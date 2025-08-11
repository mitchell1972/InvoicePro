import { promises as fs } from 'fs';
import { join } from 'path';
import { put, head, del, list } from '@vercel/blob';

// Storage configuration
const STORAGE_FILE = join(process.cwd(), 'data', 'invoices.json');
const IS_SERVERLESS = !!process.env.VERCEL;
const USE_BLOB = IS_SERVERLESS && !!process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_KEY = 'invoices-data.json';

// Cache for the current request to avoid multiple operations
let invoicesCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds cache for optimal performance

const defaultInvoices = [
  {
    id: 'inv_0001',
    number: '0001',
    client: {
      name: 'John Smith',
      email: 'john@techcorp.com',
      company: 'TechCorp Solutions'
    },
    items: [
      { description: 'Website Development', qty: 1, unitPrice: 3500, taxPercent: 20 },
      { description: 'Monthly Maintenance', qty: 3, unitPrice: 500, taxPercent: 20 }
    ],
    currency: 'GBP',
    notes: 'Payment due within 30 days',
    terms: 'Net 30',
    issueDate: '2025-01-15',
    dueDate: '2025-02-14',
    totals: { subtotal: 5000, tax: 1000, total: 6000 },
    status: 'Sent',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'inv_0002',
    number: '0002',
    client: {
      name: 'Sarah Johnson',
      email: 'sarah@marketingpro.com',
      company: 'Marketing Pro Agency'
    },
    items: [
      { description: 'SEO Consultation', qty: 8, unitPrice: 150, taxPercent: 20 },
      { description: 'Content Writing', qty: 5, unitPrice: 200, taxPercent: 20 }
    ],
    currency: 'GBP',
    notes: 'Thank you for your business',
    terms: 'Net 15',
    issueDate: '2025-01-10',
    dueDate: '2025-01-25',
    totals: { subtotal: 2200, tax: 440, total: 2640 },
    status: 'Paid',
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-20T14:30:00Z'
  },
  {
    id: 'inv_0003',
    number: '0003',
    client: {
      name: 'Michael Brown',
      email: 'michael@retailplus.com',
      company: 'Retail Plus Ltd'
    },
    items: [
      { description: 'E-commerce Platform', qty: 1, unitPrice: 8000, taxPercent: 20 },
      { description: 'Payment Integration', qty: 1, unitPrice: 1500, taxPercent: 20 }
    ],
    currency: 'GBP',
    notes: 'Please include project reference: RP-2025',
    terms: 'Net 45',
    issueDate: '2025-01-05',
    dueDate: '2025-02-19',
    totals: { subtotal: 9500, tax: 1900, total: 11400 },
    status: 'Draft',
    createdAt: '2025-01-05T11:00:00Z',
    updatedAt: '2025-01-05T11:00:00Z'
  },
  {
    id: 'inv_0004',
    number: '0004',
    client: {
      name: 'Emma Davis',
      email: 'emma@designstudio.com',
      company: 'Design Studio Creative'
    },
    items: [
      { description: 'Logo Design', qty: 1, unitPrice: 800, taxPercent: 20 },
      { description: 'Brand Guidelines', qty: 1, unitPrice: 1200, taxPercent: 20 }
    ],
    currency: 'GBP',
    notes: 'Revisions included as discussed',
    terms: 'Net 30',
    issueDate: '2024-12-15',
    dueDate: '2025-01-14',
    totals: { subtotal: 2000, tax: 400, total: 2400 },
    status: 'Overdue',
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z'
  },
  {
    id: 'inv_0005',
    number: '0005',
    client: {
      name: 'Robert Wilson',
      email: 'robert@consultingfirm.com',
      company: 'Wilson Consulting'
    },
    items: [
      { description: 'Business Analysis', qty: 20, unitPrice: 200, taxPercent: 20 },
      { description: 'Strategy Report', qty: 1, unitPrice: 2000, taxPercent: 20 }
    ],
    currency: 'GBP',
    notes: 'Phase 1 of project completed',
    terms: 'Net 30',
    issueDate: '2025-01-20',
    dueDate: '2025-02-19',
    totals: { subtotal: 6000, tax: 1200, total: 7200 },
    status: 'Sent',
    createdAt: '2025-01-20T09:00:00Z',
    updatedAt: '2025-01-20T09:00:00Z'
  },
  {
    id: 'inv_0006',
    number: '0006',
    client: {
      name: 'Lisa Martinez',
      email: 'lisa@digitalagency.com',
      company: 'Digital Marketing Agency'
    },
    items: [
      { description: 'Website Redesign', qty: 1, unitPrice: 4500, taxPercent: 20 },
      { description: 'SEO Setup', qty: 1, unitPrice: 1200, taxPercent: 20 }
    ],
    currency: 'GBP',
    notes: 'Modern responsive design with mobile optimization',
    terms: 'Net 30',
    issueDate: '2025-01-25',
    dueDate: '2025-02-24',
    totals: { subtotal: 5700, tax: 1140, total: 6840 },
    status: 'Draft',
    createdAt: '2025-01-25T10:00:00Z',
    updatedAt: '2025-01-25T10:00:00Z'
  },
  {
    id: 'inv_0007',
    number: '0007',
    client: {
      name: 'David Chen',
      email: 'david@techsolutions.com',
      company: 'Tech Solutions Inc'
    },
    items: [
      { description: 'Mobile App Development', qty: 1, unitPrice: 7500, taxPercent: 20 },
      { description: 'Testing & QA', qty: 1, unitPrice: 1500, taxPercent: 20 }
    ],
    currency: 'GBP',
    notes: 'Mobile app for iOS and Android platforms',
    terms: 'Net 30',
    issueDate: '2025-01-28',
    dueDate: '2025-02-27',
    totals: { subtotal: 9000, tax: 1800, total: 10800 },
    status: 'Draft',
    createdAt: '2025-01-28T10:00:00Z',
    updatedAt: '2025-01-28T10:00:00Z'
  },
  {
    id: 'inv_0008',
    number: '0008',
    client: {
      name: 'Sample Client',
      email: 'client@example.com',
      company: 'Example Company'
    },
    items: [
      { description: 'Professional Services', qty: 1, unitPrice: 2000, taxPercent: 20 }
    ],
    currency: 'GBP',
    notes: 'Thank you for your business',
    terms: 'Net 30',
    issueDate: '2025-01-29',
    dueDate: '2025-02-28',
    totals: { subtotal: 2000, tax: 400, total: 2400 },
    status: 'Draft',
    createdAt: '2025-01-29T10:00:00Z',
    updatedAt: '2025-01-29T10:00:00Z'
  },
  {
    id: 'inv_0009',
    number: '0009',
    client: {
      name: 'New Test Client',
      email: 'test@client.com',
      company: 'Test Company Ltd'
    },
    items: [
      { description: 'Consulting Services', qty: 5, unitPrice: 500, taxPercent: 20 }
    ],
    currency: 'GBP',
    notes: 'Invoice for consulting work',
    terms: 'Net 30',
    issueDate: '2025-01-29',
    dueDate: '2025-02-28',
    totals: { subtotal: 2500, tax: 500, total: 3000 },
    status: 'Draft',
    createdAt: '2025-01-29T11:00:00Z',
    updatedAt: '2025-01-29T11:00:00Z'
  },
  {
    id: 'inv_0010',
    number: '0010',
    client: {
      name: 'Additional Client',
      email: 'additional@client.com',
      company: 'Additional Services Inc'
    },
    items: [
      { description: 'Development Services', qty: 10, unitPrice: 300, taxPercent: 20 }
    ],
    currency: 'GBP',
    notes: 'Development project invoice',
    terms: 'Net 30',
    issueDate: '2025-01-29',
    dueDate: '2025-02-28',
    totals: { subtotal: 3000, tax: 600, total: 3600 },
    status: 'Draft',
    createdAt: '2025-01-29T11:00:00Z',
    updatedAt: '2025-01-29T11:00:00Z'
  }
];

