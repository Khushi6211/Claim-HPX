// ==================== GLOBAL STATE ====================

const AUTH_STATE = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('auth_token') || null
}

const APP_STATE = {
  currentDraftId: null,
  autoSaveTimer: null,
  receipts: [],
  ocrQueue: [],
  isProcessingOCR: false
}

// ==================== API HELPER ====================

async function apiCall(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  
  if (AUTH_STATE.token) {
    headers['Authorization'] = `Bearer ${AUTH_STATE.token}`
  }
  
  const config = {
    ...options,
    headers: { ...headers, ...options.headers }
  }
  
  try {
    const response = await fetch(endpoint, config)
    const data = await response.json()
    
    if (!response.ok) {
      // Handle auth errors - but don't logout during login/register
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        logout()
        throw new Error('Session expired. Please login again.')
      }
      throw new Error(data.error || 'Request failed')
    }
    
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// ==================== AUTHENTICATION FUNCTIONS ====================

async function register() {
  const employee_code = document.getElementById('reg_employee_code').value.trim()
  const employee_name = document.getElementById('reg_employee_name').value.trim()
  const designation = document.getElementById('reg_designation').value.trim()
  const department = document.getElementById('reg_department').value.trim()
  const password = document.getElementById('reg_password').value
  const confirmPassword = document.getElementById('reg_confirm_password').value
  
  if (!employee_code || !employee_name || !password) {
    alert('Please fill all required fields')
    return
  }
  
  if (password.length < 6) {
    alert('Password must be at least 6 characters')
    return
  }
  
  if (password !== confirmPassword) {
    alert('Passwords do not match')
    return
  }
  
  try {
    showLoading('Creating account...')
    const result = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        employee_code,
        employee_name,
        designation,
        department,
        password
      })
    })
    
    hideLoading()
    
    if (result.success) {
      AUTH_STATE.isAuthenticated = true
      AUTH_STATE.user = result.user
      AUTH_STATE.token = result.token
      localStorage.setItem('auth_token', result.token)
      
      alert(`Welcome ${result.user.employee_name}! Your account has been created.`)
      renderMainForm()
    }
  } catch (error) {
    hideLoading()
    alert(error.message)
  }
}

async function login() {
  const employee_code = document.getElementById('login_employee_code').value.trim()
  const password = document.getElementById('login_password').value
  
  if (!employee_code || !password) {
    alert('Please enter employee code and password')
    return
  }
  
  try {
    showLoading('Logging in...')
    const result = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ employee_code, password })
    })
    
    hideLoading()
    
    if (result.success) {
      AUTH_STATE.isAuthenticated = true
      AUTH_STATE.user = result.user
      AUTH_STATE.token = result.token
      localStorage.setItem('auth_token', result.token)
      
      renderMainForm()
    }
  } catch (error) {
    hideLoading()
    alert(error.message)
  }
}

async function logout() {
  try {
    if (AUTH_STATE.token) {
      await apiCall('/api/auth/logout', { method: 'POST' })
    }
  } catch (error) {
    console.error('Logout error:', error)
  }
  
  AUTH_STATE.isAuthenticated = false
  AUTH_STATE.user = null
  AUTH_STATE.token = null
  localStorage.removeItem('auth_token')
  
  // Stop auto-save
  if (APP_STATE.autoSaveTimer) {
    clearInterval(APP_STATE.autoSaveTimer)
  }
  
  renderLoginScreen()
}

async function checkAuth() {
  if (!AUTH_STATE.token) {
    return false
  }
  
  try {
    const result = await apiCall('/api/auth/me')
    if (result.user) {
      AUTH_STATE.isAuthenticated = true
      AUTH_STATE.user = result.user
      return true
    }
  } catch (error) {
    console.error('Auth check failed:', error)
    AUTH_STATE.token = null
    localStorage.removeItem('auth_token')
  }
  
  return false
}

// ==================== CLOUD DRAFT FUNCTIONS ====================

async function saveDraftToCloud() {
  if (!AUTH_STATE.isAuthenticated) return
  
  const formData = collectFormData()
  
  try {
    updateSaveIndicator('Saving to cloud...')
    
    const result = await apiCall('/api/drafts', {
      method: 'POST',
      body: JSON.stringify({
        draft_name: 'auto_save',
        form_data: formData,
        receipts_data: APP_STATE.receipts
      })
    })
    
    if (result.success) {
      APP_STATE.currentDraftId = result.draft_id
      updateSaveIndicator('Saved to cloud ✓')
      setTimeout(() => updateSaveIndicator(''), 2000)
    }
  } catch (error) {
    console.error('Save draft error:', error)
    updateSaveIndicator('Save failed ✗')
  }
}

async function loadDraftFromCloud() {
  if (!AUTH_STATE.isAuthenticated) return
  
  try {
    showLoading('Loading your drafts...')
    const result = await apiCall('/api/drafts')
    hideLoading()
    
    if (result.drafts && result.drafts.length > 0) {
      showDraftsModal(result.drafts)
    } else {
      alert('No saved drafts found')
    }
  } catch (error) {
    hideLoading()
    alert('Failed to load drafts: ' + error.message)
  }
}

async function loadSpecificDraft(draftId) {
  try {
    showLoading('Loading draft...')
    const result = await apiCall(`/api/drafts/${draftId}`)
    hideLoading()
    
    if (result.draft) {
      // Close modal first
      document.getElementById('draftsModal').classList.add('hidden')
      
      // Ensure main form is rendered (in case we're on login screen)
      if (!document.getElementById('journeyContainer')) {
        renderMainForm()
        await new Promise(resolve => setTimeout(resolve, 100)) // Wait for render
      }
      
      // Now populate the form data
      populateFormData(result.draft.form_data)
      APP_STATE.receipts = result.draft.receipts_data || []
      APP_STATE.currentDraftId = draftId
      updateReceiptsDisplay()
      
      alert('Draft loaded successfully!')
    }
  } catch (error) {
    hideLoading()
    alert('Failed to load draft: ' + error.message)
  }
}

async function deleteDraftFromCloud(draftId) {
  if (!confirm('Delete this draft?')) return
  
  try {
    showLoading('Deleting...')
    await apiCall(`/api/drafts/${draftId}`, { method: 'DELETE' })
    hideLoading()
    
    // Reload drafts list
    loadDraftFromCloud()
  } catch (error) {
    hideLoading()
    alert('Failed to delete draft: ' + error.message)
  }
}

function setupAutoSave() {
  // Auto-save every 30 seconds
  if (APP_STATE.autoSaveTimer) {
    clearInterval(APP_STATE.autoSaveTimer)
  }
  
  APP_STATE.autoSaveTimer = setInterval(() => {
    if (AUTH_STATE.isAuthenticated) {
      saveDraftToCloud()
    }
  }, 30000) // 30 seconds
}

