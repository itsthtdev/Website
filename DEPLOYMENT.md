# EzClippin Deployment Guide

This guide covers deploying the EzClippin website to production.

## Quick Start

### Local Development

1. **Clone and install**
```bash
git clone https://github.com/itsthtdev/Website.git
cd Website
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Start development server**
```bash
npm run dev
```

Visit http://localhost:3000

## Production Deployment

### Option 1: Heroku

1. **Install Heroku CLI**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

2. **Login and create app**
```bash
heroku login
heroku create ezclippin-website
```

3. **Set environment variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set STRIPE_PUBLISHABLE_KEY=pk_live_...
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASSWORD=your-app-password
```

4. **Deploy**
```bash
git push heroku main
heroku open
```

### Option 2: Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Set environment variables in Vercel Dashboard**
- Go to your project settings
- Add all environment variables from .env.example

### Option 3: DigitalOcean / AWS / VPS

1. **SSH into server**
```bash
ssh user@your-server-ip
```

2. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Clone repository**
```bash
git clone https://github.com/itsthtdev/Website.git
cd Website
npm install
```

4. **Configure environment**
```bash
cp .env.example .env
nano .env  # Edit with your values
```

5. **Install PM2 for process management**
```bash
sudo npm install -g pm2
pm2 start server.js --name ezclippin
pm2 save
pm2 startup
```

6. **Setup nginx reverse proxy**
```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/ezclippin
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name ezclippin.studio www.ezclippin.studio;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

7. **Enable site and restart nginx**
```bash
sudo ln -s /etc/nginx/sites-available/ezclippin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. **Setup SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d ezclippin.studio -d www.ezclippin.studio
```

## Stripe Configuration

### Setup Stripe Account

1. **Create account** at https://stripe.com
2. **Get API keys** from Dashboard → Developers → API keys
3. **Create products and prices**
   - Go to Products
   - Create "Pro Monthly" plan
   - Create "Pro Yearly" plan
   - Copy price IDs

4. **Configure webhooks**
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy webhook secret

5. **Update environment variables**
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
```

## Email Configuration

### Gmail Setup

1. **Enable 2-Factor Authentication** in Google Account
2. **Generate App Password**
   - Go to Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Update .env**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### SendGrid Setup (Alternative)

1. **Create account** at https://sendgrid.com
2. **Get API key** from Settings → API Keys
3. **Update .env**
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

## Download Configuration

### GitHub Releases Setup

1. **Create release in VS_auto_clipper repository**
```bash
cd VS_auto_clipper
git tag v1.0.0
git push origin v1.0.0
```

2. **Upload installers to release**
   - Go to Releases → Create new release
   - Upload files:
     - `EzClippin-Setup.exe` (Windows)
     - `EzClippin.dmg` (macOS)
     - `ezclippin-linux.tar.gz` (Linux)

3. **Update .env**
```bash
DOWNLOAD_BASE_URL=https://github.com/itsthtdev/VS_auto_clipper/releases/latest/download
```

## Security Checklist

- [ ] Use strong JWT secret (32+ random characters)
- [ ] Enable HTTPS in production
- [ ] Set NODE_ENV=production
- [ ] Use production Stripe keys
- [ ] Configure CORS properly
- [ ] Enable rate limiting (already configured)
- [ ] Setup monitoring and error logging
- [ ] Regular security updates: `npm audit fix`
- [ ] Configure Appwrite backend with proper permissions (recommended)
- [ ] OR implement alternative database for user storage
- [ ] Setup backups (automatic with Appwrite Cloud)
- [ ] Enable firewall on server
- [ ] Use environment variables for all secrets
- [ ] Review Appwrite collection permissions
- [ ] Secure API keys with minimal required scopes

## Monitoring

### Setup Error Logging with Sentry

1. **Create account** at https://sentry.io
2. **Install Sentry SDK**
```bash
npm install @sentry/node
```

3. **Add to server.js**
```javascript
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### Setup Uptime Monitoring

Use services like:
- UptimeRobot (https://uptimerobot.com)
- Pingdom (https://pingdom.com)
- StatusCake (https://statuscake.com)

## Database Setup (Recommended for Production)

### Appwrite Backend (Recommended)

**Appwrite** is now the recommended backend solution, providing:
- User authentication and management
- Persistent database storage
- Built-in security and permissions
- Real-time capabilities
- Easy setup with cloud or self-hosted options

**Quick Setup:**

1. **Create Appwrite Cloud Account**
   - Sign up at https://cloud.appwrite.io
   - Create a new project

2. **Configure Collections**
   - Follow the detailed guide in [APPWRITE_SETUP.md](APPWRITE_SETUP.md)
   - Create collections for users, visits, contacts, downloads, and subscriptions

3. **Set Environment Variables**
   ```bash
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your_project_id
   APPWRITE_API_KEY=your_api_key
   APPWRITE_DATABASE_ID=your_database_id
   APPWRITE_USERS_COLLECTION_ID=your_collection_id
   APPWRITE_VISITS_COLLECTION_ID=your_collection_id
   APPWRITE_CONTACTS_COLLECTION_ID=your_collection_id
   APPWRITE_DOWNLOADS_COLLECTION_ID=your_collection_id
   APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=your_collection_id
   ```

4. **Deploy and Test**
   - Server automatically uses Appwrite when configured
   - Falls back to in-memory storage if not configured

**Full documentation:** See [APPWRITE_SETUP.md](APPWRITE_SETUP.md)

### PostgreSQL Setup (Alternative)

If you prefer PostgreSQL over Appwrite:

1. **Install PostgreSQL**
```bash
sudo apt-get install postgresql
```

2. **Create database**
```bash
sudo -u postgres createdb ezclippin
```

3. **Install node package**
```bash
npm install pg
```

4. **Update auth.js to use database**
Replace Map storage with PostgreSQL queries

## Backup Strategy

### With Appwrite

1. **Automatic Backups** (Appwrite Cloud)
   - Appwrite Cloud includes automatic backups
   - Self-hosted: Configure backup schedule

2. **Export Data**
   - Use Appwrite Console to export data
   - Script automated exports via Appwrite API

### With PostgreSQL

1. **Database backups**
```bash
# Add to crontab
0 2 * * * pg_dump ezclippin > /backups/ezclippin-$(date +\%Y\%m\%d).sql
```

2. **Code backups**
   - Use GitHub for version control
   - Keep .env separately (not in git)

3. **User data backups**
   - Regular database exports
   - Cloud storage (S3, Google Cloud Storage)

## Testing

### Test API Endpoints

```bash
# Health check
curl https://your-domain.com/api/health

# Download info
curl https://your-domain.com/api/download/info

# Contact info
curl https://your-domain.com/api/contact/info
```

### Test Frontend

1. Visit https://your-domain.com
2. Test signup flow
3. Test login flow
4. Test download (requires authentication)
5. Test contact form
6. Test mobile responsiveness

## Troubleshooting

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
```

### PM2 Logs
```bash
pm2 logs ezclippin
pm2 restart ezclippin
```

### Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check Service Status
```bash
pm2 status
sudo systemctl status nginx
```

## Scaling

### Load Balancing

1. **Setup multiple instances**
```bash
pm2 start server.js -i max --name ezclippin
```

2. **Configure nginx load balancing**
```nginx
upstream ezclippin_backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}
```

### CDN Setup

Use CDN for static assets:
- Cloudflare (https://cloudflare.com)
- AWS CloudFront
- Fastly

## Support

For deployment issues:
- GitHub Issues: https://github.com/itsthtdev/Website/issues
- Email: support@ezclippin.studio

---

© 2026 EzClippin.studio
