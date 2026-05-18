# Amigos - Deployment Guide for Open Source

## Overview
This guide helps you deploy the Amigos application to Vercel for always-on production hosting.

## Prerequisites
- Vercel Account (free tier available at https://vercel.com)
- GitHub repository with your code
- MongoDB Atlas account (free tier: https://www.mongodb.com/cloud/atlas)
- Cloudinary account for image uploads (free tier: https://cloudinary.com)
- Gmail account with app password for email notifications
- Twilio account for SMS notifications (optional)

## Step-by-Step Deployment

### 1. Set Up Database (MongoDB Atlas)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user with username and password
4. Get the connection string in format: `mongodb+srv://username:password@cluster.mongodb.net/amigos?retryWrites=true&w=majority`
5. Save this URL - you'll need it for Vercel environment variables

### 2. Prepare GitHub Repository
1. Push your code to GitHub
2. Make sure `.env` file is in `.gitignore` (it already is in this project)
3. Commit all changes

### 3. Deploy on Vercel
1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Connect your GitHub account and select your repository
4. In "Configure Project":
   - **Root Directory**: Leave as default or set to `/`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4. Add Environment Variables on Vercel
In Vercel dashboard, go to Settings → Environment Variables and add:

**Required Variables:**
```
NODE_ENV = production
MONGO_URI = mongodb+srv://username:password@cluster.mongodb.net/amigos?retryWrites=true&w=majority
JWT_SECRET = generate_a_random_long_string_here
FRONTEND_URL = https://your-domain.vercel.app
```

**Optional Variables (for full functionality):**
```
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your_email@gmail.com
SMTP_PASSWORD = your_app_password
TWILIO_ACCOUNT_SID = (optional)
TWILIO_AUTH_TOKEN = (optional)
TWILIO_PHONE_NUMBER = (optional)
```

### 5. Deploy
1. Click "Deploy"
2. Wait for the build to complete (2-5 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Verify Deployment

Test your API endpoints:
```bash
# Check if API is online
curl https://your-project.vercel.app/api/health

# Check status
curl https://your-project.vercel.app/api/status
```

## Update Frontend Configuration
Update your frontend `.env` file:
```
VITE_API_URL=https://your-project.vercel.app/api
```

## Monitoring
- Vercel Dashboard automatically monitors your deployments
- Check logs in Vercel → Function Logs
- MongoDB Atlas has built-in monitoring

## Troubleshooting

**API returns 503 errors:**
- Check MongoDB connection in Vercel logs
- Verify MONGO_URI is correct
- Ensure MongoDB Atlas allows Vercel IP addresses

**CORS errors:**
- Check FRONTEND_URL env variable
- Update CORS origins in backend if needed

**Builds failing:**
- Check build logs in Vercel dashboard
- Ensure all dependencies are installed
- Verify Node version compatibility

## Keeping It "Always Online"

Your deployment is now:
✅ Always online - Vercel keeps your backend running 24/7
✅ Auto-scaling - Handles traffic spikes automatically
✅ SSL certified - Secure HTTPS connection by default
✅ Global CDN - Optimized for worldwide users
✅ Automatic backups - Via MongoDB Atlas

## GitHub for Open Source

1. Add open source license:
   - Copy `LICENSE` file (choose MIT, Apache 2.0, etc.)
   
2. Update README with:
   - Deployment instructions
   - API documentation
   - Architecture overview
   
3. Add CONTRIBUTING.md for contributors

4. Setup GitHub Issues for bug tracking

## Support
For issues or questions about deployment, check:
- Vercel Docs: https://vercel.com/docs
- MongoDB Docs: https://docs.mongodb.com
- GitHub Help: https://docs.github.com
