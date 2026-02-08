# Security Guide for EzClippin Website

## Overview

This document outlines security best practices for deploying and managing the EzClippin website, with a focus on protecting sensitive credentials and API keys.

## ⚠️ Critical: Never Commit Secrets to Git

**NEVER** commit the following to your Git repository:
- `.env` files with actual credentials
- API keys (Appwrite, Stripe, etc.)
- JWT secrets
- Email passwords
- Database passwords
- Any other sensitive configuration

The `.gitignore` file is already configured to exclude `.env` files, but always verify before committing.

## Credential Management

### Appwrite Credentials

Your Appwrite credentials provide full access to your backend database and user authentication system. Protect them carefully:

#### What You Have:
- **Project ID**: Identifies your Appwrite project (semi-public, used in client code)
- **API Key**: Full admin access to your Appwrite backend (**HIGHLY SENSITIVE**)
- **Database ID**: Identifies your database
- **Endpoint**: URL of your Appwrite instance

#### How to Secure:

1. **Never expose API keys in client-side code**
   - API keys should ONLY be in your `.env` file on the server
   - Never include them in HTML, JavaScript, or any public-facing code
   - The current implementation correctly keeps them server-side only

2. **Use environment-specific API keys**
   - Create separate API keys for development, staging, and production
   - Use different Appwrite projects for each environment
   - Rotate API keys regularly (every 90 days recommended)

3. **Set minimal permissions**
   - Only grant the permissions your API key actually needs:
     - `users.read` - Read user data
     - `users.write` - Create and modify users
     - `databases.read` - Read from databases
     - `databases.write` - Write to databases
   - Avoid granting additional permissions unless required

4. **Rotate compromised keys immediately**
   - If an API key is exposed (e.g., committed to Git, shared publicly):
     1. Delete the compromised key in Appwrite Dashboard immediately
     2. Generate a new API key with the same permissions
     3. Update your `.env` file with the new key
     4. Restart your server
     5. Review access logs in Appwrite for suspicious activity

### Stripe Credentials

Stripe keys provide access to payment processing and customer billing data:

#### Key Types:
- **Publishable Key** (`pk_live_...`): Safe to use in client-side code
- **Secret Key** (`sk_live_...` or `sk_test_...`): **HIGHLY SENSITIVE** - server-side only
- **Webhook Secret** (`whsec_...`): Used to verify webhook authenticity

#### Best Practices:
1. Use test keys (`sk_test_...`, `pk_test_...`) for development
2. Never commit secret keys to Git
3. Store secret keys in environment variables only
4. Use restricted API keys when possible (restrict by IP, features, etc.)
5. Enable webhook signature verification (already implemented)
6. Monitor your Stripe dashboard for unusual activity

### JWT Secret

The JWT secret is used to sign authentication tokens. If compromised, attackers can forge user sessions.

#### How to Generate a Strong JWT Secret:

