import { getDb } from "./mongodb";
import { ObjectId } from "mongodb";

// ============================================
// HELPERS
// ============================================

const toObjectId = (id) => {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && ObjectId.isValid(id) && id.length === 24) {
    return new ObjectId(id);
  }
  return id;
};

const serializeDoc = (doc) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id?.toString?.() || _id, ...rest };
};

const serializeDocs = (docs) => docs.map(serializeDoc);

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================
// ELIGIBILITY CHECK (server-enforced)
// ============================================

export function checkEligibility(participant, giveaway, tasks) {
  // 1. All required tasks must be completed
  const requiredTasks = tasks.filter(t => t.required);
  const allRequiredDone = requiredTasks.every(t =>
    participant.completedTasks?.includes(t._id.toString())
  );
  if (!allRequiredDone) return false;

  // 2. In task_gated mode, check points threshold
  if (giveaway.mode === "task_gated" && participant.points < (giveaway.requiredPoints || 0)) {
    return false;
  }

  return true;
}

// ============================================
// GIVEAWAY CRUD
// ============================================

export async function createGiveaway(data) {
  const db = await getDb();
  let slug = generateSlug(data.title);

  // Ensure unique slug
  const existing = await db.collection("giveaways").findOne({ slug });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const giveaway = {
    title: data.title,
    slug,
    description: data.description || "",
    imageUrl: data.imageUrl,
    prizeDetails: data.prizeDetails || "",
    mode: data.mode || "random",
    requiredPoints: Number(data.requiredPoints) || 0,
    targetParticipants: Number(data.targetParticipants) || 100,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    maxExtensions: data.maxExtensions !== null && data.maxExtensions !== undefined ? Number(data.maxExtensions) : 0,
    extensionsUsed: 0,
    invitePointsEnabled: Boolean(data.invitePointsEnabled),
    invitePointsCap: Number(data.invitePointsCap) || 10,
    invitePointsPerReferral: Number(data.invitePointsPerReferral) || 1,
    status: data.status || "draft",
    winnerId: null,
    createdBy: data.createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("giveaways").insertOne(giveaway);
  return { id: result.insertedId.toString(), ...giveaway };
}

export async function updateGiveaway(id, data) {
  const db = await getDb();
  const objectId = toObjectId(id);

  // Don't allow editing winner_selected giveaways (except status fields)
  const existing = await db.collection("giveaways").findOne({ _id: objectId });
  if (!existing) return null;
  if (existing.status === "winner_selected" && data.status !== "winner_selected") {
    throw new Error("Cannot edit a giveaway after winner has been selected");
  }

  const updateData = { ...data, updatedAt: new Date() };
  // Convert date strings
  if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
  if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
  if (updateData.requiredPoints !== undefined) updateData.requiredPoints = Number(updateData.requiredPoints);
  if (updateData.targetParticipants !== undefined) updateData.targetParticipants = Number(updateData.targetParticipants);
  if (updateData.maxExtensions !== undefined) updateData.maxExtensions = updateData.maxExtensions !== null && updateData.maxExtensions !== undefined ? Number(updateData.maxExtensions) : 0;
  if (updateData.invitePointsCap !== undefined) updateData.invitePointsCap = Number(updateData.invitePointsCap);
  if (updateData.invitePointsPerReferral !== undefined) updateData.invitePointsPerReferral = Number(updateData.invitePointsPerReferral);

  // Remove fields that shouldn't be updated directly
  delete updateData.id;
  delete updateData._id;
  delete updateData.createdAt;
  delete updateData.createdBy;

  await db.collection("giveaways").updateOne(
    { _id: objectId },
    { $set: updateData }
  );

  return serializeDoc(await db.collection("giveaways").findOne({ _id: objectId }));
}

export async function getGiveaway(idOrSlug) {
  const db = await getDb();
  let giveaway = null;

  // Try by slug first
  giveaway = await db.collection("giveaways").findOne({ slug: idOrSlug });

  // Try by ObjectId
  if (!giveaway && ObjectId.isValid(idOrSlug) && idOrSlug.length === 24) {
    giveaway = await db.collection("giveaways").findOne({ _id: new ObjectId(idOrSlug) });
  }

  return serializeDoc(giveaway);
}

export async function listGiveaways(filter = {}) {
  const db = await getDb();
  const query = {};

  if (filter.status) {
    if (Array.isArray(filter.status)) {
      query.status = { $in: filter.status };
    } else {
      query.status = filter.status;
    }
  }

  const giveaways = await db.collection("giveaways")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return serializeDocs(giveaways);
}

export async function deleteGiveaway(id) {
  const db = await getDb();
  const objectId = toObjectId(id);

  const giveaway = await db.collection("giveaways").findOne({ _id: objectId });
  if (!giveaway) return false;
  if (giveaway.status !== "draft") {
    throw new Error("Can only delete draft giveaways");
  }

  // Clean up related data
  await db.collection("giveaway_tasks").deleteMany({ giveawayId: id });
  await db.collection("giveaway_participants").deleteMany({ giveawayId: id });
  await db.collection("giveaways").deleteOne({ _id: objectId });

  return true;
}

// ============================================
// TASKS
// ============================================

export async function addTask(giveawayId, data) {
  const db = await getDb();
  const task = {
    giveawayId,
    type: data.type || "custom",
    title: data.title,
    description: data.description || "",
    points: Number(data.points) || 1,
    required: Boolean(data.required),
    metadata: data.metadata || {},
    createdAt: new Date(),
  };

  const result = await db.collection("giveaway_tasks").insertOne(task);
  return { id: result.insertedId.toString(), ...task };
}

export async function removeTask(taskId) {
  const db = await getDb();
  const objectId = toObjectId(taskId);
  await db.collection("giveaway_tasks").deleteOne({ _id: objectId });
  return true;
}

export async function getTasksForGiveaway(giveawayId) {
  const db = await getDb();
  const tasks = await db.collection("giveaway_tasks")
    .find({ giveawayId })
    .sort({ createdAt: 1 })
    .toArray();
  return serializeDocs(tasks);
}

// ============================================
// PARTICIPANTS
// ============================================

export async function joinGiveaway(giveawayId, userId) {
  const db = await getDb();

  // Check giveaway exists and is active
  const giveaway = await db.collection("giveaways").findOne({
    _id: toObjectId(giveawayId),
    status: "active",
  });
  if (!giveaway) throw new Error("Giveaway not found or not active");

  // Check if already joined
  const existing = await db.collection("giveaway_participants").findOne({
    giveawayId,
    userId,
  });
  if (existing) throw new Error("Already joined this giveaway");

  const inviteCode = generateInviteCode();

  const participant = {
    giveawayId,
    userId,
    points: 0,
    inviteCount: 0,
    completedTasks: [],
    status: "participant",
    inviteCode,
    joinedAt: new Date(),
    eligibleAt: null,
  };

  // In random mode with no required tasks/points, user is immediately eligible
  const tasks = await getTasksForGiveaway(giveawayId);
  if (giveaway.mode === "random" && tasks.filter(t => t.required).length === 0) {
    participant.status = "eligible";
    participant.eligibleAt = new Date();
  }

  const result = await db.collection("giveaway_participants").insertOne(participant);
  return { id: result.insertedId.toString(), ...participant };
}

export async function getParticipant(giveawayId, userId) {
  const db = await getDb();
  const participant = await db.collection("giveaway_participants").findOne({
    giveawayId,
    userId,
  });
  return serializeDoc(participant);
}

export async function listParticipants(giveawayId, filter = {}) {
  const db = await getDb();
  const query = { giveawayId };

  if (filter.status) query.status = filter.status;
  if (filter.search) {
    // Search requires joining with users collection
    const users = await db.collection("users")
      .find({
        $or: [
          { email: { $regex: filter.search, $options: "i" } },
          { name: { $regex: filter.search, $options: "i" } },
          { username: { $regex: filter.search, $options: "i" } },
        ],
      })
      .project({ _id: 1 })
      .toArray();
    const userIds = users.map(u => u._id.toString());
    query.userId = { $in: userIds };
  }

  const participants = await db.collection("giveaway_participants")
    .find(query)
    .sort({ joinedAt: -1 })
    .toArray();

  // Enrich with user info
  const userIds = participants.map(p => p.userId);
  const users = await db.collection("users")
    .find({ _id: { $in: userIds.map(id => toObjectId(id)).filter(Boolean) } })
    .project({ _id: 1, name: 1, email: 1, username: 1, photoURL: 1 })
    .toArray();

  const userMap = {};
  users.forEach(u => { userMap[u._id.toString()] = u; });

  return serializeDocs(participants).map(p => ({
    ...p,
    user: userMap[p.userId] ? {
      name: userMap[p.userId].name,
      email: userMap[p.userId].email,
      username: userMap[p.userId].username,
      photoURL: userMap[p.userId].photoURL,
    } : null,
  }));
}

export async function getParticipantCount(giveawayId) {
  const db = await getDb();
  return db.collection("giveaway_participants").countDocuments({ giveawayId });
}

// ============================================
// TASK COMPLETION
// ============================================

export async function completeTask(giveawayId, userId, taskId) {
  const db = await getDb();

  // Validate task belongs to giveaway
  const task = await db.collection("giveaway_tasks").findOne({
    _id: toObjectId(taskId),
    giveawayId,
  });
  if (!task) throw new Error("Task not found");

  // Validate participant
  const participant = await db.collection("giveaway_participants").findOne({
    giveawayId,
    userId,
  });
  if (!participant) throw new Error("Not a participant");
  if (participant.completedTasks?.includes(taskId)) {
    throw new Error("Task already completed");
  }

  // Award points and mark task complete
  const newPoints = (participant.points || 0) + task.points;
  const newCompletedTasks = [...(participant.completedTasks || []), taskId];

  const updateData = {
    points: newPoints,
    completedTasks: newCompletedTasks,
  };

  // Check eligibility after completing this task
  const giveaway = await db.collection("giveaways").findOne({ _id: toObjectId(giveawayId) });
  const allTasks = await getTasksForGiveaway(giveawayId);
  const tempParticipant = { ...participant, points: newPoints, completedTasks: newCompletedTasks };

  if (checkEligibility(tempParticipant, giveaway, allTasks.map(t => ({ ...t, _id: toObjectId(t.id) })))) {
    if (participant.status !== "eligible" && participant.status !== "winner") {
      updateData.status = "eligible";
      updateData.eligibleAt = new Date();
    }
  }

  await db.collection("giveaway_participants").updateOne(
    { _id: participant._id },
    { $set: updateData }
  );

  return { points: newPoints, completedTasks: newCompletedTasks, status: updateData.status || participant.status };
}

// ============================================
// INVITE SYSTEM
// ============================================

export async function processInvite(inviteCode, newUserId) {
  const db = await getDb();

  // Find the participant who owns this invite code
  const inviter = await db.collection("giveaway_participants").findOne({ inviteCode });
  if (!inviter) throw new Error("Invalid invite code");

  // Get giveaway
  const giveaway = await db.collection("giveaways").findOne({ _id: toObjectId(inviter.giveawayId) });
  if (!giveaway || giveaway.status !== "active") throw new Error("Giveaway not active");
  if (!giveaway.invitePointsEnabled) throw new Error("Invite points not enabled");

  // Check cap
  const invitePoints = (inviter.inviteCount || 0) * (giveaway.invitePointsPerReferral || 1);
  if (invitePoints >= (giveaway.invitePointsCap || 10)) {
    throw new Error("Invite points cap reached");
  }

  // Check new user is a participant
  const newParticipant = await db.collection("giveaway_participants").findOne({
    giveawayId: inviter.giveawayId,
    userId: newUserId,
  });
  if (!newParticipant) throw new Error("Invited user must join the giveaway first");
  if (newUserId === inviter.userId) throw new Error("Cannot invite yourself");

  // Award points to inviter
  const pointsToAdd = giveaway.invitePointsPerReferral || 1;
  const newPoints = (inviter.points || 0) + pointsToAdd;
  const newInviteCount = (inviter.inviteCount || 0) + 1;

  const updateData = { points: newPoints, inviteCount: newInviteCount };

  // Re-check eligibility
  const allTasks = await getTasksForGiveaway(inviter.giveawayId);
  const tempInviter = { ...inviter, points: newPoints, completedTasks: inviter.completedTasks || [] };
  const rawTasks = allTasks.map(t => ({ ...t, _id: toObjectId(t.id) }));

  if (checkEligibility(tempInviter, giveaway, rawTasks)) {
    if (inviter.status !== "eligible" && inviter.status !== "winner") {
      updateData.status = "eligible";
      updateData.eligibleAt = new Date();
    }
  }

  await db.collection("giveaway_participants").updateOne(
    { _id: inviter._id },
    { $set: updateData }
  );

  return { inviterPoints: newPoints, inviteCount: newInviteCount };
}

// ============================================
// WINNER SELECTION
// ============================================

export async function selectWinner(giveawayId, { mode, adminId, winnerUserId }) {
  const db = await getDb();
  const objectId = toObjectId(giveawayId);

  const giveaway = await db.collection("giveaways").findOne({ _id: objectId });
  if (!giveaway) throw new Error("Giveaway not found");
  if (giveaway.status === "winner_selected") throw new Error("Winner already selected");

  let winnerId;

  if (mode === "SYSTEM_RANDOM") {
    // Get all eligible participants
    const eligible = await db.collection("giveaway_participants")
      .find({ giveawayId, status: "eligible" })
      .toArray();
    if (eligible.length === 0) throw new Error("No eligible participants");

    // Random selection
    const randomIndex = Math.floor(Math.random() * eligible.length);
    winnerId = eligible[randomIndex].userId;
  } else if (mode === "ADMIN_RANDOM") {
    if (!winnerUserId) throw new Error("Winner user ID required for admin selection");

    // HARD BLOCK: verify the selected user is eligible
    const participant = await db.collection("giveaway_participants").findOne({
      giveawayId,
      userId: winnerUserId,
    });
    if (!participant) throw new Error("User is not a participant");
    if (participant.status !== "eligible") {
      throw new Error("Cannot select non-eligible participant as winner. User status: " + participant.status);
    }

    winnerId = winnerUserId;
  } else {
    throw new Error("Invalid selection mode");
  }

  // Update participant status to winner
  await db.collection("giveaway_participants").updateOne(
    { giveawayId, userId: winnerId },
    { $set: { status: "winner" } }
  );

  // Update giveaway
  await db.collection("giveaways").updateOne(
    { _id: objectId },
    { $set: { status: "winner_selected", winnerId, updatedAt: new Date() } }
  );

  // Create audit log entry
  const winnerLog = {
    giveawayId,
    winnerUserId: winnerId,
    selectionMode: mode,
    selectedByAdminId: mode === "ADMIN_RANDOM" ? adminId : null,
    reason: mode === "SYSTEM_RANDOM" ? "Automated random selection from eligible participants" : "Admin manual selection from eligible participants",
    selectedAt: new Date(),
  };

  await db.collection("giveaway_winner_logs").insertOne(winnerLog);

  return { winnerId, selectionMode: mode, log: serializeDoc(winnerLog) };
}

// ============================================
// USER GIVEAWAY HISTORY
// ============================================

export async function getUserGiveaways(userId) {
  const db = await getDb();

  // Get all participations for this user
  const participations = await db.collection("giveaway_participants")
    .find({ userId })
    .sort({ joinedAt: -1 })
    .toArray();

  if (participations.length === 0) return [];

  // Get all related giveaways
  const giveawayIds = participations.map(p => toObjectId(p.giveawayId)).filter(Boolean);
  const giveaways = await db.collection("giveaways")
    .find({ _id: { $in: giveawayIds } })
    .toArray();

  const giveawayMap = {};
  giveaways.forEach(g => { giveawayMap[g._id.toString()] = serializeDoc(g); });

  // Enrich winner info for completed giveaways
  const winnerIds = giveaways.filter(g => g.winnerId).map(g => g.winnerId);
  const winnerUsers = winnerIds.length > 0
    ? await db.collection("users")
        .find({ _id: { $in: winnerIds.map(id => toObjectId(id)).filter(Boolean) } })
        .project({ _id: 1, name: 1, username: 1, photoURL: 1 })
        .toArray()
    : [];
  const winnerMap = {};
  winnerUsers.forEach(u => { winnerMap[u._id.toString()] = { name: u.name, username: u.username, photoURL: u.photoURL }; });

  return participations.map(p => {
    const g = giveawayMap[p.giveawayId];
    return {
      ...serializeDoc(p),
      giveaway: g ? {
        id: g.id,
        title: g.title,
        slug: g.slug,
        imageUrl: g.imageUrl,
        prizeDetails: g.prizeDetails,
        status: g.status,
        endDate: g.endDate,
        winnerId: g.winnerId,
        winnerName: g.winnerId ? winnerMap[g.winnerId]?.name || null : null,
      } : null,
    };
  });
}

// ============================================
// WINNER INFO (public)
// ============================================

export async function getWinnerInfo(giveawayId) {
  const db = await getDb();
  const giveaway = await db.collection("giveaways").findOne({ _id: toObjectId(giveawayId) });
  if (!giveaway || !giveaway.winnerId) return null;

  const user = await db.collection("users").findOne(
    { _id: toObjectId(giveaway.winnerId) || giveaway.winnerId },
    { projection: { _id: 1, name: 1, username: 1, photoURL: 1 } }
  );

  return user ? { name: user.name, username: user.username, photoURL: user.photoURL } : null;
}

// ============================================
// WINNER SHIPPING DETAILS
// ============================================

export async function storeWinnerShipping(giveawayId, userId, shippingData) {
  const db = await getDb();
  await db.collection("giveaway_shipping").updateOne(
    { giveawayId, userId },
    {
      $set: {
        giveawayId,
        userId,
        fullName: shippingData.fullName,
        address: shippingData.address,
        city: shippingData.city,
        state: shippingData.state,
        pincode: shippingData.pincode,
        country: shippingData.country,
        phone: shippingData.phone,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
  return true;
}

export async function getWinnerShipping(giveawayId) {
  const db = await getDb();
  const shipping = await db.collection("giveaway_shipping").findOne({ giveawayId });
  return shipping ? serializeDoc(shipping) : null;
}

// ============================================
// SUPPORT (isolated — NO eligibility link)
// ============================================

export async function recordGiveawaySupport(giveawayId, userId, amount, { donorName, donorEmail, isAnonymous } = {}) {
  const db = await getDb();
  const support = {
    giveawayId,
    userId,
    amount: Number(amount),
    donorName: donorName || "",
    donorEmail: donorEmail || "",
    isAnonymous: !!isAnonymous,
    createdAt: new Date(),
  };
  await db.collection("giveaway_supports").insertOne(support);
  return serializeDoc(support);
}

export async function getGiveawaySupportTotal(giveawayId) {
  const db = await getDb();
  const result = await db.collection("giveaway_supports").aggregate([
    { $match: { giveawayId } },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]).toArray();
  return result[0] || { total: 0, count: 0 };
}

export async function getGiveawaySupporters(giveawayId, { isAdmin = false } = {}) {
  const db = await getDb();
  const supports = await db.collection("giveaway_supports")
    .find({ giveawayId })
    .sort({ createdAt: -1 })
    .toArray();

  // Enrich with user names
  const userIds = [...new Set(supports.map(s => s.userId))];
  const users = await db.collection("users")
    .find({ _id: { $in: userIds } })
    .project({ _id: 1, name: 1, displayName: 1, photoURL: 1, email: 1 })
    .toArray();
  const userMap = {};
  users.forEach(u => { userMap[u._id] = u; });

  return supports.map(s => {
    const user = userMap[s.userId];
    const publicName = s.isAnonymous ? "Anonymous" : (s.donorName || user?.displayName || user?.name || "Anonymous");
    const result = {
      ...serializeDoc(s),
      userName: publicName,
      userPhoto: s.isAnonymous ? null : (user?.photoURL || null),
      amount: s.amount,
      isAnonymous: !!s.isAnonymous,
    };

    // Admin gets full details always
    if (isAdmin) {
      result.donorName = s.donorName || user?.displayName || user?.name || "Unknown";
      result.donorEmail = s.donorEmail || user?.email || "";
      result.userEmail = user?.email || "";
      result.userName = s.donorName || user?.displayName || user?.name || "Unknown";
      result.userPhoto = user?.photoURL || null;
    }

    return result;
  });
}

export async function getAllDonationStats() {
  const db = await getDb();
  const result = await db.collection("giveaway_supports").aggregate([
    {
      $group: {
        _id: "$giveawayId",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]).toArray();

  const grandTotal = result.reduce((sum, r) => sum + r.total, 0);
  const grandCount = result.reduce((sum, r) => sum + r.count, 0);

  // Get giveaway titles
  const giveawayIds = result.map(r => r._id);
  const giveaways = await db.collection("giveaways")
    .find({ _id: { $in: giveawayIds.map(id => toObjectId(id)) } })
    .project({ _id: 1, title: 1, slug: 1, imageUrl: 1 })
    .toArray();
  const giveawayMap = {};
  giveaways.forEach(g => { giveawayMap[g._id.toString()] = g; });

  return {
    grandTotal,
    grandCount,
    perGiveaway: result.map(r => ({
      giveawayId: r._id,
      title: giveawayMap[r._id]?.title || "Unknown",
      slug: giveawayMap[r._id]?.slug || "",
      imageUrl: giveawayMap[r._id]?.imageUrl || "",
      total: r.total,
      count: r.count,
    })).sort((a, b) => b.total - a.total),
  };
}

export async function getAllDonors() {
  const db = await getDb();
  const supports = await db.collection("giveaway_supports")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  // Enrich with user info
  const userIds = [...new Set(supports.map(s => s.userId))];
  const users = await db.collection("users")
    .find({ _id: { $in: userIds } })
    .project({ _id: 1, name: 1, displayName: 1, photoURL: 1, email: 1 })
    .toArray();
  const userMap = {};
  users.forEach(u => { userMap[u._id] = u; });

  // Enrich with giveaway titles
  const giveawayIds = [...new Set(supports.map(s => s.giveawayId))];
  const giveaways = await db.collection("giveaways")
    .find({ _id: { $in: giveawayIds.map(id => toObjectId(id)) } })
    .project({ _id: 1, title: 1, slug: 1 })
    .toArray();
  const giveawayMap = {};
  giveaways.forEach(g => { giveawayMap[g._id.toString()] = g; });

  const donations = supports.map(s => {
    const user = userMap[s.userId];
    return {
      ...serializeDoc(s),
      donorName: s.donorName || user?.displayName || user?.name || "Unknown",
      donorEmail: s.donorEmail || user?.email || "",
      userPhoto: user?.photoURL || null,
      isAnonymous: !!s.isAnonymous,
      giveawayTitle: giveawayMap[s.giveawayId]?.title || "Unknown",
      giveawaySlug: giveawayMap[s.giveawayId]?.slug || "",
    };
  });

  // Aggregate top donors by email
  const emailMap = {};
  donations.forEach(d => {
    const email = d.donorEmail || "unknown";
    if (!emailMap[email]) {
      emailMap[email] = { email, name: d.donorName, photo: d.userPhoto, total: 0, count: 0 };
    }
    emailMap[email].total += d.amount;
    emailMap[email].count += 1;
    if (d.donorName && d.donorName !== "Unknown") emailMap[email].name = d.donorName;
    if (d.userPhoto) emailMap[email].photo = d.userPhoto;
  });
  const topDonors = Object.values(emailMap).sort((a, b) => b.total - a.total);

  return { donations, topDonors };
}

// ============================================
// INDEXES (call once at startup or migration)
// ============================================

export async function ensureGiveawayIndexes() {
  const db = await getDb();

  await db.collection("giveaways").createIndex({ slug: 1 }, { unique: true });
  await db.collection("giveaways").createIndex({ status: 1, startDate: -1 });
  await db.collection("giveaways").createIndex({ endDate: 1 });

  await db.collection("giveaway_tasks").createIndex({ giveawayId: 1 });

  await db.collection("giveaway_participants").createIndex(
    { giveawayId: 1, userId: 1 },
    { unique: true }
  );
  await db.collection("giveaway_participants").createIndex({ giveawayId: 1, status: 1 });
  await db.collection("giveaway_participants").createIndex({ inviteCode: 1 }, { unique: true });

  await db.collection("giveaway_winner_logs").createIndex({ giveawayId: 1 });

  await db.collection("giveaway_shipping").createIndex({ giveawayId: 1, userId: 1 }, { unique: true });
  await db.collection("giveaway_supports").createIndex({ giveawayId: 1 });
  await db.collection("giveaway_supports").createIndex({ giveawayId: 1, userId: 1 });
}
