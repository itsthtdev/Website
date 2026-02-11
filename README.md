# EzClippin.studio Website

Official website for EzClippin - Automatic Stream Clipper

## 🚀 Live Site

The website is live at: **https://EzClippin.studio**

## 📋 About

EzClippin is an AI-powered automatic clip generation platform for streamers and content creators. The website features:

- Modern, responsive design
- Interactive signup/login modals
- Feature showcase
- Pricing plans
- How It Works section
- Mobile-friendly navigation

## 🛠️ GitHub Pages Setup

This website is hosted on GitHub Pages with a custom domain. Here's how it's configured:

### Custom Domain Setup

1. The `CNAME` file in the root directory contains: `EzClippin.studio`
2. In your GitHub repository settings:
   - Go to **Settings** → **Pages**
   - Under "Custom domain", enter: `EzClippin.studio`
   - Check "Enforce HTTPS"

### DNS Configuration

Configure your DNS provider (where you registered EzClippin.studio) with these records:

**For Apex Domain (EzClippin.studio):**
```
Type: A
Name: @
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153
```

**For www Subdomain (www.EzClippin.studio):**
```
Type: CNAME
Name: www
Value: itsthtdev.github.io
```

**Note:** DNS propagation can take up to 48 hours, but usually completes within a few hours.

### Verify Setup

After DNS propagation:
1. Visit https://EzClippin.studio
2. Verify the SSL certificate is active (🔒 in browser)
3. Test that www.EzClippin.studio redirects properly

## 💻 Local Development

To run the website locally:

```bash
# Clone the repository
git clone https://github.com/itsthtdev/Website.git
cd Website

# Start a local server (Python 3)
python3 -m http.server 8080

# Or use Node.js
npx http-server -p 8080

# Or use PHP
php -S localhost:8080
```

Then visit: http://localhost:8080

## 📁 File Structure

```
├── index.html      # Main HTML file
├── styles.css      # All styles and responsive design
├── script.js       # Interactive features and animations
├── CNAME          # Custom domain configuration
└── README.md      # This file
```

## ✨ Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Authentication System**: Full user registration and login with JWT
- **Appwrite.io Backend**: Persistent cloud database for users and data
- **Password Strength Checker**: Real-time password validation
- **Download Management**: Platform-specific installers for Windows, macOS, and Linux
- **Stripe Integration**: Payment processing for subscriptions
- **Contact Forms**: Support and complaint submission system
- **Smooth Animations**: Scroll animations and transitions
- **Mobile Menu**: Hamburger menu for mobile devices
- **Animated Counters**: Hero statistics with count-up animation
- **Analytics Tracking**: Visit and download tracking

## 🗄️ Backend & Database

This website now supports **Appwrite.io** as a backend database solution:

- **Persistent Data Storage**: Users, analytics, contacts, and downloads
- **Cloud or Self-Hosted**: Use Appwrite Cloud or host your own instance
- **Automatic Fallback**: Falls back to in-memory storage if Appwrite is not configured
- **Easy Setup**: See [APPWRITE_SETUP.md](APPWRITE_SETUP.md) for detailed instructions

To enable Appwrite integration:
1. Create an Appwrite project at https://cloud.appwrite.io
2. Configure environment variables (see `.env.example`)
3. Follow the setup guide in [APPWRITE_SETUP.md](APPWRITE_SETUP.md)

## 🔒 Security

**Important**: This application handles sensitive credentials and user data. Please review these security documents:

- **[SECURITY.md](SECURITY.md)** - Comprehensive security guide for credential management
- **[CREDENTIALS_SETUP.md](CREDENTIALS_SETUP.md)** - Step-by-step guide to configure Appwrite credentials
- **[.env.production.example](.env.production.example)** - Template for production environment variables

### Security Features

- ✅ All credentials stored in `.env` file (excluded from Git)
- ✅ JWT-based authentication with secure token generation
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Strong password requirements enforced
- ✅ Rate limiting (100 requests/15min per IP)
- ✅ Helmet security headers enabled
- ✅ CORS properly configured
- ✅ Input validation on all endpoints
- ✅ SQL injection protection via Appwrite
- ✅ XSS prevention

### Quick Security Checklist

Before deploying to production:
- [ ] Configure all credentials in `.env` (never commit this file)
- [ ] Use production API keys (not test keys)
- [ ] Change default admin password
- [ ] Enable HTTPS
- [ ] Set strong JWT secret (32+ characters)
- [ ] Review and update rate limits
- [ ] Configure monitoring and alerts

See [SECURITY.md](SECURITY.md) for complete guidelines.

## 📝 License

© 2026 EzClippin.studio. All rights reserved.
