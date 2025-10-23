# Deployment Guide for NutriScan Backend

## 🚀 Deployment Options

### 1. **Railway** (Recommended - Free Tier Available)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### 2. **Render** (Free Tier)
1. Connect your GitHub repo to Render
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables in Render dashboard

### 3. **Heroku**
```bash
# Install Heroku CLI
heroku create nutriscan-backend
git push heroku main
```

### 4. **Vercel** (Serverless)
```bash
npm install -g vercel
vercel
```

### 5. **DigitalOcean App Platform**
1. Connect GitHub repository
2. Set build and run commands
3. Configure environment variables

## 📋 Pre-Deployment Checklist

### Environment Variables to Set:
- `NODE_ENV=production`
- `PORT` (usually auto-set by hosting provider)
- `DATABASE_URL` (your Neon PostgreSQL URL)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `GEMINI_API_KEY`
- `FRONTEND_URL` (optional, your frontend domain)

### Database Setup:
✅ Your Neon database is already production-ready

### Security:
✅ CORS configured for production
✅ Helmet security headers enabled
✅ Rate limiting implemented
✅ Input validation in place

## 🔧 Post-Deployment Steps

1. **Update Frontend API URL**: Change the API base URL in your frontend to point to your deployed backend
2. **Test all endpoints**: Verify authentication, chatbot, and data operations work
3. **Monitor logs**: Check for any runtime errors
4. **Set up monitoring**: Consider adding services like Sentry for error tracking

## 🏃‍♂️ Quick Start Commands

### Local Production Test:
```bash
npm start
```

### Deploy to Railway:
```bash
railway deploy
```

### Deploy to Render:
Connect your repo and deploy via dashboard

### Environment Variable Template:
Copy `.env.production` and fill in your production values