// Storage functions with Vercel Blob support
async function loadInvoicesFromStorage() {
  if (USE_BLOB) {
    // Use Vercel Blob storage
    try {
      console.log('[STORAGE] Loading from Vercel Blob storage...');
      
      // First check if the blob exists
      const blobHead = await head(BLOB_KEY).catch(() => null);
      
      if (blobHead) {
        // Blob exists, fetch its content
        const response = await fetch(blobHead.url);
        const invoices = await response.json();
        console.log(`[STORAGE] Loaded ${invoices.length} invoices from Blob storage`);
        return invoices;
      } else {
        // Blob doesn't exist yet
        console.log('[STORAGE] No existing blob data, initializing with defaults');
        throw new Error('Blob not found');
      }
    } catch (error) {
      console.log('[STORAGE] No existing blob data or error loading, will initialize with defaults');
      console.log('[STORAGE] Error details:', error.message);
      
      // Initialize blob storage with defaults
      try {
        const blob = await put(BLOB_KEY, JSON.stringify(defaultInvoices), {
          access: 'public',
          contentType: 'application/json',
          addRandomSuffix: false,
          allowOverwrite: true  // Allow overwriting if it somehow exists
        });
        console.log('[STORAGE] Initialized Blob storage with default invoices');
        return [...defaultInvoices];
      } catch (putError) {
        console.error('[STORAGE] Failed to initialize Blob storage:', putError);
        return [...defaultInvoices];
      }
    }
  } else if (IS_SERVERLESS) {
    // Serverless without Blob storage configured
    console.log('[STORAGE] Blob storage not configured. Using in-memory defaults.');
    console.log('[STORAGE] To enable persistence, set BLOB_READ_WRITE_TOKEN in Vercel dashboard.');
    return [...defaultInvoices];
  } else {
    // Local development: use file-based storage
    try {
      await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
      const data = await fs.readFile(STORAGE_FILE, 'utf8');
      const invoices = JSON.parse(data);
      console.log(`[STORAGE] Loaded ${invoices.length} invoices from file`);
      return invoices;
    } catch (error) {
      console.log('[STORAGE] Loading default invoices (file not found or invalid)');
      // Save defaults to file for next time
      try {
        await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
        await fs.writeFile(STORAGE_FILE, JSON.stringify(defaultInvoices, null, 2));
      } catch (writeError) {
        console.error('[STORAGE] Could not save defaults to file:', writeError);
      }
      return [...defaultInvoices];
    }
  }
}

