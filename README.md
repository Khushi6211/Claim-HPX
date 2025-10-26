# HPX Travel Reimbursement System

## Project Overview
- **Name**: HPX Travel Reimbursement System
- **Goal**: Streamline the travel expense claim process for Hindustan Power Exchange employees by automating the Excel form generation
- **Features**:
  - Digital form matching HPX's official travel reimbursement format
  - **NEW** ✨ Auto-save drafts every 30 seconds
  - **NEW** ✨ Save and load reusable trip templates
  - **NEW** ✨ Upload receipt photos with OCR auto-extraction
  - Dynamic row addition for multiple journeys, hotels, conveyance, DA claims, and other expenses
  - Real-time total calculation with auto-updating grand total
  - Automatic amount-to-words conversion in Indian number system (Lakhs/Crores)
  - Excel file generation with proper formatting, borders, and company header
  - Pre-filled employee information for quick access
  - Mobile-responsive design using TailwindCSS

## URLs
- **Development**: https://3000-imj5aatue1j2tnx8l6w1r-b9b802c4.sandbox.novita.ai
- **Production**: (Pending Cloudflare deployment)
- **GitHub**: https://github.com/Khushi6211/Claim-HPX

## 🚀 NEW FEATURES (Just Added!)

### A) Save Drafts & Templates
- **Auto-Save**: Form automatically saves every 30 seconds to browser storage
- **Manual Save**: Click "Save Draft" button anytime
- **Load Draft**: Resume incomplete forms instantly
- **Templates**: Save common trips (Delhi-Mumbai, Delhi-Dehradun) as templates
- **Quick Reuse**: Load template and just update dates/amounts

### B) Receipt Upload
- **Drag & Drop**: Upload receipt photos directly in the form
- **Image Preview**: View receipts before submission  
- **Multiple Files**: Upload all bills at once (max 5MB each)
- **Storage**: Receipts stored in browser with draft
- **Full Screen View**: Click any receipt to view full size

### D) OCR Bill Scanning (AI-Powered)
- **Smart Extraction**: Automatically reads amount from receipt photos
- **Date Detection**: Extracts bill date automatically
- **One-Click Add**: OCR suggests which section to add the expense
- **Support**: Works with clear bills/receipts in English
- **Accuracy**: Best with printed receipts (GST bills, hotel invoices)

## Data Architecture
- **Data Models**: 
  - Employee Information (Name, Code, Designation, Department, Period, Purpose)
  - Journey Details (Departure/Arrival locations, dates, times, company arrangement, amounts)
  - Hotel Charges (Hotel name, place, period of stay, company arrangement, amounts)
  - Local Conveyance (Date, from/to locations, mode of travel, amounts)
  - DA Claims (Date, city name, allowance amounts)
  - Other Expenses (Date, particulars, amounts)
  - **NEW**: Drafts (Saved in browser localStorage)
  - **NEW**: Templates (Reusable trip patterns)
  - **NEW**: Receipts (Base64 encoded images in localStorage)
- **Storage Services**: Browser localStorage (no server storage, fully private)
- **OCR Engine**: Tesseract.js (runs in browser, no data sent to servers)
- **Data Flow**: 
  1. User fills form in browser
  2. Auto-save stores data every 30 seconds
  3. User can upload receipts → OCR extracts data
  4. JavaScript collects all form data
  5. Frontend sends JSON to backend API
  6. Backend generates Excel file using ExcelJS
  7. Excel file downloads to user's device

## User Guide

### Quick Start (New Features First!):

#### 📸 **Upload Receipts with OCR**:
1. Click the upload area or drag receipt photos
2. Wait for "Scanning receipt..." notification
3. OCR will auto-extract amount and suggest where to add
4. Click the section (Journey/Hotel/Conveyance/Other)
5. Amount auto-fills - just add other details!

#### 💾 **Save as Template**:
1. Fill out a common trip (e.g., Delhi-Mumbai)
2. Click "Save as Template"
3. Name it "Mumbai Trip" or "Dehradun Official"
4. Next time: Click "My Templates" → Load → Update dates only!

#### 🔄 **Auto-Save**:
- Form saves automatically every 30 seconds
- On page reload, you'll be asked to load your draft
- No more data loss!

