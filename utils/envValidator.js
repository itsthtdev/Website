/**
 * Environment Variable Validator
 * 
 * Validates that all required environment variables are properly configured
 * and provides helpful error messages for missing or invalid configuration.
 */

const validationResults = {
  errors: [],
  warnings: [],
  info: []
};

/**
 * Check if a value is properly configured (not empty or placeholder)
 */
function isConfigured(value) {
  if (!value) return false;
  
  // List of common placeholder patterns
  const placeholders = [
    'your_',
    'placeholder',
    'change_in_production',
    'example',
    'xxx',
    'test_key',
    'sk_test_placeholder',
    'pk_test_placeholder'
  ];
  
  const lowerValue = value.toLowerCase();
  return !placeholders.some(placeholder => lowerValue.includes(placeholder));
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('\n🔍 Validating Environment Configuration...\n');
  
  // 1. Check NODE_ENV
  if (!process.env.NODE_ENV) {
    validationResults.warnings.push('NODE_ENV is not set. Defaulting to development mode.');
  } else {
    validationResults.info.push(`Running in ${process.env.NODE_ENV} mode`);
  }
  
  // 2. Validate JWT Secret
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default_secret_change_in_production') {
    if (isProduction) {
      validationResults.errors.push('JWT_SECRET must be set to a strong random value in production');
    } else {
      validationResults.warnings.push('JWT_SECRET is using default value. Generate a secure secret for production.');
    }
  } else if (process.env.JWT_SECRET.length < 32) {
    validationResults.warnings.push('JWT_SECRET should be at least 32 characters long for security');
  }
  
  // 3. Validate Stripe Configuration
  const stripeConfigured = !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PUBLISHABLE_KEY &&
    isConfigured(process.env.STRIPE_SECRET_KEY) &&
    isConfigured(process.env.STRIPE_PUBLISHABLE_KEY)
  );
  
  if (!stripeConfigured) {
    if (isProduction) {
      validationResults.errors.push('Stripe credentials must be configured in production');
    } else {
      validationResults.warnings.push('Stripe not configured. Payment features will not work.');
    }
  } else {
    // Check if using test vs live keys
    const usingTestKeys = process.env.STRIPE_SECRET_KEY.startsWith('sk_test');
    if (isProduction && usingTestKeys) {
      validationResults.errors.push('Using Stripe TEST keys in production. Switch to LIVE keys (sk_live_...)');
    } else if (!isProduction && !usingTestKeys) {
      validationResults.warnings.push('Using Stripe LIVE keys in development. Consider using test keys.');
    }
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      validationResults.warnings.push('STRIPE_WEBHOOK_SECRET not set. Webhook verification will fail.');
    }
    
    if (stripeConfigured && !usingTestKeys) {
      validationResults.info.push('✓ Stripe configured with live keys');
    } else if (stripeConfigured) {
      validationResults.info.push('✓ Stripe configured with test keys');
    }
  }
  
  // 5. Validate Email Configuration
  const emailConfigured = !!(
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASSWORD &&
    isConfigured(process.env.EMAIL_USER) &&
    isConfigured(process.env.EMAIL_PASSWORD)
  );
  
  if (!emailConfigured) {
    validationResults.warnings.push('Email not configured. Contact form notifications will not work.');
  } else {
    validationResults.info.push('✓ Email configured');
  }
  
  // 6. Validate CORS Configuration
  if (isProduction && !process.env.CLIENT_URL) {
    validationResults.errors.push('CLIENT_URL must be set in production for CORS security');
  } else if (isProduction) {
    validationResults.info.push(`✓ CORS configured for: ${process.env.CLIENT_URL}`);
  }
  
  // 7. Check PORT configuration
  const port = process.env.PORT || 3000;
  validationResults.info.push(`Server will run on port: ${port}`);
  
  // Print results
  printValidationResults();
  
  // Return status
  return {
    isValid: validationResults.errors.length === 0,
    hasWarnings: validationResults.warnings.length > 0,
    results: validationResults
  };
}

/**
 * Print validation results with colors
 */
function printValidationResults() {
  // Print info messages
  if (validationResults.info.length > 0) {
    validationResults.info.forEach(msg => {
      console.log(`  ℹ️  ${msg}`);
    });
    console.log('');
  }
  
  // Print warnings
  if (validationResults.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    validationResults.warnings.forEach(msg => {
      console.log(`  ⚠️  ${msg}`);
    });
    console.log('');
  }
  
  // Print errors
  if (validationResults.errors.length > 0) {
    console.log('❌ ERRORS:\n');
    validationResults.errors.forEach(msg => {
      console.log(`  ❌ ${msg}`);
    });
    console.log('');
  }
  
  // Print summary
  if (validationResults.errors.length > 0) {
    console.log('❌ Configuration validation FAILED. Please fix the errors above.\n');
    if (process.env.NODE_ENV === 'production') {
      console.log('💡 TIP: Copy .env.production.example to .env and fill in your credentials\n');
    } else {
      console.log('💡 TIP: Copy .env.example to .env and configure your services\n');
      console.log('   For development, you can leave Appwrite unconfigured to use in-memory storage.\n');
    }
  } else if (validationResults.warnings.length > 0) {
    console.log('✓ Configuration validation passed with warnings\n');
  } else {
    console.log('✅ All configuration checks passed!\n');
  }
}

/**
 * Generate helpful setup instructions
 */
function printSetupInstructions() {
  console.log('\n📋 SETUP INSTRUCTIONS:\n');
  console.log('1. Copy the template file:');
  console.log('   cp .env.example .env\n');
  console.log('2. Edit .env and configure your credentials:\n');
  console.log('   - Generate a strong JWT_SECRET:');
  console.log('     node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"\n');
  console.log('   - Set up Appwrite: See APPWRITE_SETUP.md for detailed instructions\n');
  console.log('   - Configure Stripe: Get keys from https://dashboard.stripe.com/apikeys\n');
  console.log('   - Set up Email: Use app-specific password for Gmail\n');
  console.log('3. Restart the server after configuration\n');
}

module.exports = {
  validateEnvironment,
  printSetupInstructions,
  isConfigured
};
