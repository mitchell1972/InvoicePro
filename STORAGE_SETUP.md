# Invoice Storage Setup for Production

## Problem
The invoice application was failing to save new invoices in production because serverless functions don't have persistent file storage.

## Solution
Implemented external storage using JSONBin.io (free service) for persistent invoice data in serverless environment.

## Setup Instructions

### 1. Create JSONBin Account
1. Go to https://jsonbin.io/
2. Sign up for a free account
3. Create a new bin (JSON storage)
4. Note down your:
   - **API Key** (from Account Settings)
   - **Bin ID** (from your created bin URL)

### 2. Configure Environment Variables
Add these to your Vercel project environment variables:

```bash
JSONBIN_API_KEY=your_api_key_here
JSONBIN_BIN_ID=your_bin_id_here
```

### 3. Initial Data Setup
The system will automatically initialize with default invoices on first load.

## How It Works

- **Local Development**: Uses file-based storage (`data/invoices.json`)
- **Production (with config)**: Uses JSONBin.io for persistent storage
- **Production (without config)**: Falls back to read-only defaults

## Testing

1. Set up the environment variables in Vercel
2. Deploy the application
3. Try creating a new invoice
4. Verify it persists across page refreshes

## Alternative Solutions

If you prefer not to use external storage, consider:
1. **Vercel Postgres** (paid)
2. **Supabase** (free tier available)
3. **PlanetScale** (free tier available)
4. **MongoDB Atlas** (free tier available)

The current JSONBin.io solution provides:
- ✅ Free tier (up to 100 requests/month)
- ✅ Simple setup
- ✅ No database required
- ✅ JSON-based storage