### For Employees (Like Ashish Goel):
1. **Access the Application**: Open the URL in your browser
2. **Load Previous Draft** (if any): Click "Load Draft" to continue
3. **Or Load Template**: Click "My Templates" to start from a common trip

4. **Fill Employee Information**: 
   - Name, Employee Code, Designation are pre-filled for quick access
   - Update Period of Claim (e.g., "Dec-24")
   - Enter Purpose of Travel (e.g., "Mumbai - Client Meeting")

5. **Upload Receipts First** (Recommended New Way):
   - Upload all bills/receipts
   - Let OCR extract amounts automatically
   - Add to respective sections with one click
   - Much faster than manual entry!

6. **Add Journey Details** (or use OCR):
   - Click "Add Journey" button
   - Fill departure city, date, time
   - Fill arrival city, date, time
   - Select if arranged by company (Yes/No)
   - Enter amount (or let OCR fill it)
   - Add multiple journeys as needed

7. **Add Hotel Charges** (or use OCR):
   - Click "Add Hotel" button
   - Enter hotel name, place
   - Select if arranged by company
   - Enter period of stay (e.g., "15th-16th Dec")
   - Enter amount (or let OCR fill it)
   - Add multiple hotels as needed

8. **Add Local Conveyance** (or use OCR):
   - Click "Add Conveyance" button
   - Enter date, from location, to location
   - Enter mode (Auto/Taxi/Metro/Uber)
   - Enter amount (or let OCR fill it)
   - Add multiple entries as needed

9. **Add DA Claims** (if applicable):
   - Click "Add DA" button
   - Enter date and city name
   - Enter dearness allowance amount

10. **Add Other Expenses** (or use OCR):
    - Click "Add Expense" button
    - Enter date and particulars (Lunch/Dinner/etc.)
    - Mention if bill not available in particulars
    - Enter amount (or let OCR fill it)

11. **Save for Later** (Optional):
    - Click "Save Draft" to save manually
    - Or just close - auto-save has your back!

12. **Save as Template** (For recurring trips):
    - Click "Save as Template"
    - Name it meaningfully
    - Reuse next time!

13. **Review & Generate**:
    - Check the auto-calculated Grand Total
    - Review uploaded receipts
    - Click "Generate Excel File" button
    - Excel file will download automatically

14. **Submit to Finance**:
    - Print the generated Excel file
    - Attach all supporting bills physically
    - Submit to finance department

### Features That Make Your Life Easier:
- ✅ **Auto-save**: Never lose your work (saves every 30s)
- ✅ **OCR scanning**: Upload bill photo → amount auto-fills
- ✅ **Templates**: Save Delhi-Mumbai trip once, reuse forever
- ✅ **Receipt management**: All bills in one place
- ✅ **Auto-calculation**: All totals update automatically
- ✅ **Remove entries**: Click the ❌ icon to remove any entry
- ✅ **Indian format**: Amounts converted to words in Lakh/Crore format
- ✅ **Professional output**: Excel matches HPX's official format exactly
- ✅ **Mobile friendly**: Fill form on your phone during travel
- ✅ **Privacy**: All data stays in your browser, nothing sent to servers

## Technical Stack
- **Backend**: Hono (TypeScript) - Lightweight web framework
- **Frontend**: HTML5 + TailwindCSS + Vanilla JavaScript
- **Excel Generation**: ExcelJS library
- **OCR Engine**: Tesseract.js v5 (client-side OCR)
- **Storage**: Browser localStorage (no server storage)
- **Deployment**: Cloudflare Pages (edge-optimized)
- **Dev Server**: PM2 with Wrangler Pages Dev

## Deployment Status
- **Platform**: Cloudflare Pages
- **Status**: ✅ Active (Development with new features)
- **Tech Stack**: Hono + TypeScript + TailwindCSS + ExcelJS + Tesseract.js
- **Last Updated**: 2025-10-24

## Development Notes

### Local Development:
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start dev server with PM2
pm2 start ecosystem.config.cjs

# Check logs
pm2 logs hpx-travel-reimb --nostream

# Stop server
pm2 stop hpx-travel-reimb
```

### Deployment to Cloudflare Pages:
```bash
# Setup Cloudflare API key first
setup_cloudflare_api_key