// ==================== TEMPLATE FUNCTIONS ====================

function saveAsTemplate() {
  const templateName = prompt('Enter template name (e.g., "Delhi-Mumbai Trip"):')
  if (!templateName || !templateName.trim()) return
  
  const templateData = collectFormData()
  templateData.templateName = templateName.trim()
  templateData.createdAt = new Date().toISOString()
  templateData.receipts = APP_STATE.receipts // Save receipts with template
  
  // Get existing templates from localStorage
  const templatesJson = localStorage.getItem('hpx_templates')
  const templates = templatesJson ? JSON.parse(templatesJson) : []
  
  // Add new template
  templates.push(templateData)
  localStorage.setItem('hpx_templates', JSON.stringify(templates))
  
  alert(`Template "${templateName}" saved successfully!`)
  updateTemplatesList()
}

function loadTemplate(index) {
  const templatesJson = localStorage.getItem('hpx_templates')
  if (!templatesJson) return
  
  const templates = JSON.parse(templatesJson)
  if (index >= 0 && index < templates.length) {
    const template = templates[index]
    
    // Ensure main form is rendered
    if (!document.getElementById('journeyContainer')) {
      renderMainForm()
    }
    
    // Populate form data
    populateFormData(template)
    
    // Restore receipts if available
    if (template.receipts && template.receipts.length > 0) {
      APP_STATE.receipts = template.receipts
      updateReceiptsDisplay()
    } else {
      APP_STATE.receipts = []
      updateReceiptsDisplay()
    }
    
    document.getElementById('templatesModal').classList.add('hidden')
    alert(`Template "${template.templateName}" loaded!`)
  }
}

function deleteTemplate(index) {
  if (!confirm('Delete this template?')) return
  
  const templatesJson = localStorage.getItem('hpx_templates')
  if (!templatesJson) return
  
  const templates = JSON.parse(templatesJson)
  if (index >= 0 && index < templates.length) {
    const deleted = templates.splice(index, 1)
    localStorage.setItem('hpx_templates', JSON.stringify(templates))
    alert(`Template "${deleted[0].templateName}" deleted!`)
    updateTemplatesList()
  }
}

function showTemplatesModal() {
  updateTemplatesList()
  document.getElementById('templatesModal').classList.remove('hidden')
}