```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Best Practices:
1. Use a random string of at least 32 characters
2. Never reuse the same secret across environments
3. Rotate the JWT secret periodically (requires all users to re-login)
4. Store only in environment variables, never in code

### Email Credentials

For Gmail SMTP, use app-specific passwords:

1. Enable 2-factor authentication on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Create an app-specific password for "Mail"
4. Use this password in your `.env` file (not your regular Gmail password)

## Environment Variables Setup

### Development Environment

For local development, you can use the fallback in-memory storage (no Appwrite required):

```bash
cp .env.example .env
# Leave Appwrite settings commented out
# System will automatically use in-memory storage
npm start
```

### Production Environment

For production deployment:

1. **Copy the template:**
   ```bash
   cp .env.production.example .env
   ```

2. **Fill in your actual credentials:**
   - Replace ALL placeholder values
   - Use production API keys (not test keys)
   - Set strong JWT secret
   - Configure production email service

3. **Verify .env is not tracked by Git:**
   ```bash
   git status
   # .env should NOT appear in the list
   ```

4. **Set proper file permissions (Linux/Mac):**
   ```bash
   chmod 600 .env
   ```

## Deployment Security Checklist

Before deploying to production:

- [ ] All credentials are stored in `.env` file (not in code)
- [ ] `.env` file is in `.gitignore` and not committed to Git
- [ ] Using production API keys (not test/development keys)
- [ ] JWT secret is a strong random string (32+ characters)
- [ ] Appwrite API key has minimal required permissions
- [ ] Stripe keys are production keys (`pk_live_...`, `sk_live_...`)
- [ ] Email credentials are app-specific passwords (for Gmail)
- [ ] `NODE_ENV=production` is set
- [ ] `CLIENT_URL` is set to your production domain
- [ ] HTTPS is enabled on your domain
- [ ] Webhook URLs are configured in Stripe dashboard
- [ ] File permissions on `.env` are restricted (600 on Linux/Mac)
- [ ] Tested authentication flow in production
- [ ] Tested payment flow in production
- [ ] Monitoring and alerting are configured

## What to Do If Credentials Are Compromised

If you accidentally expose credentials (e.g., commit to Git, share publicly, paste in chat):

### Immediate Actions:

1. **Appwrite API Key Compromised:**
   - Log into Appwrite Dashboard
   - Go to Settings > API Keys
   - Delete the compromised key immediately
   - Generate a new key with same permissions
   - Update `.env` file on your server
   - Restart your application
   - Review Appwrite logs for unauthorized access

2. **Stripe Keys Compromised:**
   - Log into Stripe Dashboard
   - Go to Developers > API Keys
   - Roll the compromised key (click "Roll" next to the key)
   - Update `.env` file on your server
   - Restart your application
   - Review Stripe logs for unauthorized charges

3. **JWT Secret Compromised:**
   - Generate a new JWT secret
   - Update `.env` file
   - Restart your application
   - All users will be logged out and need to log in again
   - Monitor for suspicious account activity

4. **Email Password Compromised:**
   - Revoke the app-specific password
   - Generate a new app-specific password
   - Update `.env` file
   - Restart your application

### If Committed to Git:

If secrets were committed to Git, simply deleting them in a new commit is NOT enough - they remain in Git history.

**You must:**
1. Rotate all compromised credentials immediately (as described above)
2. Consider the old credentials permanently compromised
3. Optionally: Use tools like `git-filter-repo` to remove secrets from history (advanced)
4. Never rely on removing commits from Git history as a security measure

## Monitoring and Alerts

Set up monitoring for:

1. **Appwrite Dashboard:**
   - Monitor user registrations
   - Watch for unusual database activity
   - Set up usage alerts

2. **Stripe Dashboard:**
   - Enable fraud detection
   - Monitor for unusual charges
   - Set up email alerts for failures

3. **Application Logs:**
   - Monitor authentication failures
   - Track API errors
   - Set up error alerting (e.g., Sentry)

## Additional Security Measures

### Rate Limiting

The application already implements rate limiting:
- 100 requests per 15 minutes per IP for API endpoints
- Protects against brute-force attacks
- Adjust in `server.js` if needed

### HTTPS/SSL

Always use HTTPS in production:
- Use Let's Encrypt for free SSL certificates
- Configure your hosting platform to enforce HTTPS
- Set `Strict-Transport-Security` header (already enabled via Helmet)

### CORS Configuration

The application implements proper CORS:
- In development: allows all origins (for testing)
- In production: only allows `CLIENT_URL` origin
- Verify `CLIENT_URL` is set correctly in production

### Password Requirements

The application enforces strong passwords:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Input Validation

All user inputs are validated using `express-validator`:
- Email format validation
- Phone number format validation
- Password strength requirements
- SQL injection prevention (via parameterized queries in Appwrite)
- XSS prevention (via proper output encoding)

## Resources

- [Appwrite Security Best Practices](https://appwrite.io/docs/security)
- [Stripe Security Guidelines](https://stripe.com/docs/security/guide)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Support

If you suspect a security issue:
- **DO NOT** open a public GitHub issue
- Email: security@ezclippin.studio (if available)
- Or: Contact the repository maintainer privately

---

**Remember:** Security is not a one-time task. Regularly review and update your security practices, rotate credentials, and stay informed about security best practices.
