import { getDb } from '../../../lib/mongodb';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const db = await getDb();
    
    // Check if user exists
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({ success: true, message: 'If email exists, OTP will be sent' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await db.collection('passwordResets').updateOne(
      { email: email.toLowerCase() },
      { 
        $set: { 
          email: email.toLowerCase(),
          otp,
          expiresAt: otpExpiry,
          attempts: 0,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    // Send email with OTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@luvrix.com',
      to: email,
      subject: 'Password Reset OTP - Luvrix',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #9333ea; margin: 0;">Luvrix</h1>
            <p style="color: #666;">Password Reset Request</p>
          </div>
          <div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; border-radius: 15px; text-align: center;">
            <h2 style="margin: 0 0 10px;">Your OTP Code</h2>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: rgba(255,255,255,0.2); border-radius: 10px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="margin: 0; opacity: 0.9;">This code expires in 10 minutes</p>
          </div>
          <div style="margin-top: 20px; text-align: center; color: #666;">
            <p>If you didn't request this, please ignore this email.</p>
            <p style="font-size: 12px;">© 2026 Luvrix. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Still return success to not reveal if email exists
    }

    return res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