function updateTemplatesList() {
  const list = document.getElementById('templatesList')
  const templatesJson = localStorage.getItem('hpx_templates')
  
  if (!templatesJson) {
    list.innerHTML = '<p class="text-gray-500 text-sm">No templates saved yet</p>'
    return
  }
  
  const templates = JSON.parse(templatesJson)
  
  if (templates.length === 0) {
    list.innerHTML = '<p class="text-gray-500 text-sm">No templates saved yet</p>'
    return
  }
  
  list.innerHTML = templates.map((template, index) => `
    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3">
      <div>
        <p class="font-medium">${template.templateName}</p>
        <p class="text-sm text-gray-600">
          Created: ${new Date(template.createdAt).toLocaleDateString()}
        </p>
        <p class="text-xs text-gray-500">
          ${template.purposeOfTravel || 'No purpose specified'}
        </p>
      </div>
      <div class="flex gap-2">
        <button onclick="loadTemplate(${index})" 
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          <i class="fas fa-download mr-1"></i>Load
        </button>
        <button onclick="deleteTemplate(${index})" 
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('')
}

// ==================== ENHANCED OCR FUNCTIONS ====================

async function handleReceiptUpload(event) {
  const files = Array.from(event.target.files)
  
  if (files.length === 0) return
  
  // Add files to OCR queue
  APP_STATE.ocrQueue = [...APP_STATE.ocrQueue, ...files]
  
  // Start processing
  if (!APP_STATE.isProcessingOCR) {
    processOCRQueue()
  }
  
  // Reset file input
  event.target.value = ''
}

async function processOCRQueue() {
  if (APP_STATE.ocrQueue.length === 0) {
    APP_STATE.isProcessingOCR = false
    updateOCRStatus('')
    return
  }
  
  APP_STATE.isProcessingOCR = true
  const file = APP_STATE.ocrQueue.shift()
  const totalFiles = APP_STATE.ocrQueue.length + 1
  const currentIndex = totalFiles - APP_STATE.ocrQueue.length
  
  updateOCRStatus(`Processing receipt ${currentIndex} of ${totalFiles}...`)
  
  try {
    // Read file as data URL
    const dataUrl = await readFileAsDataURL(file)
    
    // Perform OCR
    const result = await Tesseract.recognize(dataUrl, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          updateOCRStatus(`Processing receipt ${currentIndex} of ${totalFiles}... ${Math.round(m.progress * 100)}%`)
        }
      }
    })
    
    // Extract data with pattern matching
    const extractedData = extractDataWithPatterns(result.data.text, file.name)
    
    // Add receipt to collection
    APP_STATE.receipts.push({
      id: Date.now() + Math.random(),
      fileName: file.name,
      dataUrl: dataUrl,
      ocrText: result.data.text,
      extractedData: extractedData,
      uploadedAt: new Date().toISOString()
    })
    
    updateReceiptsDisplay()
    
    // Show preview modal
    showOCRPreviewModal(APP_STATE.receipts[APP_STATE.receipts.length - 1])
    
  } catch (error) {
    console.error('OCR Error:', error)
    alert(`Failed to process ${file.name}: ${error.message}`)
  }
  
  // Process next file
  setTimeout(() => processOCRQueue(), 500)
}

function extractDataWithPatterns(text, fileName) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)
  
  // Detect bill type
  const category = detectBillCategory(text, fileName)
  
  // Pattern-specific extraction
  let extractedData = {
    category: category,
    merchant: '',
    amount: 0,
    date: '',
    confidence: 0,
    details: {}
  }
  
  switch (category) {
    case 'GST Invoice':
      extractedData = extractGSTInvoice(lines, text)
      break
    case 'Hotel':
      extractedData = extractHotelBill(lines, text)
      break
    case 'Taxi':
      extractedData = extractTaxiBill(lines, text)
      break
    case 'Restaurant':
      extractedData = extractRestaurantBill(lines, text)
      break
    default:
      extractedData = extractGenericBill(lines, text)
  }
  
  return extractedData
}

function detectBillCategory(text, fileName) {
  const lower = text.toLowerCase()
  const fileNameLower = fileName.toLowerCase()
  
  if (lower.includes('gstin') || lower.includes('tax invoice') || lower.includes('gst')) {
    return 'GST Invoice'
  }
  if (lower.includes('hotel') || lower.includes('room charge') || fileNameLower.includes('hotel')) {
    return 'Hotel'
  }
  if (lower.includes('taxi') || lower.includes('uber') || lower.includes('ola') || fileNameLower.includes('cab')) {
    return 'Taxi'
  }
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('cafe')) {
    return 'Restaurant'
  }
  return 'General'
}

function extractGSTInvoice(lines, fullText) {
  const data = {
    category: 'GST Invoice',
    merchant: '',
    amount: 0,
    date: '',
    confidence: 0,
    details: { invoiceNo: '', gstin: '', tax: 0 }
  }
  
  // Extract merchant name (usually first few lines)
  data.merchant = lines.slice(0, 3).join(' ').substring(0, 50)
  
  // Extract GSTIN
  const gstinMatch = fullText.match(/GSTIN[\s:]*([A-Z0-9]{15})/i)
  if (gstinMatch) data.details.gstin = gstinMatch[1]
  
  // Extract Invoice Number
  const invoiceMatch = fullText.match(/Invoice[\s#No:]*([A-Z0-9\-\/]+)/i)
  if (invoiceMatch) data.details.invoiceNo = invoiceMatch[1]
  
  // Extract Total Amount (look for "Total" or "Grand Total")
  const amountPatterns = [
    /Total[\s:]*₹?\s*([0-9,]+\.?\d*)/i,
    /Grand Total[\s:]*₹?\s*([0-9,]+\.?\d*)/i,
    /Amount[\s:]*₹?\s*([0-9,]+\.?\d*)/i
  ]
  
  for (const pattern of amountPatterns) {
    const match = fullText.match(pattern)
    if (match) {
      data.amount = parseFloat(match[1].replace(/,/g, ''))
      break
    }
  }
  
  // Extract Date
  const dateMatch = fullText.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i)
  if (dateMatch) data.date = dateMatch[1]
  
  // Calculate confidence
  data.confidence = calculateConfidence(data)
  
  return data
}

function extractHotelBill(lines, fullText) {
  const data = {
    category: 'Hotel',
    merchant: '',
    amount: 0,
    date: '',
    confidence: 0,
    details: { nights: 0, roomType: '' }
  }
  
  // Extract hotel name
  data.merchant = lines.slice(0, 2).join(' ').substring(0, 50)
  
  // Extract amount
  const amountPatterns = [
    /Total[\s:]*₹?\s*([0-9,]+\.?\d*)/i,
    /Room Charge[\s:]*₹?\s*([0-9,]+\.?\d*)/i,
    /Amount[\s:]*₹?\s*([0-9,]+\.?\d*)/i
  ]
  
  for (const pattern of amountPatterns) {
    const match = fullText.match(pattern)
    if (match) {
      data.amount = parseFloat(match[1].replace(/,/g, ''))
      break
    }
  }
  
  // Extract date
  const dateMatch = fullText.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i)
  if (dateMatch) data.date = dateMatch[1]
  
  data.confidence = calculateConfidence(data)
  return data
}

function extractTaxiBill(lines, fullText) {
  const data = {
    category: 'Taxi',
    merchant: 'Taxi Service',
    amount: 0,
    date: '',
    confidence: 0,
    details: { from: '', to: '' }
  }
  
  // Detect service
  if (fullText.toLowerCase().includes('uber')) data.merchant = 'Uber'
  else if (fullText.toLowerCase().includes('ola')) data.merchant = 'Ola'
  
  // Extract fare
  const farePatterns = [
    /Fare[\s:]*₹?\s*([0-9,]+\.?\d*)/i,
    /Total[\s:]*₹?\s*([0-9,]+\.?\d*)/i,
    /Amount[\s:]*₹?\s*([0-9,]+\.?\d*)/i
  ]
  
  for (const pattern of farePatterns) {
    const match = fullText.match(pattern)
    if (match) {
      data.amount = parseFloat(match[1].replace(/,/g, ''))
      break
    }
  }
  
  // Extract date
  const dateMatch = fullText.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i)
  if (dateMatch) data.date = dateMatch[1]
  
  data.confidence = calculateConfidence(data)
  return data
}

function extractRestaurantBill(lines, fullText) {
  const data = {
    category: 'Restaurant',
    merchant: '',
    amount: 0,
    date: '',
    confidence: 0,
    details: {}
  }
  
  // Extract restaurant name
  data.merchant = lines[0].substring(0, 50)
  
  // Extract total
  const amountPatterns = [
    /Total[\s:]*₹?\s*([0-9,]+\.?\d*)/i,
    /Grand Total[\s:]*₹?\s*([0-9,]+\.?\d*)/i,
    /Net Amount[\s:]*₹?\s*([0-9,]+\.?\d*)/i
  ]
  
  for (const pattern of amountPatterns) {
    const match = fullText.match(pattern)
    if (match) {
      data.amount = parseFloat(match[1].replace(/,/g, ''))
      break
    }
  }
  
  // Extract date
  const dateMatch = fullText.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i)
  if (dateMatch) data.date = dateMatch[1]
  
  data.confidence = calculateConfidence(data)
  return data
}

function extractGenericBill(lines, fullText) {
  const data = {
    category: 'General',
    merchant: lines[0].substring(0, 50),
    amount: 0,
    date: '',
    confidence: 0,
    details: {}
  }
  
  // Extract any amount with ₹ or numbers
  const amounts = []
  const amountRegex = /₹?\s*([0-9,]+\.?\d*)/g
  let match
  while ((match = amountRegex.exec(fullText)) !== null) {
    const amt = parseFloat(match[1].replace(/,/g, ''))
    if (amt > 10) amounts.push(amt) // Filter out small numbers
  }
  
  // Use largest amount
  if (amounts.length > 0) {
    data.amount = Math.max(...amounts)
  }
  
  // Extract date
  const dateMatch = fullText.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i)
  if (dateMatch) data.date = dateMatch[1]
  
  data.confidence = calculateConfidence(data)
  return data
}

function calculateConfidence(data) {
  let score = 0
  if (data.merchant && data.merchant.length > 3) score += 30
  if (data.amount > 0) score += 40
  if (data.date) score += 20
  if (data.details && Object.keys(data.details).length > 0) score += 10
  return Math.min(score, 100)
}

async function learnFromCorrection(receiptId, correctedData) {
  try {
    await apiCall('/api/ocr/learn', {
      method: 'POST',
      body: JSON.stringify({
        merchant_name: correctedData.merchant,
        category: correctedData.category,
        amount: correctedData.amount,
        location: correctedData.location || ''
      })
    })
  } catch (error) {
    console.error('Failed to learn pattern:', error)
  }
}

// ==================== UI RENDERING FUNCTIONS ====================

function renderLoginScreen() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-plane text-white text-2xl"></i>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">HPX Travel Reimbursement</h2>
          <p class="mt-2 text-sm text-gray-600">Sign in to continue</p>
        </div>
        
        <!-- Login Form -->
        <div class="bg-white rounded-lg shadow-xl p-8">
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Employee Code</label>
              <input type="text" id="login_employee_code" 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your employee code">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input type="password" id="login_password" 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                onkeypress="if(event.key==='Enter') login()">
            </div>
            <button onclick="login()" 
              class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium">
              <i class="fas fa-sign-in-alt mr-2"></i>Sign In
            </button>
          </div>
          
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              Don't have an account? 
              <button onclick="renderRegisterScreen()" class="text-blue-600 hover:text-blue-700 font-medium">
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-8 rounded-lg text-center">
        <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
        <p class="text-lg font-medium" id="loadingText">Loading...</p>
      </div>
    </div>
  `
}

function renderRegisterScreen() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-user-plus text-white text-2xl"></i>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">Create Account</h2>
          <p class="mt-2 text-sm text-gray-600">Register to get started</p>
        </div>
        
        <!-- Register Form -->
        <div class="bg-white rounded-lg shadow-xl p-8">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Employee Code *</label>
              <input type="text" id="reg_employee_code" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your employee code" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input type="text" id="reg_employee_name" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your full name" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Designation</label>
              <input type="text" id="reg_designation" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your designation">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input type="text" id="reg_department" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your department">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input type="password" id="reg_password" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="At least 6 characters" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <input type="password" id="reg_confirm_password" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password" required
                onkeypress="if(event.key==='Enter') register()">
            </div>
            <button onclick="register()" 
              class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium mt-6">
              <i class="fas fa-user-plus mr-2"></i>Create Account
            </button>
          </div>
          
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              Already have an account? 
              <button onclick="renderLoginScreen()" class="text-blue-600 hover:text-blue-700 font-medium">
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-8 rounded-lg text-center">
        <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
        <p class="text-lg font-medium" id="loadingText">Loading...</p>
      </div>
    </div>
  `
}

function renderMainForm() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen py-8 px-4">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1"></div>
            <div class="flex-1 text-center">
              <h1 class="text-2xl font-bold text-gray-800 mb-2">HINDUSTAN POWER EXCHANGE LIMITED</h1>
              <p class="text-sm text-gray-600">Unit No 810-816, 8th Floor, World Trade Tower Sector 16 Noida</p>
              <p class="text-xs text-gray-500">(CIN NO -U74999MH2018PLC308448)</p>
              <h2 class="text-xl font-bold text-blue-600 mt-4">TRAVEL REIMBURSEMENT CLAIM FORM</h2>
            </div>
            <div class="flex-1 text-right">
              <div class="text-sm text-gray-600 mb-2">
                Welcome, <strong>${AUTH_STATE.user.employee_name}</strong>
              </div>
              <button onclick="logout()" class="text-sm text-red-600 hover:text-red-700">
                <i class="fas fa-sign-out-alt mr-1"></i>Logout
              </button>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2" id="autoSaveIndicator"></p>
        </div>

        <!-- Quick Actions Bar -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-6">
          <div class="flex flex-wrap gap-3 justify-center">
            <button onclick="saveDraftToCloud()" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
              <i class="fas fa-cloud-upload-alt mr-2"></i>Save to Cloud
            </button>
            <button onclick="loadDraftFromCloud()" class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
              <i class="fas fa-folder-open mr-2"></i>My Drafts
            </button>
            <button onclick="clearForm()" class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
              <i class="fas fa-trash mr-2"></i>Clear Form
            </button>
            <button onclick="saveAsTemplate()" class="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition">
              <i class="fas fa-bookmark mr-2"></i>Save as Template
            </button>
            <button onclick="showTemplatesModal()" class="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition">
              <i class="fas fa-list mr-2"></i>My Templates
            </button>
          </div>
        </div>

        <!-- Receipt Upload Section -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4 border-b-2 border-orange-500 pb-2">
            <i class="fas fa-camera mr-2"></i>Upload Receipts (OCR Enabled)
          </h3>
          <div class="mb-4">
            <label class="flex items-center justify-center w-full px-4 py-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <div class="text-center">
                <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                <p class="text-sm text-gray-600"><strong>Click to upload</strong> or drag and drop</p>
                <p class="text-xs text-gray-500 mt-1">PNG, JPG - Multiple files supported</p>
                <p class="text-xs text-blue-600 mt-2" id="ocrStatus"></p>
              </div>
              <input type="file" accept="image/*" multiple onchange="handleReceiptUpload(event)" class="hidden">
            </label>
          </div>
          <div id="receiptsContainer" class="mt-4">
            <p class="text-gray-500 text-sm">No receipts uploaded yet</p>
          </div>
        </div>

        <!-- Drafts Modal -->
        <div id="draftsModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold text-gray-800">
                <i class="fas fa-cloud mr-2"></i>My Cloud Drafts
              </h3>
              <button onclick="document.getElementById('draftsModal').classList.add('hidden')" 
                class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            <div id="draftsList">
              <p class="text-gray-500 text-sm">Loading...</p>
            </div>
          </div>
        </div>

        <!-- Templates Modal -->
        <div id="templatesModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold text-gray-800">
                <i class="fas fa-bookmark mr-2"></i>My Templates
              </h3>
              <button onclick="document.getElementById('templatesModal').classList.add('hidden')" 
                class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            <div id="templatesList">
              <p class="text-gray-500 text-sm">No templates saved yet</p>
            </div>
          </div>
        </div>

        <!-- OCR Preview Modal -->
        <div id="ocrPreviewModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold text-gray-800">
                <i class="fas fa-eye mr-2"></i>Review OCR Data
              </h3>
              <button onclick="document.getElementById('ocrPreviewModal').classList.add('hidden')" 
                class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            <div id="ocrPreviewContent">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>

        <!-- Main Form -->
        <form id="reimbursementForm" class="bg-white rounded-lg shadow-md p-6" onsubmit="generateExcel(event)">
          <!-- Employee Information (Pre-filled) -->
          <div class="mb-8">
            <h3 class="text-lg font-bold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">
              <i class="fas fa-user mr-2"></i>Employee Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Name of Employee/Traveller *</label>
                <input type="text" id="employeeName" value="${AUTH_STATE.user.employee_name}" required 
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Employee Code *</label>
                <input type="text" id="employeeCode" value="${AUTH_STATE.user.employee_code}" required readonly
                  class="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Designation *</label>
                <input type="text" id="designation" value="${AUTH_STATE.user.designation || ''}" required 
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Department & Budget Code *</label>
                <input type="text" id="department" value="${AUTH_STATE.user.department || ''}" required 
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Period of Claim *</label>
                <input type="text" id="periodOfClaim" required 
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Nov-24">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Purpose of Travel *</label>
                <input type="text" id="purposeOfTravel" required 
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Dehradun - Official">
              </div>
            </div>
          </div>

          <!-- Journey Details -->
          <div class="mb-8">
            <h3 class="text-lg font-bold text-gray-800 mb-4 border-b-2 border-green-500 pb-2">
              <i class="fas fa-plane mr-2"></i>Detail of Journey
            </h3>
            <div id="journeyContainer"></div>
            <button type="button" onclick="addJourney()" 
              class="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
              <i class="fas fa-plus mr-2"></i>Add Journey
            </button>
            <div class="mt-4 text-right">
              <span class="text-lg font-bold">Journey Total: ₹ <span id="journeyTotal">0.00</span></span>
            </div>
          </div>

          <!-- Hotel Charges -->
          <div class="mb-8">
            <h3 class="text-lg font-bold text-gray-800 mb-4 border-b-2 border-purple-500 pb-2">
              <i class="fas fa-hotel mr-2"></i>Hotel Charges
            </h3>
            <div id="hotelContainer"></div>
            <button type="button" onclick="addHotel()" 
              class="mt-4 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition">
              <i class="fas fa-plus mr-2"></i>Add Hotel
            </button>
            <div class="mt-4 text-right">
              <span class="text-lg font-bold">Hotel Total: ₹ <span id="hotelTotal">0.00</span></span>
            </div>
          </div>

          <!-- Local Conveyance -->
          <div class="mb-8">
            <h3 class="text-lg font-bold text-gray-800 mb-4 border-b-2 border-yellow-500 pb-2">
              <i class="fas fa-taxi mr-2"></i>Detail of Local Conveyance
            </h3>
            <div id="conveyanceContainer"></div>
            <button type="button" onclick="addConveyance()" 
              class="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition">
              <i class="fas fa-plus mr-2"></i>Add Conveyance
            </button>
            <div class="mt-4 text-right">
              <span class="text-lg font-bold">Conveyance Total: ₹ <span id="conveyanceTotal">0.00</span></span>
            </div>
          </div>

          <!-- DA Claimed -->
          <div class="mb-8">
            <h3 class="text-lg font-bold text-gray-800 mb-4 border-b-2 border-indigo-500 pb-2">
              <i class="fas fa-money-bill-wave mr-2"></i>Detail of DA Claimed
            </h3>
            <div id="daContainer"></div>
            <button type="button" onclick="addDA()" 
              class="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition">
              <i class="fas fa-plus mr-2"></i>Add DA
            </button>
            <div class="mt-4 text-right">
              <span class="text-lg font-bold">DA Total: ₹ <span id="daTotal">0.00</span></span>
            </div>
          </div>

          <!-- Other Expenses -->
          <div class="mb-8">
            <h3 class="text-lg font-bold text-gray-800 mb-4 border-b-2 border-red-500 pb-2">
              <i class="fas fa-receipt mr-2"></i>Other Incidental Expense
            </h3>
            <div id="otherContainer"></div>
            <button type="button" onclick="addOther()" 
              class="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
              <i class="fas fa-plus mr-2"></i>Add Expense
            </button>
            <div class="mt-4 text-right">
              <span class="text-lg font-bold">Other Total: ₹ <span id="otherTotal">0.00</span></span>
            </div>
          </div>

          <!-- Grand Total -->
          <div class="bg-yellow-100 p-6 rounded-lg mb-6">
            <div class="text-center">
              <span class="text-2xl font-bold text-gray-800">GRAND TOTAL: ₹ <span id="grandTotal">0.00</span></span>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="text-center">
            <button type="submit" 
              class="px-8 py-3 bg-blue-600 text-white text-lg font-bold rounded-md hover:bg-blue-700 transition shadow-lg">
              <i class="fas fa-file-excel mr-2"></i>Generate Excel File
            </button>
          </div>
        </form>

        <!-- Loading Overlay -->
        <div id="loadingOverlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-8 rounded-lg text-center">
            <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
            <p class="text-lg font-medium" id="loadingText">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  `
  
  // Initialize form with one row in each section
  addJourney()
  addHotel()
  addConveyance()
  addDA()
  addOther()
  
  // Setup auto-save
  setupAutoSave()
}

