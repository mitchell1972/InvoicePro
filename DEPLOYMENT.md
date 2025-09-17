# Invoice App - Production Deployment Configuration

## Deployment Type: Node.js Server Application

This application is configured to run as a Node.js Express server that:
- Serves the React frontend from `/frontend/dist`
- Handles API requests to `/api/*` endpoints
- Supports SPA routing for the frontend

## Build Process

1. **Frontend Build**: `npm run build` builds the React app into `frontend/dist`
2. **Server Start**: `npm start` runs the Express server on port 3001 (or PORT environment variable)

## Environment Variables Required

```bash
# Stripe Integration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key

# Vercel Blob Storage (or equivalent storage service)
BLOB_READ_WRITE_TOKEN=your_blob_storage_token

# Optional: Node environment
NODE_ENV=production
PORT=3001
```

## Deployment Commands

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## API Endpoints Available

- `GET /api/health` - Health check
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get specific invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/send` - Send invoice via email
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `GET /api/subscriptions/plans` - Get subscription plans
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Static Files

- Frontend React app served from `/frontend/dist`
- All non-API routes serve the React app for SPA routing

## Server Architecture

- **Express.js** server with CORS enabled
- **Error handling** for all API routes
- **Static file serving** for React frontend
- **SPA routing support** (all non-API routes serve index.html)
