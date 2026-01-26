# EzClippin Admin Backend

This document describes the admin backend system for monitoring and managing the EzClippin website.

## Features

The admin backend provides comprehensive monitoring and management capabilities:

### 1. Admin Authentication
- Secure JWT-based authentication
- Role-based access control
- Default credentials: `admin@ezclippin.studio` / `admin123` (change in production!)

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

1. **Change Default Password**: Update the admin password in `middleware/admin.js`
   - Generate a bcrypt hash: `bcrypt.hash('your-secure-password', 10)`
   - Replace the hash in the ADMIN_USERS Map

2. **Use Environment Variables**: Store admin credentials in environment variables

3. **HTTPS Only**: Always use HTTPS in production

4. **Strong, Mandatory JWT Secret**:
   - Always set a strong, random `JWT_SECRET` via environment variables (in all environments).
   - Do **not** rely on any hardcoded or default JWT secret for signing tokens.
   - Configure the server to **fail fast on startup** if `JWT_SECRET` is missing or empty.

5. **Database Migration**: Replace in-memory storage with a proper database

6. **Rate Limiting**: The admin routes inherit API rate limiting

7. **Audit Logging**: All admin actions are logged with timestamps and admin email

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
