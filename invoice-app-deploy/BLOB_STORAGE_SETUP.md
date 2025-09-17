# Vercel Blob Storage Setup

## Overview
This application now uses Vercel Blob Storage for persistent invoice data storage when deployed on Vercel. This ensures that your invoices persist across serverless function restarts and cold starts.

## Setup Instructions

### 1. Enable Vercel Blob Storage

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to the **Storage** tab
4. Click **Create Database**
5. Select **Blob** as the storage type
6. Choose a name for your store (e.g., "invoice-storage")
7. Click **Create**

### 2. Environment Variables

After creating the Blob storage, Vercel will automatically add the following environment variables to your project:

- `BLOB_READ_WRITE_TOKEN` - Required for reading and writing to Blob storage

These are automatically configured when you create the Blob store through the Vercel dashboard.

### 3. Verify Setup

The storage system will automatically detect and use Blob storage when:
- The app is deployed on Vercel (`process.env.VERCEL` is set)
- The `BLOB_READ_WRITE_TOKEN` environment variable is present

You can verify the setup is working by:
1. Creating a new invoice
2. Refreshing the page or waiting for a cold start
3. The invoice should still be visible

## Storage Behavior

### On Vercel (Production)
- **With Blob Storage**: Invoices are persisted permanently in Vercel Blob storage
- **Without Blob Storage**: Falls back to in-memory storage (data lost on cold starts)

### Local Development
- Uses file-based storage in `data/invoices.json`
- Data persists between server restarts

## Monitoring

Check the API logs in Vercel's Functions tab to see storage-related messages:
- `[STORAGE] Loading from Vercel Blob storage...` - Blob storage is active
- `[STORAGE] Blob storage not configured` - Using fallback storage

## Troubleshooting

### Invoices disappearing after deployment
- Ensure Blob storage is created and linked to your project
- Check that `BLOB_READ_WRITE_TOKEN` is set in environment variables

### "Invoice Not Found" errors
- This typically happens when Blob storage isn't configured
- Follow the setup instructions above to enable persistent storage

### Local development issues
- Ensure the `data` directory has write permissions
- Check that `data/invoices.json` isn't corrupted

## Cost Considerations

Vercel Blob storage pricing:
- Free tier: 1GB storage, 1GB bandwidth
- Perfect for small to medium invoice applications
- See [Vercel Pricing](https://vercel.com/pricing) for details

## Support

If you continue to experience issues:
1. Check the Functions logs in Vercel dashboard
2. Verify environment variables are set correctly
3. Ensure your Vercel plan supports Blob storage
