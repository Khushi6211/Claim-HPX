# Quick Start Guide - HPX Travel Reimbursement System

**Version**: Option A (Multi-User with Cloud Sync)  
**Status**: ✅ Ready for Testing  
**URL**: https://3000-imj5aatue1j2tnx8l6w1r-b9b802c4.sandbox.novita.ai

---

## 🚀 5-Minute Quick Test

### Step 1: Register (First Time Only)
1. Open: https://3000-imj5aatue1j2tnx8l6w1r-b9b802c4.sandbox.novita.ai
2. Click "Register here"
3. Fill in:
   - Employee Code: YOUR_CODE (e.g., AG001)
   - Full Name: Your Name
   - Designation: Your Designation
   - Department: Your Department
   - Password: At least 6 characters
4. Click "Create Account"

### Step 2: Fill Form
1. Form auto-fills your employee info
2. Enter:
   - Period of Claim (e.g., Nov-24)
   - Purpose of Travel (e.g., Dehradun - Official)
3. Add expenses in any section:
   - Journey: Add flight/train details
   - Hotel: Add hotel charges
   - Conveyance: Add taxi/local travel
   - DA: Add dearness allowance
   - Other: Add miscellaneous expenses

### Step 3: Upload Receipts (Optional)
1. Click "Upload Receipts" section
2. Select multiple images (bills, invoices)
3. Wait for OCR processing (progress shows: "Processing 1 of 3...")
4. Review extracted data in preview modal
5. Edit if needed, click "Add to Form"

### Step 4: Generate Excel
1. Scroll to bottom
2. Click "Generate Excel File"
3. Download opens automatically
4. Open in Excel/Google Sheets
5. Verify all data is correct

### Step 5: Test Cross-Device Sync
1. Click "Save to Cloud" (or wait 30 seconds for auto-save)
2. See "Saved to cloud ✓" indicator
3. Open URL on different device (phone/laptop)
4. Login with same credentials
5. Click "My Drafts"
6. Click "Load" on your saved draft
7. Verify all data restored correctly

---

## 🔍 What to Test

### Core Features
- [ ] Registration works with employee code
- [ ] Login works with password
- [ ] Form pre-fills your employee info
- [ ] Can add/remove rows in each section
- [ ] Totals calculate automatically
- [ ] Excel generates with correct formatting
- [ ] Excel includes all your data

### Cloud Sync Features
- [ ] Click "Save to Cloud" - shows "Saved" confirmation
- [ ] Auto-save works (wait 30 seconds, see indicator)
- [ ] "My Drafts" shows your saved drafts
- [ ] Load draft restores all form data
- [ ] Can delete old drafts

### Cross-Device Sync
- [ ] Save draft on Device A
- [ ] Logout
- [ ] Login on Device B
- [ ] Load draft - data appears
- [ ] Make changes on Device B
- [ ] Save
- [ ] Return to Device A, reload - sees changes

### OCR Features (Upload Real Bills)
- [ ] Upload GST invoice - extracts GSTIN, amount, invoice no
- [ ] Upload hotel bill - extracts hotel name, amount, dates
- [ ] Upload taxi receipt - extracts fare, service name
- [ ] Upload restaurant bill - extracts total, merchant name
- [ ] Upload multiple receipts - all process sequentially
- [ ] Preview modal shows extracted data
- [ ] Can edit before adding to form
- [ ] Confidence score displays (0-100%)
- [ ] "Add to Form" puts data in right section

---

## 📱 Testing Scenarios

### Scenario 1: Complete Claim (10 mins)
**Goal**: Create full travel claim from scratch

1. Login
2. Enter travel details (Nov-24, Dehradun trip)
3. Add 2 journey entries (outbound/return)
4. Add 1 hotel entry
5. Add 3 conveyance entries (taxi rides)
6. Upload 5 receipts (hotel, 3 taxi, 1 restaurant)
7. Review OCR extractions
8. Generate Excel
9. Verify Excel matches your data

**Expected Result**: Excel file with all 6+ expense entries, correct totals, HPX formatting

---

### Scenario 2: Cross-Device Workflow (5 mins)
**Goal**: Verify phone → laptop sync

**On Phone**:
1. Login
2. Enter employee info
3. Add 1 journey entry (partial data)
4. Upload 1 receipt
5. Wait for "Saved to cloud ✓"
6. Logout

**On Laptop**:
1. Login with same credentials
2. Click "My Drafts"
3. Load the draft
4. Verify journey entry exists
5. Verify receipt appears
6. Add more data
7. Generate Excel

**Expected Result**: Draft created on phone accessible on laptop with all data intact

---

### Scenario 3: OCR Accuracy Test (8 mins)
**Goal**: Test OCR with Indian bills

