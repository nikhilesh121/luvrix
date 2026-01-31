import { registerUser } from '../../../lib/auth';
import { getAllUsers, updateUser, getUserByEmail } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Check if admin already exists
    const users = await getAllUsers();
    const adminExists = users.some(u => u.role === 'ADMIN');
    
    if (adminExists) {
      return res.status(400).json({ success: false, error: 'Admin already exists' });
    }

    // Check if user with this email exists
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      // Upgrade existing user to admin
      await updateUser(existingUser.id, {
        role: 'ADMIN',
        extraPosts: 999,
      });
      return res.status(200).json({ 
        success: true, 
        message: 'Existing account upgraded to Admin!',
        userId: existingUser.id,
      });
    }

    // Create new admin account
    const result = await registerUser(email, password, {
      name: 'Admin',
      role: 'ADMIN',
      extraPosts: 999,
    });

    if (result.success) {
      // Update role to ADMIN (in case it wasn't set during registration)
      await updateUser(result.user.uid, { role: 'ADMIN', extraPosts: 999 });
      
      return res.status(201).json({ 
        success: true, 
        message: 'Admin account created successfully!',
        userId: result.user.uid,
      });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Setup admin API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
