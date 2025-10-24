// Journey counter
let journeyCount = 0;
let hotelCount = 0;
let conveyanceCount = 0;
let daCount = 0;
let otherCount = 0;
let autoSaveInterval = null;
let uploadedReceipts = [];

// ======================
// FEATURE A: SAVE DRAFTS & TEMPLATES
// ======================

// Auto-save draft every 30 seconds
function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(() => {
        saveDraft(true);
    }, 30000); // 30 seconds
}

// Save current form state to localStorage
function saveDraft(isAutoSave = false) {
    const draftData = collectFormData();
    draftData.savedAt = new Date().toISOString();
    draftData.receipts = uploadedReceipts;
    
    localStorage.setItem('hpx_current_draft', JSON.stringify(draftData));
    
    if (!isAutoSave) {
        showToast('Draft saved successfully!', 'success');
    } else {
        // Show subtle indicator for auto-save
        const indicator = document.getElementById('autoSaveIndicator');
        if (indicator) {
            indicator.textContent = `Auto-saved at ${new Date().toLocaleTimeString()}`;
            indicator.classList.remove('hidden');
        }
    }
}

// Load draft from localStorage
function loadDraft() {
    const draftJson = localStorage.getItem('hpx_current_draft');
    if (!draftJson) {
        showToast('No saved draft found', 'info');
        return;
    }
    
    if (confirm('Load your saved draft? This will replace current data.')) {
        const draft = JSON.parse(draftJson);
        populateForm(draft);
        uploadedReceipts = draft.receipts || [];
        displayUploadedReceipts();
        showToast('Draft loaded successfully!', 'success');
    }
}

// Clear current draft
function clearDraft() {
    if (confirm('Clear saved draft? This cannot be undone.')) {
        localStorage.removeItem('hpx_current_draft');
        showToast('Draft cleared', 'success');
    }
}

// Save as template
function saveAsTemplate() {
    const templateName = prompt('Enter template name (e.g., "Delhi-Mumbai Trip"):');
    if (!templateName) return;
    
    const templateData = collectFormData();
    templateData.templateName = templateName;
    templateData.createdAt = new Date().toISOString();
    
    // Get existing templates
    const templatesJson = localStorage.getItem('hpx_templates');
    const templates = templatesJson ? JSON.parse(templatesJson) : [];
    
    // Add new template
    templates.push(templateData);
    localStorage.setItem('hpx_templates', JSON.stringify(templates));
    
    showToast(`Template "${templateName}" saved!`, 'success');
    updateTemplatesList();
}

// Load template
function loadTemplate(index) {
    const templatesJson = localStorage.getItem('hpx_templates');
    if (!templatesJson) return;
    
    const templates = JSON.parse(templatesJson);
    if (templates[index]) {
        if (confirm(`Load template "${templates[index].templateName}"?`)) {
            populateForm(templates[index]);
            showToast('Template loaded!', 'success');
        }
    }
}

// Delete template
function deleteTemplate(index) {
    const templatesJson = localStorage.getItem('hpx_templates');
    if (!templatesJson) return;
    
    const templates = JSON.parse(templatesJson);
    if (templates[index]) {
        if (confirm(`Delete template "${templates[index].templateName}"?`)) {
            templates.splice(index, 1);
            localStorage.setItem('hpx_templates', JSON.stringify(templates));
            updateTemplatesList();
            showToast('Template deleted', 'success');
        }
    }
}