# Build and deploy
npm run deploy:prod
```

## File Structure
```
webapp/
├── src/
│   └── index.tsx          # Main Hono application with Excel generation API
├── public/
│   └── static/
│       └── app.js         # Frontend JavaScript (drafts, OCR, templates, form)
├── ecosystem.config.cjs   # PM2 configuration
├── wrangler.jsonc        # Cloudflare configuration
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Current Features ✅
- Complete digital form matching HPX format
- All sections: Journey, Hotel, Conveyance, DA, Other Expenses
- Dynamic row addition/removal
- Real-time total calculations
- Excel file generation with proper formatting
- Indian Rupee formatting
- Amount to words conversion (Lakh/Crore system)
- Mobile responsive design
- Pre-filled employee data for quick access
- **NEW** ✨ Auto-save drafts (every 30s)
- **NEW** ✨ Manual save/load draft
- **NEW** ✨ Save and load reusable templates
- **NEW** ✨ Upload receipt photos
- **NEW** ✨ OCR bill scanning (auto-extract amount & date)
- **NEW** ✨ Receipt preview and management
- **NEW** ✨ Full-screen receipt viewer
- **NEW** ✨ Toast notifications for user feedback

## Features Not Yet Implemented 📋
- User authentication/login system
- Cloud storage for receipts (currently browser-only)
- History of past claims
- Email submission to finance department
- PDF generation option
- Manager approval workflow
- Integration with HRMS
- Multi-currency support (for international travel)
- Mileage calculator
- Policy compliance checker

## OCR Best Practices
For best OCR results:
1. **Good Lighting**: Take photos in well-lit conditions
2. **Clear Image**: Ensure text is readable
3. **Straight Angle**: Hold phone parallel to bill
4. **GST Bills**: Work best (clear formatting)
5. **Hotel Invoices**: Usually scan perfectly
6. **Hand-written Bills**: May need manual entry
7. **File Size**: Keep under 5MB for fast processing

## Recommended Next Steps
1. **User Testing**: Get feedback from Ashish and other BD team members
2. **Cloudflare Deployment**: Deploy to production with proper domain
3. **GitHub Push**: Version control and collaboration
4. **Cloud Storage**: Move receipts to cloud (optional, if needed)
5. **Email Integration**: Auto-send to finance department
6. **Mobile App**: Convert to PWA for offline access during travel
7. **PDF Support**: Add PDF generation alongside Excel
8. **Approval Workflow**: Add HOD approval mechanism
9. **Analytics**: Track expense patterns and provide insights

## Changelog

### v2.0.0 (2025-10-24) - Major Feature Update
- ✨ Added auto-save functionality (every 30 seconds)
- ✨ Added manual save/load draft feature
- ✨ Added template system for recurring trips
- ✨ Added receipt photo upload
- ✨ Added OCR bill scanning with Tesseract.js
- ✨ Added toast notifications
- ✨ Added receipt preview and management
- ✨ Added full-screen receipt viewer
- 🎨 Updated UI with Quick Actions bar
- 🎨 Added Templates modal
- 🎨 Added Receipt upload section
- 📝 Updated README with comprehensive guide

### v1.0.0 (2025-10-23) - Initial Release
- Basic travel reimbursement form
- Excel file generation
- All expense sections
- Real-time calculations
- Mobile responsive design

## Notes
- One claim form per round trip (as per company policy)
- Enter "NIL" or 0 for company-arranged travel/hotel
- Always attach supporting bills with physical printout
- Keep the Excel file name format: `Travel_Reimbursement_[Name]_[Period].xlsx`
- Drafts and templates are stored locally in your browser
- Clear browser data will erase saved drafts/templates
- OCR works best with printed receipts in good lighting

## Browser Compatibility
- Chrome/Edge: ✅ Full support (recommended)
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS/macOS)
- Opera: ✅ Full support
- Internet Explorer: ❌ Not supported

## Privacy & Security
- **No Server Storage**: All data stays in your browser
- **LocalStorage Only**: Drafts, templates, receipts stored locally
- **OCR Processing**: Happens in browser, no images sent to servers
- **Excel Generation**: Server-side, but data not stored
- **No Tracking**: No analytics or third-party trackers
- **HTTPS**: Secure connection for all API calls

---

**Built with efficiency in mind for the power sector's business development professionals.**
**Turning hours of form-filling into minutes of productivity.**
**Now with AI-powered OCR and smart templates!** ⚡📸✨
