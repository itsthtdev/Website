# Appwrite.io Setup Guide for EzClippin

This guide will help you set up Appwrite.io as the backend for the EzClippin website, enabling persistent data storage for users, analytics, and more.

## Why Appwrite?

Appwrite is an open-source backend-as-a-service platform that provides:
- User authentication and management
- Database with collections and queries
- Real-time capabilities
- File storage
- Cloud functions
- Built-in security

## Prerequisites

- Appwrite Cloud account (https://cloud.appwrite.io) OR
- Self-hosted Appwrite instance (https://appwrite.io/docs/installation)

## Quick Start

### Option 1: Appwrite Cloud (Recommended)

1. **Create an Appwrite Cloud Account**
   - Go to https://cloud.appwrite.io
   - Sign up for a free account
   - Create a new project

2. **Get Your Project Credentials**
   - In your Appwrite project dashboard
   - Copy your Project ID
   - Go to Settings → API Keys
   - Create a new API Key with the following scopes:
     - `users.read`
     - `users.write`
     - `databases.read`
     - `databases.write`
   - Copy the generated API Key

3. **Create Database and Collections**

   **Create Database:**
   - Go to Databases in the left sidebar
   - Click "Create Database"
   - Name it "ezclippin" (or your preferred name)
   - Copy the Database ID

   **Create Collections:**

   a. **Users Collection** (for user profiles)
   - Name: `users`
   - Attributes:
     - `userId` (string, required, size: 255)
     - `subscription` (string, required, size: 50, default: "free")
     - `verified` (boolean, required, default: true)
     - `createdAt` (string, required, size: 50)
     - `passwordHash` (string, size: 255) - Stores bcrypt password hash for authentication
   - Permissions: 
     - Create: Users
     - Read: Users (owner only)
     - Update: Users (owner only)
     - Delete: Users (owner only)
   - Indexes:
     - `userId` (key index)

   b. **Visits Collection** (for analytics)
   - Name: `visits`
   - Attributes:
     - `timestamp` (string, required, size: 50)
     - `ip` (string, required, size: 100)
     - `userAgent` (string, size: 500)
     - `path` (string, required, size: 255)
     - `referrer` (string, size: 500)
   - Permissions:
     - Create: Any
     - Read: Admin only
   - Indexes:
     - `timestamp` (key index)
     - `path` (key index)

   c. **Contacts Collection** (for contact submissions)
   - Name: `contacts`
   - Attributes:
     - `timestamp` (string, required, size: 50)
     - `name` (string, required, size: 255)
     - `email` (string, required, size: 255)
     - `message` (string, required, size: 5000)
     - `status` (string, required, size: 50, default: "new")
   - Permissions:
     - Create: Any
     - Read: Admin only
     - Update: Admin only
   - Indexes:
     - `timestamp` (key index)
     - `status` (key index)

   d. **Downloads Collection** (for download tracking)
   - Name: `downloads`
   - Attributes:
     - `timestamp` (string, required, size: 50)
     - `userId` (string, required, size: 255)
     - `platform` (string, required, size: 50)
     - `version` (string, size: 50)
   - Permissions:
     - Create: Users
     - Read: Users (owner only)
   - Indexes:
     - `timestamp` (key index)
     - `userId` (key index)
     - `platform` (key index)

   e. **Subscriptions Collection** (for subscription events)
   - Name: `subscriptions`
   - Attributes:
     - `timestamp` (string, required, size: 50)
     - `userId` (string, required, size: 255)
     - `type` (string, required, size: 100)
     - `plan` (string, size: 50)
     - `status` (string, required, size: 50)
   - Permissions:
     - Create: Users
     - Read: Users (owner only)
     - Update: Admin only
   - Indexes:
     - `timestamp` (key index)
     - `userId` (key index)
     - `type` (key index)

4. **Configure Environment Variables**
   
   Update your `.env` file with the Appwrite credentials:

   ```env
   # Appwrite Configuration
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your_project_id_here
   APPWRITE_API_KEY=your_api_key_here
   APPWRITE_DATABASE_ID=your_database_id_here
   APPWRITE_USERS_COLLECTION_ID=your_users_collection_id
   APPWRITE_VISITS_COLLECTION_ID=your_visits_collection_id
   APPWRITE_CONTACTS_COLLECTION_ID=your_contacts_collection_id
   APPWRITE_DOWNLOADS_COLLECTION_ID=your_downloads_collection_id
   APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=your_subscriptions_collection_id
   ```

   Replace the placeholder values with your actual IDs from Appwrite.

5. **Start Your Server**
   ```bash
   npm start
   ```

   You should see:
   ```
   ✅ Appwrite configured - using cloud database
   🚀 EzClippin server running on port 3000
   ```

### Option 2: Self-Hosted Appwrite

1. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

2. **Install Appwrite**
   ```bash
   docker run -it --rm \
     --volume /var/run/docker.sock:/var/run/docker.sock \
     --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
     --entrypoint="install" \
     appwrite/appwrite:1.4.13
   ```

3. **Access Appwrite Console**
   - Open http://localhost
   - Create your first project
   - Follow the same steps as Option 1 for creating collections

4. **Configure Environment Variables**
   ```env
   APPWRITE_ENDPOINT=http://localhost/v1
   APPWRITE_PROJECT_ID=your_project_id
   APPWRITE_API_KEY=your_api_key
   # ... rest of the configuration
   ```

## Testing Your Setup

1. **Test User Signup**
   ```bash
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "phone": "+1234567890",
       "password": "Test123!@#"
     }'
   ```

   Expected response:
   ```json
   {
     "message": "User created successfully",
     "user": {...},
     "token": "eyJ..."
   }
   ```

2. **Check Appwrite Console**
   - Go to Auth → Users
   - You should see the new user
   - Go to Databases → Your Database → users collection
   - You should see the user profile

3. **Test Login**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!@#"
     }'
   ```

## Fallback Mode

If Appwrite is not configured (missing environment variables), the system automatically falls back to in-memory storage for development:

```
⚠️  Appwrite not configured - using in-memory storage (development only)
```

This allows you to develop and test without Appwrite, but data will be lost when the server restarts.

## Migration from In-Memory to Appwrite

If you have existing users in the in-memory storage, you'll need to migrate them:

1. **Export existing data** (if needed)
2. **Configure Appwrite** as described above
3. **Restart server** - it will now use Appwrite
4. **Users will need to re-register** OR manually create them in Appwrite

## Advantages Over In-Memory Storage

| Feature | In-Memory | Appwrite |
|---------|-----------|----------|
| Data persistence | ❌ Lost on restart | ✅ Persistent |
| Scalability | ❌ Limited to one server | ✅ Distributed |
| User management | ❌ Manual | ✅ Built-in dashboard |
| Real-time updates | ❌ Not supported | ✅ Supported |
| File storage | ❌ Not supported | ✅ Supported |
| Analytics | ❌ Basic | ✅ Advanced |
| Security | ⚠️ Basic | ✅ Enterprise-grade |

## Troubleshooting

### "Appwrite not configured" message

**Cause:** Missing environment variables

**Solution:** Verify all required Appwrite environment variables are set in `.env`

### "Failed to create user in Appwrite"

**Cause 1:** Invalid API key permissions

**Solution:** Ensure API key has `users.write` scope

**Cause 2:** User already exists

**Solution:** User with that email already registered, try login instead

### "Collection not found"

**Cause:** Collection ID is incorrect or collection doesn't exist

**Solution:** 
1. Verify collection IDs in `.env` match Appwrite console
2. Ensure collections are created with correct attributes

### Network errors connecting to Appwrite

**Cause:** Firewall or network restrictions

**Solution:** 
1. Check if you can access Appwrite console
2. Verify endpoint URL is correct
3. For self-hosted: ensure Docker containers are running

## Production Deployment

### Security Best Practices

1. **Use API Keys with Minimal Scopes**
   - Create separate API keys for different environments
   - Use only required scopes

2. **Enable HTTPS**
   - Appwrite Cloud uses HTTPS by default
   - For self-hosted, configure SSL certificate

3. **Set Up Proper Permissions**
   - Review collection permissions
   - Ensure users can only access their own data

4. **Environment Variables**
   - Never commit `.env` to git
   - Use secure environment variable management (e.g., AWS Secrets Manager, Heroku Config Vars)

5. **Rate Limiting**
   - Configure rate limits in Appwrite
   - Already configured in Express server

### Monitoring

1. **Appwrite Console**
   - Monitor usage in Appwrite dashboard
   - Set up alerts for quota limits

2. **Server Logs**
   - Check server logs for Appwrite errors
   - Set up error tracking (e.g., Sentry)

## Cost Considerations

### Appwrite Cloud Pricing (as of 2026)

- **Free Tier:**
  - 75,000 monthly active users
  - 2 GB bandwidth
  - 2 GB storage
  - Perfect for getting started

- **Pro Tier:** $15/month
  - 200,000 monthly active users
  - Additional resources as needed

### Self-Hosted

- **Free** (just infrastructure costs)
- You pay for server hosting
- Full control over resources

## Support

- **Appwrite Documentation:** https://appwrite.io/docs
- **Appwrite Discord:** https://appwrite.io/discord
- **GitHub Issues:** https://github.com/appwrite/appwrite/issues

## Next Steps

1. ✅ Set up Appwrite account and project
2. ✅ Create database and collections
3. ✅ Configure environment variables
4. ✅ Test user registration and login
5. 📱 Integrate with frontend
6. 🚀 Deploy to production
7. 📊 Monitor usage and performance

---

For more information, visit the [Appwrite Documentation](https://appwrite.io/docs).
