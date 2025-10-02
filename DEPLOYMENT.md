# Deployment Guide for Render

## Quick Start

1. **Create a Render Account**: Sign up at https://render.com

2. **Create a PostgreSQL Database**:
   - Go to Dashboard → New → PostgreSQL
   - Choose a name (e.g., `topping-express-db`)
   - Select Free tier or paid plan
   - Note: The `DATABASE_URL` will be automatically provided to your web service

3. **Deploy the Web Service**:
   - Go to Dashboard → New → Web Service
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml` file
   - Click "Apply" to create the service

4. **Configure Environment Variables**:
   
   Required variables (set in Render Dashboard → Environment):
   
   - `STALLION_API_TOKEN`: Your Stallion Express API token
     - Get from: https://dashboard.stallionexpress.ca
   
   - `postmark_API_Tokens`: Your Postmark API token for sending emails
     - Get from: https://account.postmarkapp.com
     - Configure sender signature for `noreply@toppingcourier.ca`
   
   - `ADMIN_EMAIL`: Email address to receive order notifications
     - Default: `toppingcourier.ca@gmail.com`
   
   Auto-configured by Render:
   - `DATABASE_URL`: Automatically set when PostgreSQL add-on is connected
   - `NODE_ENV`: Set to `production` in render.yaml
   - `PORT`: Set to `10000` in render.yaml
   - `SESSION_SECRET`: Auto-generated in render.yaml
   - `RENDER_EXTERNAL_URL`: Auto-set by Render (used for email links)

5. **Connect PostgreSQL to Web Service**:
   - In Web Service settings → Environment
   - Add environment variable: `DATABASE_URL`
   - Select: "PostgreSQL database" from dropdown
   - Choose your database instance

## Email Configuration

### Postmark Setup
1. Sign up at https://postmarkapp.com
2. Create a server for transactional emails
3. Add and verify sender signature: `noreply@toppingcourier.ca`
4. Get Server API Token from Settings → API Tokens
5. Add token to Render environment as `postmark_API_Tokens`

### Email Templates
The system sends two types of emails:

1. **Customer Confirmation Email**:
   - Sent to: Order recipient
   - Contains: Order details, tracking link, package info
   - Tracking URL: `{APP_URL}/track?number={trackingNumber}`

2. **Admin Notification Email**:
   - Sent to: `ADMIN_EMAIL`
   - Contains: Full order details, quick action links
   - Includes link to Stallion dashboard

## Stallion Express Integration

### API Setup
1. Sign up at https://stallionexpress.ca
2. Go to Dashboard → API Settings
3. Generate API token
4. Add token to Render environment as `STALLION_API_TOKEN`

### Features
- Real-time shipping rate quotes
- Order creation and tracking
- Support for multiple carriers (FedEx, UPS, ICS, etc.)
- Automatic postal code formatting for CA/US addresses

## Database Schema

The application automatically creates the following table on startup:

```sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  tracking_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sender JSONB NOT NULL,
  recipient JSONB NOT NULL,
  package_info JSONB NOT NULL,
  service JSONB NOT NULL,
  stallion_order_id VARCHAR(100)
);
```

**No manual migrations required** - the table is created automatically on first startup.

**Note**: The application automatically enables the `pgcrypto` extension if needed for `gen_random_uuid()`. Render's PostgreSQL (13+) has this function built-in, so no manual setup is required.

## Build and Deployment Process

### Build Command (from render.yaml):
```bash
npm install && npm run build
```

This will:
1. Install all dependencies
2. Build the React frontend with Vite
3. Output static files to `server/public/`

### Start Command (from render.yaml):
```bash
npm start
```

This runs `NODE_ENV=production node server/index.js` which:
1. Starts Express server on `0.0.0.0:10000`
2. Connects to PostgreSQL database
3. Initializes Postmark email service
4. Serves built React app + API endpoints

## Health Check

The service includes a health check endpoint:
- **URL**: `/api/health`
- **Returns**: Server status, database connection, email service status

## Testing Production Build Locally

```bash
# Build frontend
npm run build

# Set environment variables
export NODE_ENV=production
export PORT=10000
export DATABASE_URL="your_postgres_url"
export STALLION_API_TOKEN="your_token"
export postmark_API_Tokens="your_token"

# Start production server
npm start
```

Visit http://localhost:10000

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check PostgreSQL instance is running
- Ensure SSL is enabled (auto-configured for Render)

### Email Not Sending
- Verify `postmark_API_Tokens` is set
- Check sender signature is verified in Postmark
- Review logs for error messages

### Build Failures
- Check Node.js version matches `package.json` requirements (18.x - 20.x)
- Verify all dependencies are in `package.json`
- Review build logs for specific errors

### API Errors
- Verify `STALLION_API_TOKEN` is valid
- Check Stallion API is accessible
- Review server logs for detailed error messages

## Monitoring

### Logs
View logs in Render Dashboard → Logs to monitor:
- Server startup
- Database connections
- Email sending
- API requests
- Errors and warnings

### Metrics
Monitor in Render Dashboard:
- Request volume
- Response times
- Memory usage
- Error rates

## Security Notes

- All secrets stored in Render environment (encrypted)
- Database uses SSL in production
- HTTPS enforced by Render
- Session secrets auto-generated
- No sensitive data in code/repository
