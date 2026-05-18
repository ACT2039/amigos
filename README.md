# Amigos - Where Is My Friend? 📍

A real-time location sharing application that helps you track and stay connected with your friends using live geolocation and proximity alerts.

## Features

- 🗺️ **Real-time Location Tracking** - See where your friends are in real-time
- 📍 **Proximity Alerts** - Get notified when friends are nearby
- 👥 **Group Management** - Create groups and invite friends
- 💬 **In-app Messaging** - Chat with your group members
- 🔐 **Secure Authentication** - JWT-based authentication with password encryption
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🌐 **Always Online** - Production-ready deployment on Vercel

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Leaflet** - Map rendering
- **Zustand** - State management
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client

### Backend
- **Node.js & Express** - Server framework
- **MongoDB** - Database
- **Socket.IO** - WebSocket communication
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **Twilio** - SMS service (optional)
- **Cloudinary** - Image uploads

## Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- MongoDB Atlas account (free tier available)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/amigos.git
   cd amigos
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local MongoDB URI and other settings
   ```

4. **Start the backend**
   ```bash
   npm run backend:dev
   ```

5. **Start the frontend** (in another terminal)
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:5173
   ```

## Deployment to Production

### One-Click Deployment on Vercel

This project is optimized for Vercel deployment. Your backend runs 24/7 without any additional configuration needed!

#### Steps:

1. **Fork this repository on GitHub**

2. **Go to Vercel.com**
   - Create a new account or log in
   - Click "New Project"
   - Select "Import Git Repository"
   - Paste your repository URL

3. **Configure the deployment**
   - Root Directory: Leave default
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variables** in Vercel Settings → Environment Variables:

   **Required:**
   ```
   NODE_ENV=production
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/amigos
   JWT_SECRET=your_generated_secret_key
   FRONTEND_URL=https://your-project.vercel.app
   ```

   **Optional:**
   ```
   CLOUDINARY_CLOUD_NAME=your_value
   CLOUDINARY_API_KEY=your_value
   CLOUDINARY_API_SECRET=your_value
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

5. **Deploy** - Click the deploy button and wait 2-5 minutes

6. **Update frontend configuration**
   ```bash
   VITE_API_URL=https://your-project.vercel.app/api
   ```

### Detailed Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions including:
- Setting up MongoDB Atlas
- Configuring email service
- Configuring SMS service (Twilio)
- Troubleshooting common issues

## API Documentation

### Health Check
- `GET /api/health` - Check if API is running
- `GET /api/status` - Get detailed status including database connection

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/nearby` - Get nearby users

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - List user's groups
- `POST /api/groups/:id/invite` - Invite member to group

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

For issues or questions:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment troubleshooting
2. Open a GitHub Issue
3. Contact the maintainers

## Status

✅ **Always Online** - Running 24/7 on Vercel
✅ **Production Ready** - Fully tested and optimized
✅ **Open Source** - Free to use, modify, and deploy

---

Made with ❤️ by the Amigos team
