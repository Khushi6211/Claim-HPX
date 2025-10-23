# HPX Travel Reimbursement System

## Project Overview
- **Name**: HPX Travel Reimbursement System
- **Goal**: Streamline the travel expense claim process for Hindustan Power Exchange employees by automating the Excel form generation
- **Features**:
  - Digital form matching HPX's official travel reimbursement format
  - Dynamic row addition for multiple journeys, hotels, conveyance, DA claims, and other expenses
  - Real-time total calculation with auto-updating grand total
  - Automatic amount-to-words conversion in Indian number system (Lakhs/Crores)
  - Excel file generation with proper formatting, borders, and company header
  - Pre-filled employee information for quick access
  - Mobile-responsive design using TailwindCSS

## URLs
- **Development**: https://3000-imj5aatue1j2tnx8l6w1r-b9b802c4.sandbox.novita.ai
- **GitHub**: (To be added after GitHub push)

## Data Architecture
- **Data Models**: 
  - Employee Information (Name, Code, Designation, Department, Period, Purpose)
  - Journey Details (Departure/Arrival locations, dates, times, company arrangement, amounts)
  - Hotel Charges (Hotel name, place, period of stay, company arrangement, amounts)
  - Local Conveyance (Date, from/to locations, mode of travel, amounts)
  - DA Claims (Date, city name, allowance amounts)
  - Other Expenses (Date, particulars, amounts)
- **Storage Services**: None (stateless application - all data processing happens client-side and in-memory)
- **Data Flow**: 
  1. User fills form in browser
  2. JavaScript collects all form data
  3. Frontend sends JSON to backend API
  4. Backend generates Excel file using ExcelJS
  5. Excel file downloads to user's device

## User Guide

### For Employees (Like Ashish Goel):
1. **Access the Application**: Open the URL in your browser
2. **Fill Employee Information**: 
   - Name, Employee Code, Designation are pre-filled for quick access
   - Update Period of Claim (e.g., "Dec-24")
   - Enter Purpose of Travel (e.g., "Mumbai - Client Meeting")

3. **Add Journey Details**:
   - Click "Add Journey" button
   - Fill departure city, date, time
   - Fill arrival city, date, time
   - Select if arranged by company (Yes/No)
   - Enter amount (enter 0 or NIL if company arranged)
   - Add multiple journeys as needed

4. **Add Hotel Charges**:
   - Click "Add Hotel" button
   - Enter hotel name, place
   - Select if arranged by company
   - Enter period of stay (e.g., "15th-16th Dec")
   - Enter amount
   - Add multiple hotels as needed

5. **Add Local Conveyance**:
   - Click "Add Conveyance" button
   - Enter date, from location, to location
   - Enter mode (Auto/Taxi/Metro/Uber)
   - Enter amount
   - Add multiple entries as needed

6. **Add DA Claims** (if applicable):
   - Click "Add DA" button
   - Enter date and city name
   - Enter dearness allowance amount

7. **Add Other Expenses**:
   - Click "Add Expense" button
   - Enter date and particulars (Lunch/Dinner/etc.)
   - Mention if bill not available in particulars
   - Enter amount

8. **Review & Generate**:
   - Check the auto-calculated Grand Total
   - Click "Generate Excel File" button
   - Excel file will download automatically

9. **Submit to Finance**:
   - Print the generated Excel file
   - Attach all supporting bills physically
   - Submit to finance department

### Features That Make Your Life Easier:
- ✅ **Auto-calculation**: All totals update automatically as you enter amounts
- ✅ **Remove entries**: Click the ❌ icon to remove any entry
- ✅ **Indian format**: Amounts converted to words in Lakh/Crore format
- ✅ **Professional output**: Excel matches HPX's official format exactly
- ✅ **Mobile friendly**: Fill form on your phone during travel
- ✅ **No data loss**: All data stays in your browser until you generate the file

## Technical Stack
- **Backend**: Hono (TypeScript) - Lightweight web framework
- **Frontend**: HTML5 + TailwindCSS + Vanilla JavaScript
- **Excel Generation**: ExcelJS library
- **Deployment**: Cloudflare Pages (edge-optimized)
- **Dev Server**: PM2 with Wrangler Pages Dev

## Deployment Status
- **Platform**: Cloudflare Pages
- **Status**: ✅ Active (Development)
- **Tech Stack**: Hono + TypeScript + TailwindCSS + ExcelJS
- **Last Updated**: 2025-10-23

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
│       └── app.js         # Frontend JavaScript (form handling, calculations)
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
- Pre-filled employee data for testing

## Features Not Yet Implemented 📋
- User authentication/login system
- Saved drafts functionality
- History of past claims
- Email submission to finance department
- PDF generation option
- Bulk upload of bills/receipts
- Manager approval workflow
- Integration with HRMS

## Recommended Next Steps
1. **User Testing**: Get feedback from Ashish and other BD team members
2. **Authentication**: Add login system if multiple employees will use it
3. **Cloud Storage**: Store generated files in cloud if needed
4. **Email Integration**: Auto-send to finance department
5. **Mobile App**: Convert to PWA for offline access during travel
6. **PDF Support**: Add PDF generation alongside Excel
7. **Receipt Upload**: Allow uploading supporting bills directly
8. **Approval Workflow**: Add HOD approval mechanism

## Notes
- One claim form per round trip (as per company policy)
- Enter "NIL" or 0 for company-arranged travel/hotel
- Always attach supporting bills with physical printout
- Keep the Excel file name format: `Travel_Reimbursement_[Name]_[Period].xlsx`

---

**Built with efficiency in mind for the power sector's business development professionals.**
**Turning hours of form-filling into minutes of productivity.**
