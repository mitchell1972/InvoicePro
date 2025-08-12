# 🌐 Production Manual Test Guide - Complete User Journey

**Production URL:** https://invoice-app-two.vercel.app  
**Test Date:** August 12, 2025  
**Purpose:** Test complete user workflow from login to email sending

---

## 🎯 Complete User Journey Test Plan

### **Phase 1: Authentication & Access** 🔐

#### Test 1.1: Website Access
- [ ] **Action:** Navigate to https://invoice-app-two.vercel.app
- [ ] **Expected:** Homepage loads successfully
- [ ] **Check:** Page title shows "Invoice app"
- [ ] **Check:** Navigation elements are visible
- [ ] **Status:** ❓ TO TEST

#### Test 1.2: User Registration
- [ ] **Action:** Click "Register" or navigate to registration
- [ ] **Expected:** Registration form appears
- [ ] **Fill:** Valid email, password, confirm password
- [ ] **Submit:** Create new account
- [ ] **Expected:** Success message or redirect to login
- [ ] **Status:** ❓ TO TEST

#### Test 1.3: User Login
- [ ] **Action:** Navigate to login page
- [ ] **Expected:** Login form with email/password fields
- [ ] **Fill:** Enter valid credentials
- [ ] **Submit:** Attempt login
- [ ] **Expected:** Successful login, redirect to dashboard
- [ ] **Status:** ❓ TO TEST

---

### **Phase 2: Dashboard & Navigation** 🖥️

#### Test 2.1: Dashboard Access
- [ ] **Action:** After successful login
- [ ] **Expected:** Dashboard page loads
- [ ] **Check:** Invoice list is visible
- [ ] **Check:** "New Invoice" button present
- [ ] **Check:** Filter/search options available
- [ ] **Status:** ❓ TO TEST

#### Test 2.2: Navigation Menu
- [ ] **Action:** Test all navigation links
- [ ] **Check:** Dashboard ✓
- [ ] **Check:** New Invoice ✓
- [ ] **Check:** Settings ✓
- [ ] **Check:** Logout ✓
- [ ] **Expected:** All pages load without errors
- [ ] **Status:** ❓ TO TEST

---

### **Phase 3: Invoice Creation** 📋

#### Test 3.1: New Invoice Form Access
- [ ] **Action:** Click "New Invoice" or "Create Invoice"
- [ ] **Expected:** Invoice creation form loads
- [ ] **Check:** Client details section visible
- [ ] **Check:** Line items section visible
- [ ] **Check:** Totals calculation area visible
- [ ] **Status:** ❓ TO TEST

#### Test 3.2: Invoice Form Completion
**Client Details:**
- [ ] **Fill:** Client Name: "Test Customer Production"
- [ ] **Fill:** Email: "production.test@example.com"
- [ ] **Fill:** Company: "Production Test Ltd"

**Line Items:**
- [ ] **Fill:** Description: "Production Test Service"
- [ ] **Fill:** Quantity: 2
- [ ] **Fill:** Unit Price: 500.00
- [ ] **Fill:** Tax: 20%
- [ ] **Check:** Total calculates automatically: £1,200.00

**Additional Details:**
- [ ] **Fill:** Notes: "Production test invoice"
- [ ] **Fill:** Terms: "Net 30"
- [ ] **Set:** Issue Date (today)
- [ ] **Set:** Due Date (30 days from now)

- [ ] **Status:** ❓ TO TEST

#### Test 3.3: Save Invoice as Draft
- [ ] **Action:** Click "Save as Draft"
- [ ] **Expected:** Invoice saved successfully
- [ ] **Expected:** Redirect to invoice detail view
- [ ] **Check:** Invoice appears in dashboard list
- [ ] **Status:** ❓ TO TEST

---

### **Phase 4: Email Sending to Customer** 📧

#### Test 4.1: Email Configuration Check
- [ ] **Action:** Go to Settings or check EmailJS configuration
- [ ] **Check:** EmailJS Service ID: service_gh4oqg3
- [ ] **Check:** EmailJS Template ID: template_2yro5ul  
- [ ] **Check:** EmailJS Public Key: 9olw9DixFqoBU12qo
- [ ] **Check:** Configuration status shows "READY"
- [ ] **Status:** ❓ TO TEST

#### Test 4.2: Send Invoice Email
- [ ] **Action:** Open the test invoice created above
- [ ] **Action:** Click "Send Invoice" button
- [ ] **Expected:** Email sending process starts
- [ ] **Expected:** Success message appears
- [ ] **Expected:** Invoice status changes to "Sent"
- [ ] **Check:** Email contains professional formatting
- [ ] **Check:** Email includes banking details
- [ ] **Check:** Email includes payment link
- [ ] **Status:** ❓ TO TEST

