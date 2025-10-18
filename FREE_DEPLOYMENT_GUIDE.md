# 🆓 Free Deployment Guide - ReferConnect

This guide shows you how to deploy ReferConnect using **100% FREE** services that never expire!

## 🎯 **Deployment Architecture**

- **Frontend**: Vercel (Free Forever)
- **Backend**: Render (Free Forever) 
- **Database**: Render PostgreSQL (Free Forever)
- **Domain**: Custom domain supported

## 🚀 **Step 1: Deploy Backend to Render**

### **1.1 Create Render Account**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

### **1.2 Deploy Backend**
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `rk2002purna/referConnect`
3. **Root Directory**: `backend`
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `python main.py`
6. **Environment**: `Python 3`

### **1.3 Set Environment Variables**
In Render dashboard, go to **Environment** tab and add:

```
DATABASE_URL=postgresql://... (will be provided by Render)
SECRET_KEY=your-secret-key-here
SENDGRID_API_KEY=your-sendgrid-key (optional)
SENDGRID_FROM_EMAIL=your-email@domain.com (optional)
ENVIRONMENT=production
```

### **1.4 Create PostgreSQL Database**
1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Choose **"Free"** plan
3. Name it: `referconnect-db`
4. Copy the **Internal Database URL**
5. Paste it as `DATABASE_URL` in your web service

## 🎨 **Step 2: Deploy Frontend to Vercel**

### **2.1 Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. **Root Directory**: Leave empty (frontend is at root)
4. **Build Command**: `npm run build`
5. **Output Directory**: `build`

### **2.2 Set Environment Variables**
In Vercel dashboard, go to **Settings** → **Environment Variables**:

```
REACT_APP_API_URL=https://your-render-app.onrender.com/api/v1
```

Replace `your-render-app` with your actual Render app name.

## 🔧 **Step 3: Update Frontend API URL**

Update your frontend to use the new Render backend:

```typescript
// In src/lib/api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:8000/api/v1' 
    : 'https://your-render-app.onrender.com/api/v1')
```

## 🌐 **Step 4: Custom Domain (Optional)**

### **4.1 Backend Domain (Render)**
1. In Render dashboard, go to **Settings** → **Custom Domains**
2. Add your domain: `api.yourdomain.com`
3. Update DNS records as instructed

### **4.2 Frontend Domain (Vercel)**
1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your domain: `yourdomain.com`
3. Update DNS records as instructed

## 📊 **Free Tier Limits**

### **Render (Backend)**
- ✅ **750 hours/month** (enough for 24/7)
- ✅ **512MB RAM**
- ✅ **Free PostgreSQL** (1GB storage)
- ✅ **Custom domains**
- ✅ **SSL certificates**

### **Vercel (Frontend)**
- ✅ **Unlimited deployments**
- ✅ **100GB bandwidth/month**
- ✅ **Custom domains**
- ✅ **SSL certificates**

## 🔄 **Step 5: Migration from Railway**

### **5.1 Export Data from Railway**
```bash
# Connect to Railway PostgreSQL
pg_dump $DATABASE_URL > backup.sql
```

### **5.2 Import to Render**
```bash
# Connect to Render PostgreSQL
psql $RENDER_DATABASE_URL < backup.sql
```

## 🚨 **Important Notes**

1. **Render Free Tier**: Apps sleep after 15 minutes of inactivity
2. **Cold Start**: First request after sleep takes ~30 seconds
3. **Database**: Render PostgreSQL is always available
4. **Monitoring**: Use Render's built-in monitoring

## 🆘 **Troubleshooting**

### **Backend Issues**
- Check Render logs in dashboard
- Ensure `DATABASE_URL` is set correctly
- Verify all environment variables

### **Frontend Issues**
- Check Vercel build logs
- Ensure `REACT_APP_API_URL` points to Render
- Clear browser cache

## 💰 **Cost Breakdown**

- **Render Backend**: $0/month (Free Forever)
- **Render Database**: $0/month (Free Forever)
- **Vercel Frontend**: $0/month (Free Forever)
- **Custom Domain**: $0/month (if you own domain)
- **Total**: **$0/month** 🎉

## 🎯 **Next Steps**

1. Deploy backend to Render
2. Deploy frontend to Vercel
3. Test the application
4. Set up custom domain (optional)
5. Monitor performance

---

**Need Help?** Check the logs in Render and Vercel dashboards for detailed error messages.