async function saveInvoicesToStorage(invoices) {
  if (USE_BLOB) {
    // Use Vercel Blob storage
    try {
      const blob = await put(BLOB_KEY, JSON.stringify(invoices), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true  // CRITICAL: Allow overwriting existing blob
      });
      console.log(`[STORAGE] Saved ${invoices.length} invoices to Blob storage`);
      console.log('[STORAGE] Blob URL:', blob.url);
    } catch (error) {
      console.error('[STORAGE] Failed to save to Blob storage:', error);
      throw error;
    }
  } else if (IS_SERVERLESS) {
    // Serverless without Blob storage
    console.log('[STORAGE] Warning: Running on Vercel without Blob storage.');
    console.log('[STORAGE] Data will be lost on function restart.');
    console.log('[STORAGE] To enable persistence, configure BLOB_READ_WRITE_TOKEN.');
  } else {
    // Local development: save to file
    try {
      await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
      await fs.writeFile(STORAGE_FILE, JSON.stringify(invoices, null, 2));
      console.log(`[STORAGE] Saved ${invoices.length} invoices to file: ${STORAGE_FILE}`);
    } catch (error) {
      console.error('[STORAGE] Failed to save invoices:', error);
      throw error;
    }
  }
}

// Force clear the cache (useful before critical operations)
export function clearInvoiceCache() {
  console.log('[STORAGE] Clearing invoice cache');
  invoicesCache = null;
  cacheTimestamp = 0;
}

export async function getInvoices(forceRefresh = false) {
  const now = Date.now();
  
  // Clear cache if forced refresh requested
  if (forceRefresh) {
    clearInvoiceCache();
  }
  
  // Return cached data if it's fresh
  if (invoicesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('[STORAGE] Returning cached invoices');
    return [...invoicesCache]; // Return a copy to prevent mutations
  }
  
  // Load from storage
  try {
    invoicesCache = await loadInvoicesFromStorage();
    cacheTimestamp = now;
    console.log(`[STORAGE] Retrieved ${invoicesCache.length} invoices from storage`);
    return [...invoicesCache]; // Return a copy
  } catch (error) {
    console.error('[STORAGE] Failed to load invoices, using defaults:', error);
    invoicesCache = [...defaultInvoices];
    cacheTimestamp = now;
    return [...invoicesCache]; // Return a copy
  }
}

export async function setInvoices(newInvoices) {
  try {
    await saveInvoicesToStorage(newInvoices);
    
    // Update cache
    invoicesCache = newInvoices;
    cacheTimestamp = Date.now();
    
    console.log(`[STORAGE] Successfully updated ${newInvoices.length} invoices`);
    return true;
  } catch (error) {
    console.error('[STORAGE] Failed to save invoices:', error);
    console.error('[STORAGE] Error details:', error.message, error.stack);
    
    // Log more details about the environment
    console.error('[STORAGE] Environment check:', {
      IS_SERVERLESS,
      USE_BLOB,
      HAS_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
      TOKEN_LENGTH: process.env.BLOB_READ_WRITE_TOKEN?.length || 0
    });
    
    // Still update cache for current session
    invoicesCache = newInvoices;
    cacheTimestamp = Date.now();
    
    // Throw the error so the API knows the save failed
    throw new Error(`Storage save failed: ${error.message}`);
  }
}

export function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const tax = items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice * (item.taxPercent / 100),
    0
  );
  return { subtotal, tax, total: subtotal + tax };
}