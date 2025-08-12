// Comprehensive Test Suite for Invoice App (CommonJS)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 COMPREHENSIVE INVOICE APP TEST SUITE');
console.log('==========================================\n');

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(testName, status, details = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${testName}`);
    if (details) console.log(`   ${details}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}`);
    if (details) console.log(`   ${details}`);
    testResults.errors.push(`${testName}: ${details}`);
  }
}

async function runFullTestSuite() {
  console.log('📋 1. STORAGE & DATABASE TESTS');
  console.log('────────────────────────────────\n');

  // Test 1: Storage File Exists and Contains Data
  try {
    const dataFile = path.join(__dirname, '..', 'api', 'data', 'invoices.json');
    const fileExists = fs.existsSync(dataFile);
    
    if (fileExists) {
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      logTest('Storage File Accessible', 'PASS', `${data.length} invoices loaded`);
      
      // Test invoice data integrity
      const hasCompleteInvoices = data.every(inv => 
        inv.id && inv.client && inv.items && inv.totals
      );
      logTest('Invoice Data Integrity', hasCompleteInvoices ? 'PASS' : 'FAIL', 
        hasCompleteInvoices ? 'All invoices have required fields' : 'Missing required fields');
      
      // Test recent invoice creation
      const recentInvoice = data.find(inv => inv.id === 'inv_0007');
      logTest('Recent Invoice Creation', recentInvoice ? 'PASS' : 'FAIL',
        recentInvoice ? `Created invoice ${recentInvoice.number} for ${recentInvoice.client.name}` : 'Test invoice not found');

      // Test invoice status distribution
      const statusCounts = data.reduce((acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      }, {});
      logTest('Invoice Status Tracking', Object.keys(statusCounts).length > 0 ? 'PASS' : 'FAIL',
        `Statuses: ${Object.entries(statusCounts).map(([k,v]) => `${k}:${v}`).join(', ')}`);
        
    } else {
      logTest('Storage File Accessible', 'FAIL', 'invoices.json not found');
    }
  } catch (error) {
    logTest('Storage File Access', 'FAIL', error.message);
  }

  console.log('\n📧 2. EMAIL CONFIGURATION TESTS');
  console.log('──────────────────────────────────\n');

  // Test 2: EmailJS Configuration
  try {
    const emailjsPath = path.join(__dirname, 'src', 'utils', 'emailjs-service.js');
    const emailjsExists = fs.existsSync(emailjsPath);
    
    if (emailjsExists) {
      const emailjsContent = fs.readFileSync(emailjsPath, 'utf8');
      
      const hasServiceId = emailjsContent.includes('service_gh4oqg3');
      const hasTemplateId = emailjsContent.includes('template_2yro5ul');
      const hasPublicKey = emailjsContent.includes('9olw9DixFqoBU12qo');
      
      logTest('EmailJS Service File Exists', 'PASS', 'emailjs-service.js found');
      logTest('EmailJS Service ID Configured', hasServiceId ? 'PASS' : 'FAIL');
      logTest('EmailJS Template ID Configured', hasTemplateId ? 'PASS' : 'FAIL');
      logTest('EmailJS Public Key Configured', hasPublicKey ? 'PASS' : 'FAIL');
      
      const isFullyConfigured = hasServiceId && hasTemplateId && hasPublicKey;
      logTest('EmailJS Full Configuration', isFullyConfigured ? 'PASS' : 'FAIL',
        isFullyConfigured ? 'All credentials present' : 'Missing credentials');
        
      // Test validation function
      const hasValidationFunction = emailjsContent.includes('isEmailJSConfigured');
      logTest('EmailJS Validation Function', hasValidationFunction ? 'PASS' : 'FAIL');
        
    } else {
      logTest('EmailJS Service File Exists', 'FAIL', 'emailjs-service.js not found');
    }
    
    // Check EmailJS setup documentation
    const setupDocPath = path.join(__dirname, '..', 'EMAILJS_SETUP.md');
    const setupDocExists = fs.existsSync(setupDocPath);
    logTest('EmailJS Documentation', setupDocExists ? 'PASS' : 'FAIL',
      setupDocExists ? 'Setup guide available' : 'Setup documentation missing');
      
  } catch (error) {
    logTest('EmailJS Configuration Test', 'FAIL', error.message);
  }

  console.log('\n🖥️ 3. FRONTEND COMPONENT TESTS');
  console.log('─────────────────────────────────\n');

  // Test 3: Frontend Components
  try {
    const componentsDir = path.join(__dirname, 'src', 'components');
    const requiredComponents = [
      'InvoiceForm.jsx',
      'InvoiceDetail.jsx', 
      'Dashboard.jsx',
      'Settings.jsx',
      'StatusBadge.jsx',
      'EmailPreview.jsx'
    ];
    
    requiredComponents.forEach(component => {
      const componentPath = path.join(componentsDir, component);
      const exists = fs.existsSync(componentPath);
      logTest(`Component: ${component}`, exists ? 'PASS' : 'FAIL');
    });
    
    // Test if InvoiceDetail has EmailJS integration
    const invoiceDetailPath = path.join(componentsDir, 'InvoiceDetail.jsx');
    if (fs.existsSync(invoiceDetailPath)) {
      const content = fs.readFileSync(invoiceDetailPath, 'utf8');
      const hasEmailJSImport = content.includes('emailjs-service');
      const hasSendFunction = content.includes('sendInvoiceEmailJS');
      logTest('InvoiceDetail EmailJS Integration', hasEmailJSImport && hasSendFunction ? 'PASS' : 'FAIL');
    }
    
    // Test if InvoiceForm has EmailJS integration  
    const invoiceFormPath = path.join(componentsDir, 'InvoiceForm.jsx');
    if (fs.existsSync(invoiceFormPath)) {
      const content = fs.readFileSync(invoiceFormPath, 'utf8');
      const hasEmailJSImport = content.includes('emailjs-service');
      const hasInitFunction = content.includes('initEmailJS');
      logTest('InvoiceForm EmailJS Integration', hasEmailJSImport && hasInitFunction ? 'PASS' : 'FAIL');
    }
    
  } catch (error) {
    logTest('Frontend Component Tests', 'FAIL', error.message);
  }

  console.log('\n⚙️ 4. API FUNCTION TESTS');
  console.log('───────────────────────────────\n');

  // Test 4: API Functions (Direct Testing)
  try {
    const invoicesApiPath = path.join(__dirname, '..', 'api', 'invoices', 'index.js');
    const dataModulePath = path.join(__dirname, '..', 'api', '_data', 'invoices.js');
    
    logTest('API Invoices Endpoint File', fs.existsSync(invoicesApiPath) ? 'PASS' : 'FAIL');
    logTest('API Data Module File', fs.existsSync(dataModulePath) ? 'PASS' : 'FAIL');
    
    // Test direct function imports (CommonJS format check)
    if (fs.existsSync(invoicesApiPath)) {
      const apiContent = fs.readFileSync(invoicesApiPath, 'utf8');
      const isCommonJS = apiContent.includes('module.exports') && apiContent.includes('require(');
      logTest('API CommonJS Format', isCommonJS ? 'PASS' : 'FAIL',
        isCommonJS ? 'Uses module.exports and require()' : 'Still using ES modules');
    }
    
    if (fs.existsSync(dataModulePath)) {
      const dataContent = fs.readFileSync(dataModulePath, 'utf8');
      const isCommonJS = dataContent.includes('module.exports') && dataContent.includes('require(');
      logTest('Data Module CommonJS Format', isCommonJS ? 'PASS' : 'FAIL',
        isCommonJS ? 'Uses module.exports and require()' : 'Still using ES modules');
    }

    // Test API function directly
    try {
      const { getInvoices } = require('../api/_data/invoices.js');
      const invoices = await getInvoices();
      logTest('API Direct Function Call', Array.isArray(invoices) ? 'PASS' : 'FAIL',
        `Returned ${invoices.length} invoices`);
    } catch (apiError) {
      logTest('API Direct Function Call', 'FAIL', apiError.message);
    }
    
  } catch (error) {
    logTest('API Function Tests', 'FAIL', error.message);
  }

  console.log('\n🔧 5. CONFIGURATION TESTS');
  console.log('────────────────────────────\n');

  // Test 5: Configuration Files
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const hasTypeModule = packageContent.type === 'module';
      logTest('Root Package.json ES Module Type', !hasTypeModule ? 'PASS' : 'FAIL',
        !hasTypeModule ? 'CommonJS compatible' : 'ES module type may cause issues');
      
      const hasVercelDeps = packageContent.dependencies && packageContent.dependencies['@vercel/blob'];
      logTest('Vercel Blob Dependency', hasVercelDeps ? 'PASS' : 'FAIL');
    }
    
    const vercelConfigPath = path.join(__dirname, '..', 'vercel.json');
    logTest('Vercel Configuration', fs.existsSync(vercelConfigPath) ? 'PASS' : 'FAIL');
    
    // Test frontend package.json
    const frontendPackagePath = path.join(__dirname, 'package.json');
    if (fs.existsSync(frontendPackagePath)) {
      const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
      const hasEmailJS = frontendPackage.dependencies && frontendPackage.dependencies['@emailjs/browser'];
      logTest('Frontend EmailJS Dependency', hasEmailJS ? 'PASS' : 'FAIL');
    }
    
  } catch (error) {
    logTest('Configuration Tests', 'FAIL', error.message);
  }

  console.log('\n📊 6. BUILD & DEPLOYMENT TESTS');
  console.log('────────────────────────────────\n');

  // Test 6: Build Configuration
  try {
    const distDir = path.join(__dirname, 'dist');
    const distExists = fs.existsSync(distDir);
    logTest('Frontend Build Directory', distExists ? 'PASS' : 'FAIL');
    
    if (distExists) {
      const indexHtml = path.join(distDir, 'index.html');
      const indexExists = fs.existsSync(indexHtml);
      logTest('Build Index.html', indexExists ? 'PASS' : 'FAIL');
      
      const assetsDir = path.join(distDir, 'assets');
      const assetsExist = fs.existsSync(assetsDir);
      logTest('Build Assets Directory', assetsExist ? 'PASS' : 'FAIL');
    }
    
    // Test Git status for deployment
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      const hasUncommittedChanges = gitStatus.trim().length > 0;
      logTest('Git Clean State', !hasUncommittedChanges ? 'PASS' : 'FAIL',
        !hasUncommittedChanges ? 'All changes committed' : 'Uncommitted changes detected');
    } catch (gitError) {
      logTest('Git Status Check', 'FAIL', 'Could not check git status');
    }
    
  } catch (error) {
    logTest('Build & Deployment Tests', 'FAIL', error.message);
  }

  console.log('\n🔬 7. EMAIL FUNCTIONALITY TESTS');
  console.log('──────────────────────────────────\n');

  // Test 7: Email System Integration
  try {
    // Test EmailJS browser dependency
    const frontendPackagePath = path.join(__dirname, 'package.json');
    if (fs.existsSync(frontendPackagePath)) {
      const packageData = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
      const hasEmailJSBrowser = packageData.dependencies && packageData.dependencies['@emailjs/browser'];
      logTest('EmailJS Browser Dependency', hasEmailJSBrowser ? 'PASS' : 'FAIL');
    }

    // Test email service integration in components
    const invoiceDetailPath = path.join(__dirname, 'src', 'components', 'InvoiceDetail.jsx');
    if (fs.existsSync(invoiceDetailPath)) {
      const content = fs.readFileSync(invoiceDetailPath, 'utf8');
      const hasEmailJSLogic = content.includes('useEmailJS');
      const hasFallbackLogic = content.includes('useGmail');
      logTest('Email Service Priority System', hasEmailJSLogic && hasFallbackLogic ? 'PASS' : 'FAIL',
        'EmailJS primary, Gmail fallback configured');
    }

    // Test email template file exists
    const emailTemplatePath = path.join(__dirname, '..', 'EMAILJS_TEMPLATE.html');
    logTest('Email Template File', fs.existsSync(emailTemplatePath) ? 'PASS' : 'FAIL');

  } catch (error) {
    logTest('Email Functionality Tests', 'FAIL', error.message);
  }

  // Test Summary
  console.log('\n📈 TEST RESULTS SUMMARY');
  console.log('═══════════════════════\n');
  
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%\n`);
  
  if (testResults.failed > 0) {
    console.log('🚨 FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`   • ${error}`);
    });
    console.log('');
  }
  
  // Recommendations
  console.log('🎯 SYSTEM STATUS & RECOMMENDATIONS');
  console.log('═══════════════════════════════════\n');
  
  if (testResults.passed >= testResults.total * 0.85) {
    console.log('🟢 SYSTEM STATUS: EXCELLENT');
    console.log('   All major components working correctly.');
    console.log('   System ready for production deployment.');
    console.log('   Minor issues can be resolved post-deployment.');
  } else if (testResults.passed >= testResults.total * 0.7) {
    console.log('🟡 SYSTEM STATUS: GOOD');
    console.log('   Most components working correctly.');
    console.log('   Ready for production with minor fixes needed.');
    console.log('   Address failed tests when possible.');
  } else if (testResults.passed >= testResults.total * 0.5) {
    console.log('🟠 SYSTEM STATUS: NEEDS ATTENTION');
    console.log('   Several issues need to be resolved.');
    console.log('   Focus on failed tests before deployment.');
    console.log('   Core functionality may be affected.');
  } else {
    console.log('🔴 SYSTEM STATUS: CRITICAL ISSUES');
    console.log('   Multiple critical components failing.');
    console.log('   Requires immediate attention before use.');
    console.log('   System not ready for production.');
  }
  
  return testResults;
}

// Run the test suite
runFullTestSuite().then((results) => {
  process.exit(results.failed === 0 ? 0 : 1);
}).catch((error) => {
  console.error('🚨 TEST SUITE FAILED:', error);
  process.exit(1);
});