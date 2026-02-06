# Test Data Sample for New Tour Allowance Format

Use this JSON structure to test the `/api/generate-excel` endpoint.

## Complete Test Data

```json
{
  "employeeName": "Ashish Goel",
  "designation": "Deputy Manager Business Development",
  "employeeCode": "HPX001",
  "grade": "E2",
  "department": "Business Development",
  "dateOfClaim": "2025-10-28",
  
  "miscExpenses": [
    {
      "sno": 1,
      "particulars": "Mobile recharge for official calls",
      "amount": 500
    },
    {
      "sno": 2,
      "particulars": "Internet charges",
      "amount": 800
    }
  ],
  
  "journeys": [
    {
      "departureDate": "2025-10-15",
      "departureTime": "08:30",
      "departureStation": "New Delhi",
      "arrivalDate": "2025-10-15",
      "arrivalTime": "10:45",
      "arrivalStation": "Mumbai Central",
      "modeClass": "Flight - Economy",
      "trainNo": "AI 101",
      "purpose": "Client meeting with Tata Power",
      "amount": 8500,
      "ticketNo": "AI-2025-1015-001",
      "remarks": "Advance booking discount"
    },
    {
      "departureDate": "2025-10-18",
      "departureTime": "18:00",
      "departureStation": "Mumbai Central",
      "arrivalDate": "2025-10-18",
      "arrivalTime": "20:15",
      "arrivalStation": "New Delhi",
      "modeClass": "Flight - Economy",
      "trainNo": "AI 202",
      "purpose": "Return journey",
      "amount": 9000,
      "ticketNo": "AI-2025-1018-002",
      "remarks": ""
    }
  ],
  
  "daDetails": [
    {
      "cityType": "Principal City",
      "station": "Mumbai",
      "dates": "15-Oct to 18-Oct",
      "daysForDA": 3,
      "ratePerDay": 1000,
      "hotelName": "The Taj Hotel",
      "hotelAmount": 12000,
      "sharedWith": ""
    },
    {
      "cityType": "Journey",
      "station": "In Transit",
      "dates": "15-Oct, 18-Oct",
      "daysForDA": 2,
      "ratePerDay": 500,
      "hotelName": "",
      "hotelAmount": 0,
      "sharedWith": ""
    }
  ],
  
  "conveyances": [
    {
      "date": "2025-10-15",
      "station": "Mumbai",
      "placeFrom": "Airport",
      "placeTo": "The Taj Hotel",
      "distanceKm": 25,
      "meansOfTravel": "Taxi",
      "amount": 800,
      "purpose": "Airport to hotel transfer"
    },
    {
      "date": "2025-10-16",
      "station": "Mumbai",
      "placeFrom": "Hotel",
      "placeTo": "Tata Power Office",
      "distanceKm": 15,
      "meansOfTravel": "Uber",
      "amount": 450,
      "purpose": "Client meeting"
    },
    {
      "date": "2025-10-16",
      "station": "Mumbai",
      "placeFrom": "Tata Power Office",
      "placeTo": "Hotel",
      "distanceKm": 15,
      "meansOfTravel": "Uber",
      "amount": 450,
      "purpose": "Return to hotel"
    },
    {
      "date": "2025-10-18",
      "station": "Mumbai",
      "placeFrom": "Hotel",
      "placeTo": "Airport",
      "distanceKm": 25,
      "meansOfTravel": "Taxi",
      "amount": 850,
      "purpose": "Hotel to airport transfer"
    }
  ],
  
  "advanceDrawn": 15000
}
```

## Expected Calculations

Based on above data:

| Section | Calculation | Amount |
|---------|-------------|--------|
| Journey Fares (III) | 8,500 + 9,000 | ₹17,500 |
| Misc + Conveyance (II + V) | (500 + 800) + (800 + 450 + 450 + 850) | ₹3,850 |
| Accommodation (IV) | 12,000 | ₹12,000 |
| Daily Allowance (IV) | (3 × 1,000) + (2 × 500) | ₹4,000 |
| **Total (A)** | | **₹37,350** |
| Advance Drawn (B) | | ₹15,000 |
| **Net Claim (A-B)** | | **₹22,350** |

## How to Test

### Using curl:

```bash
# Save above JSON to file
cat > test-data.json << 'EOF'
{
  "employeeName": "Ashish Goel",
  "designation": "Deputy Manager Business Development",
  ...
}
EOF

# Generate Excel
curl -X POST https://hpx-travel-reimb.pages.dev/api/generate-excel \
  -H "Content-Type: application/json" \
  -d @test-data.json \
  --output test_tour_allowance.xlsx

# Open the Excel file
# Verify all sections populated correctly
```

### Using Postman:

1. Create new POST request
2. URL: `https://hpx-travel-reimb.pages.dev/api/generate-excel`
3. Headers: `Content-Type: application/json`
4. Body: Raw JSON (paste above)
5. Send
6. Save response as .xlsx file

### Expected Excel Output:

**Header:**
- Title: "TOUR TRAVELING ALLOWANCE CLAIM"
- Name: Ashish Goel
- Designation: Deputy Manager Business Development
- Emp. ID: HPX001
- Grade: E2
- Department: Business Development  
- Date: 2025-10-28

**Section I: Totals**
- Journey Fares: ₹17,500
- Conveyance & Misc: ₹3,850
- Accommodation: ₹12,000
- Daily Allowance: ₹4,000
- Total: ₹37,350
- Advance: ₹15,000
- **Net Claim: ₹22,350**

**Section II: 2 miscellaneous expenses**
**Section III: 2 journeys (Delhi-Mumbai, Mumbai-Delhi)**
**Section IV: 2 DA entries (Principal City + Journey)**
**Section V: 4 conveyance entries**

## Minimal Test Data

For quick testing, use this minimal version:

```json
{
  "employeeName": "Test User",
  "designation": "Manager",
  "employeeCode": "TEST001",
  "grade": "E1",
  "department": "Testing",
  "dateOfClaim": "2025-10-28",
  "miscExpenses": [{"sno": 1, "particulars": "Test expense", "amount": 100}],
  "journeys": [{"departureDate": "2025-10-15", "departureTime": "09:00", "departureStation": "Delhi", "arrivalDate": "2025-10-15", "arrivalTime": "11:00", "arrivalStation": "Mumbai", "modeClass": "Train", "trainNo": "12345", "purpose": "Test", "amount": 1000, "ticketNo": "TKT001", "remarks": ""}],
  "daDetails": [{"cityType": "Principal City", "station": "Mumbai", "dates": "15-Oct", "daysForDA": 1, "ratePerDay": 500, "hotelName": "Test Hotel", "hotelAmount": 2000, "sharedWith": ""}],
  "conveyances": [{"date": "2025-10-15", "station": "Mumbai", "placeFrom": "A", "placeTo": "B", "distanceKm": 10, "meansOfTravel": "Taxi", "amount": 200, "purpose": "Test"}],
  "advanceDrawn": 1000
}
```

Expected Net Claim: ₹2,800 (1,000 + 100 + 200 + 500 + 2,000 - 1,000)

## Validation Rules

### Required Fields:
- employeeName, designation, employeeCode, department, dateOfClaim
- Each section array can be empty but must exist

### Optional Fields:
- grade (defaults to empty)
- advanceDrawn (defaults to 0)
- Various "remarks" and similar fields

### Amount Fields:
- All amounts are numbers (not strings)
- Can be 0 or positive
- Negative amounts not validated (but unusual)

### Date Format:
- Dates: YYYY-MM-DD (e.g., "2025-10-15")
- Times: HH:MM (e.g., "09:30")

## Security Note

All inputs are sanitized before Excel generation:
- Values starting with `=`, `+`, `-`, `@` are prepended with `'` to prevent formula injection
- Filenames are sanitized to prevent header injection
- No execution of formulas or scripts possible

## Testing Checklist

- [ ] Test with full data (above)
- [ ] Test with minimal data
- [ ] Test with empty arrays
- [ ] Test with special characters in names
- [ ] Test with formula injection attempts (`=SUM(1+1)`)
- [ ] Verify all sections appear in Excel
- [ ] Verify calculations are correct
- [ ] Verify formatting matches template
- [ ] Verify file downloads correctly
- [ ] Verify filename is sanitized

---

**All tests should pass with the new secure backend!** ✅