#### Test 4.3: Verify Email Delivery
- [ ] **Action:** Check the recipient email inbox
- [ ] **Expected:** Invoice email received
- [ ] **Check:** Subject: "Invoice #XXXX - £1,200.00"
- [ ] **Check:** Professional HTML formatting
- [ ] **Check:** All invoice details present
- [ ] **Check:** Banking payment details included
- [ ] **Check:** "Pay Online" button works
- [ ] **Status:** ❓ TO TEST

---

### **Phase 5: Email Resending** 🔄

#### Test 5.1: Resend Email Function
- [ ] **Action:** From invoice detail view (status: Sent)
- [ ] **Action:** Click "Resend Invoice" button
- [ ] **Expected:** Confirmation dialog appears
- [ ] **Action:** Confirm resend
- [ ] **Expected:** Email resent successfully
- [ ] **Expected:** Success message appears
- [ ] **Status:** ❓ TO TEST

#### Test 5.2: Verify Resent Email
- [ ] **Action:** Check recipient email inbox again
- [ ] **Expected:** Second email received
- [ ] **Check:** Same professional formatting
- [ ] **Check:** All details identical to first email
- [ ] **Check:** Timestamp reflects resend time
- [ ] **Status:** ❓ TO TEST

---

### **Phase 6: Advanced Features** 🚀

#### Test 6.1: Multiple Invoice Management
- [ ] **Action:** Create 2-3 more test invoices
- [ ] **Action:** Test different statuses (Draft, Sent, Paid)
- [ ] **Action:** Use dashboard filters
- [ ] **Check:** Filtering by status works
- [ ] **Check:** Search by client name works
- [ ] **Status:** ❓ TO TEST

#### Test 6.2: Invoice Status Management
- [ ] **Action:** Mark a sent invoice as "Paid"
- [ ] **Expected:** Status updates successfully
- [ ] **Check:** Status badge changes color
- [ ] **Check:** Dashboard reflects new status
- [ ] **Status:** ❓ TO TEST

#### Test 6.3: Settings Configuration
- [ ] **Action:** Navigate to Settings page
- [ ] **Fill:** Company details
- [ ] **Fill:** Banking information
- [ ] **Save:** Configuration changes
- [ ] **Expected:** Settings saved successfully
- [ ] **Check:** New invoices use updated company info
- [ ] **Status:** ❓ TO TEST

---

### **Phase 7: Error Handling & Edge Cases** 🛡️

#### Test 7.1: Invalid Email Addresses
- [ ] **Action:** Try sending to invalid email
- [ ] **Expected:** Appropriate error message
- [ ] **Expected:** Invoice status remains unchanged
- [ ] **Status:** ❓ TO TEST

#### Test 7.2: Network Issues
- [ ] **Action:** Test with slow/intermittent connection
- [ ] **Expected:** Loading indicators show
- [ ] **Expected:** Graceful error messages
- [ ] **Expected:** Data persistence maintained
- [ ] **Status:** ❓ TO TEST

#### Test 7.3: Empty/Invalid Invoice Data
- [ ] **Action:** Try creating invoice with missing fields
- [ ] **Expected:** Validation errors appear
- [ ] **Expected:** Form prevents submission
- [ ] **Expected:** Helpful error messages
- [ ] **Status:** ❓ TO TEST

---

## 📊 Production Test Results Summary

### **Critical User Journey Tests:**
- [ ] Authentication: Registration & Login
- [ ] Invoice Creation: Form & Validation
- [ ] Email Sending: First Send
- [ ] Email Resending: Duplicate Send
- [ ] Dashboard Management: List & Filter

### **Success Criteria:**
- ✅ User can register and login successfully
- ✅ User can create invoices with complete data
- ✅ System can send professional emails to any address  
- ✅ Email resending works reliably
- ✅ All invoice data persists correctly

### **Performance Criteria:**
- ⚡ Page loads under 3 seconds
- ⚡ Email sending completes under 10 seconds
- ⚡ Invoice creation saves within 5 seconds

---

## 🎯 Production Issues Found & Next Steps

### **Issues Identified:**
1. **API Endpoints Not Accessible** - 404 errors on /api/invoices
2. **React App Not Loading** - Frontend shows basic HTML only  
3. **Routing Issues** - SPA routes not working properly

### **Recommended Fixes:**
1. **Redeploy with Latest Changes** - Ensure all API fixes are deployed
2. **Check Vercel Configuration** - Verify build and routing settings
3. **Test API Functions** - Ensure serverless functions are deployed properly

### **Manual Testing Status:**
🔴 **BLOCKED** - Cannot complete manual tests until production deployment issues are resolved.

**Next Action:** Fix production deployment, then re-run complete manual test suite.

---

*This guide covers the complete user journey from registration to email resending. Each test should be performed manually in the production environment to ensure all features work as expected for real users.*