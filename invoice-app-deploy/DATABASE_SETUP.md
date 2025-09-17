# Invoice Database Setup (Vercel Blob Storage)

## Overview
The invoice application uses **Vercel Blob Storage** as its built-in database. This provides persistent, reliable storage that's part of your Vercel application - no external services required.

## Database Features
- ✅ **Built into Vercel**: Part of your application, not external
- ✅ **Persistent Storage**: Invoices survive server restarts and cold starts
- ✅ **Scalable**: Handles growing invoice data automatically  
- ✅ **Reliable**: Enterprise-grade storage with backups
- ✅ **Fast**: Low-latency access to invoice data
- ✅ **Secure**: Access controlled by your Vercel project

## Database Structure
The database stores invoices as JSON documents with this structure:

```json
{
  "id": "inv_0001",
  "number": "0001", 
  "client": {
    "name": "Client Name",
    "email": "client@example.com",
    "company": "Client Company"
  },
  "items": [
    {
      "description": "Service/Product",
      "qty": 1,
      "unitPrice": 1000,
      "taxPercent": 20
    }
  ],
  "currency": "GBP",
  "notes": "Invoice notes",
  "terms": "Net 30",
  "issueDate": "2025-01-01",
  "dueDate": "2025-01-31", 
  "totals": {
    "subtotal": 1000,
    "tax": 200,
    "total": 1200
  },
  "status": "Draft",
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-01T10:00:00Z"
}
```

## Production Setup

### 1. Enable Vercel Blob Storage
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Storage**
3. Click **Create Database** → **Blob**
4. Choose a name (e.g., "invoice-storage")
5. Create the storage

### 2. Environment Variables
Vercel will automatically set the required environment variable:
- `BLOB_READ_WRITE_TOKEN` - Automatically configured

### 3. Deploy
```bash
git push origin main
```
The application will automatically detect and use Blob storage in production.

## How It Works

### Local Development
- Uses file-based storage (`data/invoices.json`)
- Automatic initialization with sample invoices
- Full CRUD operations available

### Production (Vercel)
- Uses Vercel Blob storage for persistence
- Automatic initialization with default invoices
- All invoices persist across deployments and restarts

## Database Operations

### Reading Invoices
```javascript
import { getInvoices } from './api/_data/invoices.js';
const invoices = await getInvoices();
```

### Saving Invoices  
```javascript
import { setInvoices } from './api/_data/invoices.js';
await setInvoices(updatedInvoices);
```

### Creating Invoices
```javascript
import { calculateTotals } from './api/_data/invoices.js';
const newInvoice = {
  id: 'inv_' + Date.now(),
  // ... other fields
  totals: calculateTotals(items)
};
```

## Default Data
The database initializes with 8 sample invoices (`inv_0001` through `inv_0008`) including:
- Various client types
- Different invoice statuses (Draft, Sent, Paid, Overdue)
- Multiple currencies (GBP, USD, EUR)
- Sample line items and calculations

## Monitoring
- View storage usage in Vercel dashboard
- Monitor API calls and performance
- Access logs for debugging

## Backup & Recovery
- Vercel handles automatic backups
- Data is replicated across regions
- Point-in-time recovery available

## Cost
- Vercel Blob storage is included in Pro plans
- Pay-as-you-go pricing for usage beyond limits
- Very cost-effective for typical invoice volumes

## Troubleshooting

### Database Not Working
1. Check `BLOB_READ_WRITE_TOKEN` is set in environment
2. Verify Blob storage is enabled in Vercel dashboard
3. Check deployment logs for errors
4. Test with default invoices first

### Performance Issues
1. Check cache settings (currently 5 second cache)
2. Monitor Blob storage metrics in Vercel
3. Consider pagination for large invoice lists

The database is now fully implemented and ready for production use!