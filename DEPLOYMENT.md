# 🚀 ReferConnect Deployment Guide

## Overview
This guide will help you deploy ReferConnect to production with:
- **Frontend**: React app on Vercel
- **Backend**: FastAPI on Railway
- **Database**: PostgreSQL on Railway

## Prerequisites
- GitHub repository with your code
- Vercel account (free)
- Railway account (free)
- SendGrid account for email

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"

### 1.2 Deploy Backend
1. Select your `referConnect` repository
2. Choose the `backend` folder as root directory
3. Railway will auto-detect Python and install dependencies

### 1.3 Configure Environment Variables
In Railway dashboard, add these variables:
```
DATABASE_URL=postgresql://username:password@host:port/database
SECRET_KEY=your-super-secret-key-here
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
ENVIRONMENT=production
```

### 1.4 Add PostgreSQL Database
1. In Railway project, click "New" → "Database" → "PostgreSQL"
2. Railway will provide `DATABASE_URL` automatically
3. Copy this URL to your environment variables

### 1.5 Run Database Migrations
1. In Railway dashboard, go to your backend service
2. Click "Deploy Logs" → "Shell"
3. Run: `alembic upgrade head`

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"

### 2.2 Import Repository
1. Select your `referConnect` repository
2. Set root directory to project root (not backend folder)
3. Vercel will auto-detect React

### 2.3 Configure Environment Variables
In Vercel dashboard, add:
```
REACT_APP_API_URL=https://your-railway-backend-url.railway.app
```

### 2.4 Deploy
1. Click "Deploy"
2. Vercel will build and deploy your React app
3. You'll get a URL like `https://referconnect.vercel.app`

## Step 3: Update Backend CORS

### 3.1 Update CORS Settings
In your backend code, update CORS to allow your Vercel domain:
```python
origins = [
    "http://localhost:3000",
    "https://your-vercel-domain.vercel.app",
    "https://referconnect.vercel.app"
]
```

## Step 4: Configure SendGrid

### 4.1 Create SendGrid Account
1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for free account
3. Verify your sender email

### 4.2 Get API Key
1. Go to Settings → API Keys
2. Create new API key with "Full Access"
3. Copy the key to Railway environment variables

## Step 5: Test Deployment

### 5.1 Test Backend
1. Visit `https://your-railway-url.railway.app/docs`
2. Test API endpoints
3. Check database connection

### 5.2 Test Frontend
1. Visit your Vercel URL
2. Test registration and login
3. Test onboarding flow
4. Test job posting (for employees)

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain
1. In Vercel: Project Settings → Domains
2. Add your custom domain
3. Configure DNS records

### 6.2 Update Environment Variables
Update `REACT_APP_API_URL` to use your custom domain

## Monitoring & Maintenance

### Health Checks
- Backend: `https://your-railway-url.railway.app/health`
- Frontend: Your Vercel URL

### Logs
- Railway: View logs in dashboard
- Vercel: View logs in dashboard

### Database Backups
- Railway provides automatic backups
- Consider setting up additional backup strategy

## Troubleshooting

### Common Issues
1. **CORS errors**: Check CORS settings in backend
2. **Database connection**: Verify DATABASE_URL in Railway
3. **Email not sending**: Check SendGrid API key and sender verification
4. **Build failures**: Check logs in respective platforms

### Support
- Railway: [docs.railway.app](https://docs.railway.app)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- SendGrid: [docs.sendgrid.com](https://docs.sendgrid.com)

## Cost Estimation
- **Vercel**: Free tier (100GB bandwidth, unlimited deployments)
- **Railway**: Free tier (500 hours/month, $5 credit)
- **SendGrid**: Free tier (100 emails/day)
- **Total**: ~$0-5/month for small to medium usage

## Security Checklist
- [ ] Strong SECRET_KEY
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Database credentials protected
- [ ] HTTPS enabled (automatic on both platforms)
- [ ] Regular security updates

---

🎉 **Congratulations!** Your ReferConnect app is now live in production!
