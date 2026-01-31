export const PAYMENT_STATUS = {
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
  REFUNDED: "refunded",
};

export function canUserPost(user) {
  if (!user) return { canPost: false, reason: "Not logged in" };

  if (user.blocked) {
    return { canPost: false, reason: "Your account is blocked" };
  }

  // Admin has unlimited posting access
  if (user.role === "admin" || user.isAdmin === true) {
    return { canPost: true, reason: "Admin - Unlimited posts", isFree: true, isAdmin: true };
  }

  // Free post available
  if (user.freePostsUsed < 1) {
    return { canPost: true, reason: "Free post available", isFree: true };
  }

  // Extra posts available
  if (user.extraPosts > 0) {
    return { canPost: true, reason: `${user.extraPosts} extra posts available`, isFree: false };
  }

  return {
    canPost: false,
    reason: "Free post limit reached. Please purchase more posts.",
    needsPayment: true,
  };
}

export function calculatePostsFromPayment(amount, pricePerPost) {
  if (!amount || !pricePerPost || pricePerPost <= 0) return 0;
  return Math.floor(amount / pricePerPost);
}

export function createPaymentData(userId, amount, txnId, postsAdded) {
  return {
    userId,
    amount,
    txnId,
    status: PAYMENT_STATUS.SUCCESS,
    postsAdded,
  };
}

export function generatePayUHash(params, salt) {
  // PayU hash generation logic
  // hash = sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
  const hashString = `${params.key}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|||||||||||${salt}`;
  
  // Note: In production, generate SHA512 hash server-side for security
  return hashString;
}

export function getPaymentPackages(pricePerPost) {
  return [
    { posts: 5, amount: pricePerPost * 5, savings: 0 },
    { posts: 10, amount: pricePerPost * 9, savings: pricePerPost },
    { posts: 25, amount: pricePerPost * 20, savings: pricePerPost * 5 },
    { posts: 50, amount: pricePerPost * 35, savings: pricePerPost * 15 },
  ];
}
