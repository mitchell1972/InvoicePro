/**
 * Comprehensive Subscription Test Suite for Invoice Pro
 * Tests all subscription functionality including:
 * - User registration and credential storage
 * - Subscription creation (monthly/yearly)
 * - Subscription status validation
 * - Subscription cancellation scenarios
 * - Edge cases and error handling
 */

import axios from 'axios';

class SubscriptionTestSuite {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.testResults = [];
    this.testUsers = [];
  }

  // Utility method to log test results
  logResult(testName, status, message, data = null) {
    const result = {
      testName,
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    const statusSymbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusSymbol} ${testName}: ${message}`);
    if (data) console.log('   Data:', JSON.stringify(data, null, 2));
  }

  // Generate unique test email
  generateTestEmail(prefix = 'test') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}_${timestamp}_${random}@invoicepro.test`;
  }

  // Test 1: User Registration with Credentials
  async testUserRegistration() {
    console.log('\n🧪 Testing User Registration and Credential Storage...\n');

    const testCases = [
      {
        name: 'Valid Monthly Subscription Registration',
        userData: {
          email: this.generateTestEmail('monthly'),
          password: 'securePassword123',
          name: 'Monthly Test User',
          company: 'Monthly Test Company',
          paymentMethodId: 'pm_card_visa',
          planId: 'monthly'
        }
      },
      {
        name: 'Valid Yearly Subscription Registration',
        userData: {
          email: this.generateTestEmail('yearly'),
          password: 'securePassword456',
          name: 'Yearly Test User',
          company: 'Yearly Test Company',
          paymentMethodId: 'pm_card_visa',
          planId: 'yearly'
        }
      }
    ];

    for (const testCase of testCases) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/auth/register`, testCase.userData);
        
        if (response.data.success) {
          this.testUsers.push({
            email: testCase.userData.email,
            token: response.data.token,
            user: response.data.user
          });
          
          this.logResult(
            testCase.name,
            'PASS',
            'User registered successfully with credentials stored',
            {
              userId: response.data.user.id,
              email: response.data.user.email,
              subscriptionStatus: response.data.user.subscription.status,
              planId: response.data.user.subscription.planId
            }
          );
        } else {
          this.logResult(testCase.name, 'FAIL', 'Registration failed', response.data);
        }
      } catch (error) {
        this.logResult(testCase.name, 'FAIL', `Registration error: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data
        });
      }
    }

    // Test invalid registration scenarios
    const invalidCases = [
      {
        name: 'Invalid Email Registration',
        userData: { email: 'invalid-email', password: 'test123456', name: 'Test', paymentMethodId: 'pm_card_visa' },
        expectedError: 'Email must be valid'
      },
      {
        name: 'Short Password Registration',
        userData: { email: this.generateTestEmail('short'), password: '123', name: 'Test', paymentMethodId: 'pm_card_visa' },
        expectedError: 'password must be at least 8 characters'
      },
      {
        name: 'Missing Payment Method Registration',
        userData: { email: this.generateTestEmail('nopay'), password: 'test123456', name: 'Test' },
        expectedError: 'payment method are required'
      }
    ];

    for (const testCase of invalidCases) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/auth/register`, testCase.userData);
        this.logResult(testCase.name, 'FAIL', 'Should have failed but succeeded', response.data);
      } catch (error) {
        if (error.response?.data?.error?.includes(testCase.expectedError)) {
          this.logResult(testCase.name, 'PASS', 'Correctly rejected invalid registration');
        } else {
          this.logResult(testCase.name, 'FAIL', `Unexpected error: ${error.response?.data?.error || error.message}`);
        }
      }
    }
  }

  // Test 2: User Login and Credential Validation
  async testUserLogin() {
    console.log('\n🧪 Testing User Login and Credential Validation...\n');

    for (const testUser of this.testUsers) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
          email: testUser.email,
          password: 'securePassword123' // Using known password from registration
        });

        if (response.data.success) {
          this.logResult(
            `Login Test - ${testUser.email}`,
            'PASS',
            'User login successful',
            {
              userId: response.data.user.id,
              subscriptionStatus: response.data.user.subscription.status,
              daysLeftInTrial: response.data.user.subscription.daysLeftInTrial
            }
          );
        } else {
          this.logResult(`Login Test - ${testUser.email}`, 'FAIL', 'Login failed', response.data);
        }
      } catch (error) {
        this.logResult(`Login Test - ${testUser.email}`, 'FAIL', `Login error: ${error.message}`);
      }
    }

    // Test invalid login scenarios
    try {
      await axios.post(`${this.baseUrl}/api/auth/login`, {
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      });
      this.logResult('Invalid Login Test', 'FAIL', 'Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 401) {
        this.logResult('Invalid Login Test', 'PASS', 'Correctly rejected invalid credentials');
      } else {
        this.logResult('Invalid Login Test', 'FAIL', `Unexpected error: ${error.message}`);
      }
    }
  }

  // Test 3: Subscription Status Validation
  async testSubscriptionStatusValidation() {
    console.log('\n🧪 Testing Subscription Status Validation...\n');

    for (const testUser of this.testUsers) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
          action: 'get_user_status',
          email: testUser.email
        });

        if (response.data.success) {
          const subscription = response.data.user.subscription;
          
          // Validate subscription data structure
          const requiredFields = ['status', 'planId', 'currentPeriodEnd', 'trialEnd'];
          const missingFields = requiredFields.filter(field => !subscription[field]);
          
          if (missingFields.length === 0) {
            this.logResult(
              `Subscription Status Validation - ${testUser.email}`,
              'PASS',
              'Subscription status retrieved and validated',
              {
                status: subscription.status,
                planId: subscription.planId,
                daysLeftInTrial: subscription.daysLeftInTrial,
                trialEnd: subscription.trialEnd
              }
            );
          } else {
            this.logResult(
              `Subscription Status Validation - ${testUser.email}`,
              'FAIL',
              `Missing required fields: ${missingFields.join(', ')}`
            );
          }
        } else {
          this.logResult(
            `Subscription Status Validation - ${testUser.email}`,
            'FAIL',
            'Failed to get subscription status',
            response.data
          );
        }
      } catch (error) {
        this.logResult(
          `Subscription Status Validation - ${testUser.email}`,
          'FAIL',
          `Error: ${error.message}`
        );
      }
    }
  }

  // Test 4: Subscription Lifecycle Simulation
  async testSubscriptionLifecycle() {
    console.log('\n🧪 Testing Subscription Lifecycle (Trial → Active → Cancelled)...\n');

    if (this.testUsers.length === 0) {
      this.logResult('Subscription Lifecycle Test', 'SKIP', 'No test users available');
      return;
    }

    const testUser = this.testUsers[0];

    // Test Trial End Simulation
    try {
      const trialEndResponse = await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
        action: 'simulate_trial_end',
        email: testUser.email
      });

      if (trialEndResponse.data.success) {
        this.logResult(
          'Trial End Simulation',
          'PASS',
          'Trial end simulated successfully',
          {
            status: trialEndResponse.data.user.subscription.status,
            trialEnd: trialEndResponse.data.user.subscription.trialEnd
          }
        );
      } else {
        this.logResult('Trial End Simulation', 'FAIL', 'Failed to simulate trial end');
      }
    } catch (error) {
      this.logResult('Trial End Simulation', 'FAIL', `Error: ${error.message}`);
    }

    // Test Payment Success Simulation
    try {
      const paymentSuccessResponse = await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
        action: 'simulate_payment_success',
        email: testUser.email
      });

      if (paymentSuccessResponse.data.success) {
        this.logResult(
          'Payment Success Simulation',
          'PASS',
          'Payment success simulated successfully',
          {
            status: paymentSuccessResponse.data.user.subscription.status,
            currentPeriodEnd: paymentSuccessResponse.data.user.subscription.currentPeriodEnd
          }
        );
      } else {
        this.logResult('Payment Success Simulation', 'FAIL', 'Failed to simulate payment success');
      }
    } catch (error) {
      this.logResult('Payment Success Simulation', 'FAIL', `Error: ${error.message}`);
    }

    // Test Payment Failed Simulation
    try {
      const paymentFailedResponse = await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
        action: 'simulate_payment_failed',
        email: testUser.email
      });

      if (paymentFailedResponse.data.success) {
        this.logResult(
          'Payment Failed Simulation',
          'PASS',
          'Payment failure simulated successfully',
          {
            status: paymentFailedResponse.data.user.subscription.status
          }
        );
      } else {
        this.logResult('Payment Failed Simulation', 'FAIL', 'Failed to simulate payment failure');
      }
    } catch (error) {
      this.logResult('Payment Failed Simulation', 'FAIL', `Error: ${error.message}`);
    }
  }

  // Test 5: Subscription Plans Validation
  async testSubscriptionPlans() {
    console.log('\n🧪 Testing Subscription Plans...\n');

    try {
      const response = await axios.get(`${this.baseUrl}/api/subscriptions/plans`);

      if (response.data.success && response.data.plans) {
        const plans = response.data.plans;
        
        // Validate plan structure
        const expectedPlans = ['monthly', 'yearly'];
        const availablePlans = plans.map(plan => plan.id);
        const missingPlans = expectedPlans.filter(plan => !availablePlans.includes(plan));
        
        if (missingPlans.length === 0) {
          this.logResult(
            'Subscription Plans Validation',
            'PASS',
            'All subscription plans available and properly structured',
            {
              availablePlans,
              monthlyPrice: plans.find(p => p.id === 'monthly')?.price,
              yearlyPrice: plans.find(p => p.id === 'yearly')?.price
            }
          );
        } else {
          this.logResult(
            'Subscription Plans Validation',
            'FAIL',
            `Missing plans: ${missingPlans.join(', ')}`
          );
        }
      } else {
        this.logResult('Subscription Plans Validation', 'FAIL', 'Failed to retrieve subscription plans');
      }
    } catch (error) {
      this.logResult('Subscription Plans Validation', 'FAIL', `Error: ${error.message}`);
    }
  }

  // Test 6: Subscription Cancellation Scenarios
  async testSubscriptionCancellation() {
    console.log('\n🧪 Testing Subscription Cancellation Scenarios...\n');

    // Create specific test users for cancellation testing
    const cancellationTestUsers = [
      {
        email: this.generateTestEmail('cancel_monthly'),
        planId: 'monthly',
        name: 'Monthly Cancel User'
      },
      {
        email: this.generateTestEmail('cancel_yearly'),
        planId: 'yearly',
        name: 'Yearly Cancel User'
      }
    ];

    for (const testUserData of cancellationTestUsers) {
      try {
        // Create test user via test flow
        const createResponse = await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
          action: 'create_trial_user',
          email: testUserData.email,
          name: testUserData.name,
          planId: testUserData.planId
        });

        if (createResponse.data.success) {
          this.logResult(
            `Create Cancellation Test User - ${testUserData.planId}`,
            'PASS',
            'Test user created for cancellation testing',
            {
              email: testUserData.email,
              planId: testUserData.planId,
              status: createResponse.data.user.subscription.status
            }
          );

          // Test cancellation by simulating trial end without payment
          const cancelResponse = await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
            action: 'simulate_trial_end',
            email: testUserData.email
          });

          if (cancelResponse.data.success) {
            this.logResult(
              `Subscription Cancellation - ${testUserData.planId}`,
              'PASS',
              'Subscription cancellation simulated successfully',
              {
                email: testUserData.email,
                previousStatus: 'trialing',
                newStatus: cancelResponse.data.user.subscription.status
              }
            );
          } else {
            this.logResult(
              `Subscription Cancellation - ${testUserData.planId}`,
              'FAIL',
              'Failed to simulate cancellation'
            );
          }
        } else {
          this.logResult(
            `Create Cancellation Test User - ${testUserData.planId}`,
            'FAIL',
            'Failed to create test user for cancellation'
          );
        }
      } catch (error) {
        this.logResult(
          `Subscription Cancellation - ${testUserData.planId}`,
          'FAIL',
          `Error: ${error.message}`
        );
      }
    }
  }

  // Test 7: Edge Cases and Error Handling
  async testEdgeCases() {
    console.log('\n🧪 Testing Edge Cases and Error Handling...\n');

    // Test 1: Non-existent user status check
    try {
      await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
        action: 'get_user_status',
        email: 'nonexistent@test.com'
      });
      this.logResult('Non-existent User Status Check', 'FAIL', 'Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 404) {
        this.logResult('Non-existent User Status Check', 'PASS', 'Correctly handled non-existent user');
      } else {
        this.logResult('Non-existent User Status Check', 'FAIL', `Unexpected error: ${error.message}`);
      }
    }

    // Test 2: Invalid action in test flow
    try {
      await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
        action: 'invalid_action',
        email: 'test@test.com'
      });
      this.logResult('Invalid Action Test', 'FAIL', 'Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400) {
        this.logResult('Invalid Action Test', 'PASS', 'Correctly rejected invalid action');
      } else {
        this.logResult('Invalid Action Test', 'FAIL', `Unexpected error: ${error.message}`);
      }
    }

    // Test 3: Missing email in requests
    try {
      await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
        action: 'get_user_status'
        // Missing email
      });
      this.logResult('Missing Email Test', 'FAIL', 'Should have failed but succeeded');
    } catch (error) {
      if (error.response?.status === 400) {
        this.logResult('Missing Email Test', 'PASS', 'Correctly rejected missing email');
      } else {
        this.logResult('Missing Email Test', 'FAIL', `Unexpected error: ${error.message}`);
      }
    }
  }

  // Generate comprehensive test report
  generateReport() {
    console.log('\n📊 COMPREHENSIVE SUBSCRIPTION TEST REPORT\n');
    console.log('='.repeat(60));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
    const skippedTests = this.testResults.filter(r => r.status === 'SKIP').length;
    
    console.log(`📊 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   ⚠️  Skipped: ${skippedTests}`);
    console.log(`   📈 Success Rate: ${((passedTests / (totalTests - skippedTests)) * 100).toFixed(1)}%`);
    
    console.log('\n📋 DETAILED RESULTS:');
    console.log('-'.repeat(60));
    
    // Group results by test category
    const categories = {
      'User Registration': this.testResults.filter(r => r.testName.includes('Registration')),
      'User Login': this.testResults.filter(r => r.testName.includes('Login')),
      'Subscription Status': this.testResults.filter(r => r.testName.includes('Status')),
      'Subscription Lifecycle': this.testResults.filter(r => r.testName.includes('Simulation')),
      'Subscription Plans': this.testResults.filter(r => r.testName.includes('Plans')),
      'Subscription Cancellation': this.testResults.filter(r => r.testName.includes('Cancel')),
      'Edge Cases': this.testResults.filter(r => r.testName.includes('Test') && !r.testName.includes('Registration'))
    };
    
    for (const [category, results] of Object.entries(categories)) {
      if (results.length > 0) {
        console.log(`\n${category}:`);
        results.forEach(result => {
          const statusSymbol = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
          console.log(`  ${statusSymbol} ${result.testName}: ${result.message}`);
        });
      }
    }
    
    // System validation summary
    console.log('\n🔍 SYSTEM VALIDATION SUMMARY:');
    console.log('-'.repeat(60));
    
    const userRegPassed = this.testResults.some(r => r.testName.includes('Valid') && r.testName.includes('Registration') && r.status === 'PASS');
    const loginPassed = this.testResults.some(r => r.testName.includes('Login') && r.status === 'PASS');
    const statusValidationPassed = this.testResults.some(r => r.testName.includes('Status Validation') && r.status === 'PASS');
    const lifecyclePassed = this.testResults.some(r => r.testName.includes('Simulation') && r.status === 'PASS');
    const plansPassed = this.testResults.some(r => r.testName.includes('Plans') && r.status === 'PASS');
    
    console.log(`✓ User Registration & Credential Storage: ${userRegPassed ? 'WORKING' : 'FAILED'}`);
    console.log(`✓ User Authentication: ${loginPassed ? 'WORKING' : 'FAILED'}`);
    console.log(`✓ Subscription Status Validation: ${statusValidationPassed ? 'WORKING' : 'FAILED'}`);
    console.log(`✓ Subscription Lifecycle Management: ${lifecyclePassed ? 'WORKING' : 'FAILED'}`);
    console.log(`✓ Subscription Plans: ${plansPassed ? 'WORKING' : 'FAILED'}`);
    
    const overallSystemHealth = userRegPassed && loginPassed && statusValidationPassed && lifecyclePassed && plansPassed;
    console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${overallSystemHealth ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}`);
    
    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      successRate: ((passedTests / (totalTests - skippedTests)) * 100).toFixed(1),
      systemHealth: overallSystemHealth,
      testResults: this.testResults
    };
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Invoice Pro Subscription Test Suite...\n');
    console.log('Testing the following functionality:');
    console.log('  ✓ User registration with credential storage');
    console.log('  ✓ Subscription creation (monthly/yearly plans)');
    console.log('  ✓ Subscription status validation');
    console.log('  ✓ Subscription lifecycle management');
    console.log('  ✓ Subscription cancellation scenarios');
    console.log('  ✓ Edge cases and error handling\n');

    try {
      await this.testSubscriptionPlans();
      await this.testUserRegistration();
      await this.testUserLogin();
      await this.testSubscriptionStatusValidation();
      await this.testSubscriptionLifecycle();
      await this.testSubscriptionCancellation();
      await this.testEdgeCases();
      
      return this.generateReport();
    } catch (error) {
      console.error('❌ Test suite execution failed:', error.message);
      this.logResult('Test Suite Execution', 'FAIL', `Execution failed: ${error.message}`);
      return this.generateReport();
    }
  }
}

// Export for use
export default SubscriptionTestSuite;

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new SubscriptionTestSuite();
  testSuite.runAllTests().then(report => {
    console.log('\n✅ Test suite completed. Results saved to test report.');
    process.exit(report.systemHealth ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}
