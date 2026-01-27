const jwt = require('jsonwebtoken');

// Validate JWT_SECRET on module load
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  console.error('The server cannot start without a secure JWT secret.');
  console.error('Please set JWT_SECRET in your .env file or environment variables.');
  process.exit(1);
}

// Admin user credentials from environment variables
// In production, use a database with hashed passwords
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ezclippin.studio';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$eC7Ah5Xj1VieqDE2jDLVIOqwiFPelK.W2DtYuXqI6SlXg9KyDubtW';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User';

// Warn if using default admin credentials
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) {
  console.warn('WARNING: Using default admin credentials. Please set ADMIN_EMAIL and ADMIN_PASSWORD_HASH environment variables in production.');
}

const ADMIN_USERS = new Map([
  [ADMIN_EMAIL, {
    id: 'admin-001',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD_HASH,
    role: 'admin',
    name: ADMIN_NAME
  }]
]);

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
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
