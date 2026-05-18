import twilio from 'twilio';

const sendSMS = async (to, message) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;
  const hasCreds = !!(accountSid && authToken && fromPhone);

  if (!hasCreds) {
    // No Twilio credentials — return simulated flag so the controller
    // can include the OTP directly in the API response.
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('[NO TWILIO] SMS service not configured — returning code directly.');
    console.warn(`  To:      ${to}`);
    console.warn(`  Message: ${message}`);
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { simulated: true };
  }

  try {
    const client = twilio(accountSid, authToken);

    const response = await client.messages.create({
      body: message,
      from: fromPhone,
      to: to,
    });

    console.log(`✅ SMS sent to ${to}. SID: ${response.sid}`);
    return { simulated: false };
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    throw new Error('Failed to send SMS. Please try again later.');
  }
};

export default sendSMS;
