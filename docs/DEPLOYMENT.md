# Deployment Guide

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

# Optional (add as needed)
# Add any other environment variables here
```

### Setting Environment Variables

1. **Local Development**
   - Copy `.env.example` to `.env.local`
   - Fill in the values in `.env.local`

2. **Heroku Environment**
   ```bash
   # Set MongoDB URI
   heroku config:set MONGODB_URI=your_mongodb_uri --remote <remote-name>
   
   # Set Node environment
   heroku config:set NODE_ENV=production --remote <remote-name>
   ```

## Deployment Pipeline

### 1. Development Environment (dev)
```bash
git push dev dev:main
```

### 2. Staging Environment (staging)
```bash
git push staging staging:main
```

### 3. Production Environment (prod)
```bash
git push prod main:main
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
   "heroku-postbuild": "npm ci --omit=dev && npm run build"
   ```

3. **Development Tools**: Development tools (husky, etc.) are properly configured as devDependencies and are excluded from production builds.

## MongoDB Setup

1. **Create MongoDB Atlas Cluster**
   - Sign up for MongoDB Atlas
   - Create a new cluster
   - Configure network access (IP whitelist)
   - Create database user
   - Get connection string

2. **Configure Connection**
   - Use connection string in environment variables
   - Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>`

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Ensure all production dependencies are correctly listed in `dependencies` (not `devDependencies`)
   - Verify Node.js version compatibility
   - Check build logs: `heroku logs --tail`

2. **Runtime Errors**
   - Verify environment variables are correctly set
   - Check application logs: `heroku logs --tail`

3. **Database Connection Issues**
   - Verify MONGODB_URI is correctly set
   - Check MongoDB Atlas network access settings
   - Ensure database user has correct permissions

## Monitoring

1. **Application Health**
   - Health check endpoint: `/api/health`
   - Monitors application status and dependencies

2. **Logs**
   - View logs: `heroku logs --tail`
   - Monitor for errors and performance issues

## Best Practices

1. **Version Control**
   - Keep development and production branches separate
   - Use feature branches for development
   - Merge through proper review process

2. **Testing**
   - Test locally with `heroku local` before deployment
   - Verify application in staging before production deployment

3. **Security**
   - Keep environment variables secure
   - Regularly update dependencies
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

For deployment issues or questions:
1. Check Heroku status: https://status.heroku.com/
2. Review Heroku logs: `heroku logs --tail`
3. Consult team lead or DevOps support
