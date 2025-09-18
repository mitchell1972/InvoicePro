/**
 * Comprehensive Subscription Test Runner for Invoice Pro
 * Compatible with Node.js - Tests all subscription functionality
 */

const axios = require('axios');

class SubscriptionTestRunner {
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

  // Check if server is running
  async checkServerStatus() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/subscriptions/plans`);
      this.logResult('Server Status Check', 'PASS', 'Invoice Pro server is running');
      return true;
    } catch (error) {
      this.logResult('Server Status Check', 'FAIL', `Server not responding: ${error.message}`);
      return false;
    }
  }

  // Test subscription plans endpoint
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
          return true;
        } else {
          this.logResult(
            'Subscription Plans Validation',
            'FAIL',
            `Missing plans: ${missingPlans.join(', ')}`
          );
          return false;
        }
      } else {
        this.logResult('Subscription Plans Validation', 'FAIL', 'Failed to retrieve subscription plans');
        return false;
      }
    } catch (error) {
      this.logResult('Subscription Plans Validation', 'FAIL', `Error: ${error.message}`);
      return false;
    }
  }

  // Test creating trial users
  async testTrialUserCreation() {
    console.log('\n🧪 Testing Trial User Creation...\n');

    const testCases = [
      {
        name: 'Monthly Trial User Creation',
        userData: {
          email: this.generateTestEmail('monthly_trial'),
          name: 'Monthly Trial User',
          planId: 'monthly'
        }
      },
      {
        name: 'Yearly Trial User Creation',
        userData: {
          email: this.generateTestEmail('yearly_trial'),
          name: 'Yearly Trial User',
          planId: 'yearly'
        }
      }
    ];

    for (const testCase of testCases) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
          action: 'create_trial_user',
          ...testCase.userData
        });
        
        if (response.data.success) {
          this.testUsers.push({
            email: testCase.userData.email,
            user: response.data.user
          });
          
          this.logResult(
            testCase.name,
            'PASS',
            'Trial user created successfully with credentials stored',
            {
              userId: response.data.user.id,
              email: response.data.user.email,
              subscriptionStatus: response.data.user.subscription.status,
              planId: response.data.user.subscription.planId,
              trialEnd: response.data.user.subscription.trialEnd
            }
          );
        } else {
          this.logResult(testCase.name, 'FAIL', 'Trial user creation failed', response.data);
        }
      } catch (error) {
        this.logResult(testCase.name, 'FAIL', `Trial user creation error: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data
        });
      }
    }
  }

  // Test subscription status validation
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
                trialEnd: subscription.trialEnd,
                currentPeriodEnd: subscription.currentPeriodEnd
              }
            );

            // Validate trial days calculation
            if (subscription.status === 'trialing') {
              const now = new Date();
              const trialEnd = new Date(subscription.trialEnd);
              const expectedDays = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
              
              if (Math.abs(subscription.daysLeftInTrial - expectedDays) <= 1) {
                this.logResult(
                  `Trial Days Calculation - ${testUser.email}`,
                  'PASS',
                  'Trial days calculation is accurate',
                  {
                    calculatedDays: subscription.daysLeftInTrial,
                    expectedDays: expectedDays
                  }
                );
              } else {
                this.logResult(
                  `Trial Days Calculation - ${testUser.email}`,
                  'FAIL',
                  'Trial days calculation is inaccurate',
                  {
                    calculatedDays: subscription.daysLeftInTrial,
                    expectedDays: expectedDays
                  }
                );
              }
            }
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

  // Test subscription lifecycle transitions
  async testSubscriptionLifecycle() {
    console.log('\n🧪 Testing Subscription Lifecycle Transitions...\n');

    if (this.testUsers.length === 0) {
      this.logResult('Subscription Lifecycle Test', 'SKIP', 'No test users available');
      return;
    }

    const testUser = this.testUsers[0];

    // Test 1: Trial End Simulation
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
            email: testUser.email,
            previousStatus: 'trialing',
            newStatus: trialEndResponse.data.user.subscription.status,
            trialEnd: trialEndResponse.data.user.subscription.trialEnd
          }
        );
      } else {
        this.logResult('Trial End Simulation', 'FAIL', 'Failed to simulate trial end', trialEndResponse.data);
      }
    } catch (error) {
      this.logResult('Trial End Simulation', 'FAIL', `Error: ${error.message}`);
    }

    // Test 2: Payment Success Simulation
    try {
      const paymentSuccessResponse = await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
        action: 'simulate_payment_success',
        email: testUser.email
      });

      if (paymentSuccessResponse.data.success) {
        const subscription = paymentSuccessResponse.data.user.subscription;
        const expectedDuration = subscription.planId === 'yearly' ? 365 : 30;
        const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
        const now = new Date();
        const durationDays = Math.ceil((currentPeriodEnd - now) / (1000 * 60 * 60 * 24));
        
        this.logResult(
          'Payment Success Simulation',
          'PASS',
          'Payment success simulated successfully',
          {
            email: testUser.email,
            status: subscription.status,
            planId: subscription.planId,
            currentPeriodEnd: subscription.currentPeriodEnd,
            subscriptionDurationDays: durationDays,
            expectedDurationDays: expectedDuration
          }
        );

        // Validate subscription period length
        if (Math.abs(durationDays - expectedDuration) <= 5) { // Allow 5-day tolerance
          this.logResult(
            'Subscription Period Validation',
            'PASS',
            'Subscription period duration is correct'
          );
        } else {
          this.logResult(
            'Subscription Period Validation',
            'FAIL',
            `Subscription period mismatch: expected ~${expectedDuration} days, got ${durationDays} days`
          );
        }
      } else {
        this.logResult('Payment Success Simulation', 'FAIL', 'Failed to simulate payment success', paymentSuccessResponse.data);
      }
    } catch (error) {
      this.logResult('Payment Success Simulation', 'FAIL', `Error: ${error.message}`);
    }

    // Test 3: Payment Failed Simulation
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
            email: testUser.email,
            status: paymentFailedResponse.data.user.subscription.status
          }
        );
      } else {
        this.logResult('Payment Failed Simulation', 'FAIL', 'Failed to simulate payment failure', paymentFailedResponse.data);
      }
    } catch (error) {
      this.logResult('Payment Failed Simulation', 'FAIL', `Error: ${error.message}`);
    }
  }

  // Test subscription cancellation scenarios
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
        // Create test user
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

          // Simulate active subscription first
          await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
            action: 'simulate_payment_success',
            email: testUserData.email
          });

          // Test cancellation by simulating payment failure
          const cancelResponse = await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
            action: 'simulate_payment_failed',
            email: testUserData.email
          });

          if (cancelResponse.data.success) {
            this.logResult(
              `Subscription Cancellation - ${testUserData.planId}`,
              'PASS',
              'Subscription cancellation simulated successfully',
              {
                email: testUserData.email,
                planId: testUserData.planId,
                previousStatus: 'active',
                newStatus: cancelResponse.data.user.subscription.status
              }
            );
          } else {
            this.logResult(
              `Subscription Cancellation - ${testUserData.planId}`,
              'FAIL',
              'Failed to simulate cancellation',
              cancelResponse.data
            );
          }
        } else {
          this.logResult(
            `Create Cancellation Test User - ${testUserData.planId}`,
            'FAIL',
            'Failed to create test user for cancellation',
            createResponse.data
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

  // Test edge cases and error handling
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

    // Test 4: Duplicate user creation
    const duplicateEmail = this.generateTestEmail('duplicate');
    
    try {
      // Create first user
      await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
        action: 'create_trial_user',
        email: duplicateEmail,
        name: 'First User'
      });

      // Try to create duplicate
      await axios.post(`${this.baseUrl}/api/subscriptions/test-flow`, {
        action: 'create_trial_user',
        email: duplicateEmail,
        name: 'Duplicate User'
      });
      
      this.logResult('Duplicate User Creation Test', 'FAIL', 'Should have prevented duplicate user creation');
    } catch (error) {
      if (error.response?.status === 400) {
        this.logResult('Duplicate User Creation Test', 'PASS', 'Correctly prevented duplicate user creation');
      } else {
        this.logResult('Duplicate User Creation Test', 'FAIL', `Unexpected error: ${error.message}`);
      }
    }
  }

  // Generate comprehensive test report
  generateReport() {
    console.log('\n📊 COMPREHENSIVE SUBSCRIPTION TEST REPORT\n');
    console.log('='.repeat(80));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
    const skippedTests = this.testResults.filter(r => r.status === 'SKIP').length;
    
    console.log(`📊 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   ⚠️  Skipped: ${skippedTests}`);
    const successRate = totalTests - skippedTests > 0 ? ((passedTests / (totalTests - skippedTests)) * 100).toFixed(1) : 0;
    console.log(`   📈 Success Rate: ${successRate}%`);
    
    console.log('\n📋 DETAILED RESULTS BY CATEGORY:');
    console.log('-'.repeat(80));
    
    // Group results by test category
    const categories = {
      'System Status': this.testResults.filter(r => r.testName.includes('Server') || r.testName.includes('Plans')),
      'User Management': this.testResults.filter(r => r.testName.includes('User') && !r.testName.includes('Status Check')),
      'Subscription Status': this.testResults.filter(r => r.testName.includes('Status') || r.testName.includes('Trial Days')),
      'Subscription Lifecycle': this.testResults.filter(r => r.testName.includes('Simulation') || r.testName.includes('Period')),
      'Subscription Cancellation': this.testResults.filter(r => r.testName.includes('Cancel')),
      'Edge Cases & Error Handling': this.testResults.filter(r => r.testName.includes('Test') && 
        (r.testName.includes('Non-existent') || r.testName.includes('Invalid') || r.testName.includes('Missing') || r.testName.includes('Duplicate')))
    };
    
    for (const [category, results] of Object.entries(categories)) {
      if (results.length > 0) {
        const categoryPassed = results.filter(r => r.status === 'PASS').length;
        const categoryTotal = results.filter(r => r.status !== 'SKIP').length;
        const categoryRate = categoryTotal > 0 ? ((categoryPassed / categoryTotal) * 100).toFixed(1) : 0;
        
        console.log(`\n${category} (${categoryRate}% passed):`);
        results.forEach(result => {
          const statusSymbol = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
          console.log(`  ${statusSymbol} ${result.testName}: ${result.message}`);
        });
      }
    }
    
    // System validation summary
    console.log('\n🔍 SUBSCRIPTION SYSTEM VALIDATION:');
    console.log('-'.repeat(80));
    
    const serverRunning = this.testResults.some(r => r.testName.includes('Server') && r.status === 'PASS');
    const plansWorking = this.testResults.some(r => r.testName.includes('Plans') && r.status === 'PASS');
    const userCreation = this.testResults.some(r => r.testName.includes('Trial User Creation') && r.status === 'PASS');
    const statusValidation = this.testResults.some(r => r.testName.includes('Status Validation') && r.status === 'PASS');
    const lifecycleWorking = this.testResults.some(r => r.testName.includes('Simulation') && r.status === 'PASS');
    const cancellationWorking = this.testResults.some(r => r.testName.includes('Cancellation - ') && r.status === 'PASS');
    const errorHandling = this.testResults.filter(r => r.testName.includes('Test') && 
      (r.testName.includes('Non-existent') || r.testName.includes('Invalid') || r.testName.includes('Missing')) && 
      r.status === 'PASS').length >= 2;
    
    console.log(`✓ Server & API Endpoints: ${serverRunning && plansWorking ? '🟢 WORKING' : '🔴 FAILED'}`);
    console.log(`✓ User Creation & Credential Storage: ${userCreation ? '🟢 WORKING' : '🔴 FAILED'}`);
    console.log(`✓ Subscription Status Validation: ${statusValidation ? '🟢 WORKING' : '🔴 FAILED'}`);
    console.log(`✓ Subscription Lifecycle Management: ${lifecycleWorking ? '🟢 WORKING' : '🔴 FAILED'}`);
    console.log(`✓ Subscription Cancellation (Monthly/Yearly): ${cancellationWorking ? '🟢 WORKING' : '🔴 FAILED'}`);
    console.log(`✓ Error Handling & Edge Cases: ${errorHandling ? '🟢 WORKING' : '🔴 FAILED'}`);
    
    const overallSystemHealth = serverRunning && plansWorking && userCreation && statusValidation && lifecycleWorking && cancellationWorking;
    
    console.log(`\n🎯 OVERALL SUBSCRIPTION SYSTEM HEALTH: ${overallSystemHealth ? '🟢 FULLY FUNCTIONAL' : '🔴 ISSUES DETECTED'}`);
    
    if (!overallSystemHealth) {
      console.log('\n⚠️  ISSUES FOUND:');
      if (!serverRunning || !plansWorking) console.log('   • Server or API endpoints not responding correctly');
      if (!userCreation) console.log('   • User creation and credential storage not working');
      if (!statusValidation) console.log('   • Subscription status validation failing');
      if (!lifecycleWorking) console.log('   • Subscription lifecycle management not working');
      if (!cancellationWorking) console.log('   • Subscription cancellation not working for monthly/yearly plans');
      if (!errorHandling) console.log('   • Error handling and edge cases not properly handled');
    }
    
    console.log('\n📁 Test Users Created:');
    console.log(`   Total test users: ${this.testUsers.length}`);
    this.testUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (Plan: ${user.user?.subscription?.planId || 'unknown'})`);
    });
    
    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      successRate,
      systemHealth: overallSystemHealth,
      testResults: this.testResults,
      testUsers: this.testUsers
    };
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 INVOICE PRO SUBSCRIPTION SYSTEM - COMPREHENSIVE TEST SUITE\n');
    console.log('='.repeat(80));
    console.log('Testing the following subscription functionality:');
    console.log('  📝 User addition with credential storage');
    console.log('  📋 Subscription details management (monthly/yearly)');
    console.log('  ✅ Subscription status validation');
    console.log('  🔄 Subscription lifecycle (trial → active → cancelled)');
    console.log('  ❌ Subscription cancellation scenarios');
    console.log('  🛡️  Edge cases and error handling\n');

    try {
      // Check if server is running first
      const serverRunning = await this.checkServerStatus();
      if (!serverRunning) {
        console.log('\n❌ Cannot proceed with tests - Invoice Pro server is not running.');
        console.log('Please start the server and try again.');
        return this.generateReport();
      }

      await this.testSubscriptionPlans();
      await this.testTrialUserCreation();
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

// Run the test suite
async function runTests() {
  const testRunner = new SubscriptionTestRunner();
  
  try {
    const report = await testRunner.runAllTests();
    
    console.log('\n✅ Test suite execution completed.');
    console.log(`📊 Final Score: ${report.passedTests}/${report.totalTests - report.skippedTests} tests passed (${report.successRate}%)`);
    
    // Exit with appropriate code
    process.exit(report.systemHealth ? 0 : 1);
  } catch (error) {
    console.error('❌ Test suite crashed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = SubscriptionTestRunner;

// Run if this file is executed directly
if (require.main === module) {
  runTests();
}
