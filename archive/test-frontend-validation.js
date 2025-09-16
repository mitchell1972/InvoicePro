#!/usr/bin/env node

/**
 * Frontend Validation Test Suite
 * Tests the client-side validation logic
 */

// Import validation functions (simulate ES6 import)
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateInvoiceForm(data) {
  const errors = {};

  if (!data.client?.name) {
    errors.clientName = 'Client name is required';
  }

  if (!data.client?.email) {
    errors.clientEmail = 'Client email is required';
  } else if (!validateEmail(data.client.email)) {
    errors.clientEmail = 'Invalid email address';
  }

  if (!data.items || data.items.length === 0) {
    errors.items = 'At least one line item is required';
  } else {
    data.items.forEach((item, index) => {
      if (!item.description) {
        errors[`item_${index}_description`] = 'Description is required';
      }
      if (!item.qty || item.qty <= 0) {
        errors[`item_${index}_qty`] = 'Valid quantity is required';
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        errors[`item_${index}_price`] = 'Valid price is required';
      }
    });
  }

  return errors;
}

class FrontendValidationTests {
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

  async testEmailValidation() {
    console.log('\n🧪 Testing Email Validation...');

    const validEmails = [
      'user@example.com',
      'test.email+tag@domain.co.uk',
      'user123@test-domain.org'
    ];

    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'user@',
      'user@domain',
      '',
      null
    ];

    // Test valid emails
    validEmails.forEach(email => {
      const isValid = validateEmail(email);
      this.logTest(`Valid email: ${email}`, isValid, isValid ? 'Correctly validated' : 'Should be valid');
    });

    // Test invalid emails
    invalidEmails.forEach(email => {
      const isValid = validateEmail(email);
      this.logTest(`Invalid email: ${email || 'null'}`, !isValid, !isValid ? 'Correctly rejected' : 'Should be invalid');
    });
  }

  async testInvoiceFormValidation() {
    console.log('\n🧪 Testing Invoice Form Validation...');

    // Test 1: Valid form data
    const validFormData = {
      client: {
        name: 'Test Client',
        email: 'test@example.com',
        company: 'Test Company'
      },
      items: [
        { description: 'Web Development', qty: 1, unitPrice: 1000, taxPercent: 20 },
        { description: 'SEO Services', qty: 2, unitPrice: 500, taxPercent: 20 }
      ],
      notes: 'Test notes',
      terms: 'Net 30'
    };

    const validErrors = validateInvoiceForm(validFormData);
    const hasNoErrors = Object.keys(validErrors).length === 0;
    this.logTest('Valid form data', hasNoErrors, hasNoErrors ? 'No validation errors' : `Found errors: ${Object.keys(validErrors).join(', ')}`);

    // Test 2: Missing client name
    const missingNameData = {
      ...validFormData,
      client: { ...validFormData.client, name: '' }
    };
    const nameErrors = validateInvoiceForm(missingNameData);
    const hasNameError = nameErrors.clientName;
    this.logTest('Missing client name', !!hasNameError, hasNameError || 'Should have client name error');

    // Test 3: Missing client email
    const missingEmailData = {
      ...validFormData,
      client: { ...validFormData.client, email: '' }
    };
    const emailErrors = validateInvoiceForm(missingEmailData);
    const hasEmailError = emailErrors.clientEmail;
    this.logTest('Missing client email', !!hasEmailError, hasEmailError || 'Should have client email error');

    // Test 4: Invalid email format
    const invalidEmailData = {
      ...validFormData,
      client: { ...validFormData.client, email: 'invalid-email' }
    };
    const invalidEmailErrors = validateInvoiceForm(invalidEmailData);
    const hasInvalidEmailError = invalidEmailErrors.clientEmail;
    this.logTest('Invalid email format', !!hasInvalidEmailError, hasInvalidEmailError || 'Should have invalid email error');

    // Test 5: Empty items array
    const emptyItemsData = {
      ...validFormData,
      items: []
    };
    const itemsErrors = validateInvoiceForm(emptyItemsData);
    const hasItemsError = itemsErrors.items;
    this.logTest('Empty items array', !!hasItemsError, hasItemsError || 'Should have items error');

    // Test 6: Invalid item data
    const invalidItemData = {
      ...validFormData,
      items: [
        { description: '', qty: 0, unitPrice: -100, taxPercent: 20 },
        { description: 'Valid item', qty: 1, unitPrice: 100, taxPercent: 20 }
      ]
    };
    const itemValidationErrors = validateInvoiceForm(invalidItemData);
    const hasItemDescriptionError = itemValidationErrors.item_0_description;
    const hasItemQtyError = itemValidationErrors.item_0_qty;
    const hasItemPriceError = itemValidationErrors.item_0_price;
    
    this.logTest('Invalid item description', !!hasItemDescriptionError, hasItemDescriptionError || 'Should have description error');
    this.logTest('Invalid item quantity', !!hasItemQtyError, hasItemQtyError || 'Should have quantity error');
    this.logTest('Invalid item price', !!hasItemPriceError, hasItemPriceError || 'Should have price error');
  }

  async testEdgeCases() {
    console.log('\n🧪 Testing Edge Cases...');

    // Test 1: Null/undefined client object
    const nullClientData = { client: null, items: [{ description: 'Test', qty: 1, unitPrice: 100 }] };
    const nullClientErrors = validateInvoiceForm(nullClientData);
    const hasNullClientError = nullClientErrors.clientName || nullClientErrors.clientEmail;
    this.logTest('Null client object', !!hasNullClientError, 'Should handle null client gracefully');

    // Test 2: Undefined items
    const undefinedItemsData = { client: { name: 'Test', email: 'test@example.com' }, items: undefined };
    const undefinedItemsErrors = validateInvoiceForm(undefinedItemsData);
    const hasUndefinedItemsError = undefinedItemsErrors.items;
    this.logTest('Undefined items', !!hasUndefinedItemsError, 'Should handle undefined items');

    // Test 3: Very long input values
    const longInputData = {
      client: {
        name: 'A'.repeat(1000), // Very long name
        email: 'test@example.com',
        company: 'B'.repeat(1000)
      },
      items: [
        { description: 'C'.repeat(1000), qty: 999999, unitPrice: 999999, taxPercent: 20 }
      ]
    };
    const longInputErrors = validateInvoiceForm(longInputData);
    const handlesLongInput = Object.keys(longInputErrors).length === 0;
    this.logTest('Very long input values', handlesLongInput, 'Should handle long input values gracefully');

    // Test 4: Special characters in email
    const specialCharEmails = [
      'test+tag@example.com',
      'user.name@example.com',
      'test-user@example-domain.co.uk'
    ];

    specialCharEmails.forEach(email => {
      const isValid = validateEmail(email);
      this.logTest(`Special char email: ${email}`, isValid, 'Should accept valid special characters');
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Frontend Validation Test Suite...\n');

    await this.testEmailValidation();
    await this.testInvoiceFormValidation();
    await this.testEdgeCases();

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FRONTEND VALIDATION TEST SUMMARY');
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
      
      console.log('\n🔧 RECOMMENDED FIXES:');
      console.log('1. Review failed validation logic');
      console.log('2. Update validation functions as needed');
      console.log('3. Add additional edge case handling');
    } else {
      console.log('\n✨ All frontend validation tests passed!');
    }
  }
}

// Run the test suite
const testSuite = new FrontendValidationTests();
testSuite.runAllTests().catch(console.error);