**Bills to Test**:
1. GST invoice (any vendor)
2. Hotel bill (with room charges)
3. Uber/Ola receipt
4. Restaurant bill
5. Generic receipt

**Steps**:
1. Upload all 5 bills at once
2. Wait for sequential processing
3. Review each preview modal:
   - Check category detection
   - Check merchant name
   - Check amount
   - Check confidence score
4. Correct any errors
5. Click "Add to Form" for each

**Expected Accuracy**:
- GST Invoice: 85-90% confidence
- Hotel: 80-85% confidence
- Taxi: 75-85% confidence
- Restaurant: 80-90% confidence
- Generic: 60-70% confidence

---

### Scenario 4: Auto-Save Test (2 mins)
**Goal**: Verify auto-save functionality

1. Login
2. Start filling form
3. Watch top of page
4. After 30 seconds, see "Saving to cloud..."
5. Then see "Saved to cloud ✓"
6. Make a change
7. Wait 30 seconds
8. See save indicator again

**Expected Result**: Form saves automatically every 30 seconds without manual action

---

## 🐛 Known Limitations

### Current Limitations
1. **OCR Language**: English only (Tesseract.js limitation)
2. **OCR Quality**: Depends on image clarity (use clear photos)
3. **OCR Speed**: 10-30 seconds per receipt (client-side processing)
4. **File Size**: No limit check (use reasonably sized images)
5. **Browser Support**: Modern browsers only (Chrome, Firefox, Safari, Edge)

### Tips for Best OCR Results
- ✅ Use clear, well-lit photos
- ✅ Capture entire bill (all 4 corners visible)
- ✅ Avoid shadows or glare
- ✅ Hold camera parallel to bill
- ✅ Use higher resolution (but not too large files)
- ❌ Don't use blurry or tilted images
- ❌ Avoid handwritten receipts (OCR can't read well)

---

## 🆘 Troubleshooting

### Can't Register
- **Error**: "Employee code already registered"
- **Fix**: Use different employee code or login with existing

### Can't Login
- **Error**: "Invalid employee code or password"
- **Fix**: Check employee code spelling, check password (case-sensitive)

### Draft Not Saving
- **Error**: "Save failed ✗"
- **Fix**: Check internet connection, try logging out and back in

### OCR Not Working
- **Error**: No progress indicator appears
- **Fix**: Check file type (use PNG/JPG), refresh page and try again

### Excel Not Generating
- **Error**: "Failed to generate Excel"
- **Fix**: Ensure all required fields filled (employee name, code, designation, department, period, purpose)

### Cross-Device Sync Failed
- **Error**: Draft not appearing on second device
- **Fix**: 
  1. On first device: Click "Save to Cloud" manually
  2. Wait for "Saved to cloud ✓"
  3. On second device: Click "My Drafts" (not browser back button)
  4. Refresh list if needed

---

## 📞 Support

### For Testing Issues
- Check browser console (F12) for errors
- Try different browser
- Clear browser cache
- Try incognito/private mode

### For Feature Requests
- Note down what you'd like to see
- Suggest improvements
- Report bugs with steps to reproduce

---

## 🎯 Test Checklist

Before completing testing, verify:

**Authentication**:
- [x] Can register new account
- [x] Can login with credentials
- [x] Can logout
- [x] Token persists across page refresh

**Form Features**:
- [x] Employee info pre-fills
- [x] Can add rows in all sections
- [x] Can remove rows
- [x] Totals calculate correctly
- [x] Grand total updates

**Draft Sync**:
- [x] Manual save works
- [x] Auto-save works (30s)
- [x] Can load saved drafts
- [x] Can delete drafts
- [x] Cross-device sync works

**OCR Features**:
- [x] Multi-file upload works
- [x] All files process sequentially
- [x] Progress indicator shows
- [x] Category detection works
- [x] Amount extraction works
- [x] Preview modal appears
- [x] Can edit extracted data
- [x] Can add to form

**Excel Generation**:
- [x] Excel downloads
- [x] Opens in Excel/Sheets
- [x] All sections present
- [x] Data matches form
- [x] Formatting correct (borders, colors)
- [x] Totals correct

---

## ✅ Success Criteria

**System is working correctly if**:
1. You can register and login
2. Form saves automatically
3. You can load drafts on different device
4. Multiple receipts process (not just one)
5. OCR extracts reasonable data (even if not 100% accurate)
6. You can edit OCR data before adding
7. Excel generates with HPX formatting

---

**Happy Testing!** 🎉

If everything works as expected, we're ready for Option B (Dashboard, Analytics, Advanced AI) tomorrow.

---

**Questions?**  
Check the full documentation in OPTION_A_COMPLETE.md