// ==================== FORM MANAGEMENT FUNCTIONS ====================

// (Copy all form management functions from original app.js)
// addJourney, addHotel, addConveyance, addDA, addOther, removeRow, calculateTotals, etc.

let journeyCount = 0
let hotelCount = 0
let conveyanceCount = 0
let daCount = 0
let otherCount = 0

function addJourney() {
  journeyCount++
  const container = document.getElementById('journeyContainer')
  const row = document.createElement('div')
  row.className = 'grid grid-cols-1 md:grid-cols-9 gap-3 mb-4 p-4 bg-gray-50 rounded-lg'
  row.id = `journey-${journeyCount}`
  row.innerHTML = `
    <input type="text" placeholder="From" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <input type="date" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <input type="time" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <input type="text" placeholder="To" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <input type="date" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <input type="time" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <select class="px-3 py-2 border rounded" onchange="calculateTotals()">
      <option value="No">No</option>
      <option value="Yes">Yes</option>
    </select>
    <input type="number" placeholder="Amount" step="0.01" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <button type="button" onclick="removeRow('journey-${journeyCount}')" class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">
      <i class="fas fa-trash"></i>
    </button>
  `
  container.appendChild(row)
  calculateTotals()
}

function addHotel() {
  hotelCount++
  const container = document.getElementById('hotelContainer')
  const row = document.createElement('div')
  row.className = 'grid grid-cols-1 md:grid-cols-6 gap-3 mb-4 p-4 bg-gray-50 rounded-lg'
  row.id = `hotel-${hotelCount}`
  row.innerHTML = `
    <input type="text" placeholder="Hotel Name" class="px-3 py-2 border rounded md:col-span-2" onchange="calculateTotals()">
    <input type="text" placeholder="Place" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <select class="px-3 py-2 border rounded" onchange="calculateTotals()">
      <option value="No">No</option>
      <option value="Yes">Yes</option>
    </select>
    <input type="text" placeholder="Period" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <input type="number" placeholder="Amount" step="0.01" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <button type="button" onclick="removeRow('hotel-${hotelCount}')" class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">
      <i class="fas fa-trash"></i>
    </button>
  `
  container.appendChild(row)
  calculateTotals()
}

