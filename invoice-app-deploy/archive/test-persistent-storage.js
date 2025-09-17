#!/usr/bin/env node

/**
 * Test the new persistent file storage system
 */

import { getInvoices, setInvoices } from './api/_data/invoices.js';

async function testPersistentStorage() {
  console.log('🧪 Testing Persistent Storage System...\n');

  try {
    // Test 1: Load initial invoices
    console.log('📖 Loading initial invoices...');
    const initialInvoices = await getInvoices();
    console.log(`✅ Loaded ${initialInvoices.length} invoices from storage`);
    
    // Test 2: Create a new invoice
    console.log('\n📝 Creating new test invoice...');
    const testInvoice = {
      id: 'inv_storage_test',
      number: '9999',
      client: {
        name: 'Storage Test Client',
        email: 'storage@test.com',
        company: 'Test Storage Inc'
      },
      items: [
        { description: 'Storage Test Service', qty: 1, unitPrice: 500, taxPercent: 20 }
      ],
      currency: 'GBP',
      notes: 'This is a persistent storage test',
      terms: 'Net 30',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totals: { subtotal: 500, tax: 100, total: 600 },
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newInvoices = [...initialInvoices, testInvoice];
    await setInvoices(newInvoices);
    console.log('✅ Test invoice saved to persistent storage');

    // Test 3: Reload and verify persistence
    console.log('\n🔄 Reloading invoices to test persistence...');
    
    // Clear cache by waiting a bit and accessing directly
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const reloadedInvoices = await getInvoices();
    const foundTestInvoice = reloadedInvoices.find(inv => inv.id === 'inv_storage_test');
    
    if (foundTestInvoice) {
      console.log('✅ Test invoice successfully persisted and reloaded');
      console.log(`   Invoice ID: ${foundTestInvoice.id}`);
      console.log(`   Client: ${foundTestInvoice.client.name}`);
      console.log(`   Total: £${(foundTestInvoice.totals.total / 100).toFixed(2)}`);
    } else {
      console.log('❌ Test invoice not found after reload - persistence failed');
      return false;
    }

    // Test 4: Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    const cleanedInvoices = reloadedInvoices.filter(inv => inv.id !== 'inv_storage_test');
    await setInvoices(cleanedInvoices);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Persistent storage system is working correctly!');
    console.log(`📁 Storage location: ${process.cwd()}/data/invoices.json`);
    
    return true;

  } catch (error) {
    console.error('❌ Storage test failed:', error);
    return false;
  }
}

// Run the test
testPersistentStorage()
  .then(success => {
    console.log(`\n🏁 Test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });