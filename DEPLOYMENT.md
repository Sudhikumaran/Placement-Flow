# Placement Flow - Deployment Guide

## Production Readiness Checklist

### ✅ Completed Security Features

1. **Secure JWT Authentication**

   - Cryptographically secure 64-byte token
   - Access tokens (24h) + Refresh tokens (7 days)
   - Token type validation

2. **Rate Limiting**

   - Register: 5 requests/hour per IP
   - Login: 10 requests/minute per IP
   - Refresh: 20 requests/minute per IP

3. **Password Security**

   - Minimum 8 characters
   - Requires uppercase, lowercase, and numbers
   - Bcrypt hashing

4. **Input Sanitization**

   - XSS prevention with bleach library
   - All user inputs sanitized

5. **CORS Protection**

   - Restricted to frontend domain only
   - No wildcard origins in production

6. **Database Optimization**

   - 13 indexes created for optimal query performance
   - Unique constraints on critical fields

7. **Error Boundaries**

   - Frontend error handling with graceful fallbacks
   - Development mode stack traces

8. **Health Checks**
   - `/health` endpoint for container monitoring
   - Database connectivity verification

---

## Environment Setup

### Prerequisites

- Python 3.13+
- Node.js 20+
- MongoDB Atlas account
- Docker (optional, for containerized deployment)

### 1. Backend Configuration

Create `backend/.env`:

```bash
# MongoDB
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DB_NAME=placement_flow_db

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-here-minimum-32-characters
JWT_EXPIRATION_HOURS=24

# Security
CORS_ORIGINS=https://yourdomain.com
PASSWORD_MIN_LENGTH=8
```

**Generate secure JWT secret:**

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### 2. Frontend Configuration

Create `frontend/.env`:

```bash
VITE_API_URL=https://api.yourdomain.com
```

---

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Build and run containers:**

```bash
docker-compose up -d
```

2. **View logs:**

```bash
docker-compose logs -f
```

3. **Stop containers:**

```bash
docker-compose down
```

**Services:**

- Backend: http://localhost:8000
- Frontend: http://localhost:80

### Option 2: Manual Deployment

#### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Frontend

```bash
cd frontend
npm install
npm run build
# Serve dist/ with nginx or hosting provider
```

---

## Production Deployment Steps

### 1. MongoDB Atlas Setup

1. Create cluster at https://cloud.mongodb.com
2. Create database user with read/write permissions
3. Whitelist application IP addresses
4. Get connection string and update `MONGO_URL`

### 2. Environment Variables

- **Never commit `.env` files to git**
- Use secret management in production (AWS Secrets Manager, Azure Key Vault)
- Update `CORS_ORIGINS` to your production domain

### 3. SSL/HTTPS

- Use Let's Encrypt for free SSL certificates
- Configure nginx with SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://backend:8000;
    }
}
```

### 4. Domain Configuration

Update the following:

- `backend/.env`: `CORS_ORIGINS=https://yourdomain.com`
- `frontend/.env`: `VITE_API_URL=https://api.yourdomain.com`

### 5. Monitoring

- Set up application monitoring (Datadog, New Relic)
- Configure log aggregation (ELK Stack, Splunk)
- Enable MongoDB Atlas monitoring and alerts

---

## Security Best Practices

### Required Actions Before Production

1. **Environment Variables**

   - Generate new JWT secret (don't use development secret)
   - Use strong database passwords
   - Store secrets in secure vault

2. **Rate Limiting**

   - Already configured (register: 5/hr, login: 10/min)
   - Adjust based on your traffic patterns

3. **Database**

   - Enable MongoDB Atlas authentication
   - Restrict IP whitelist to application servers only
   - Enable backups

4. **Monitoring**
   - Set up error tracking (Sentry)
   - Configure uptime monitoring
   - Enable security alerts

### Optional Enhancements

1. **Email Verification**

   - Implement email verification on registration
   - Add SMTP configuration to `.env`

2. **Password Reset**

   - Add forgot password functionality
   - Implement secure token-based reset flow

3. **File Upload Security**

   - Validate resume file types (PDF only)
   - Scan uploads for malware
   - Set file size limits (5MB max)

4. **API Rate Limiting**

   - Consider Redis-based rate limiting for scaling
   - Implement per-user rate limits

5. **Database Backups**
   - Enable automated backups in MongoDB Atlas
   - Test restore procedures

---

## Performance Optimization

### Current Optimizations

✅ Database indexes (13 indexes created)
✅ Gzip compression (nginx)
✅ Static asset caching
✅ Connection pooling

### Recommended Additions

- **Pagination**: Implement for drives and applications lists
- **Caching**: Add Redis for session management
- **CDN**: Use Cloudflare or CloudFront for static assets
- **Database**: Enable MongoDB Atlas auto-scaling

---

## Troubleshooting

### Backend Issues

**"Token expired" errors:**

- Check if JWT_EXPIRATION_HOURS is too low
- Implement refresh token flow (already added)

**"Database not connected":**

- Verify MONGO_URL is correct
- Check IP whitelist in MongoDB Atlas
- Test connection: `python -c "from motor.motor_asyncio import AsyncIOMotorClient; client = AsyncIOMotorClient('your-url'); print(client.server_info())"`

**Rate limit errors:**

- Adjust limits in server.py `@limiter.limit()` decorators
- Check if shared IP (NAT) is causing issues

### Frontend Issues

**API connection errors:**

- Verify VITE_API_URL is correct
- Check CORS_ORIGINS in backend/.env
- Test backend: `curl https://api.yourdomain.com/health`

**Error boundary triggered:**

- Check browser console for errors
- Review server logs
- Verify all API responses match expected format

---

## Scaling Considerations

### Horizontal Scaling

- Run multiple backend instances behind load balancer
- Use sticky sessions or Redis for session storage
- Enable MongoDB Atlas sharding for large datasets

### Vertical Scaling

- Increase uvicorn workers (currently 1)
- Upgrade MongoDB Atlas tier
- Optimize database queries

### Monitoring at Scale

- Set up APM (Application Performance Monitoring)
- Enable distributed tracing
- Configure auto-scaling policies

---

## Rollback Plan

If deployment fails:

1. **Backend Rollback:**

```bash
git checkout <previous-commit>
docker-compose restart backend
```

2. **Frontend Rollback:**

```bash
git checkout <previous-commit>
npm run build
docker-compose restart frontend
```

3. **Database Rollback:**

- Use MongoDB Atlas point-in-time recovery
- Restore from backup

---

## Support

For issues or questions:

- Check logs: `docker-compose logs -f`
- Review health endpoint: `curl http://localhost:8000/health`
- Test database: MongoDB Atlas console

## Version

**Current Version:** 2.0.0 (Production Ready)

**Security Features:** JWT auth, rate limiting, input sanitization, password validation, CORS protection

**Last Updated:** 2024
