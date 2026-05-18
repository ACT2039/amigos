import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

  // Set JWT as HTTP-Only cookie if we were doing cookie auth, 
  // but for mobile/API clients, sending it in response body is often better.
  // We'll return it so the controller can send it to the client.
  return token;
};

export default generateToken;
