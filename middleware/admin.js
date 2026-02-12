const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Admin user credentials
 * 
 * SECURITY NOTE: In production, this should be moved to a secure database
 * with environment-based credentials. For now, we use environment variables
 * for admin credentials with secure defaults.
 * 
 * To configure:
 * 1. Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH in your .env file
 * 2. Generate password hash: node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 10))"
 * 3. Store the hash in ADMIN_PASSWORD_HASH environment variable
 */

// Get admin credentials from environment or use defaults (with warning)
const getAdminCredentials = () => {
  const email = process.env.ADMIN_EMAIL || 'admin@ezclippin.studio';
  const passwordHash = process.env.ADMIN_PASSWORD_HASH || 
    '$2a$10$eC7Ah5Xj1VieqDE2jDLVIOqwiFPelK.W2DtYuXqI6SlXg9KyDubtW'; // Default: "admin123"
  
  // Warn if using default credentials
  if (!process.env.ADMIN_PASSWORD_HASH) {
    console.warn('\n⚠️  WARNING: Using default admin password!');
    console.warn('   Default admin: admin@ezclippin.studio / admin123');
    console.warn('   For production, set ADMIN_EMAIL and ADMIN_PASSWORD_HASH in .env');
    console.warn('   Generate hash: node -e "console.log(require(\'bcryptjs\').hashSync(\'YOUR_PASSWORD\', 10))"\n');
  }
  
  return {
    id: 'admin-001',
    email,
    password: passwordHash,
    role: 'admin',
    name: process.env.ADMIN_NAME || 'Admin User'
  };
};

// Initialize admin users map
const ADMIN_USERS = new Map();
const adminCreds = getAdminCredentials();
ADMIN_USERS.set(adminCreds.email, adminCreds);

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret_change_in_production'
    );
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminId = decoded.userId;
    req.adminEmail = decoded.email;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  verifyAdminToken,
  ADMIN_USERS
};