function addConveyance() {
  conveyanceCount++
  const container = document.getElementById('conveyanceContainer')
  const row = document.createElement('div')
  row.className = 'grid grid-cols-1 md:grid-cols-6 gap-3 mb-4 p-4 bg-gray-50 rounded-lg'
  row.id = `conveyance-${conveyanceCount}`
  row.innerHTML = `
    <input type="date" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <input type="text" placeholder="From" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <input type="text" placeholder="To" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <input type="text" placeholder="Mode" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <input type="number" placeholder="Amount" step="0.01" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <button type="button" onclick="removeRow('conveyance-${conveyanceCount}')" class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">
      <i class="fas fa-trash"></i>
    </button>
  `
  container.appendChild(row)
  calculateTotals()
}

function addDA() {
  daCount++
  const container = document.getElementById('daContainer')
  const row = document.createElement('div')
  row.className = 'grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg'
  row.id = `da-${daCount}`
  row.innerHTML = `
    <input type="date" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <input type="text" placeholder="City Name" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <input type="number" placeholder="Amount" step="0.01" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <button type="button" onclick="removeRow('da-${daCount}')" class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">
      <i class="fas fa-trash"></i>
    </button>
  `
  container.appendChild(row)
  calculateTotals()
}

function addOther() {
  otherCount++
  const container = document.getElementById('otherContainer')
  const row = document.createElement('div')
  row.className = 'grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg'
  row.id = `other-${otherCount}`
  row.innerHTML = `
    <input type="date" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <input type="text" placeholder="Particulars" class="px-3 py-2 border rounded md:col-span-2" onchange="calculateTotals()">
    <input type="number" placeholder="Amount" step="0.01" class="px-3 py-2 border rounded" onchange="calculateTotals()">
    <button type="button" onclick="removeRow('other-${otherCount}')" class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">
      <i class="fas fa-trash"></i>
    </button>
  `
  container.appendChild(row)
  calculateTotals()
}

