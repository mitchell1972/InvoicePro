import { promises as fs } from 'fs';
import { join } from 'path';

// Storage configuration
// For serverless: use in-memory storage with defaults always available
// For local development: use file-based storage
const STORAGE_FILE = join(process.cwd(), 'data', 'invoices.json');
const IS_SERVERLESS = !!process.env.VERCEL;

// Runtime storage for serverless environment (resets on cold start)
let runtimeInvoices = [];

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
  }
];

// Storage functions
async function loadInvoicesFromStorage() {
  if (IS_SERVERLESS) {
    // In serverless, always start with default invoices + any in memory
    console.log('[STORAGE] Serverless: Loading default invoices + in-memory invoices');
    return [...defaultInvoices, ...(runtimeInvoices || [])];
  } else {
    // Local development: use file-based storage
    try {
      await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
      const data = await fs.readFile(STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log('[STORAGE] Loading default invoices (file not found or invalid)');
      return [...defaultInvoices];
    }
  }
}

async function saveInvoicesToStorage(invoices) {
  if (IS_SERVERLESS) {
    // In serverless, separate default invoices from runtime-created ones
    const runtimeOnly = invoices.filter(inv => !defaultInvoices.find(def => def.id === inv.id));
    runtimeInvoices = runtimeOnly;
    console.log(`[STORAGE] Serverless: Saved ${runtimeOnly.length} runtime invoices to memory`);
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

// Cache for the current request to avoid multiple operations
let invoicesCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = IS_SERVERLESS ? 10000 : 30000; // Shorter cache in serverless

export async function getInvoices() {
  const now = Date.now();
  
  // Return cached data if it's fresh
  if (invoicesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return invoicesCache;
  }
  
  // Load from storage
  try {
    invoicesCache = await loadInvoicesFromStorage();
    cacheTimestamp = now;
    console.log(`[STORAGE] Loaded ${invoicesCache.length} invoices from storage`);
    return invoicesCache;
  } catch (error) {
    console.error('[STORAGE] Failed to load invoices, using defaults:', error);
    invoicesCache = [...defaultInvoices];
    cacheTimestamp = now;
    return invoicesCache;
  }
}

export async function setInvoices(newInvoices) {
  try {
    await saveInvoicesToStorage(newInvoices);
    
    // Update cache
    invoicesCache = newInvoices;
    cacheTimestamp = Date.now();
    
    console.log(`[STORAGE] Updated storage with ${newInvoices.length} invoices`);
  } catch (error) {
    console.error('[STORAGE] Failed to save invoices:', error);
    // Still update cache for current session
    invoicesCache = newInvoices;
    cacheTimestamp = Date.now();
    throw error;
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


