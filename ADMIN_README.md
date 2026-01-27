# EzClippin Admin Backend

This document describes the admin backend system for monitoring and managing the EzClippin website.

## Features

The admin backend provides comprehensive monitoring and management capabilities:

### 1. Admin Authentication
- Secure JWT-based authentication
- Role-based access control
- Admin credentials configured via environment variables:
  - `ADMIN_EMAIL`: Admin user email address
  - `ADMIN_PASSWORD_HASH`: Bcrypt hash of admin password
  - `ADMIN_NAME`: Admin user display name
- Default credentials (for development only): `admin@ezclippin.studio` / `admin123`

### 2. Dashboard Overview
- View total users, visits, downloads, and contact submissions
- Real-time statistics
- Quick access to all management features

### 3. User Management
- View all registered users
- Search and filter users
- View individual user details:
  - Account information
  - Subscription status
  - Download history
  - Subscription events
- Manually update user subscription tiers
- Create manual subscriptions for users

### 4. Subscription Management
- View all Stripe subscriptions
- Filter by status (active, past_due, canceled, etc.)
- View detailed subscription information
- Administrative actions:
  - Cancel subscriptions (immediately or at period end)
  - Resume canceled subscriptions
  - Issue refunds (full or partial)
- Track all subscription events and changes

### 5. Analytics & Monitoring
- Website visit tracking
  - Total visits and unique visitors
  - Visit details (IP, path, referrer, timestamp)
  - Date range filtering
- Download statistics
  - Track downloads by platform
  - Monitor download trends
  - View recent downloads
- Real-time event logging

### 6. Contact Form Management
- View all contact form submissions
- View complaints and support tickets
- Filter by status
- Track submission timestamps

## API Endpoints

### Authentication
```
POST /api/admin/login
```

### Dashboard
```
GET /api/admin/dashboard
```

### User Management
```
GET /api/admin/users
GET /api/admin/users/:userId
PATCH /api/admin/users/:userId/subscription
POST /api/admin/users/:userId/create-subscription
```

### Subscription Management
```
GET /api/admin/subscriptions
GET /api/admin/subscriptions/:subscriptionId
POST /api/admin/subscriptions/:subscriptionId/cancel
POST /api/admin/subscriptions/:subscriptionId/resume
POST /api/admin/subscriptions/:subscriptionId/refund
```

### Analytics
```
GET /api/admin/analytics/visits
GET /api/admin/analytics/downloads
```

### Contact & Events
```
GET /api/admin/contact-submissions
GET /api/admin/subscription-events
```

## Access the Admin Dashboard

1. Start the server:
   ```bash
   npm start
   ```

2. Navigate to:
   ```
   http://localhost:3000/admin.html
   ```

3. Login with admin credentials:
   - Email: `admin@ezclippin.studio`
   - Password: `admin123`

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION:**

1. **Change Default Admin Credentials**: Set secure admin credentials via environment variables
   - Set `ADMIN_EMAIL` to your admin email address
   - Generate a bcrypt hash for your password:
     ```bash
     node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-secure-password', 10, (err, hash) => console.log(hash));"
     ```
   - Set `ADMIN_PASSWORD_HASH` to the generated hash
   - Optionally set `ADMIN_NAME` to customize the admin display name

2. **HTTPS Only**: Always use HTTPS in production

3. **Strong, Mandatory JWT Secret**:
   - **REQUIRED**: Set a strong, random `JWT_SECRET` via environment variables
   - The server will **fail to start** if `JWT_SECRET` is missing or empty
   - Generate a secure secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Never use default or hardcoded secrets in any environment

4. **Database Migration**: Replace in-memory storage with a proper database

5. **Rate Limiting**: The admin routes inherit API rate limiting

6. **Audit Logging**: All admin actions are logged with timestamps and admin email

7. **Data Retention**: In-memory data is automatically purged after 7 days (configurable)

## Data Storage

Currently uses in-memory storage (`utils/dataStore.js`) for:
- Website visits
- Contact submissions
- Download tracking
- Subscription events

**For production**: Replace with a persistent database (PostgreSQL, MongoDB, etc.)

## Automated Tracking

The system automatically tracks:

1. **Website Visits**: Every non-API page request
2. **User Signups**: When users register via `/api/auth/signup`
3. **Downloads**: When users request download links
4. **Contact Forms**: All contact and complaint submissions
5. **Subscription Events**: All Stripe webhook events
6. **Admin Actions**: All administrative changes and actions

## Architecture

```
├── middleware/
│   └── admin.js          # Admin authentication middleware
├── routes/
│   └── admin.js          # Admin API endpoints
├── utils/
│   └── dataStore.js      # In-memory data storage (replace for production)
└── admin.html            # Admin dashboard UI
```

## Future Enhancements

Potential improvements for production:

1. Database integration (PostgreSQL/MongoDB)
2. Advanced analytics and reporting
3. Email notification system for admin alerts
4. Bulk user operations
5. Advanced search and filtering
6. Export functionality (CSV/Excel)
7. Two-factor authentication for admin
8. Activity audit trail
9. Custom subscription plans management
10. Automated backup and recovery

## Support

For issues or questions, contact the development team.
