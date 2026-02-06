import nodemailer from 'nodemailer';
import { getDb } from '../../lib/mongodb';
import { withCSRFProtection } from '../../lib/csrf';
import { withRateLimit } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, to, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Sanitize user input
    const sanitizedData = {
      name: data.name ? sanitizeText(data.name) : '',
      email: data.email ? sanitizeText(data.email) : '',
      message: data.message ? sanitizeText(data.message) : '',
    };

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (sanitizedData.email && !emailRegex.test(sanitizedData.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Store contact submission in database
    const db = await getDb();
    await db.collection('contact_submissions').insertOne({
      type,
      name: sanitizedData.name,
      email: sanitizedData.email,
      message: sanitizedData.message,
      status: 'pending',
      createdAt: new Date(),
    });

    // Get SMTP settings from database or environment
    const settings = await db.collection('settings').findOne({ _id: 'main' });
    
    const smtpHost = settings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = settings?.smtpPort || parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = settings?.smtpUser || process.env.SMTP_USER;
    const smtpPass = settings?.smtpPass || process.env.SMTP_PASS;
    const smtpFrom = settings?.smtpFrom || process.env.SMTP_FROM || 'noreply@luvrix.com';
    const contactEmail = settings?.contactEmail || to || 'contact@luvrix.com';

    // If SMTP is not configured, just store in database
    if (!smtpUser || !smtpPass) {
      console.log('SMTP not configured, contact stored in database');
      return res.status(200).json({ 
        success: true, 
        message: 'Message received and stored',
        emailSent: false 
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Email templates based on type
    let subject, htmlContent;

    switch (type) {
      case 'contact':
        subject = `[Luvrix Contact] New message from ${sanitizedData.name}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 20px; border-radius: 15px 15px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">New Contact Message</h1>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 15px 15px;">
              <p><strong>From:</strong> ${sanitizedData.name}</p>
              <p><strong>Email:</strong> ${sanitizedData.email}</p>
              <p><strong>Message:</strong></p>
              <div style="background: white; padding: 15px; border-radius: 10px; border-left: 4px solid #9333ea;">
                ${sanitizedData.message.replace(/\n/g, '<br>')}
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 20px;">
                Received at: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        `;
        break;

      case 'feedback':
        subject = `[Luvrix Feedback] From ${sanitizedData.name}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 15px 15px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">User Feedback</h1>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 15px 15px;">
              <p><strong>From:</strong> ${sanitizedData.name} (${sanitizedData.email})</p>
              <div style="background: white; padding: 15px; border-radius: 10px;">
                ${sanitizedData.message.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
        `;
        break;

      default:
        subject = `[Luvrix] Message from ${sanitizedData.name}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <p><strong>From:</strong> ${sanitizedData.name} (${sanitizedData.email})</p>
            <p>${sanitizedData.message.replace(/\n/g, '<br>')}</p>
          </div>
        `;
    }

    // Send email
    await transporter.sendMail({
      from: smtpFrom,
      to: contactEmail,
      replyTo: sanitizedData.email,
      subject,
      html: htmlContent,
    });

    // Update submission status
    await db.collection('contact_submissions').updateOne(
      { email: sanitizedData.email, createdAt: { $gte: new Date(Date.now() - 60000) } },
      { $set: { status: 'sent' } }
    );

    return res.status(200).json({ success: true, emailSent: true });
  } catch (error) {
    console.error('Send email error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}

// Apply contact rate limiting (5/hour) - no CSRF for public contact form
export default withRateLimit(handler, 'contact');
