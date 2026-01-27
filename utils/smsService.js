const twilio = require('twilio');
const crypto = require('crypto');

// In-memory storage for verification codes (in production, use Redis or database)
const verificationCodes = new Map();

// Initialize Twilio client
let twilioClient = null;

function initializeTwilio() {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    return true;
  }
  return false;
}

// Generate a 6-digit verification code using cryptographically secure random
function generateVerificationCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

// Send verification code via SMS
async function sendVerificationCode(phoneNumber, email) {
  // Initialize Twilio if not already initialized
  if (!twilioClient) {
    initializeTwilio();
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store code with email as key
  verificationCodes.set(email, {
    code,
    phoneNumber,
    expiresAt,
    attempts: 0,
    createdAt: new Date()
  });

  // If Twilio is configured, send actual SMS
  if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    try {
      await twilioClient.messages.create({
        body: `Your EzClippin verification code is: ${code}. This code will expire in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      console.log(`SMS sent to ${phoneNumber} with code: ${code}`);
      return { success: true, message: 'Verification code sent' };
    } catch (error) {
      console.error('Error sending SMS:', error);
      // In development, we still return success even if SMS fails
      // so developers can test with the logged code
      if (process.env.NODE_ENV === 'development') {
        console.log(`DEVELOPMENT MODE: Verification code for ${email}: ${code}`);
        return { success: true, message: 'Verification code sent (dev mode)', devCode: code };
      }
      throw new Error('Failed to send verification code');
    }
  } else {
    // Development mode: just log the code
    console.log(`DEVELOPMENT MODE: Verification code for ${email}: ${code}`);
    return { success: true, message: 'Verification code sent (dev mode)', devCode: code };
  }
}

// Verify the code
function verifyCode(email, code) {
  const stored = verificationCodes.get(email);

  if (!stored) {
    return { success: false, error: 'No verification code found' };
  }

  // Check expiration
  if (new Date() > stored.expiresAt) {
    verificationCodes.delete(email);
    return { success: false, error: 'Verification code expired' };
  }

  // Check attempts (allow up to 5 attempts)
  if (stored.attempts >= 5) {
    verificationCodes.delete(email);
    return { success: false, error: 'Too many attempts. Please request a new code.' };
  }

  // Check code match
  if (stored.code === code) {
    verificationCodes.delete(email);
    return { success: true, message: 'Phone number verified successfully' };
  }

  // Increment attempts only if code was incorrect
  stored.attempts++;

  return { success: false, error: 'Invalid verification code' };
}

// Clean up expired codes (run periodically)
function cleanupExpiredCodes() {
  const now = new Date();
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expiresAt) {
      verificationCodes.delete(email);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);

module.exports = {
  sendVerificationCode,
  verifyCode,
  initializeTwilio
};
