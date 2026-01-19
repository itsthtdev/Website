# EzClippin Website

Official website for EzClippin - Automatic Stream Clipper with integrated download functionality, Stripe payments, and support system.

## Features

- **User Authentication**: Secure signup/login with JWT tokens and SMS verification
- **Download Management**: Platform-specific downloads for Windows, macOS, and Linux
- **Stripe Integration**: Subscription payments and billing management
- **Contact System**: Support and complaint submission with email notifications
- **Responsive Design**: Mobile-friendly interface
- **Real-time Features**: Live statistics and animations

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Stripe.js for payment processing
- Responsive design with CSS Grid and Flexbox

### Backend
- Node.js with Express.js
- JWT authentication
- Stripe API integration
- Nodemailer for email notifications
- Express Rate Limiting for security
- Helmet for HTTP security headers

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Stripe account (for payments)
- SMTP email service (for notifications)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/itsthtdev/Website.git
cd Website
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `EMAIL_USER`: SMTP email address
- `EMAIL_PASSWORD`: SMTP password or app-specific password
- `JWT_SECRET`: Random secret for JWT tokens

4. **Start the server**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

5. **Access the website**
Open your browser and navigate to:
```
http://localhost:3000
```

## Configuration

### Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Create products and prices for your subscription plans
4. Update the price IDs in `.env`:
   - `STRIPE_PRO_MONTHLY_PRICE_ID`
   - `STRIPE_PRO_YEARLY_PRICE_ID`
5. Configure webhook endpoint for production deployment

### Email Setup

For Gmail:
1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use the app password in `EMAIL_PASSWORD`

For other providers:
- Update `EMAIL_HOST` and `EMAIL_PORT` accordingly

### Download Links

Update the download URLs in `.env`:
- `DOWNLOAD_BASE_URL`: Base URL for downloads (e.g., GitHub releases)
- `EZCLIPPIN_INSTALLER_WINDOWS`: Windows installer filename
- `EZCLIPPIN_INSTALLER_MAC`: macOS installer filename
- `EZCLIPPIN_INSTALLER_LINUX`: Linux installer filename

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-sms` - Verify phone number
- `GET /api/auth/profile` - Get user profile (requires auth)

### Downloads
- `GET /api/download/info` - Get download information
- `GET /api/download/:platform` - Get download link (requires auth)
- `POST /api/download/track` - Track download completion (requires auth)

### Stripe
- `GET /api/stripe/config` - Get Stripe publishable key
- `POST /api/stripe/create-checkout-session` - Create checkout session (requires auth)
- `GET /api/stripe/subscription/status` - Get subscription status (requires auth)
- `POST /api/stripe/webhook` - Stripe webhook handler

### Contact
- `POST /api/contact/submit` - Submit contact form
- `POST /api/contact/complaint` - Submit complaint
- `GET /api/contact/info` - Get contact information

## Deployment

### Production Checklist

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use production Stripe keys
   - Configure production email settings
   - Set strong `JWT_SECRET`

2. **Security**
   - Enable HTTPS
   - Configure proper CORS settings
   - Set up Stripe webhooks with proper secret
   - Implement rate limiting (already included)

3. **Database** (Recommended for production)
   - Replace in-memory user storage with a proper database (PostgreSQL, MongoDB, etc.)
   - Implement user session management
   - Store download analytics

4. **Monitoring**
   - Set up error logging (e.g., Sentry)
   - Monitor API performance
   - Track user analytics

### Deployment Platforms

**Heroku**
```bash
heroku create ezclippin
heroku config:set NODE_ENV=production
# Set other env vars
git push heroku main
```

**Vercel**
- Connect your GitHub repository
- Configure environment variables in dashboard
- Deploy automatically on push

**AWS / DigitalOcean / VPS**
- Set up Node.js environment
- Configure reverse proxy (nginx/Apache)
- Set up SSL certificates
- Use PM2 for process management

## Development

### Project Structure
```
Website/
├── routes/           # API route handlers
│   ├── auth.js       # Authentication endpoints
│   ├── download.js   # Download management
│   ├── stripe.js     # Payment processing
│   └── contact.js    # Contact/support forms
├── index.html        # Main webpage
├── script.js         # Frontend JavaScript
├── styles.css        # Stylesheets
├── server.js         # Express server
├── package.json      # Dependencies
└── .env.example      # Environment template
```

### Adding New Features

1. Backend: Add routes in `routes/` directory
2. Frontend: Update `script.js` for API calls
3. Styling: Modify `styles.css`
4. Documentation: Update this README

## Integration with VS_auto_clipper

This website is designed to work with the EzClippin auto-clipper software:
- Repository: https://github.com/itsthtdev/VS_auto_clipper
- Downloads are linked to releases from that repository
- Authentication allows software activation

## GitHub Pages Configuration

This website is configured to be hosted on GitHub Pages with a custom domain.

### Custom Domain Setup

The site is configured to use the custom domain: **EzClippin.studio**

#### DNS Configuration

To use the custom domain, configure the following DNS records with your domain registrar:

**For apex domain (EzClippin.studio):**
```
Type: A
Host: @
Value: 185.199.108.153
```
```
Type: A
Host: @
Value: 185.199.109.153
```
```
Type: A
Host: @
Value: 185.199.110.153
```
```
Type: A
Host: @
Value: 185.199.111.153
```

**For www subdomain (optional):**
```
Type: CNAME
Host: www
Value: itsthtdev.github.io
```

#### CNAME File

The `CNAME` file in the root directory contains the custom domain name. This file tells GitHub Pages which custom domain to use for the site.

### GitHub Pages Settings

1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main` / `(root)`
4. Custom domain: `EzClippin.studio`
5. Enforce HTTPS: ✓ Enabled (after DNS propagation)

### Verification

After DNS records are configured and propagated (can take 24-48 hours):
1. Visit https://EzClippin.studio to verify the site loads
2. Check that HTTPS is working
3. Verify www subdomain redirects (if configured)

### Local Development

For local development, the site runs on `http://localhost:3000` (backend) or can be opened directly in a browser (frontend only).

The custom domain configuration only affects the production deployment on GitHub Pages.

## Support

For issues or questions:
- Email: support@ezclippin.studio
- Submit via contact form on website
- GitHub Issues: https://github.com/itsthtdev/Website/issues

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

© 2026 EzClippin.studio. All rights reserved.

