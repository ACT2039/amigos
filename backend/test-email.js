import nodemailer from 'nodemailer';

const testConnection = async () => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'dummy@gmail.com',
      pass: 'dummy',
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 5000,
  });

  console.log('Testing connection to smtp.gmail.com:465...');
  try {
    await transporter.verify();
    console.log('✅ Connection successful!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }

  const transporter587 = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'dummy@gmail.com',
      pass: 'dummy',
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 5000,
  });

  console.log('Testing connection to smtp.gmail.com:587...');
  try {
    await transporter587.verify();
    console.log('✅ Connection successful (587)!');
  } catch (error) {
    console.error('❌ Connection failed (587):', error.message);
  }
};

testConnection();
