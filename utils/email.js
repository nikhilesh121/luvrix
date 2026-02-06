import nodemailer from "nodemailer";

// Hostinger SMTP Configuration
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "support@luvrix.com",
    pass: process.env.SMTP_PASS || "Rohan@1241",
  },
});

// Email Templates
export const emailTemplates = {
  welcome: (name) => ({
    subject: "Welcome to Luvrix! 🎉",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f2942 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to Luvrix!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi ${name},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Thank you for joining Luvrix! We're excited to have you as part of our community.
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            You can now:
          </p>
          <ul style="font-size: 16px; color: #333; line-height: 1.8;">
            <li>Create your first blog post (1 free post available!)</li>
            <li>Read and comment on blogs and manga</li>
            <li>Share content with your friends</li>
            <li>Customize your profile</li>
          </ul>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://luvrix.com/create-blog" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #1e3a5f 0%, #0f2942 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Start Writing</a>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 14px;">© ${new Date().getFullYear()} Luvrix. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  blogApproved: (name, blogTitle) => ({
    subject: "Your Blog Has Been Approved! ✅",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Blog Approved!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi ${name},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Great news! Your blog post <strong>"${blogTitle}"</strong> has been approved and is now live on Luvrix.
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Share it with your friends and start getting views!
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://luvrix.com/dashboard" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #1e3a5f 0%, #0f2942 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">View Dashboard</a>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 14px;">© ${new Date().getFullYear()} Luvrix. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  blogRejected: (name, blogTitle) => ({
    subject: "Blog Review Update",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Blog Review Update</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi ${name},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Unfortunately, your blog post <strong>"${blogTitle}"</strong> could not be approved at this time.
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Please review our content guidelines and make necessary edits. You can resubmit your post for review after making changes.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://luvrix.com/dashboard" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #1e3a5f 0%, #0f2942 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Edit Blog</a>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 14px;">© ${new Date().getFullYear()} Luvrix. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  paymentSuccess: (name, posts, amount) => ({
    subject: "Payment Successful - Blog Posts Added! 💰",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Payment Successful!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi ${name},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Thank you for your purchase! Here's your receipt:
          </p>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #666;">Blog Posts</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #333;">${posts} posts</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666;">Amount Paid</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #333;">₹${amount}</td>
              </tr>
            </table>
          </div>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Your posts have been added to your account. Start writing now!
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://luvrix.com/create-blog" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #1e3a5f 0%, #0f2942 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Create Blog</a>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 14px;">© ${new Date().getFullYear()} Luvrix. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  passwordReset: (name, newPassword) => ({
    subject: "Your Password Has Been Reset - Luvrix",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f2942 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi ${name},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Your password has been reset by an administrator. Here is your new temporary password:
          </p>
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; border: 2px dashed #1e3a5f;">
            <p style="margin: 0 0 5px; color: #666; font-size: 14px;">Temporary Password</p>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1e3a5f; letter-spacing: 2px; font-family: monospace;">${newPassword}</p>
          </div>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Please log in with this password and change it immediately from your profile settings for security.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://luvrix.com/login" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #1e3a5f 0%, #0f2942 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Login Now</a>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #999; font-size: 12px;">If you did not request this, please contact support immediately at support@luvrix.com</p>
          <p style="margin: 5px 0 0; color: #666; font-size: 14px;">© ${new Date().getFullYear()} Luvrix. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  contactForm: (name, email, message) => ({
    subject: `New Contact Form Submission from ${name}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f2942 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">New Contact Message</h1>
        </div>
        <div style="padding: 40px 30px;">
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0; color: #666;"><strong>From:</strong> ${name}</p>
            <p style="margin: 0; color: #666;"><strong>Email:</strong> ${email}</p>
          </div>
          <p style="font-size: 16px; color: #333; line-height: 1.6;"><strong>Message:</strong></p>
          <p style="font-size: 16px; color: #333; line-height: 1.6; background: #f8f9fa; padding: 20px; border-radius: 8px;">
            ${message}
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 14px;">© ${new Date().getFullYear()} Luvrix. All rights reserved.</p>
        </div>
      </div>
    `,
  }),
};

// Send Email Function
export const sendEmail = async (to, template, data = {}) => {
  try {
    const emailContent = typeof template === "function" ? template(...Object.values(data)) : template;

    const mailOptions = {
      from: '"Luvrix" <support@luvrix.com>',
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

// Specific email functions
export const sendWelcomeEmail = async (email, name) => {
  return sendEmail(email, emailTemplates.welcome, { name });
};

export const sendBlogApprovedEmail = async (email, name, blogTitle) => {
  return sendEmail(email, emailTemplates.blogApproved, { name, blogTitle });
};

export const sendBlogRejectedEmail = async (email, name, blogTitle) => {
  return sendEmail(email, emailTemplates.blogRejected, { name, blogTitle });
};

export const sendPaymentSuccessEmail = async (email, name, posts, amount) => {
  return sendEmail(email, emailTemplates.paymentSuccess, { name, posts, amount });
};

export const sendPasswordResetEmail = async (email, name, newPassword) => {
  return sendEmail(email, emailTemplates.passwordReset, { name, newPassword });
};

export const sendContactEmail = async (name, email, message) => {
  return sendEmail("support@luvrix.com", emailTemplates.contactForm, { name, email, message });
};

export default transporter;
