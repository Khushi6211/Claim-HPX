// Journey counter
let journeyCount = 0;
let hotelCount = 0;
let conveyanceCount = 0;
let daCount = 0;
let otherCount = 0;

// Number to words conversion
function numberToWords(num) {
    const a = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
        'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    function convertLessThanThousand(n) {
        if (n === 0) return '';
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
        return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    }
    
    if (num < 1000) return convertLessThanThousand(num);
    if (num < 100000) {
        return convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand' +
            (num % 1000 !== 0 ? ' ' + convertLessThanThousand(num % 1000) : '');
    }
    if (num < 10000000) {
        return convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh' +
            (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
    }
    return convertLessThanThousand(Math.floor(num / 10000000)) + ' Crore' +
        (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
}

// Calculate totals
function calculateTotals() {
    // Journey Total
    let journeyTotal = 0;
    document.querySelectorAll('.journey-amount').forEach(input => {
        journeyTotal += parseFloat(input.value) || 0;
    });
    document.getElementById('journeyTotal').textContent = journeyTotal.toFixed(2);
    
    // Hotel Total
    let hotelTotal = 0;
    document.querySelectorAll('.hotel-amount').forEach(input => {
        hotelTotal += parseFloat(input.value) || 0;
    });
    document.getElementById('hotelTotal').textContent = hotelTotal.toFixed(2);
    
    // Conveyance Total
    let conveyanceTotal = 0;
    document.querySelectorAll('.conveyance-amount').forEach(input => {
        conveyanceTotal += parseFloat(input.value) || 0;
    });
    document.getElementById('conveyanceTotal').textContent = conveyanceTotal.toFixed(2);
    
    // DA Total
    let daTotal = 0;
    document.querySelectorAll('.da-amount').forEach(input => {
        daTotal += parseFloat(input.value) || 0;
    });
    document.getElementById('daTotal').textContent = daTotal.toFixed(2);
    
    // Other Total
    let otherTotal = 0;
    document.querySelectorAll('.other-amount').forEach(input => {
        otherTotal += parseFloat(input.value) || 0;
    });
    document.getElementById('otherTotal').textContent = otherTotal.toFixed(2);
    
    // Grand Total
    const grandTotal = journeyTotal + hotelTotal + conveyanceTotal + daTotal + otherTotal;
    document.getElementById('grandTotal').textContent = grandTotal.toFixed(2);
}

// Add Journey
function addJourney() {
    journeyCount++;
    const container = document.getElementById('journeyContainer');
    const journeyDiv = document.createElement('div');
    journeyDiv.className = 'journey-item bg-gray-50 p-4 rounded-lg mb-4 relative';
    journeyDiv.innerHTML = `
        <button type="button" onclick="removeItem(this)" 
            class="absolute top-2 right-2 text-red-500 hover:text-red-700">
            <i class="fas fa-times-circle text-xl"></i>
        </button>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Departure From</label>
                <input type="text" class="journey-from w-full px-3 py-2 text-sm border border-gray-300 rounded-md" placeholder="City">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Departure Date</label>
                <input type="date" class="journey-dep-date w-full px-3 py-2 text-sm border border-gray-300 rounded-md">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Departure Time</label>
                <input type="time" class="journey-dep-time w-full px-3 py-2 text-sm border border-gray-300 rounded-md">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Arrived At</label>
                <input type="text" class="journey-to w-full px-3 py-2 text-sm border border-gray-300 rounded-md" placeholder="City">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Arrival Date</label>
                <input type="date" class="journey-arr-date w-full px-3 py-2 text-sm border border-gray-300 rounded-md">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Arrival Time</label>
                <input type="time" class="journey-arr-time w-full px-3 py-2 text-sm border border-gray-300 rounded-md">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Arranged By Company</label>
                <select class="journey-arranged w-full px-3 py-2 text-sm border border-gray-300 rounded-md">
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" step="0.01" class="journey-amount w-full px-3 py-2 text-sm border border-gray-300 rounded-md" 
                    placeholder="0.00" oninput="calculateTotals()">
            </div>
        </div>
    `;
    container.appendChild(journeyDiv);
}

// Add Hotel
function addHotel() {
    hotelCount++;
    const container = document.getElementById('hotelContainer');
    const hotelDiv = document.createElement('div');
    hotelDiv.className = 'hotel-item bg-gray-50 p-4 rounded-lg mb-4 relative';
    hotelDiv.innerHTML = `
        <button type="button" onclick="removeItem(this)" 
            class="absolute top-2 right-2 text-red-500 hover:text-red-700">
            <i class="fas fa-times-circle text-xl"></i>
        </button>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Hotel Name</label>
                <input type="text" class="hotel-name w-full px-3 py-2 text-sm border border-gray-300 rounded-md" placeholder="Hotel name">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Place</label>
                <input type="text" class="hotel-place w-full px-3 py-2 text-sm border border-gray-300 rounded-md" placeholder="City">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Arranged By Company</label>
                <select class="hotel-arranged w-full px-3 py-2 text-sm border border-gray-300 rounded-md">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Period of Stay</label>
                <input type="text" class="hotel-period w-full px-3 py-2 text-sm border border-gray-300 rounded-md" 
                    placeholder="e.g., 28th-29th Nov">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" step="0.01" class="hotel-amount w-full px-3 py-2 text-sm border border-gray-300 rounded-md" 
                    placeholder="0.00" oninput="calculateTotals()">
            </div>
        </div>
    `;
    container.appendChild(hotelDiv);
}

// Add Conveyance
function addConveyance() {
    conveyanceCount++;
    const container = document.getElementById('conveyanceContainer');
    const convDiv = document.createElement('div');
    convDiv.className = 'conveyance-item bg-gray-50 p-4 rounded-lg mb-4 relative';
    convDiv.innerHTML = `
        <button type="button" onclick="removeItem(this)" 
            class="absolute top-2 right-2 text-red-500 hover:text-red-700">
            <i class="fas fa-times-circle text-xl"></i>
        </button>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input type="date" class="conv-date w-full px-3 py-2 text-sm border border-gray-300 rounded-md">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">From</label>
                <input type="text" class="conv-from w-full px-3 py-2 text-sm border border-gray-300 rounded-md" placeholder="Location">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">To</label>
                <input type="text" class="conv-to w-full px-3 py-2 text-sm border border-gray-300 rounded-md" placeholder="Location">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Mode of Travel</label>
                <input type="text" class="conv-mode w-full px-3 py-2 text-sm border border-gray-300 rounded-md" 
                    placeholder="Auto/Taxi/Metro">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" step="0.01" class="conveyance-amount w-full px-3 py-2 text-sm border border-gray-300 rounded-md" 
                    placeholder="0.00" oninput="calculateTotals()">
            </div>
        </div>
    `;
    container.appendChild(convDiv);
}

// Add DA
function addDA() {
    daCount++;
    const container = document.getElementById('daContainer');
    const daDiv = document.createElement('div');
    daDiv.className = 'da-item bg-gray-50 p-4 rounded-lg mb-4 relative';
    daDiv.innerHTML = `
        <button type="button" onclick="removeItem(this)" 
            class="absolute top-2 right-2 text-red-500 hover:text-red-700">
            <i class="fas fa-times-circle text-xl"></i>
        </button>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input type="date" class="da-date w-full px-3 py-2 text-sm border border-gray-300 rounded-md">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">City Name</label>
                <input type="text" class="da-city w-full px-3 py-2 text-sm border border-gray-300 rounded-md" placeholder="City">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">DA Amount (₹)</label>
                <input type="number" step="0.01" class="da-amount w-full px-3 py-2 text-sm border border-gray-300 rounded-md" 
                    placeholder="0.00" oninput="calculateTotals()">
            </div>
        </div>
    `;
    container.appendChild(daDiv);
}

// Add Other Expense
function addOther() {
    otherCount++;
    const container = document.getElementById('otherContainer');
    const otherDiv = document.createElement('div');
    otherDiv.className = 'other-item bg-gray-50 p-4 rounded-lg mb-4 relative';
    otherDiv.innerHTML = `
        <button type="button" onclick="removeItem(this)" 
            class="absolute top-2 right-2 text-red-500 hover:text-red-700">
            <i class="fas fa-times-circle text-xl"></i>
        </button>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input type="date" class="other-date w-full px-3 py-2 text-sm border border-gray-300 rounded-md">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Particulars</label>
                <input type="text" class="other-particulars w-full px-3 py-2 text-sm border border-gray-300 rounded-md" 
                    placeholder="e.g., Lunch, Dinner">
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" step="0.01" class="other-amount w-full px-3 py-2 text-sm border border-gray-300 rounded-md" 
                    placeholder="0.00" oninput="calculateTotals()">
            </div>
        </div>
    `;
    container.appendChild(otherDiv);
}

// Remove item
function removeItem(button) {
    button.closest('.journey-item, .hotel-item, .conveyance-item, .da-item, .other-item').remove();
    calculateTotals();
}

// Form submission
document.getElementById('reimbursementForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading overlay
    document.getElementById('loadingOverlay').classList.remove('hidden');
    
    // Collect form data
    const formData = {
        employeeName: document.getElementById('employeeName').value,
        employeeCode: document.getElementById('employeeCode').value,
        designation: document.getElementById('designation').value,
        department: document.getElementById('department').value,
        periodOfClaim: document.getElementById('periodOfClaim').value,
        purposeOfTravel: document.getElementById('purposeOfTravel').value,
        journeys: [],
        hotels: [],
        conveyance: [],
        daClaimed: [],
        otherExpenses: []
    };
    
    // Collect journey data
    document.querySelectorAll('.journey-item').forEach(item => {
        formData.journeys.push({
            departureFrom: item.querySelector('.journey-from').value,
            departureDate: item.querySelector('.journey-dep-date').value,
            departureTime: item.querySelector('.journey-dep-time').value,
            arrivedAt: item.querySelector('.journey-to').value,
            arrivalDate: item.querySelector('.journey-arr-date').value,
            arrivalTime: item.querySelector('.journey-arr-time').value,
            arrangedByCompany: item.querySelector('.journey-arranged').value,
            amount: item.querySelector('.journey-amount').value
        });
    });
    
    // Collect hotel data
    document.querySelectorAll('.hotel-item').forEach(item => {
        formData.hotels.push({
            hotelName: item.querySelector('.hotel-name').value,
            place: item.querySelector('.hotel-place').value,
            arrangedByCompany: item.querySelector('.hotel-arranged').value,
            periodOfStay: item.querySelector('.hotel-period').value,
            amount: item.querySelector('.hotel-amount').value
        });
    });
    
    // Collect conveyance data
    document.querySelectorAll('.conveyance-item').forEach(item => {
        formData.conveyance.push({
            date: item.querySelector('.conv-date').value,
            from: item.querySelector('.conv-from').value,
            to: item.querySelector('.conv-to').value,
            mode: item.querySelector('.conv-mode').value,
            amount: item.querySelector('.conveyance-amount').value
        });
    });
    
    // Collect DA data
    document.querySelectorAll('.da-item').forEach(item => {
        formData.daClaimed.push({
            date: item.querySelector('.da-date').value,
            cityName: item.querySelector('.da-city').value,
            amount: item.querySelector('.da-amount').value
        });
    });
    
    // Collect other expenses data
    document.querySelectorAll('.other-item').forEach(item => {
        formData.otherExpenses.push({
            date: item.querySelector('.other-date').value,
            particulars: item.querySelector('.other-particulars').value,
            amount: item.querySelector('.other-amount').value
        });
    });
    
    // Calculate grand total and convert to words
    const grandTotal = parseFloat(document.getElementById('grandTotal').textContent);
    const totalInt = Math.floor(grandTotal);
    formData.amountInWords = numberToWords(totalInt) + ' Only';
    
    try {
        // Send to backend
        const response = await fetch('/api/generate-excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate Excel file');
        }
        
        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Travel_Reimbursement_${formData.employeeName}_${formData.periodOfClaim}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Hide loading overlay
        document.getElementById('loadingOverlay').classList.add('hidden');
        
        alert('Excel file generated successfully! You can now attach your supporting bills and submit to finance department.');
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error generating Excel file. Please try again.');
        document.getElementById('loadingOverlay').classList.add('hidden');
    }
});

// Initialize with one entry in each section
window.addEventListener('DOMContentLoaded', () => {
    addJourney();
    addHotel();
    addConveyance();
    addDA();
    addOther();
    
    // Pre-fill with Ashish's data for quick testing
    document.getElementById('employeeName').value = 'Ashish Goel';
    document.getElementById('employeeCode').value = '115';
    document.getElementById('designation').value = 'Deputy Manager';
    document.getElementById('department').value = 'Business Development';
});
