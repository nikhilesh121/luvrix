import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "./mongodb";
import { createUser, getUser, getUserByEmail } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "luvrix-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    { 
      uid: user._id || user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Hash password
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Compare password
export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// Register new user
export const registerUser = async (email, password, additionalData = {}) => {
  try {
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Generate unique ID
    const uniqueId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create user
    const userData = await createUser(uniqueId, {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: additionalData.name || "",
      photoURL: additionalData.photoURL || "",
      ...additionalData,
    });
    
    // Generate token
    const token = generateToken({ _id: uniqueId, email, role: userData.role });
    
    // Remove password from response
    const { password: _pw, ...userWithoutPassword } = userData;
    
    return { 
      success: true, 
      user: { uid: uniqueId, ...userWithoutPassword },
      token,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: error.message };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const db = await getDb();
    
    // Find user by email
    const user = await db.collection("users").findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }
    
    // Check if user is blocked
    if (user.blocked) {
      return { success: false, error: "Your account has been blocked" };
    }
    
    // Handle users without password (legacy accounts)
    if (!user.password) {
      // Set the password for migrated user on first login
      const hashedPassword = await hashPassword(password);
      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword, updatedAt: new Date(), migratedAt: new Date() } }
      );
      
      // Generate token
      const token = generateToken(user);
      
      // Remove password from response
      const { password: _pw2, ...userWithoutPassword } = user;
      
      return { 
        success: true, 
        user: { uid: user._id, id: user._id, ...userWithoutPassword },
        token,
        message: "Password set successfully for migrated account"
      };
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return { success: false, error: "Invalid email or password" };
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Remove password from response
    const { password: _pw3, ...userWithoutPassword } = user;
    
    return { 
      success: true, 
      user: { uid: user._id, id: user._id, ...userWithoutPassword },
      token,
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: error.message };
  }
};

// Get user from token
export const getUserFromToken = async (token) => {
  try {
    const decoded = verifyToken(token);
    if (!decoded) return null;
    
    const user = await getUser(decoded.uid);
    if (!user) return null;
    
    // Remove password from response
    const { password: _pw4, ...userWithoutPassword } = user;
    return { uid: user.id, ...userWithoutPassword };
  } catch (error) {
    console.error("Get user from token error:", error);
    return null;
  }
};

// Logout (client-side only - just remove token)
export const logoutUser = async () => {
  return { success: true };
};

// Change password
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const db = await getDb();
    
    const user = await db.collection("users").findOne({ _id: userId });
    if (!user) {
      return { success: false, error: "User not found" };
    }
    
    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      return { success: false, error: "Current password is incorrect" };
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    await db.collection("users").updateOne(
      { _id: userId },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );
    
    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, error: error.message };
  }
};

// Auth state change listener (for client-side)
// This will be implemented using React context
export const onAuthChange = (_callback) => {
  // This is a placeholder - actual implementation will be in AuthContext
  // Return unsubscribe function
  return () => {};
};

// Middleware to verify auth on API routes
export const withAuth = (handler) => async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "") || 
                  req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    
    req.user = user;
    return handler(req, res);
  } catch (error) {
    return res.status(401).json({ error: "Authentication failed" });
  }
};

// Middleware to verify admin
export const withAdmin = (handler) => async (req, res) => {
  return withAuth(async (req, res) => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }
    return handler(req, res);
  })(req, res);
};
