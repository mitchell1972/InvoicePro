# Invoice Creation & Viewing Test Plan

## Test Scenarios

### 1. Invoice Form Validation
- [ ] Test empty form submission
- [ ] Test missing client name
- [ ] Test missing client email
- [ ] Test invalid email format
- [ ] Test empty line items
- [ ] Test invalid quantities/prices

### 2. Draft Invoice Creation
- [ ] Create invoice with valid data
- [ ] Verify invoice gets Draft status
- [ ] Check invoice appears in dashboard
- [ ] Verify invoice ID generation
- [ ] Test navigation to detail page

### 3. Draft Invoice Viewing
- [ ] Open draft invoice from dashboard
- [ ] Verify all data displays correctly
- [ ] Check Draft status badge
- [ ] Verify action buttons (Preview Email, Send Invoice, Edit)

### 4. Data Persistence
- [ ] Create invoice and refresh page
- [ ] Verify invoice persists in localStorage/memory
- [ ] Test multiple invoice creation
- [ ] Check sequential ID generation

### 5. Error Handling
- [ ] Test invalid invoice ID access
- [ ] Test network failures
- [ ] Test malformed data handling

## Expected Results
- Invoice creation should be seamless
- Draft invoices should save properly
- Navigation should work correctly
- Data should persist appropriately
- Error states should be handled gracefully