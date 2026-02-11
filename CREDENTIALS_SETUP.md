# Appwrite Credentials Setup Guide

## 🔴 CRITICAL SECURITY WARNING

**If you posted your Appwrite credentials in a public GitHub issue, they are now compromised and should be rotated immediately!**

### Immediate Action Required:

1. **Rotate Your API Keys NOW**:
   - Log into https://cloud.appwrite.io
   - Go to your project settings
   - Navigate to "API Keys"
   - **DELETE** the exposed API key immediately
   - Create a new API key with the same permissions
   - Use the new key in your `.env` file

2. **Never Share Credentials Publicly**:
   - Don't post credentials in GitHub issues, comments, or pull requests
   - Don't commit credentials to Git repositories
   - Don't share credentials via email, chat, or screenshots
   - Use secure password managers to share credentials with team members

3. **Review Access Logs**:
   - Check your Appwrite logs for unauthorized access
   - Review recent user registrations for suspicious activity
   - Monitor your database for unexpected changes

---

## Important Security Notice

**⚠️ CRITICAL**: The Appwrite credentials you provided in the issue have been documented here for your reference, but they are **NOT stored in the repository**. They must be configured in your `.env` file which is excluded from Git for security.

## Your Appwrite Configuration

⚠️ **SECURITY NOTE**: Your actual Appwrite credentials were provided in the issue. For security reasons, they are **NOT** included in this documentation or repository. You must configure them in your `.env` file on your production server.

The credentials you provided include:
- Endpoint: `https://sfo.cloud.appwrite.io/v1`
- Project ID: (from your Appwrite dashboard)
- Database ID: (from your Appwrite dashboard)
- API Key: (keep this secure and never commit to Git)

**Important**: If you shared these credentials publicly (e.g., in a GitHub issue), you should rotate them immediately in your Appwrite dashboard for security.

## Setup Instructions

### Step 1: Create Your .env File

In your production server, create a `.env` file with your Appwrite credentials:

```bash
cd /path/to/your/website
cp .env.production.example .env
```

### Step 2: Configure Appwrite Settings

Edit the `.env` file and uncomment/update the Appwrite configuration:

```env
# Appwrite Configuration
APPWRITE_ENDPOINT=https://sfo.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here
APPWRITE_DATABASE_ID=your_database_id_here
```

Replace the placeholder values above with your actual Appwrite credentials from your dashboard.

### Step 3: Configure Collection IDs

You need to create collections in your Appwrite database and then add their IDs to your `.env` file. Follow the guide in `APPWRITE_SETUP.md` to create the collections, then add:

```env
APPWRITE_USERS_COLLECTION_ID=your_users_collection_id
APPWRITE_VISITS_COLLECTION_ID=your_visits_collection_id
APPWRITE_CONTACTS_COLLECTION_ID=your_contacts_collection_id
APPWRITE_DOWNLOADS_COLLECTION_ID=your_downloads_collection_id
APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=your_subscriptions_collection_id
```

**Common collection naming:**
- If you named your collections exactly as suggested in the setup guide, you might use the collection names directly (e.g., "users", "visits", etc.)
- However, it's better to use the actual collection IDs from your Appwrite dashboard

To find your collection IDs:
1. Log into your Appwrite Console at https://cloud.appwrite.io
2. Go to your project (find your Project ID in the dashboard)
3. Click on "Databases" in the sidebar
4. Click on your database (find your Database ID in the list)
5. Click on each collection and copy its ID from the URL or settings

### Step 4: Secure Your .env File

Make sure your `.env` file is not accessible to the public:

```bash
# Set restrictive permissions (Linux/Mac)
chmod 600 .env

# Verify it's in .gitignore
cat .gitignore | grep "^\.env$"
```

### Step 5: Start Your Server

```bash
npm install
npm start
```

You should see:
```
✅ Appwrite configured - using cloud database
🚀 EzClippin server running on port 3000
```

## Testing Your Setup

### Test 1: User Registration

```bash
curl -X POST http://your-domain.com/api/auth/signup \
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
  "user": { ... },
  "token": "eyJ..."
}
```

