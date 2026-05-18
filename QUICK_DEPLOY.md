# Quick Deploy to Vercel - Step by Step

This guide will have your app deployed and always online in less than 10 minutes!

## Prerequisites (5 minutes)

### 1. Create a GitHub Repository
1. Go to https://github.com/new
2. Repository name: `amigos` (or your choice)
3. Add description: "Location sharing app with real-time tracking"
4. Select "Public" (for open source)
5. Click "Create repository"

### 2. Push Code to GitHub
```bash
cd ~/path/to/amigos
git init
git add .
git commit -m "Initial commit: Amigos app ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/amigos.git
git push -u origin main
```

### 3. Create MongoDB Atlas Database (2 minutes)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create a new organization
4. Create a free cluster (M0)
5. Create database user with username and password
6. Click "Connect" → "Connect your application"
7. Copy the connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/amigos`)
8. Keep this string handy - you'll need it in Vercel

## Deploy to Vercel (5 minutes)

### Step 1: Connect GitHub
1. Go to https://vercel.com/new
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub account

### Step 2: Import Repository
1. Find and select your `amigos` repository
2. Click "Import"

### Step 3: Configure Project
- **Project name**: Keep as `amigos` or change to your preference
- **Framework preset**: Leave blank or select "Other"
- **Root Directory**: Leave empty
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: Leave default (`npm install`)

Click "Continue"

### Step 4: Add Environment Variables ⭐ IMPORTANT

Before clicking Deploy, scroll down to "Environment Variables" and add these:

**Minimum Required:**

| Key | Value | Example |
|-----|-------|---------|
| `NODE_ENV` | `production` | production |
| `MONGO_URI` | Your MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/amigos` |
| `JWT_SECRET` | Generate random string | `xyz123abc456...` (use [this generator](https://www.uuidgenerator.net/)) |
| `FRONTEND_URL` | Your Vercel app URL | You'll get this after first deploy - for now use the suggested one |

**Optional (for full features):**

| Key | Value |
|-----|-------|
| `CLOUDINARY_CLOUD_NAME` | (get from cloudinary.com) |
| `CLOUDINARY_API_KEY` | (get from cloudinary.com) |
| `CLOUDINARY_API_SECRET` | (get from cloudinary.com) |

You can leave optional ones empty for now and add them later.

### Step 5: Deploy!
1. Click the blue "Deploy" button
2. Vercel will start building your app
3. Wait 2-5 minutes for the build to complete
4. You'll see a success message with your app URL 🎉

## Verify Deployment

Once deployment is complete:

### 1. Test Frontend
- Click "Visit" to open your app
- You should see the Amigos landing page

### 2. Test Backend API
Open a new browser tab and go to:
```
https://your-project.vercel.app/api/health
```

You should see:
```json
{
  "status": "OK",
  "message": "Amigos API is running",
  "environment": "production"
}
```

### 3. Update Frontend URL
After first deploy, you know your Vercel URL. Update environment variable:

1. Go to Vercel Dashboard → Your Project → Settings
2. Click "Environment Variables"
3. Find or add `FRONTEND_URL` 
4. Set it to your exact Vercel URL (e.g., `https://amigos-123.vercel.app`)
5. Click Save
6. Go to "Deployments" and click "Redeploy" on latest deployment

## Troubleshooting Deployment

### ❌ Build Failed - Check These:

1. **Missing Dependencies**
   - Verify `backend/package.json` has all imports as dependencies
   - Check root `package.json` has vite, react, etc.

2. **Environment Variables**
   - Go to Settings → Environment Variables
   - Verify all required variables are set
   - Check MongoDB connection string is valid

3. **Build Logs**
   - In Vercel dashboard, click "Deployments"
   - Click the failed deployment
   - Scroll down to see build logs
   - Look for error messages

### ❌ API Returns 503 Error

1. **Check Database Connection**
   - Verify `MONGO_URI` is correct
   - Test connection string locally first

2. **MongoDB Atlas Network Access**
   - Go to MongoDB Atlas dashboard
   - Click "Network Access"
   - Click "Add IP Address"
   - Select "Allow access from anywhere" (for development)
   - Click Confirm

3. **Check Function Logs**
   - Vercel Dashboard → Your Project → Logs
   - Look for error messages

### ❌ Env Variables Not Working

1. Redeploy after adding env variables
2. Go to Deployments → Click latest → "Redeploy"
3. Wait for new deployment to complete

## Keep It Running 24/7

Your app is now:
- ✅ Running 24/7 on Vercel servers
- ✅ Auto-scaling if traffic increases  
- ✅ Globally distributed via CDN
- ✅ HTTPS/SSL enabled by default
- ✅ Automatic backups (MongoDB Atlas)

## Enable GitHub Integration (Optional)

For automatic deployments on every push:

1. Vercel Dashboard → Settings → Git
2. Select "Deploy on every push to main"
3. Now every GitHub commit auto-deploys!

## Next Steps

1. **Add Repo Details on GitHub**
   - Edit README.md with your deployment URL
   - Add DEPLOYMENT.md guide
   - Add LICENSE file

2. **Get Feedback**
   - Share your GitHub repo link
   - Ask for issues/feedback
   - Accept pull requests

3. **Monitor**
   - Check Vercel logs occasionally
   - Monitor MongoDB usage
   - Set up error tracking (Sentry)

## Quick Reference URLs

| What | Where |
|------|-------|
| Your App | `https://your-project.vercel.app` |
| Backend API | `https://your-project.vercel.app/api` |
| API Health | `https://your-project.vercel.app/api/health` |
| Vercel Dashboard | https://vercel.com/dashboard |
| MongoDB Atlas | https://cloud.mongodb.com |
| GitHub Repo | Your repo URL |

## Support

- 📖 Full Guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 📝 Setup Info: [BACKEND_ONLINE_SETUP.md](./BACKEND_ONLINE_SETUP.md)
- 🔧 Tech Details: [README.md](./README.md)
- 💬 Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Congratulations! Your backend is now always online! 🚀**

Your app is running 24/7 on Vercel's global infrastructure. No more server management - just push code to GitHub and Vercel deploys automatically!
