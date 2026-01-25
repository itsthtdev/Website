const jwt = require('jsonwebtoken');

// Admin user credentials (in production, use a database with hashed passwords)
const ADMIN_USERS = new Map([
  ['admin@ezclippin.studio', {
    id: 'admin-001',
    email: 'admin@ezclippin.studio',
    password: '$2a$10$YourHashedPasswordHere', // Use bcrypt to hash: "admin123"
    role: 'admin',
    name: 'Admin User'
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