### Test 2: User Login

```bash
curl -X POST http://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### Test 3: Admin Login

Default admin credentials:
- **Email**: `admin@ezclippin.studio`
- **Password**: `admin123`

```bash
curl -X POST http://your-domain.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ezclippin.studio",
    "password": "admin123"
  }'
```

**⚠️ IMPORTANT**: Change the admin password in production! The password hash is stored in `/middleware/admin.js`.

### Test 4: Verify in Appwrite Console

1. Log into Appwrite Console: https://cloud.appwrite.io
2. Go to your project
3. Check "Auth" → "Users" - you should see the test user
4. Check "Databases" → Your database → "users" collection - you should see user profile data

## Troubleshooting

### "Appwrite not configured - using in-memory storage"

**Cause**: Environment variables are not set correctly.

**Solution**:
1. Verify `.env` file exists in the root directory
2. Check that variables are uncommented (no `#` at the start)
3. Restart your server after editing `.env`

### "Failed to create user" or "Appwrite error"

**Possible causes and solutions**:

1. **Invalid API Key**
   - Verify the API key in Appwrite Dashboard → Settings → API Keys
   - Ensure the key has these permissions:
     - `users.read`
     - `users.write`
     - `databases.read`
     - `databases.write`

2. **Collections don't exist**
   - Follow `APPWRITE_SETUP.md` to create all required collections
   - Verify collection IDs in your `.env` match those in Appwrite

3. **Wrong Database ID**
   - Double-check the database ID in Appwrite Console
   - Ensure it matches `APPWRITE_DATABASE_ID` in your `.env`

4. **Network issues**
   - Verify your server can reach https://sfo.cloud.appwrite.io
   - Check firewall settings
   - Try curl: `curl https://sfo.cloud.appwrite.io/v1/health/status`

### User can create account but can't login

**Cause**: Password mismatch or user data corruption.

**Solution**:
1. Check server logs for specific error messages
2. Verify the user exists in Appwrite Console
3. Try creating a new user with a different email
4. If needed, delete the test user and recreate

### Admin can't login

**Cause**: Admin credentials don't match the hash in code.

**Default credentials**:
- Email: `admin@ezclippin.studio`
- Password: `admin123`

**To change admin password**:
1. Generate a bcrypt hash of your new password:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('YourNewPassword', 10))"
   ```
2. Edit `/middleware/admin.js` and replace the password hash
3. Restart your server

## Security Best Practices

Now that authentication is working:

1. **Rotate API Keys Regularly**
   - Create a new API key every 90 days
   - Delete old keys after updating `.env`

2. **Use Separate Environments**
   - Create separate Appwrite projects for development and production
   - Never use production API keys in development

3. **Monitor Access**
   - Regularly check Appwrite Console for unusual activity
   - Review user registrations and login patterns

4. **Backup Your Data**
   - Use Appwrite's export features to backup user data
   - Store backups securely

5. **Change Default Admin Password**
   - The default admin password (`admin123`) should be changed immediately
   - Use a strong password

6. **Enable Two-Factor Authentication**
   - Enable 2FA on your Appwrite account
   - Enable 2FA on your GitHub account

See `SECURITY.md` for complete security guidelines.

## Next Steps

Once authentication is working:

1. ✅ Users can create accounts
2. ✅ Users can login and access dashboard
3. ✅ Admin can login and access admin panel
4. [ ] Configure Stripe for payments (see `.env.production.example`)
5. [ ] Configure email service (see `.env.production.example`)
6. [ ] Set up domain and HTTPS
7. [ ] Deploy to production
8. [ ] Test complete user flow
9. [ ] Monitor and maintain

## Support

If you continue to have issues:

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test connectivity to Appwrite endpoint
4. Review `APPWRITE_SETUP.md` for collection setup
5. Review `SECURITY.md` for security guidelines
6. Open a GitHub issue with:
   - Server logs (redact sensitive info)
   - Steps to reproduce
   - Expected vs actual behavior

---

**Remember**: Never commit your `.env` file or share your API keys publicly!
