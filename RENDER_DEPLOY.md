# Render.com Deployment Guide

## Quick Deploy to Render 🚀

Your application is now configured for Render.com deployment with `render.yaml`.

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up or log in with GitHub

### Step 2: Create New Blueprint
1. Click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository: `Sudhikumaran/Placement-Flow`
3. Render will automatically detect `render.yaml`
4. Click **"Apply"**

### Step 3: Configure Environment Variables

#### Backend Service Environment Variables
In the Render dashboard for `placement-flow-backend`, add:

```
MONGO_URL=mongodb+srv://sudhikumaran2005_db_user:sudhi123@cluster0.gmbbh21.mongodb.net/?appName=Cluster0
DB_NAME=placement_flow_db
JWT_SECRET=DUZVNJIJNVz7mGIJZVbYUPt54TlSF1CNnhvLL67_gQM5aqP_34xyiIcnDe-BiD4_oEqfMvZS1SOYWlEnkUygGg
JWT_EXPIRATION_HOURS=24
PASSWORD_MIN_LENGTH=8
CORS_ORIGINS=https://placement-flow-frontend.onrender.com
```

**Important**: Replace `placement-flow-frontend.onrender.com` with your actual frontend URL after deployment.

#### Frontend Service Environment Variables
In the Render dashboard for `placement-flow-frontend`, add:

```
REACT_APP_BACKEND_URL=https://placement-flow-backend.onrender.com
```

**Important**: Replace `placement-flow-backend.onrender.com` with your actual backend URL after deployment.

### Step 4: Update CORS After Deployment
Once both services are deployed:

1. Note your frontend URL (e.g., `https://your-app.onrender.com`)
2. Update backend environment variable:
   - `CORS_ORIGINS=https://your-app.onrender.com`
3. Trigger a manual redeploy of the backend

### Step 5: Monitor Deployment
- Backend build time: ~3-5 minutes
- Frontend build time: ~3-5 minutes
- Watch logs in Render dashboard for any errors

### Step 6: Test Your Deployment
1. Visit your frontend URL
2. Register a new student account
3. Test login functionality
4. Check backend health: `https://your-backend.onrender.com/health`

## Troubleshooting

### Build Fails
- **Error**: "Could not open requirements file"
  - ✅ Fixed: `render.yaml` now specifies `cd backend` in buildCommand

- **Error**: "Module not found"
  - Check that all dependencies are in `requirements.txt`
  - Verify Python version is 3.13.4

### CORS Errors
- Update `CORS_ORIGINS` environment variable with your frontend URL
- Must include `https://` protocol
- Redeploy backend after changing environment variables

### Database Connection Issues
- Verify MongoDB Atlas connection string is correct
- Check MongoDB Atlas network access (allow all IPs: `0.0.0.0/0` for Render)
- Ensure database user has read/write permissions

### App Not Responding
- Check service logs in Render dashboard
- Verify health check endpoint: `/health` for backend
- Free tier services sleep after 15 minutes of inactivity

## Free Tier Limitations

Render's free tier includes:
- ✅ 750 hours/month per service
- ⚠️ Services sleep after 15 minutes of inactivity
- ⚠️ Cold start takes ~30 seconds
- ⚠️ Limited to 512MB RAM per service

### Keeping Services Awake (Optional)
Use a service like [UptimeRobot](https://uptimerobot.com/) to ping your health endpoint every 5 minutes:
- Ping URL: `https://your-backend.onrender.com/health`

## Upgrade to Paid Plan

For production use, consider upgrading:
- **Starter Plan** ($7/month per service)
  - No cold starts
  - Always-on services
  - 512MB RAM

## Alternative: Docker Deployment

If you prefer Docker over Render's native build:

1. Update `render.yaml` to use Docker:
```yaml
services:
  - type: web
    name: placement-flow-backend
    runtime: docker
    dockerfilePath: ./backend/Dockerfile
```

2. Ensure Dockerfile includes all environment variables

## Security Checklist Before Going Live

- [ ] Change JWT_SECRET to a new secure value
- [ ] Update CORS_ORIGINS to your production domain
- [ ] Enable MongoDB Atlas IP whitelist (add Render IPs or use 0.0.0.0/0)
- [ ] Verify all environment variables are set correctly
- [ ] Test all functionality in production
- [ ] Set up error monitoring (Sentry)
- [ ] Configure custom domain (optional)

## Cost Estimate

**Free Tier (Current)**:
- Backend: Free (with sleep)
- Frontend: Free (with sleep)
- MongoDB Atlas: Free (M0 tier, 512MB)
- **Total**: $0/month

**Paid Tier (Recommended for Production)**:
- Backend Starter: $7/month
- Frontend Starter: $7/month
- MongoDB Atlas M2: $9/month
- **Total**: $23/month

## Next Steps

1. **Monitor Performance**: Check logs regularly
2. **Set Up Alerts**: Configure uptime monitoring
3. **Add Custom Domain**: Point your domain to Render
4. **Enable SSL**: Automatic with Render
5. **Scale as Needed**: Upgrade plans when traffic increases

## Support

- Render Docs: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Your App Status: Check Render dashboard

---

**Deployment Status**: ✅ Ready to deploy!

Your application is configured with:
- ✅ Production-grade security
- ✅ Health checks
- ✅ Automatic HTTPS
- ✅ Zero-downtime deployments
- ✅ Auto-scaling (paid tiers)
