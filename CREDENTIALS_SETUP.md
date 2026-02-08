# Appwrite Credentials Setup Guide

## Important Security Notice

**⚠️ CRITICAL**: The Appwrite credentials you provided in the issue have been documented here for your reference, but they are **NOT stored in the repository**. They must be configured in your `.env` file which is excluded from Git for security.

## Your Appwrite Configuration

Based on the credentials you provided, here's your configuration:

```
Endpoint: https://sfo.cloud.appwrite.io/v1
Project ID: 696397ea00044f7c73ee
Database ID: 6978ae25002272a88d7b
API Key: standard_0562e88749ab7a5eb7c52d09a762aeebd8bda73b08366ba50f15f89bb04a20baf749cf27263b8fe36a5cd139300380802f9b01d183175c464d14db5c56aadfff09a9589a2f1e5e635e1233cb4e67c0f3223abaf22f68dde4a2f0c83ea6a2bc1b4bb1e0e52c2d3a4c6c2a01a9d9a4afad95ca35c0d7164c927d8c0583174336a8
```

**Note**: There appears to be a second API key mentioned in your issue:
```
API secret: standard_cef217a2e720c8d8569aea429f0a97260a459d985192800c8r52102058b3c76d4b3b93c6e3f99409e69f0a53116c48c844895143508bbdd9096fae95c99d2706e0225c6c40aa03923c52baea45c55dbf8e8ecf49bd1dc96485ede6eca4d6a55e160f64aba831bf1c5f8c6525c042b7bffb1aeed106226c5de458dd860670eedf5
```

This second key may be for client-side access. Use the first key (starting with `standard_0562...`) for server-side operations.

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
APPWRITE_PROJECT_ID=696397ea00044f7c73ee
APPWRITE_API_KEY=standard_0562e88749ab7a5eb7c52d09a762aeebd8bda73b08366ba50f15f89bb04a20baf749cf27263b8fe36a5cd139300380802f9b01d183175c464d14db5c56aadfff09a9589a2f1e5e635e1233cb4e67c0f3223abaf22f68dde4a2f0c83ea6a2bc1b4bb1e0e52c2d3a4c6c2a01a9d9a4afad95ca35c0d7164c927d8c0583174336a8
APPWRITE_DATABASE_ID=6978ae25002272a88d7b
```

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
2. Go to your project (ID: 696397ea00044f7c73ee)
3. Click on "Databases" in the sidebar
4. Click on your database (ID: 6978ae25002272a88d7b)
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
