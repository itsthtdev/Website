#!/usr/bin/env node

/**
 * Interactive Environment Setup Script
 * 
 * Helps users create a properly configured .env file
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_PATH = path.join(__dirname, '..', '.env');
const EXAMPLE_PATH = path.join(__dirname, '..', '.env.example');

console.log('\n🔧 EzClippin Environment Setup\n');

// Check if .env already exists
if (fs.existsSync(ENV_PATH)) {
  console.log('⚠️  .env file already exists!');
  console.log('   This script will not overwrite your existing configuration.\n');
  console.log('   To reconfigure, either:');
  console.log('   1. Delete .env and run this script again');
  console.log('   2. Manually edit .env file\n');
  process.exit(0);
}

// Read example file
if (!fs.existsSync(EXAMPLE_PATH)) {
  console.error('❌ Error: .env.example file not found');
  process.exit(1);
}

console.log('📋 Creating .env file from template...\n');

let envContent = fs.readFileSync(EXAMPLE_PATH, 'utf8');

// Generate a secure JWT secret
const jwtSecret = crypto.randomBytes(32).toString('base64');
console.log('✓ Generated secure JWT_SECRET');

// Replace JWT secret in template
envContent = envContent.replace(
  'JWT_SECRET=your_jwt_secret_key_here_change_in_production',
  `JWT_SECRET=${jwtSecret}`
);

// Write the file
fs.writeFileSync(ENV_PATH, envContent, 'utf8');

console.log('✓ Created .env file\n');

console.log('📝 Next Steps:\n');
console.log('1. Open .env file in your text editor');
console.log('2. Configure the services you need:\n');

console.log('   🔐 JWT_SECRET:');
console.log('      ✓ Already generated and configured!\n');

console.log('   ☁️  Appwrite (Required for production):');
console.log('      - Follow instructions in APPWRITE_SETUP.md');
console.log('      - Get credentials from https://cloud.appwrite.io');
console.log('      - Update APPWRITE_* variables in .env\n');

console.log('   💳 Stripe (Required for payments):');
console.log('      - Get API keys from https://dashboard.stripe.com/apikeys');
console.log('      - Use test keys (sk_test_...) for development');
console.log('      - Use live keys (sk_live_...) for production');
console.log('      - Update STRIPE_* variables in .env\n');

console.log('   📧 Email (Required for contact form):');
console.log('      - For Gmail: Generate app-specific password');
console.log('      - Visit: https://myaccount.google.com/apppasswords');
console.log('      - Update EMAIL_* variables in .env\n');

console.log('3. Start the server:');
console.log('   npm start\n');

console.log('💡 TIP: For development, you can skip Appwrite configuration.');
console.log('   The system will use in-memory storage as a fallback.\n');

console.log('📖 For detailed setup instructions, see:');
console.log('   - APPWRITE_SETUP.md');
console.log('   - CREDENTIALS_SETUP.md');
console.log('   - SECURITY.md\n');

console.log('✅ Setup complete!\n');