function removeRow(id) {
  const row = document.getElementById(id)
  if (row) row.remove()
  calculateTotals()
}

function calculateTotals() {
  let journeyTotal = 0
  let hotelTotal = 0
  let conveyanceTotal = 0
  let daTotal = 0
  let otherTotal = 0
  
  // Journey
  document.querySelectorAll('#journeyContainer > div').forEach(row => {
    const amount = parseFloat(row.querySelector('input[type="number"]')?.value || 0)
    journeyTotal += amount
  })
  
  // Hotel
  document.querySelectorAll('#hotelContainer > div').forEach(row => {
    const inputs = row.querySelectorAll('input[type="number"]')
    const amount = parseFloat(inputs[inputs.length - 1]?.value || 0)
    hotelTotal += amount
  })
  
  // Conveyance
  document.querySelectorAll('#conveyanceContainer > div').forEach(row => {
    const inputs = row.querySelectorAll('input[type="number"]')
    const amount = parseFloat(inputs[inputs.length - 1]?.value || 0)
    conveyanceTotal += amount
  })
  
  // DA
  document.querySelectorAll('#daContainer > div').forEach(row => {
    const amount = parseFloat(row.querySelector('input[type="number"]')?.value || 0)
    daTotal += amount
  })
  
  // Other
  document.querySelectorAll('#otherContainer > div').forEach(row => {
    const amount = parseFloat(row.querySelector('input[type="number"]')?.value || 0)
    otherTotal += amount
  })
  
  const grandTotal = journeyTotal + hotelTotal + conveyanceTotal + daTotal + otherTotal
  
  document.getElementById('journeyTotal').textContent = journeyTotal.toFixed(2)
  document.getElementById('hotelTotal').textContent = hotelTotal.toFixed(2)
  document.getElementById('conveyanceTotal').textContent = conveyanceTotal.toFixed(2)
  document.getElementById('daTotal').textContent = daTotal.toFixed(2)
  document.getElementById('otherTotal').textContent = otherTotal.toFixed(2)
  document.getElementById('grandTotal').textContent = grandTotal.toFixed(2)
}

function collectFormData() {
  const data = {
    employeeName: document.getElementById('employeeName')?.value || '',
    employeeCode: document.getElementById('employeeCode')?.value || '',
    designation: document.getElementById('designation')?.value || '',
    department: document.getElementById('department')?.value || '',
    periodOfClaim: document.getElementById('periodOfClaim')?.value || '',
    purposeOfTravel: document.getElementById('purposeOfTravel')?.value || '',
    journeys: [],
    hotels: [],
    conveyance: [],
    daClaimed: [],
    otherExpenses: []
  }
  
  // Collect Journey data
  document.querySelectorAll('#journeyContainer > div').forEach(row => {
    const inputs = row.querySelectorAll('input, select')
    data.journeys.push({
      departureFrom: inputs[0]?.value || '',
      departureDate: inputs[1]?.value || '',
      departureTime: inputs[2]?.value || '',
      arrivedAt: inputs[3]?.value || '',
      arrivalDate: inputs[4]?.value || '',
      arrivalTime: inputs[5]?.value || '',
      arrangedByCompany: inputs[6]?.value || '',
      amount: inputs[7]?.value || ''
    })
  })
  
  // Collect Hotel data
  document.querySelectorAll('#hotelContainer > div').forEach(row => {
    const inputs = row.querySelectorAll('input, select')
    data.hotels.push({
      hotelName: inputs[0]?.value || '',
      place: inputs[1]?.value || '',
      arrangedByCompany: inputs[2]?.value || '',
      periodOfStay: inputs[3]?.value || '',
      amount: inputs[4]?.value || ''
    })
  })
  
  // Collect Conveyance data
  document.querySelectorAll('#conveyanceContainer > div').forEach(row => {
    const inputs = row.querySelectorAll('input')
    data.conveyance.push({
      date: inputs[0]?.value || '',
      from: inputs[1]?.value || '',
      to: inputs[2]?.value || '',
      mode: inputs[3]?.value || '',
      amount: inputs[4]?.value || ''
    })
  })
  
  // Collect DA data
  document.querySelectorAll('#daContainer > div').forEach(row => {
    const inputs = row.querySelectorAll('input')
    data.daClaimed.push({
      date: inputs[0]?.value || '',
      cityName: inputs[1]?.value || '',
      amount: inputs[2]?.value || ''
    })
  })
  
  // Collect Other Expenses data
  document.querySelectorAll('#otherContainer > div').forEach(row => {
    const inputs = row.querySelectorAll('input')
    data.otherExpenses.push({
      date: inputs[0]?.value || '',
      particulars: inputs[1]?.value || '',
      amount: inputs[2]?.value || ''
    })
  })
  
  return data
}

