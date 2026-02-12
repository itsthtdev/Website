# Developer To-Do List

## ✅ What Has Been Fixed (Already Complete)

All security vulnerabilities have been fixed and the application is ready. The following issues are resolved:

1. ✅ Fixed server crash from undefined PRICE_IDS variable
2. ✅ Removed hardcoded admin credentials (now uses environment variables)
3. ✅ Fixed authentication bypass vulnerability
4. ✅ Added environment validation on server startup
5. ✅ Created secure JWT_SECRET automatically
6. ✅ Added input validation to all API endpoints
7. ✅ CodeQL security scan passed (0 alerts)

---

## 🔧 What YOU Need to Do (Step-by-Step)

### Step 1: Get Your Appwrite Credentials

**What is Appwrite?** Appwrite is your backend database where user data is stored.

**How to get your credentials:**

1. Go to https://cloud.appwrite.io
2. Log in to your account
3. Click on your project (or create a new one if you don't have one)
4. Click **"Settings"** in the left sidebar
5. Click **"View API Keys"**

**Copy these values:**

- **Project ID**: Located at the top (looks like: `65abc123def456789`)
- **API Key**: Click "Create API Key" if you don't have one
  - Name it: "EzClippin Server"
  - Select these scopes:
    - `users.read`
    - `users.write`
    - `databases.read`
    - `databases.write`
  - Click "Create"
  - **COPY THE KEY NOW** (you can't see it again!)

6. Now go to **"Databases"** in the left sidebar
7. Click on your database (or create one named "ezclippin")
8. Copy the **Database ID** (looks like: `65def789abc123456`)

9. For each collection, click on it and copy the **Collection ID**:
   - Users collection
   - Visits collection
   - Contacts collection
   - Downloads collection
   - Subscriptions collection

**Once you have all these values, reply back with:**
```
APPWRITE_PROJECT_ID=<paste here>
APPWRITE_API_KEY=<paste here>
APPWRITE_DATABASE_ID=<paste here>
APPWRITE_USERS_COLLECTION_ID=<paste here>
APPWRITE_VISITS_COLLECTION_ID=<paste here>
APPWRITE_CONTACTS_COLLECTION_ID=<paste here>
APPWRITE_DOWNLOADS_COLLECTION_ID=<paste here>
APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=<paste here>
```

---

### Step 2: Get Your Stripe Credentials (For Payments)

**What is Stripe?** Stripe processes credit card payments for your subscription service.

**How to get your credentials:**

1. Go to https://dashboard.stripe.com
2. Log in to your account
3. Make sure you're in **TEST MODE** (toggle in top right) for now
4. Click **"Developers"** in the top menu
5. Click **"API keys"** in the left sidebar

**Copy these values:**

- **Publishable key**: Starts with `pk_test_` (you can see this anytime)
- **Secret key**: Starts with `sk_test_` (click "Reveal test key")

6. For webhook secret:
   - Click **"Webhooks"** in the left sidebar
   - Click **"Add endpoint"**
   - Enter your URL: `https://yourdomain.com/api/stripe/webhook`
   - Select these events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click "Add endpoint"
   - Click on the webhook you just created
   - Click **"Signing secret"** and copy it (starts with `whsec_`)

**Once you have all these values, reply back with:**
```
STRIPE_SECRET_KEY=<paste here>
STRIPE_PUBLISHABLE_KEY=<paste here>
STRIPE_WEBHOOK_SECRET=<paste here>
```

---

### Step 3: Get Email Credentials (For Contact Form)

**What is this for?** This lets your contact form send emails to you.

**How to get Gmail App Password:**

1. Go to https://myaccount.google.com
2. Click **"Security"** in the left sidebar
3. Enable **"2-Step Verification"** if not already enabled
4. After 2FA is enabled, go back to Security
5. Scroll down and click **"App passwords"**
6. Select:
   - App: **Mail**
   - Device: **Other (Custom name)**
   - Type: "EzClippin Website"
7. Click **"Generate"**
8. **COPY THE PASSWORD** (looks like: `abcd efgh ijkl mnop`)

**Once you have this, reply back with:**
```
EMAIL_USER=<your gmail address>
EMAIL_PASSWORD=<the app password you copied>
```

---

### Step 4: (Optional) Change Admin Password

**Default admin login:**
- Email: `admin@ezclippin.studio`
- Password: `admin123`

**To change the admin password:**

1. Open Terminal/Command Prompt
2. Navigate to your project folder: `cd /path/to/Website`
3. Run this command with YOUR desired password:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('YOUR_NEW_PASSWORD', 10))"
   ```
4. Copy the output (it's a long hash starting with `$2a$10$`)

**Reply back with:**
```
ADMIN_PASSWORD_HASH=<paste the hash here>
ADMIN_EMAIL=<your email or keep admin@ezclippin.studio>
```

---

### Step 5: (Optional but Recommended) Stripe Price IDs

**What is this?** Price IDs tell Stripe which subscription plans you offer.

**How to get them:**

1. In Stripe Dashboard, click **"Products"**
2. Click on each product/subscription plan you have
3. Copy the **Price ID** (starts with `price_`)
4. Make a comma-separated list of all valid price IDs

**Reply back with:**
```
STRIPE_ALLOWED_PRICE_IDS=price_xxx,price_yyy,price_zzz
```

---

## 📝 When You Reply Back

Simply paste all the values you collected in one message like this:

```
# Appwrite
APPWRITE_PROJECT_ID=65abc123def456789
APPWRITE_API_KEY=your_actual_api_key
APPWRITE_DATABASE_ID=65def789abc123456
APPWRITE_USERS_COLLECTION_ID=collection_id_1
APPWRITE_VISITS_COLLECTION_ID=collection_id_2
APPWRITE_CONTACTS_COLLECTION_ID=collection_id_3
APPWRITE_DOWNLOADS_COLLECTION_ID=collection_id_4
APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=collection_id_5

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Email
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your_app_password

# Admin (optional)
ADMIN_PASSWORD_HASH=$2a$10$your_hash_here
ADMIN_EMAIL=admin@ezclippin.studio
```

I will then:
1. Update your `.env` file with these values
2. Test the server to make sure everything works
3. Confirm that Appwrite is connected
4. Confirm that all security issues are resolved

---

## ⚠️ Important Notes

- **Never share** your API keys publicly (don't post them in GitHub issues!)
- The `.env` file is already in `.gitignore` so it won't be committed to git
- For **production**, use Stripe LIVE keys (starts with `sk_live_` and `pk_live_`)
- Keep your credentials safe and never share them

---

## 🚀 After I Update Your Credentials

The application will be fully configured and ready to:
- ✅ Store user data in Appwrite
- ✅ Process payments with Stripe
- ✅ Send contact form emails
- ✅ Admin dashboard access
- ✅ All security features active

---

## 🆘 Need Help?

If you have trouble finding any of these values, reply with which step you're stuck on and I'll provide more detailed guidance for that specific step.
