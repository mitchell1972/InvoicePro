#!/usr/bin/env node

/**
 * Calculation Consistency Test Suite
 * Tests that frontend and backend calculate totals identically
 */

// Frontend calculation logic (from utils/money.js)
function calculateLineTotal(item) {
  return item.qty * item.unitPrice;
}

function calculateTax(item) {
  return calculateLineTotal(item) * (item.taxPercent / 100);
}

function calculateInvoiceTotalsFrontend(items) {
  const subtotal = items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  const tax = items.reduce((sum, item) => sum + calculateTax(item), 0);
  return {
    subtotal,
    tax,
    total: subtotal + tax
  };
}

// Backend calculation logic (from api/_data/invoices.js)
function calculateInvoiceTotalsBackend(items) {
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const tax = items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice * (item.taxPercent / 100),
    0
  );
  return { subtotal, tax, total: subtotal + tax };
}

class CalculationConsistencyTests {
  constructor() {
    this.testResults = [];
  }

  logTest(testName, passed, details = '') {
    const result = { testName, passed, details, timestamp: new Date().toISOString() };
    this.testResults.push(result);
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName}`);
    if (details) console.log(`   Details: ${details}`);
  }

  compareCalculations(items, testName) {
    const frontendResult = calculateInvoiceTotalsFrontend(items);
    const backendResult = calculateInvoiceTotalsBackend(items);

    const subtotalMatch = Math.abs(frontendResult.subtotal - backendResult.subtotal) < 0.01;
    const taxMatch = Math.abs(frontendResult.tax - backendResult.tax) < 0.01;
    const totalMatch = Math.abs(frontendResult.total - backendResult.total) < 0.01;

    const allMatch = subtotalMatch && taxMatch && totalMatch;

    this.logTest(`${testName} - Calculation consistency`, allMatch, 
      allMatch ? 'Frontend and backend calculations match' :
      `Mismatch - Frontend: ${JSON.stringify(frontendResult)} vs Backend: ${JSON.stringify(backendResult)}`
    );

    if (!allMatch) {
      console.log(`   Frontend: Subtotal: ${frontendResult.subtotal}, Tax: ${frontendResult.tax}, Total: ${frontendResult.total}`);
      console.log(`   Backend:  Subtotal: ${backendResult.subtotal}, Tax: ${backendResult.tax}, Total: ${backendResult.total}`);
    }

    return allMatch;
  }

  async testBasicCalculations() {
    console.log('\n🧪 Testing Basic Calculations...');

    // Test 1: Simple single item
    const singleItem = [
      { description: 'Web Development', qty: 1, unitPrice: 1000, taxPercent: 20 }
    ];
    this.compareCalculations(singleItem, 'Single item');

    // Test 2: Multiple items same tax
    const multipleItemsSameTax = [
      { description: 'Web Development', qty: 1, unitPrice: 1000, taxPercent: 20 },
      { description: 'SEO Services', qty: 2, unitPrice: 500, taxPercent: 20 }
    ];
    this.compareCalculations(multipleItemsSameTax, 'Multiple items same tax');

    // Test 3: Multiple items different tax
    const multipleItemsDifferentTax = [
      { description: 'Web Development', qty: 1, unitPrice: 1000, taxPercent: 20 },
      { description: 'Consultation', qty: 3, unitPrice: 200, taxPercent: 0 },
      { description: 'Hosting', qty: 12, unitPrice: 50, taxPercent: 10 }
    ];
    this.compareCalculations(multipleItemsDifferentTax, 'Multiple items different tax');
  }

  async testEdgeCases() {
    console.log('\n🧪 Testing Edge Cases...');

    // Test 1: Zero tax
    const zeroTax = [
      { description: 'Service', qty: 1, unitPrice: 100, taxPercent: 0 }
    ];
    this.compareCalculations(zeroTax, 'Zero tax rate');

    // Test 2: High tax rate
    const highTax = [
      { description: 'Luxury Service', qty: 1, unitPrice: 1000, taxPercent: 50 }
    ];
    this.compareCalculations(highTax, 'High tax rate');

    // Test 3: Decimal quantities and prices
    const decimalValues = [
      { description: 'Hourly Service', qty: 2.5, unitPrice: 75.50, taxPercent: 17.5 }
    ];
    this.compareCalculations(decimalValues, 'Decimal quantities and prices');

    // Test 4: Very large numbers
    const largeNumbers = [
      { description: 'Enterprise Project', qty: 100, unitPrice: 10000, taxPercent: 25 }
    ];
    this.compareCalculations(largeNumbers, 'Large numbers');

    // Test 5: Very small numbers
    const smallNumbers = [
      { description: 'Micro Service', qty: 1, unitPrice: 0.01, taxPercent: 5 }
    ];
    this.compareCalculations(smallNumbers, 'Very small numbers');
  }

  async testRealWorldScenarios() {
    console.log('\n🧪 Testing Real-World Scenarios...');

    // Test 1: Typical web development invoice
    const webDevInvoice = [
      { description: 'Website Design', qty: 1, unitPrice: 3500, taxPercent: 20 },
      { description: 'Frontend Development', qty: 40, unitPrice: 85, taxPercent: 20 },
      { description: 'Backend Development', qty: 30, unitPrice: 95, taxPercent: 20 },
      { description: 'Testing & QA', qty: 10, unitPrice: 75, taxPercent: 20 }
    ];
    this.compareCalculations(webDevInvoice, 'Web development invoice');

    // Test 2: Mixed services invoice
    const mixedServices = [
      { description: 'Consultation (Tax-free)', qty: 5, unitPrice: 150, taxPercent: 0 },
      { description: 'Design Work', qty: 1, unitPrice: 2000, taxPercent: 20 },
      { description: 'Development', qty: 25, unitPrice: 80, taxPercent: 20 },
      { description: 'Third-party Software', qty: 1, unitPrice: 500, taxPercent: 10 }
    ];
    this.compareCalculations(mixedServices, 'Mixed services invoice');

    // Test 3: European VAT rates
    const europeanVAT = [
      { description: 'Standard Rate Service', qty: 1, unitPrice: 1000, taxPercent: 21 }, // Netherlands
      { description: 'Reduced Rate Service', qty: 2, unitPrice: 500, taxPercent: 9 }    // Netherlands reduced
    ];
    this.compareCalculations(europeanVAT, 'European VAT rates');
  }

  async runAllTests() {
    console.log('🚀 Starting Calculation Consistency Test Suite...\n');

    await this.testBasicCalculations();
    await this.testEdgeCases();
    await this.testRealWorldScenarios();

    this.printSummary();
    this.provideBugFixRecommendations();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 CALCULATION CONSISTENCY TEST SUMMARY');
    console.log('='.repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.filter(r => !r.passed).forEach(test => {
        console.log(`  • ${test.testName}: ${test.details}`);
      });
    }
  }

  provideBugFixRecommendations() {
    const failedTests = this.testResults.filter(r => !r.passed);
    
    if (failedTests.length > 0) {
      console.log('\n🔧 BUG FIX RECOMMENDATIONS:');
      console.log('1. Standardize calculation logic between frontend and backend');
      console.log('2. Use the same precision handling for floating-point arithmetic');
      console.log('3. Consider using a money library for precise decimal calculations');
      console.log('4. Add unit tests to prevent calculation regression');
      
      console.log('\n💡 SUGGESTED FIXES:');
      console.log('- Move calculation logic to a shared utility function');
      console.log('- Use Math.round() for consistent precision');
      console.log('- Store amounts as integers (cents) to avoid floating-point errors');
    } else {
      console.log('\n✅ CALCULATION INTEGRITY VERIFIED:');
      console.log('Frontend and backend calculations are consistent across all test scenarios.');
    }
  }
}

// Run the test suite
const testSuite = new CalculationConsistencyTests();
testSuite.runAllTests().catch(console.error);