function populateFormData(data) {
  if (!data) return
  
  // Populate employee info
  if (data.employeeName) document.getElementById('employeeName').value = data.employeeName
  if (data.employeeCode) document.getElementById('employeeCode').value = data.employeeCode
  if (data.designation) document.getElementById('designation').value = data.designation
  if (data.department) document.getElementById('department').value = data.department
  if (data.periodOfClaim) document.getElementById('periodOfClaim').value = data.periodOfClaim
  if (data.purposeOfTravel) document.getElementById('purposeOfTravel').value = data.purposeOfTravel
  
  // Clear existing rows
  document.getElementById('journeyContainer').innerHTML = ''
  document.getElementById('hotelContainer').innerHTML = ''
  document.getElementById('conveyanceContainer').innerHTML = ''
  document.getElementById('daContainer').innerHTML = ''
  document.getElementById('otherContainer').innerHTML = ''
  
  journeyCount = 0
  hotelCount = 0
  conveyanceCount = 0
  daCount = 0
  otherCount = 0
  
  // Populate Journey data
  if (data.journeys && data.journeys.length > 0) {
    data.journeys.forEach(journey => {
      addJourney()
      const row = document.getElementById(`journey-${journeyCount}`)
      const inputs = row.querySelectorAll('input, select')
      inputs[0].value = journey.departureFrom || ''
      inputs[1].value = journey.departureDate || ''
      inputs[2].value = journey.departureTime || ''
      inputs[3].value = journey.arrivedAt || ''
      inputs[4].value = journey.arrivalDate || ''
      inputs[5].value = journey.arrivalTime || ''
      inputs[6].value = journey.arrangedByCompany || ''
      inputs[7].value = journey.amount || ''
    })
  } else {
    addJourney()
  }
  
  // Populate Hotel data
  if (data.hotels && data.hotels.length > 0) {
    data.hotels.forEach(hotel => {
      addHotel()
      const row = document.getElementById(`hotel-${hotelCount}`)
      const inputs = row.querySelectorAll('input, select')
      inputs[0].value = hotel.hotelName || ''
      inputs[1].value = hotel.place || ''
      inputs[2].value = hotel.arrangedByCompany || ''
      inputs[3].value = hotel.periodOfStay || ''
      inputs[4].value = hotel.amount || ''
    })
  } else {
    addHotel()
  }
  
  // Populate Conveyance data
  if (data.conveyance && data.conveyance.length > 0) {
    data.conveyance.forEach(conv => {
      addConveyance()
      const row = document.getElementById(`conveyance-${conveyanceCount}`)
      const inputs = row.querySelectorAll('input')
      inputs[0].value = conv.date || ''
      inputs[1].value = conv.from || ''
      inputs[2].value = conv.to || ''
      inputs[3].value = conv.mode || ''
      inputs[4].value = conv.amount || ''
    })
  } else {
    addConveyance()
  }
  
  // Populate DA data
  if (data.daClaimed && data.daClaimed.length > 0) {
    data.daClaimed.forEach(da => {
      addDA()
      const row = document.getElementById(`da-${daCount}`)
      const inputs = row.querySelectorAll('input')
      inputs[0].value = da.date || ''
      inputs[1].value = da.cityName || ''
      inputs[2].value = da.amount || ''
    })
  } else {
    addDA()
  }
  
  // Populate Other Expenses data
  if (data.otherExpenses && data.otherExpenses.length > 0) {
    data.otherExpenses.forEach(expense => {
      addOther()
      const row = document.getElementById(`other-${otherCount}`)
      const inputs = row.querySelectorAll('input')
      inputs[0].value = expense.date || ''
      inputs[1].value = expense.particulars || ''
      inputs[2].value = expense.amount || ''
    })
  } else {
    addOther()
  }
  
  calculateTotals()
}

function clearForm() {
  if (!confirm('Clear all form data?')) return
  
  document.getElementById('periodOfClaim').value = ''
  document.getElementById('purposeOfTravel').value = ''
  
  document.getElementById('journeyContainer').innerHTML = ''
  document.getElementById('hotelContainer').innerHTML = ''
  document.getElementById('conveyanceContainer').innerHTML = ''
  document.getElementById('daContainer').innerHTML = ''
  document.getElementById('otherContainer').innerHTML = ''
  
  journeyCount = 0
  hotelCount = 0
  conveyanceCount = 0
  daCount = 0
  otherCount = 0
  
  APP_STATE.receipts = []
  APP_STATE.currentDraftId = null
  
  updateReceiptsDisplay()
  
  addJourney()
  addHotel()
  addConveyance()
  addDA()
  addOther()
}

