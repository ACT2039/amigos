import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const hasCreds = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

  if (!hasCreds) {
    console.error('❌ Email service not configured (SMTP_USER and SMTP_PASS are missing).');
    throw new Error('Email service is not currently configured.');
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465', // true for SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const message = {
      from: `${process.env.FROM_NAME || 'Amigos'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p style="font-family:sans-serif;white-space:pre-wrap">${options.message}</p>`,
    };

    const info = await transporter.sendMail(message);
    console.log(`✅ Email sent to ${options.email}. ID: ${info.messageId}`);
    return { simulated: false };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw new Error('Failed to send email. Please try again later.');
  }
};

export default sendEmail;
