# Deployment Guide

## Branch Structure

### Production Branch (`main`)
- Deployed to Heroku production environment
- Contains stable, production-ready code
- All features are thoroughly tested
- Deployment is automated via Heroku Git integration

### Development Branch (`dev`)
- Used for feature integration and testing
- Contains latest development changes
- Features are tested here before merging to main
- Can be deployed to staging environment if needed

### Experimental Branch (`experimental`)
- Used for experimental features and testing
- Not deployed to any environment
- Changes may be merged to dev if successful

## Prerequisites

- Heroku CLI installed
- Node.js 18.x
- Git
- MongoDB Atlas account

## Environment Variables

The following environment variables need to be set in your Heroku application:

```bash
# Required
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
NODE_ENV=production
OPENROUTER_API_KEY=your_openrouter_key
```

### Setting Environment Variables

1. **Local Development**
   - Copy `.env.example` to `.env.local`
   - Fill in the values in `.env.local`

2. **Heroku Environment**
   ```bash
   # Set MongoDB URI
   heroku config:set MONGODB_URI=your_mongodb_uri

   # Set Node environment
   heroku config:set NODE_ENV=production

   # Set OpenRouter API key
   heroku config:set OPENROUTER_API_KEY=your_openrouter_key
   ```

## Deployment Pipeline

### 1. Development Environment (dev)
```bash
git push origin dev
```

### 2. Production Environment (main)
```bash
git push origin main
```

## Build Process

The application uses the following build configuration:

1. **Node.js Version**: The application is configured to use Node.js 18.x as specified in `package.json`:
   ```json
   "engines": {
     "node": "18.x"
   }
   ```

2. **Production Dependencies**: Only production dependencies are installed during deployment:
   ```json
   "scripts": {
     "build": "next build",
     "start": "next start"
   }
   ```

## MongoDB Setup

1. **MongoDB Atlas Configuration**
   - Database: Brain-Dump-Database
   - Region: AWS Frankfurt (eu-central-1)
   - Connection pooling enabled
   - Network access configured for Heroku IPs

2. **Connection Configuration**
   - Use connection string in environment variables
   - Connection pooling is automatically configured
   - Health monitoring is active

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs: `heroku logs --tail`
   - Verify Node.js version compatibility
   - Check for missing dependencies

2. **Runtime Errors**
   - Check application logs: `heroku logs --tail`
   - Verify environment variables
   - Check MongoDB connection

3. **Database Connection Issues**
   - Verify MONGODB_URI is correct
   - Check MongoDB Atlas network access
   - Monitor connection pool status

## Monitoring

1. **Application Health**
   - Health check endpoint: `/api/health`
   - Status endpoint: `/api/status`
   - Metrics endpoint: `/api/status/metrics`

2. **Logs**
   - View logs: `heroku logs --tail`
   - Monitor for errors and performance issues

## Best Practices

1. **Version Control**
   - Keep main branch stable
   - Develop in dev branch
   - Test experimental features in experimental branch
   - Use proper commit messages

2. **Testing**
   - Test locally before deployment
   - Verify in development environment
   - Monitor production deployment

3. **Security**
   - Keep environment variables secure
   - Update dependencies regularly
   - Monitor for security advisories

## Rollback Procedure

If issues are encountered after deployment:

1. View previous releases:
   ```bash
   heroku releases
   ```

2. Rollback to a previous version:
   ```bash
   heroku rollback v<version-number>
   ```

## Support

For deployment issues:
1. Check Heroku status: https://status.heroku.com/
2. Review application logs: `heroku logs --tail`
3. Check MongoDB Atlas status
4. Monitor system metrics in Admin Panel