// Update templates list in UI
function updateTemplatesList() {
    const templatesJson = localStorage.getItem('hpx_templates');
    const templates = templatesJson ? JSON.parse(templatesJson) : [];
    
    const container = document.getElementById('templatesList');
    if (!container) return;
    
    if (templates.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No templates saved yet</p>';
        return;
    }
    
    container.innerHTML = templates.map((template, index) => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md mb-2">
            <div>
                <p class="font-medium text-gray-800">${template.templateName}</p>
                <p class="text-xs text-gray-500">Created: ${new Date(template.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="loadTemplate(${index})" class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                    Load
                </button>
                <button onclick="deleteTemplate(${index})" class="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// ======================
// FEATURE B: RECEIPT UPLOAD
// ======================

// Handle receipt file upload
function handleReceiptUpload(event) {
    const files = event.target.files;
    
    for (let file of files) {
        if (!file.type.startsWith('image/')) {
            showToast('Please upload only image files', 'error');
            continue;
        }
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('File size should be less than 5MB', 'error');
            continue;
        }
        
        // Read file as base64
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedReceipts.push({
                name: file.name,
                data: e.target.result,
                size: file.size,
                uploadedAt: new Date().toISOString()
            });
            displayUploadedReceipts();
            showToast(`Receipt "${file.name}" uploaded`, 'success');
            
            // Trigger OCR if available
            performOCR(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// Display uploaded receipts
function displayUploadedReceipts() {
    const container = document.getElementById('receiptsContainer');
    if (!container) return;
    
    if (uploadedReceipts.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No receipts uploaded yet</p>';
        return;
    }
    
    container.innerHTML = uploadedReceipts.map((receipt, index) => `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-md mb-2 relative">
            <img src="${receipt.data}" alt="${receipt.name}" class="w-16 h-16 object-cover rounded cursor-pointer" 
                onclick="viewReceiptFullSize(${index})">
            <div class="flex-1">
                <p class="font-medium text-gray-800 text-sm">${receipt.name}</p>
                <p class="text-xs text-gray-500">${formatFileSize(receipt.size)}</p>
            </div>
            <button onclick="deleteReceipt(${index})" class="text-red-500 hover:text-red-700">
                <i class="fas fa-times-circle text-xl"></i>
            </button>
        </div>
    `).join('');
}

// View receipt in full size
function viewReceiptFullSize(index) {
    const receipt = uploadedReceipts[index];
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="relative max-w-4xl max-h-full">
            <button onclick="this.closest('.fixed').remove()" 
                class="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300">
                <i class="fas fa-times"></i>
            </button>
            <img src="${receipt.data}" alt="${receipt.name}" class="max-w-full max-h-screen rounded">
        </div>
    `;
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    document.body.appendChild(modal);
}

// Delete receipt
function deleteReceipt(index) {
    if (confirm('Delete this receipt?')) {
        uploadedReceipts.splice(index, 1);
        displayUploadedReceipts();
        showToast('Receipt deleted', 'success');
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ======================
// FEATURE D: OCR BILL SCANNING
// ======================

// Perform OCR on uploaded receipt (using Tesseract.js via CDN)
async function performOCR(imageData) {
    try {
        // Check if Tesseract is available
        if (typeof Tesseract === 'undefined') {
            console.log('OCR library not loaded');
            return;
        }
        
        showToast('Scanning receipt...', 'info');
        
        const result = await Tesseract.recognize(imageData, 'eng', {
            logger: m => console.log(m)
        });
        
        const text = result.data.text;
        console.log('OCR Result:', text);
        
        // Extract amount from text
        const amount = extractAmountFromText(text);
        const date = extractDateFromText(text);
        
        if (amount || date) {
            showOCRSuggestion(amount, date, text);
        } else {
            showToast('Could not extract amount from receipt', 'warning');
        }
        
    } catch (error) {
        console.error('OCR Error:', error);
        showToast('OCR scanning failed', 'error');
    }
}

// Extract amount from OCR text
function extractAmountFromText(text) {
    // Look for patterns like: ₹500, Rs. 500, 500.00, Total: 500
    const patterns = [
        /₹\s*(\d+(?:,\d+)*(?:\.\d{2})?)/,
        /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
        /Total[:\s]+₹?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
        /Amount[:\s]+₹?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
        /(\d+\.\d{2})/
    ];
    
    for (let pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const amount = match[1].replace(/,/g, '');
            return parseFloat(amount);
        }
    }
    
    return null;
}

// Extract date from OCR text
function extractDateFromText(text) {
    // Look for date patterns: DD/MM/YYYY, DD-MM-YYYY
    const patterns = [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
        /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i
    ];
    
    for (let pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            // Format as YYYY-MM-DD for input field
            if (match[3]) {
                const day = match[1].padStart(2, '0');
                const month = match[2].padStart(2, '0');
                const year = match[3];
                return `${year}-${month}-${day}`;
            }
        }
    }
    
    return null;
}

// Show OCR suggestion to user
function showOCRSuggestion(amount, date, fullText) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 class="text-lg font-bold mb-4">
                <i class="fas fa-magic text-blue-600"></i> OCR Detected
            </h3>
            ${amount ? `<p class="mb-2"><strong>Amount:</strong> ₹${amount}</p>` : ''}
            ${date ? `<p class="mb-4"><strong>Date:</strong> ${date}</p>` : ''}
            <p class="text-sm text-gray-600 mb-4">Add to which section?</p>
            <div class="grid grid-cols-2 gap-2">
                <button onclick="addOCRToSection('journey', ${amount}, '${date}'); this.closest('.fixed').remove()" 
                    class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    Journey
                </button>
                <button onclick="addOCRToSection('hotel', ${amount}, '${date}'); this.closest('.fixed').remove()" 
                    class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                    Hotel
                </button>
                <button onclick="addOCRToSection('conveyance', ${amount}, '${date}'); this.closest('.fixed').remove()" 
                    class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                    Conveyance
                </button>
                <button onclick="addOCRToSection('other', ${amount}, '${date}'); this.closest('.fixed').remove()" 
                    class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                    Other
                </button>
            </div>
            <button onclick="this.closest('.fixed').remove()" 
                class="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                Cancel
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Add OCR data to specific section
function addOCRToSection(section, amount, date) {
    switch(section) {
        case 'journey':
            addJourney();
            const lastJourney = document.querySelector('.journey-item:last-child');
            if (lastJourney && amount) {
                lastJourney.querySelector('.journey-amount').value = amount;
            }
            break;
        case 'hotel':
            addHotel();
            const lastHotel = document.querySelector('.hotel-item:last-child');
            if (lastHotel && amount) {
                lastHotel.querySelector('.hotel-amount').value = amount;
            }
            break;
        case 'conveyance':
            addConveyance();
            const lastConv = document.querySelector('.conveyance-item:last-child');
            if (lastConv) {
                if (date) lastConv.querySelector('.conv-date').value = date;
                if (amount) lastConv.querySelector('.conveyance-amount').value = amount;
            }
            break;
        case 'other':
            addOther();
            const lastOther = document.querySelector('.other-item:last-child');
            if (lastOther) {
                if (date) lastOther.querySelector('.other-date').value = date;
                if (amount) lastOther.querySelector('.other-amount').value = amount;
            }
            break;
    }
    calculateTotals();
    showToast('OCR data added!', 'success');
}

// ======================
// UTILITY FUNCTIONS
// ======================

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    }[type];
    
    toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Collect form data
function collectFormData() {
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
    
    return formData;
}

// Populate form with data
function populateForm(data) {
    // Clear existing entries
    document.getElementById('journeyContainer').innerHTML = '';
    document.getElementById('hotelContainer').innerHTML = '';
    document.getElementById('conveyanceContainer').innerHTML = '';
    document.getElementById('daContainer').innerHTML = '';
    document.getElementById('otherContainer').innerHTML = '';
    
    // Fill employee info
    document.getElementById('employeeName').value = data.employeeName || '';
    document.getElementById('employeeCode').value = data.employeeCode || '';
    document.getElementById('designation').value = data.designation || '';
    document.getElementById('department').value = data.department || '';
    document.getElementById('periodOfClaim').value = data.periodOfClaim || '';
    document.getElementById('purposeOfTravel').value = data.purposeOfTravel || '';
    
    // Add journeys
    if (data.journeys && data.journeys.length > 0) {
        data.journeys.forEach(journey => {
            addJourney();
            const lastJourney = document.querySelector('.journey-item:last-child');
            lastJourney.querySelector('.journey-from').value = journey.departureFrom || '';
            lastJourney.querySelector('.journey-dep-date').value = journey.departureDate || '';
            lastJourney.querySelector('.journey-dep-time').value = journey.departureTime || '';
            lastJourney.querySelector('.journey-to').value = journey.arrivedAt || '';
            lastJourney.querySelector('.journey-arr-date').value = journey.arrivalDate || '';
            lastJourney.querySelector('.journey-arr-time').value = journey.arrivalTime || '';
            lastJourney.querySelector('.journey-arranged').value = journey.arrangedByCompany || 'N';
            lastJourney.querySelector('.journey-amount').value = journey.amount || '';
        });
    } else {
        addJourney();
    }
    
    // Add hotels
    if (data.hotels && data.hotels.length > 0) {
        data.hotels.forEach(hotel => {
            addHotel();
            const lastHotel = document.querySelector('.hotel-item:last-child');
            lastHotel.querySelector('.hotel-name').value = hotel.hotelName || '';
            lastHotel.querySelector('.hotel-place').value = hotel.place || '';
            lastHotel.querySelector('.hotel-arranged').value = hotel.arrangedByCompany || 'No';
            lastHotel.querySelector('.hotel-period').value = hotel.periodOfStay || '';
            lastHotel.querySelector('.hotel-amount').value = hotel.amount || '';
        });
    } else {
        addHotel();
    }
    
    // Add conveyance
    if (data.conveyance && data.conveyance.length > 0) {
        data.conveyance.forEach(conv => {
            addConveyance();
            const lastConv = document.querySelector('.conveyance-item:last-child');
            lastConv.querySelector('.conv-date').value = conv.date || '';
            lastConv.querySelector('.conv-from').value = conv.from || '';
            lastConv.querySelector('.conv-to').value = conv.to || '';
            lastConv.querySelector('.conv-mode').value = conv.mode || '';
            lastConv.querySelector('.conveyance-amount').value = conv.amount || '';
        });
    } else {
        addConveyance();
    }
    
    // Add DA
    if (data.daClaimed && data.daClaimed.length > 0) {
        data.daClaimed.forEach(da => {
            addDA();
            const lastDA = document.querySelector('.da-item:last-child');
            lastDA.querySelector('.da-date').value = da.date || '';
            lastDA.querySelector('.da-city').value = da.cityName || '';
            lastDA.querySelector('.da-amount').value = da.amount || '';
        });
    } else {
        addDA();
    }
    
    // Add other expenses
    if (data.otherExpenses && data.otherExpenses.length > 0) {
        data.otherExpenses.forEach(expense => {
            addOther();
            const lastOther = document.querySelector('.other-item:last-child');
            lastOther.querySelector('.other-date').value = expense.date || '';
            lastOther.querySelector('.other-particulars').value = expense.particulars || '';
            lastOther.querySelector('.other-amount').value = expense.amount || '';
        });
    } else {
        addOther();
    }
    
    calculateTotals();
}

// ======================
// ORIGINAL FUNCTIONS (ENHANCED)
// ======================

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
    
    const formData = collectFormData();
    
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
        
        showToast('Excel file generated successfully!', 'success');
        
        // Clear draft after successful submission
        if (confirm('Clear saved draft now that Excel is generated?')) {
            localStorage.removeItem('hpx_current_draft');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error generating Excel file. Please try again.', 'error');
        document.getElementById('loadingOverlay').classList.add('hidden');
    }
});

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Check for existing draft
    const existingDraft = localStorage.getItem('hpx_current_draft');
    if (existingDraft) {
        if (confirm('You have a saved draft. Load it?')) {
            loadDraft();
        } else {
            // Initialize fresh form
            addJourney();
            addHotel();
            addConveyance();
            addDA();
            addOther();
        }
    } else {
        // Initialize fresh form
        addJourney();
        addHotel();
        addConveyance();
        addDA();
        addOther();
    }
    
    // Pre-fill with Ashish's data
    if (!document.getElementById('employeeName').value) {
        document.getElementById('employeeName').value = 'Ashish Goel';
        document.getElementById('employeeCode').value = '115';
        document.getElementById('designation').value = 'Deputy Manager';
        document.getElementById('department').value = 'Business Development';
    }
    
    // Start auto-save
    startAutoSave();
    
    // Update templates list
    updateTemplatesList();
    
    // Display receipts if any
    displayUploadedReceipts();
});
