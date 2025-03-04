import { generateId } from '../utilities.js';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

export const sendOtpHandler = async (request, reply) => {
  const { phoneNumber } = request.body;
  
  if (!phoneNumber) {
    return reply.code(400).send({ error: 'Phone number is required' });
  }

  try {
    // Format phone number to E.164 format
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;

    // Start verification
    const verification = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({
        to: formattedPhone,
        channel: 'sms'
      });

    console.log(`Verification status: ${verification.status}`);
    return reply.send({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return reply.code(500).send({ error: 'Failed to send OTP' });
  }
};

export const verifyOtpHandler = async (request, reply) => {
  const { phoneNumber, otp } = request.body;

  if (!phoneNumber || !otp) {
    return reply.code(400).send({ error: 'Phone number and OTP are required' });
  }

  try {
    // Format phone number to E.164 format
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;

    // Check verification
    const verification = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: formattedPhone,
        code: otp
      });

    if (verification.status === 'approved') {
      // Find or create user
      let user = await request.db('users').where({ phone_number: phoneNumber }).first();
      
      if (!user) {
        // Create new user
        const userId = generateId();
        await request.db('users').insert({
          id: userId,
          phone_number: phoneNumber,
          created_at: new Date()
        });
        user = { id: userId, phone_number: phoneNumber };
      }

      // Set session
      request.session = { userId: user.id };
      
      return reply.send({ message: 'Authentication successful' });
    } else {
      return reply.code(400).send({ error: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return reply.code(500).send({ error: 'Failed to verify OTP' });
  }
};

export const checkAuthHandler = async (request, reply) => {
  if (request.session && request.session.userId) {
    return reply.send({ authenticated: true });
  } else {
    return reply.code(401).send({ authenticated: false });
  }
}; 