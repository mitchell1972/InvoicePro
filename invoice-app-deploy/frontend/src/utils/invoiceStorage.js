// Fallback invoice storage for when API is unavailable
const STORAGE_KEY = 'invoice_fallback_data';

// Default invoices to prevent errors
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

// Initialize localStorage with defaults if empty
export function initializeFallbackStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultInvoices));
    console.log('[Fallback] Initialized with default invoices');
  }
}

// Get all invoices from localStorage
export function getFallbackInvoices() {
  initializeFallbackStorage();
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : defaultInvoices;
}

// Get a single invoice by ID
export function getFallbackInvoiceById(id) {
  const invoices = getFallbackInvoices();
  return invoices.find(inv => inv.id === id);
}

// Save invoice to localStorage
export function saveFallbackInvoice(invoice) {
  const invoices = getFallbackInvoices();
  const index = invoices.findIndex(inv => inv.id === invoice.id);
  
  if (index >= 0) {
    invoices[index] = invoice;
  } else {
    invoices.push(invoice);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  return invoice;
}

// Delete invoice from localStorage
export function deleteFallbackInvoice(id) {
  const invoices = getFallbackInvoices();
  const filtered = invoices.filter(inv => inv.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// Export for use in components
export default {
  initializeFallbackStorage,
  getFallbackInvoices,
  getFallbackInvoiceById,
  saveFallbackInvoice,
  deleteFallbackInvoice
};