async function generateExcel(event) {
  event.preventDefault()
  
  const data = collectFormData()
  
  try {
    showLoading('Generating Excel file...')
    
    const response = await fetch('/api/generate-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate Excel')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Travel_Reimbursement_${data.employeeName}_${data.periodOfClaim}.xlsx`
    a.click()
    
    hideLoading()
    alert('Excel file generated successfully!')
    
  } catch (error) {
    hideLoading()
    alert('Failed to generate Excel: ' + error.message)
  }
}

// ==================== UI HELPER FUNCTIONS ====================

function showLoading(message = 'Loading...') {
  document.getElementById('loadingText').textContent = message
  document.getElementById('loadingOverlay').classList.remove('hidden')
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden')
}

function updateSaveIndicator(message) {
  const indicator = document.getElementById('autoSaveIndicator')
  if (indicator) indicator.textContent = message
}

function updateOCRStatus(message) {
  const status = document.getElementById('ocrStatus')
  if (status) status.textContent = message
}

function updateReceiptsDisplay() {
  const container = document.getElementById('receiptsContainer')
  
  if (APP_STATE.receipts.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm">No receipts uploaded yet</p>'
    return
  }
  
  container.innerHTML = APP_STATE.receipts.map((receipt, index) => `
    <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-3">
      <img src="${receipt.dataUrl}" class="w-20 h-20 object-cover rounded">
      <div class="flex-1">
        <p class="font-medium">${receipt.fileName}</p>
        <p class="text-sm text-gray-600">
          ${receipt.extractedData.category} • 
          ${receipt.extractedData.merchant || 'Unknown'} • 
          ₹${receipt.extractedData.amount || '0'}
        </p>
        <p class="text-xs text-gray-500">Confidence: ${receipt.extractedData.confidence}%</p>
      </div>
      <button onclick="showOCRPreviewModal(APP_STATE.receipts[${index}])" 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        <i class="fas fa-eye mr-1"></i>Review
      </button>
      <button onclick="deleteReceipt(${index})" 
        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('')
}

function showOCRPreviewModal(receipt) {
  const modal = document.getElementById('ocrPreviewModal')
  const content = document.getElementById('ocrPreviewContent')
  
  content.innerHTML = `
    <div class="grid grid-cols-2 gap-6">
      <div>
        <h4 class="font-bold mb-2">Receipt Image</h4>
        <img src="${receipt.dataUrl}" class="w-full rounded border">
      </div>
      <div>
        <h4 class="font-bold mb-4">Extracted Data (Editable)</h4>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1">Category</label>
            <input type="text" id="ocr_category" value="${receipt.extractedData.category}" 
              class="w-full px-3 py-2 border rounded">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Merchant/Vendor</label>
            <input type="text" id="ocr_merchant" value="${receipt.extractedData.merchant || ''}" 
              class="w-full px-3 py-2 border rounded">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Amount (₹)</label>
            <input type="number" id="ocr_amount" value="${receipt.extractedData.amount || 0}" step="0.01"
              class="w-full px-3 py-2 border rounded">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Date</label>
            <input type="text" id="ocr_date" value="${receipt.extractedData.date || ''}" 
              class="w-full px-3 py-2 border rounded">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-blue-700">Add to Section *</label>
            <select id="ocr_section" class="w-full px-3 py-2 border-2 border-blue-500 rounded bg-blue-50">
              <option value="journey">Journey</option>
              <option value="hotel" ${receipt.extractedData.category.toLowerCase().includes('hotel') ? 'selected' : ''}>Hotel</option>
              <option value="conveyance" ${receipt.extractedData.category.toLowerCase().includes('taxi') || receipt.extractedData.category.toLowerCase().includes('cab') ? 'selected' : ''}>Local Conveyance</option>
              <option value="da">DA Claimed</option>
              <option value="other" ${!receipt.extractedData.category.toLowerCase().includes('hotel') && !receipt.extractedData.category.toLowerCase().includes('taxi') && !receipt.extractedData.category.toLowerCase().includes('cab') ? 'selected' : ''}>Other Expenses</option>
            </select>
            <p class="text-xs text-gray-600 mt-1">Select where to add this expense</p>
          </div>
          <div class="bg-blue-50 p-3 rounded">
            <p class="text-sm"><strong>Confidence Score:</strong> ${receipt.extractedData.confidence}%</p>
          </div>
        </div>
        <div class="mt-6 space-y-2">
          <button onclick="applyOCRDataToForm('${receipt.id}')" 
            class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
            <i class="fas fa-check mr-2"></i>Add to Form
          </button>
          <button onclick="document.getElementById('ocrPreviewModal').classList.add('hidden')" 
            class="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700">
            Close
          </button>
        </div>
      </div>
    </div>
  `
  
  modal.classList.remove('hidden')
}

function applyOCRDataToForm(receiptId) {
  const receipt = APP_STATE.receipts.find(r => r.id == receiptId)
  if (!receipt) return
  
  // Get corrected values from modal
  const correctedData = {
    category: document.getElementById('ocr_category').value,
    merchant: document.getElementById('ocr_merchant').value,
    amount: parseFloat(document.getElementById('ocr_amount').value),
    date: document.getElementById('ocr_date').value,
    section: document.getElementById('ocr_section').value // User-selected section
  }
  
  // Learn from correction
  if (AUTH_STATE.isAuthenticated) {
    learnFromCorrection(receiptId, correctedData)
  }
  
  // Add to user-selected form section
  switch (correctedData.section) {
    case 'journey':
      addJourney()
      const journeyRow = document.getElementById(`journey-${journeyCount}`)
      const journeyInputs = journeyRow.querySelectorAll('input, select')
      journeyInputs[0].value = correctedData.merchant // Departure from
      journeyInputs[7].value = correctedData.amount
      break
      
    case 'hotel':
      addHotel()
      const hotelRow = document.getElementById(`hotel-${hotelCount}`)
      const hotelInputs = hotelRow.querySelectorAll('input, select')
      hotelInputs[0].value = correctedData.merchant // Hotel name
      hotelInputs[4].value = correctedData.amount
      break
      
    case 'conveyance':
      addConveyance()
      const convRow = document.getElementById(`conveyance-${conveyanceCount}`)
      const convInputs = convRow.querySelectorAll('input')
      convInputs[0].value = correctedData.date
      convInputs[3].value = correctedData.merchant // Mode
      convInputs[4].value = correctedData.amount
      break
      
    case 'da':
      addDA()
      const daRow = document.getElementById(`da-${daCount}`)
      const daInputs = daRow.querySelectorAll('input')
      daInputs[0].value = correctedData.date
      daInputs[1].value = correctedData.merchant // City name
      daInputs[2].value = correctedData.amount
      break
      
    case 'other':
    default:
      addOther()
      const otherRow = document.getElementById(`other-${otherCount}`)
      const otherInputs = otherRow.querySelectorAll('input')
      otherInputs[0].value = correctedData.date
      otherInputs[1].value = `${correctedData.category} - ${correctedData.merchant}`
      otherInputs[2].value = correctedData.amount
      break
  }
  
  calculateTotals()
  document.getElementById('ocrPreviewModal').classList.add('hidden')
  alert('Data added to form!')
}

function deleteReceipt(index) {
  if (confirm('Delete this receipt?')) {
    APP_STATE.receipts.splice(index, 1)
    updateReceiptsDisplay()
  }
}

function showDraftsModal(drafts) {
  const modal = document.getElementById('draftsModal')
  const list = document.getElementById('draftsList')
  
  if (drafts.length === 0) {
    list.innerHTML = '<p class="text-gray-500 text-sm">No saved drafts found</p>'
  } else {
    list.innerHTML = drafts.map(draft => `
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3">
        <div>
          <p class="font-medium">${draft.draft_name || 'Unnamed Draft'}</p>
          <p class="text-sm text-gray-600">
            Updated: ${new Date(draft.updated_at).toLocaleString()}
          </p>
        </div>
        <div class="flex gap-2">
          <button onclick="loadSpecificDraft(${draft.id})" 
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            <i class="fas fa-download mr-1"></i>Load
          </button>
          <button onclick="deleteDraftFromCloud(${draft.id})" 
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('')
  }
  
  modal.classList.remove('hidden')
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ==================== INITIALIZE APP ====================

async function initApp() {
  const authenticated = await checkAuth()
  
  if (authenticated) {
    renderMainForm()
  } else {
    renderLoginScreen()
  }
}

// Start the app
initApp()
