const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4,                   // IPv4 force
  connectionTimeout: 20000,    // 20 seconds
  greetingTimeout: 20000,
  socketTimeout: 20000,
  tls: {
    rejectUnauthorized: false  // local testing ke liye
  }
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email transporter ready');
  }
});

const sendContactEmail = async (name, email, subject, message) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'eduepic72@gmail.com',
      replyTo: email,
      subject: `📩 New Contact Message: ${subject || 'No Subject'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f8fafc; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { border-bottom: 3px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; }
            .header h2 { color: #1e293b; margin: 0; }
            .field { margin-bottom: 15px; }
            .label { font-weight: 600; color: #475569; }
            .value { color: #1e293b; padding: 8px 12px; background: #f1f5f9; border-radius: 6px; margin-top: 4px; }
            .footer { margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 14px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📩 New Contact Message</h2>
              <p style="color: #64748b; margin: 5px 0 0;">From EduEpic Website</p>
            </div>
            <div class="field">
              <div class="label">👤 Name</div>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <div class="label">📧 Email</div>
              <div class="value">${email}</div>
            </div>
            ${subject ? `<div class="field"><div class="label">📌 Subject</div><div class="value">${subject}</div></div>` : ''}
            <div class="field">
              <div class="label">💬 Message</div>
              <div class="value" style="white-space: pre-wrap;">${message}</div>
            </div>
            <div class="footer">
              <p>Sent via EduEpic Contact Form</p>
              <p style="font-size: 12px;">This email was sent from your website's contact form.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    throw error;
  }
};

module.exports = { sendContactEmail };