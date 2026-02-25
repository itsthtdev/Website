# Developer To-Do List

## ⚠️ IMPORTANT: Before You Start

Run this command in your terminal to install dependencies:
```bash
cd /path/to/Website
npm install
```

---

## ✅ What Has Been Fixed (Already Complete)

1. ✅ Fixed server crash from undefined PRICE_IDS variable
2. ✅ Removed hardcoded admin credentials (now uses environment variables)
3. ✅ Fixed authentication bypass vulnerability
4. ✅ Added environment validation on server startup
5. ✅ Created secure JWT_SECRET automatically
6. ✅ Added input validation to all API endpoints
7. ✅ CodeQL security scan passed (0 alerts)
8. ✅ Removed Appwrite integration — backend now runs fully standalone
9. ✅ Removed phone number requirement and SMS/email verification from signup (beta-friendly)

---

## 🔧 What YOU Need to Do (Step-by-Step)

### Step 1: Get Your Stripe Credentials (For Payments)

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

### Step 2: Get Email Credentials (For Contact Form)

**What is this for?** This lets your contact form send notification emails to you.

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

### Step 3: (Optional) Change Admin Password

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

## ⚠️ Important Notes

- **Never share** your API keys publicly (don't post them in GitHub issues!)
- The `.env` file is already in `.gitignore` so it won't be committed to git
- For **production**, use Stripe LIVE keys (starts with `sk_live_` and `pk_live_`)
- Keep your credentials safe and never share them

---

## 🚀 After Credentials Are Set

The application will be fully configured and ready to:
- ✅ Let users create accounts (name + email + password — no phone required)
- ✅ Process payments with Stripe
- ✅ Send contact form emails
- ✅ Admin dashboard access
- ✅ All security features active


---

## 🆘 Need Help?

If you have trouble finding any of these values, reply with which step you're stuck on and I'll provide more detailed guidance for that specific step.
