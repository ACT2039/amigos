
const sendEmail = async (options) => {
  const brevoApiKey = process.env.BREVO_API_KEY?.trim();
  const fromEmail = process.env.FROM_EMAIL || 'charantejarangi122333@gmail.com'; // Defaulting to the verified email

  if (!brevoApiKey) {
    console.error('❌ Email service not configured (BREVO_API_KEY missing).');
    throw new Error('Email service is not currently configured.');
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Amigos App', email: fromEmail },
        to: [{ email: options.email }],
        subject: options.subject,
        htmlContent: options.html || `<p style="font-family:sans-serif;white-space:pre-wrap">${options.message}</p>`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send via Brevo API');
    }

    console.log(`✅ Email sent via Brevo API to ${options.email}. MessageId: ${data.messageId}`);
    return { simulated: false };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw new Error(`Email Error: ${error.message}`);
  }
};

export default sendEmail;
