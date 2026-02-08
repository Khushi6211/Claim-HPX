// HPX Tour Allowance Claim System - Complete Frontend
// New Finance Department Format (5 Sections)

// ===== GLOBAL STATE =====
const AUTH_STATE = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('auth_token') || null
}

const APP_STATE = {
  currentView: 'login',
  currentDraftId: null,
  receipts: [],
  formData: {},
  ocrQueue: []
}

// ===== API UTILITIES =====
async function apiCall(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  
  if (AUTH_STATE.token && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    headers['Authorization'] = `Bearer ${AUTH_STATE.token}`
  }
  
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers
    })
    
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      logout()
      throw new Error('Session expired. Please login again.')
    }
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Request failed')
    }
    
    return await response.json()
  } catch (error) {
    throw error
  }
}

// ===== AUTHENTICATION =====
async function register() {
  const employeeCode = document.getElementById('reg_employee_code').value
  const employeeName = document.getElementById('reg_employee_name').value
  const designation = document.getElementById('reg_designation').value
  const department = document.getElementById('reg_department').value
  const password = document.getElementById('reg_password').value
  const confirmPassword = document.getElementById('reg_confirm_password').value
  
  if (!employeeCode || !employeeName || !password) {
    alert('Please fill all required fields')
    return
  }
  
  if (password !== confirmPassword) {
    alert('Passwords do not match')
    return
  }
  
  if (password.length < 10) {
    alert('Password must be at least 10 characters')
    return
  }
  
  try {
    showLoading('Creating account...')
    const result = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ employee_code: employeeCode, employee_name: employeeName, designation, department, password })
    })
    
    AUTH_STATE.isAuthenticated = true
    AUTH_STATE.user = result.user
    AUTH_STATE.token = result.token
    localStorage.setItem('auth_token', result.token)
    
    hideLoading()
    showDashboard()
  } catch (error) {
    hideLoading()
    alert('Registration failed: ' + error.message)
  }
}

async function login() {
  const employeeCode = document.getElementById('login_employee_code').value
  const password = document.getElementById('login_password').value
  
  if (!employeeCode || !password) {
    alert('Please enter employee code and password')
    return
  }
  
  try {
    showLoading('Logging in...')
    const result = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ employee_code: employeeCode, password })
    })
    
    AUTH_STATE.isAuthenticated = true
    AUTH_STATE.user = result.user
    AUTH_STATE.token = result.token
    localStorage.setItem('auth_token', result.token)
    
    hideLoading()
    showDashboard()
  } catch (error) {
    hideLoading()
    alert('Login failed: ' + error.message)
  }
}

function logout() {
  AUTH_STATE.isAuthenticated = false
  AUTH_STATE.user = null
  AUTH_STATE.token = null
  localStorage.removeItem('auth_token')
  renderLoginScreen()
}

// ===== UI RENDERING =====
function renderLoginScreen() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-blue-900 mb-2">HPX Tour Allowance</h1>
          <p class="text-gray-600">Hindustan Power Exchange Limited</p>
        </div>
        
        <div class="mb-6">
          <div class="flex border-b border-gray-200">
            <button onclick="showLoginTab()" id="loginTab" class="flex-1 py-3 px-4 font-semibold text-blue-600 border-b-2 border-blue-600">Login</button>
            <button onclick="showRegisterTab()" id="registerTab" class="flex-1 py-3 px-4 font-semibold text-gray-500">Register</button>
          </div>
        </div>
        
        <div id="loginForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
            <input type="text" id="login_employee_code" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="HPX001">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" id="login_password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter password">
          </div>
          <button onclick="login()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200">
            <i class="fas fa-sign-in-alt mr-2"></i>Login
          </button>
        </div>
        
        <div id="registerForm" class="space-y-4 hidden">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Employee Code *</label>
            <input type="text" id="reg_employee_code" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="HPX001">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input type="text" id="reg_employee_name" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ashish Goel">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Designation</label>
            <input type="text" id="reg_designation" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Deputy Manager">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input type="text" id="reg_department" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Business Development">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password * (min 10 characters)</label>
            <input type="password" id="reg_password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Min 10 characters">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
            <input type="password" id="reg_confirm_password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Re-enter password">
          </div>
          <button onclick="register()" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200">
            <i class="fas fa-user-plus mr-2"></i>Create Account
          </button>
        </div>
      </div>
    </div>
    <div id="loadingOverlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 flex flex-col items-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p id="loadingText" class="text-gray-700 font-medium">Loading...</p>
      </div>
    </div>
  `
}

function showLoginTab() {
  document.getElementById('loginTab').className = 'flex-1 py-3 px-4 font-semibold text-blue-600 border-b-2 border-blue-600'
  document.getElementById('registerTab').className = 'flex-1 py-3 px-4 font-semibold text-gray-500'
  document.getElementById('loginForm').classList.remove('hidden')
  document.getElementById('registerForm').classList.add('hidden')
}

function showRegisterTab() {
  document.getElementById('loginTab').className = 'flex-1 py-3 px-4 font-semibold text-gray-500'
  document.getElementById('registerTab').className = 'flex-1 py-3 px-4 font-semibold text-blue-600 border-b-2 border-blue-600'
  document.getElementById('loginForm').classList.add('hidden')
  document.getElementById('registerForm').classList.remove('hidden')
}

// ===== DASHBOARD =====
async function showDashboard() {
  APP_STATE.currentView = 'dashboard'
  
  try {
    showLoading('Loading dashboard...')
    const summary = await apiCall('/api/claims/summary')
    hideLoading()
    
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen bg-gray-50">
        <nav class="bg-blue-900 text-white shadow-lg">
          <div class="container mx-auto px-4 py-4 flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="bg-white rounded-lg p-2">
                <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <rect fill="#1E3A8A" width="100" height="100" rx="10"/>
                  <text x="50" y="65" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#FFFFFF" text-anchor="middle">HPX</text>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-bold">HPX Tour Allowance</h1>
                <p class="text-sm text-blue-200">${AUTH_STATE.user.employee_name} (${AUTH_STATE.user.employee_code})</p>
              </div>
            </div>
            <button onclick="logout()" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition duration-200">
              <i class="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
          </div>
        </nav>
        
        <div class="container mx-auto px-4 py-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-md p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-sm font-medium">Total Claims</p>
                  <p class="text-3xl font-bold text-blue-600">${summary.totalClaims || 0}</p>
                </div>
                <div class="bg-blue-100 rounded-full p-3">
                  <i class="fas fa-file-invoice text-blue-600 text-2xl"></i>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-sm font-medium">Total Amount</p>
                  <p class="text-3xl font-bold text-green-600">₹${(summary.totalAmount || 0).toLocaleString('en-IN')}</p>
                </div>
                <div class="bg-green-100 rounded-full p-3">
                  <i class="fas fa-rupee-sign text-green-600 text-2xl"></i>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-sm font-medium">Recent Claims</p>
                  <p class="text-3xl font-bold text-purple-600">${(summary.recentClaims || []).length}</p>
                </div>
                <div class="bg-purple-100 rounded-full p-3">
                  <i class="fas fa-clock text-purple-600 text-2xl"></i>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onclick="showNewClaimForm()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center">
                <i class="fas fa-plus-circle mr-3 text-xl"></i>
                <span>New Tour Allowance Claim</span>
              </button>
              <button onclick="showMyDrafts()" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center">
                <i class="fas fa-folder-open mr-3 text-xl"></i>
                <span>My Drafts</span>
              </button>
            </div>
          </div>
          
          ${summary.recentClaims && summary.recentClaims.length > 0 ? `
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Recent Claims</h2>
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  ${summary.recentClaims.map(claim => `
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#${claim.id}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">₹${claim.total_amount.toLocaleString('en-IN')}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${claim.claim_period || 'N/A'}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(claim.submitted_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `
  } catch (error) {
    hideLoading()
    alert('Failed to load dashboard: ' + error.message)
  }
}

// ===== NEW CLAIM FORM (5 SECTIONS) =====
function showNewClaimForm() {
  APP_STATE.currentView = 'form'
  APP_STATE.currentDraftId = null
  APP_STATE.receipts = []
  APP_STATE.formData = {}
  
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-blue-900 text-white shadow-lg">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <div class="bg-white rounded-lg p-2">
              <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#1E3A8A" width="100" height="100" rx="10"/>
                <text x="50" y="65" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#FFFFFF" text-anchor="middle">HPX</text>
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold">New Tour Allowance Claim</h1>
              <p class="text-sm text-blue-200">${AUTH_STATE.user.employee_name}</p>
            </div>
          </div>
          <div class="space-x-2">
            <button onclick="saveDraft()" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg">
              <i class="fas fa-save mr-2"></i>Save Draft
            </button>
            <button onclick="showDashboard()" class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg">
              <i class="fas fa-home mr-2"></i>Dashboard
            </button>
          </div>
        </div>
      </nav>
      
      <div class="container mx-auto px-4 py-8 max-w-6xl">
        <form id="tourAllowanceForm" class="space-y-6">
          <!-- Employee Information -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Employee Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" id="employeeName" value="${AUTH_STATE.user.employee_name}" class="w-full px-3 py-2 border rounded-lg" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Employee Code *</label>
                <input type="text" id="employeeCode" value="${AUTH_STATE.user.employee_code}" class="w-full px-3 py-2 border rounded-lg" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                <input type="text" id="designation" value="${AUTH_STATE.user.designation || ''}" class="w-full px-3 py-2 border rounded-lg" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <input type="text" id="department" value="${AUTH_STATE.user.department || ''}" class="w-full px-3 py-2 border rounded-lg" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <input type="text" id="grade" placeholder="E1, E2, etc." class="w-full px-3 py-2 border rounded-lg">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date of Claim *</label>
                <input type="date" id="dateOfClaim" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 border rounded-lg" required>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Advance Drawn (₹)</label>
                <input type="number" id="advanceDrawn" value="0" class="w-full px-3 py-2 border rounded-lg" min="0">
              </div>
            </div>
          </div>
          
          <!-- Section II: Miscellaneous Expenses -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex justify-between items-center mb-4 border-b pb-2">
              <h2 class="text-xl font-bold text-gray-800">Section II: Miscellaneous Expenses</h2>
              <button type="button" onclick="addMiscExpense()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                <i class="fas fa-plus mr-2"></i>Add Expense
              </button>
            </div>
            <div id="miscExpensesContainer" class="space-y-3"></div>
          </div>
          
          <!-- Section III: Journey Details -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex justify-between items-center mb-4 border-b pb-2">
              <h2 class="text-xl font-bold text-gray-800">Section III: Journey Details</h2>
              <button type="button" onclick="addJourney()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                <i class="fas fa-plus mr-2"></i>Add Journey
              </button>
            </div>
            <div id="journeysContainer" class="space-y-4"></div>
          </div>
          
          <!-- Section IV: DA & Accommodation -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex justify-between items-center mb-4 border-b pb-2">
              <h2 class="text-xl font-bold text-gray-800">Section IV: DA & Accommodation</h2>
              <button type="button" onclick="addDA()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                <i class="fas fa-plus mr-2"></i>Add DA Entry
              </button>
            </div>
            <div id="daContainer" class="space-y-4"></div>
          </div>
          
          <!-- Section V: Conveyance Charges -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex justify-between items-center mb-4 border-b pb-2">
              <h2 class="text-xl font-bold text-gray-800">Section V: Conveyance Charges</h2>
              <button type="button" onclick="addConveyance()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                <i class="fas fa-plus mr-2"></i>Add Conveyance
              </button>
            </div>
            <div id="conveyanceContainer" class="space-y-3"></div>
          </div>
          
          <!-- Submit Buttons -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex flex-col md:flex-row gap-4">
              <button type="button" onclick="generateExcel()" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">
                <i class="fas fa-file-excel mr-2"></i>Generate Excel File
              </button>
              <button type="button" onclick="submitClaim()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
                <i class="fas fa-paper-plane mr-2"></i>Submit Claim
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `
  
  // Add initial rows
  addMiscExpense()
  addJourney()
  addDA()
  addConveyance()
}

// ===== FORM SECTION FUNCTIONS =====
let miscCounter = 0
function addMiscExpense() {
  miscCounter++
  const container = document.getElementById('miscExpensesContainer')
  const div = document.createElement('div')
  div.className = 'grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded border'
  div.innerHTML = `
    <div class="col-span-1">
      <input type="number" value="${miscCounter}" class="w-full px-2 py-1 border rounded text-center" readonly>
    </div>
    <div class="col-span-7">
      <input type="text" placeholder="Particulars of Expenses" class="misc-particulars w-full px-3 py-2 border rounded">
    </div>
    <div class="col-span-3">
      <input type="number" placeholder="Amount" class="misc-amount w-full px-3 py-2 border rounded" min="0" value="0">
    </div>
    <div class="col-span-1 text-center">
      <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-600 hover:text-red-800">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `
  container.appendChild(div)
}

let journeyCounter = 0
function addJourney() {
  journeyCounter++
  const container = document.getElementById('journeysContainer')
  const div = document.createElement('div')
  div.className = 'p-4 bg-gray-50 rounded border'
  div.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="md:col-span-3 font-bold text-gray-700 border-b pb-2">Journey #${journeyCounter}</div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Departure Date</label>
        <input type="date" class="journey-dep-date w-full px-2 py-1 border rounded text-sm">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Departure Time</label>
        <input type="time" class="journey-dep-time w-full px-2 py-1 border rounded text-sm">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Departure Station</label>
        <input type="text" class="journey-dep-station w-full px-2 py-1 border rounded text-sm" placeholder="New Delhi">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Arrival Date</label>
        <input type="date" class="journey-arr-date w-full px-2 py-1 border rounded text-sm">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Arrival Time</label>
        <input type="time" class="journey-arr-time w-full px-2 py-1 border rounded text-sm">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Arrival Station</label>
        <input type="text" class="journey-arr-station w-full px-2 py-1 border rounded text-sm" placeholder="Mumbai">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Mode & Class</label>
        <input type="text" class="journey-mode w-full px-2 py-1 border rounded text-sm" placeholder="Flight - Economy">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Train/Flight No</label>
        <input type="text" class="journey-trainno w-full px-2 py-1 border rounded text-sm" placeholder="AI 101">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Ticket/PNR No</label>
        <input type="text" class="journey-ticket w-full px-2 py-1 border rounded text-sm" placeholder="TKT123">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Amount (₹)</label>
        <input type="number" class="journey-amount w-full px-2 py-1 border rounded text-sm" min="0" value="0">
      </div>
      <div class="md:col-span-2">
        <label class="block text-xs text-gray-600 mb-1">Purpose</label>
        <input type="text" class="journey-purpose w-full px-2 py-1 border rounded text-sm" placeholder="Client meeting">
      </div>
      <div class="md:col-span-3">
        <label class="block text-xs text-gray-600 mb-1">Remarks</label>
        <input type="text" class="journey-remarks w-full px-2 py-1 border rounded text-sm">
      </div>
      <div class="md:col-span-3 text-right">
        <button type="button" onclick="this.closest('.p-4').remove()" class="text-red-600 hover:text-red-800 text-sm">
          <i class="fas fa-trash mr-1"></i>Remove Journey
        </button>
      </div>
    </div>
  `
  container.appendChild(div)
}

let daCounter = 0
function addDA() {
  daCounter++
  const container = document.getElementById('daContainer')
  const div = document.createElement('div')
  div.className = 'p-4 bg-gray-50 rounded border'
  div.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div class="md:col-span-4 font-bold text-gray-700 border-b pb-2">DA Entry #${daCounter}</div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">City Type</label>
        <select class="da-citytype w-full px-2 py-1 border rounded text-sm">
          <option>Principal City</option>
          <option>Ordinary City</option>
          <option>Journey</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Station</label>
        <input type="text" class="da-station w-full px-2 py-1 border rounded text-sm" placeholder="Mumbai">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Date(s)</label>
        <input type="text" class="da-dates w-full px-2 py-1 border rounded text-sm" placeholder="15-Oct to 18-Oct">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">No. of Days for DA</label>
        <input type="number" class="da-days w-full px-2 py-1 border rounded text-sm" min="0" value="1">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Rate per Day (₹)</label>
        <input type="number" class="da-rate w-full px-2 py-1 border rounded text-sm" min="0" value="0">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Hotel Name</label>
        <input type="text" class="da-hotel w-full px-2 py-1 border rounded text-sm" placeholder="The Taj Hotel">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Hotel Amount (₹)</label>
        <input type="number" class="da-hotel-amount w-full px-2 py-1 border rounded text-sm" min="0" value="0">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Shared With</label>
        <input type="text" class="da-shared w-full px-2 py-1 border rounded text-sm" placeholder="Name (optional)">
      </div>
      <div class="md:col-span-4 text-right">
        <button type="button" onclick="this.closest('.p-4').remove()" class="text-red-600 hover:text-red-800 text-sm">
          <i class="fas fa-trash mr-1"></i>Remove Entry
        </button>
      </div>
    </div>
  `
  container.appendChild(div)
}

let conveyanceCounter = 0
function addConveyance() {
  conveyanceCounter++
  const container = document.getElementById('conveyanceContainer')
  const div = document.createElement('div')
  div.className = 'grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded border'
  div.innerHTML = `
    <div class="col-span-1">
      <input type="date" class="conv-date w-full px-1 py-1 border rounded text-xs">
    </div>
    <div class="col-span-2">
      <input type="text" class="conv-station w-full px-2 py-1 border rounded text-sm" placeholder="Station">
    </div>
    <div class="col-span-2">
      <input type="text" class="conv-from w-full px-2 py-1 border rounded text-sm" placeholder="From">
    </div>
    <div class="col-span-2">
      <input type="text" class="conv-to w-full px-2 py-1 border rounded text-sm" placeholder="To">
    </div>
    <div class="col-span-1">
      <input type="number" class="conv-km w-full px-2 py-1 border rounded text-sm" placeholder="KM" min="0">
    </div>
    <div class="col-span-1">
      <input type="text" class="conv-means w-full px-2 py-1 border rounded text-sm" placeholder="Taxi">
    </div>
    <div class="col-span-1">
      <input type="number" class="conv-amount w-full px-2 py-1 border rounded text-sm" placeholder="₹" min="0" value="0">
    </div>
    <div class="col-span-1">
      <input type="text" class="conv-purpose w-full px-2 py-1 border rounded text-sm" placeholder="Purpose">
    </div>
    <div class="col-span-1 text-center">
      <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-600 hover:text-red-800">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `
  container.appendChild(div)
}

// ===== DATA COLLECTION =====
function collectFormData() {
  // Employee info
  const data = {
    employeeName: document.getElementById('employeeName').value,
    designation: document.getElementById('designation').value,
    employeeCode: document.getElementById('employeeCode').value,
    grade: document.getElementById('grade').value || '',
    department: document.getElementById('department').value,
    dateOfClaim: document.getElementById('dateOfClaim').value,
    advanceDrawn: parseFloat(document.getElementById('advanceDrawn').value) || 0,
    
    miscExpenses: [],
    journeys: [],
    daDetails: [],
    conveyances: []
  }
  
  // Misc expenses
  document.querySelectorAll('#miscExpensesContainer > div').forEach((row, idx) => {
    data.miscExpenses.push({
      sno: idx + 1,
      particulars: row.querySelector('.misc-particulars').value,
      amount: parseFloat(row.querySelector('.misc-amount').value) || 0
    })
  })
  
  // Journeys
  document.querySelectorAll('#journeysContainer > div').forEach(row => {
    data.journeys.push({
      departureDate: row.querySelector('.journey-dep-date').value,
      departureTime: row.querySelector('.journey-dep-time').value,
      departureStation: row.querySelector('.journey-dep-station').value,
      arrivalDate: row.querySelector('.journey-arr-date').value,
      arrivalTime: row.querySelector('.journey-arr-time').value,
      arrivalStation: row.querySelector('.journey-arr-station').value,
      modeClass: row.querySelector('.journey-mode').value,
      trainNo: row.querySelector('.journey-trainno').value,
      purpose: row.querySelector('.journey-purpose').value,
      amount: parseFloat(row.querySelector('.journey-amount').value) || 0,
      ticketNo: row.querySelector('.journey-ticket').value,
      remarks: row.querySelector('.journey-remarks').value
    })
  })
  
  // DA & Accommodation
  document.querySelectorAll('#daContainer > div').forEach(row => {
    data.daDetails.push({
      cityType: row.querySelector('.da-citytype').value,
      station: row.querySelector('.da-station').value,
      dates: row.querySelector('.da-dates').value,
      daysForDA: parseInt(row.querySelector('.da-days').value) || 0,
      ratePerDay: parseFloat(row.querySelector('.da-rate').value) || 0,
      hotelName: row.querySelector('.da-hotel').value,
      hotelAmount: parseFloat(row.querySelector('.da-hotel-amount').value) || 0,
      sharedWith: row.querySelector('.da-shared').value
    })
  })
  
  // Conveyances
  document.querySelectorAll('#conveyanceContainer > div').forEach(row => {
    data.conveyances.push({
      date: row.querySelector('.conv-date').value,
      station: row.querySelector('.conv-station').value,
      placeFrom: row.querySelector('.conv-from').value,
      placeTo: row.querySelector('.conv-to').value,
      distanceKm: parseFloat(row.querySelector('.conv-km').value) || 0,
      meansOfTravel: row.querySelector('.conv-means').value,
      amount: parseFloat(row.querySelector('.conv-amount').value) || 0,
      purpose: row.querySelector('.conv-purpose').value
    })
  })
  
  return data
}

// ===== ACTIONS =====
async function saveDraft() {
  try {
    showLoading('Saving draft...')
    const formData = collectFormData()
    const draftName = prompt('Enter draft name:', `Draft ${new Date().toLocaleDateString()}`)
    
    if (!draftName) {
      hideLoading()
      return
    }
    
    await apiCall('/api/drafts', {
      method: 'POST',
      body: JSON.stringify({
        draft_name: draftName,
        form_data: formData,
        receipts_data: APP_STATE.receipts,
        draft_id: APP_STATE.currentDraftId
      })
    })
    
    hideLoading()
    alert('Draft saved successfully!')
  } catch (error) {
    hideLoading()
    alert('Failed to save draft: ' + error.message)
  }
}

async function generateExcel() {
  try {
    showLoading('Generating Excel...')
    const data = collectFormData()
    
    const response = await fetch('/api/generate-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) throw new Error('Generation failed')
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Tour_Allowance_${data.employeeName}_${data.dateOfClaim}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    hideLoading()
    alert('Excel file generated successfully!')
  } catch (error) {
    hideLoading()
    alert('Failed to generate Excel: ' + error.message)
  }
}

async function submitClaim() {
  try {
    if (!confirm('Submit this claim? You cannot edit after submission.')) return
    
    showLoading('Submitting claim...')
    const data = collectFormData()
    
    const result = await apiCall('/api/claims', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    
    hideLoading()
    alert(`Claim submitted successfully!\n\nClaim ID: ${result.claim_id}\nTotal: ₹${result.totalClaimed.toLocaleString('en-IN')}\nNet Claim: ₹${result.netClaim.toLocaleString('en-IN')}`)
    showDashboard()
  } catch (error) {
    hideLoading()
    alert('Failed to submit claim: ' + error.message)
  }
}

async function showMyDrafts() {
  try {
    showLoading('Loading drafts...')
    const result = await apiCall('/api/drafts')
    hideLoading()
    
    if (!result.drafts || result.drafts.length === 0) {
      alert('No drafts found')
      return
    }
    
    // Create modal overlay
    const modalHTML = `
      <div id="draftsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div class="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
            <h2 class="text-2xl font-bold">
              <i class="fas fa-folder-open mr-2"></i>My Drafts (${result.drafts.length})
            </h2>
            <button onclick="closeMyDraftsModal()" class="text-white hover:text-gray-200">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div class="grid gap-4">
              ${result.drafts.map(draft => `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h3 class="font-bold text-lg text-gray-800">${draft.draft_name || 'Untitled Draft'}</h3>
                      <p class="text-sm text-gray-500 mt-1">
                        <i class="fas fa-clock mr-1"></i>Last updated: ${new Date(draft.updated_at).toLocaleString('en-IN')}
                      </p>
                      <p class="text-sm text-gray-500">
                        <i class="fas fa-calendar mr-1"></i>Created: ${new Date(draft.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div class="flex gap-2">
                      <button onclick="loadDraft(${draft.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                        <i class="fas fa-edit mr-1"></i>Load
                      </button>
                      <button onclick="deleteDraft(${draft.id})" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
                        <i class="fas fa-trash mr-1"></i>Delete
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="bg-gray-50 px-6 py-4 flex justify-end">
            <button onclick="closeMyDraftsModal()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">
              Close
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
  } catch (error) {
    hideLoading()
    alert('Failed to load drafts: ' + error.message)
  }
}

function closeMyDraftsModal() {
  const modal = document.getElementById('draftsModal')
  if (modal) modal.remove()
}

async function loadDraft(draftId) {
  try {
    showLoading('Loading draft...')
    const draft = await apiCall(`/api/drafts/${draftId}`)
    hideLoading()
    
    APP_STATE.currentDraftId = draftId
    APP_STATE.formData = JSON.parse(draft.form_data || '{}')
    
    closeMyDraftsModal()
    showNewClaimForm()
    
    // Populate form with draft data
    setTimeout(() => {
      Object.keys(APP_STATE.formData).forEach(key => {
        const input = document.getElementById(key)
        if (input) input.value = APP_STATE.formData[key]
      })
    }, 100)
    
    alert('Draft loaded successfully!')
  } catch (error) {
    hideLoading()
    alert('Failed to load draft: ' + error.message)
  }
}

async function deleteDraft(draftId) {
  if (!confirm('Are you sure you want to delete this draft?')) return
  
  try {
    showLoading('Deleting draft...')
    await apiCall(`/api/drafts/${draftId}`, { method: 'DELETE' })
    hideLoading()
    
    closeMyDraftsModal()
    alert('Draft deleted successfully!')
    showMyDrafts() // Refresh the list
  } catch (error) {
    hideLoading()
    alert('Failed to delete draft: ' + error.message)
  }
}

// ===== UTILITIES =====
function showLoading(text) {
  const overlay = document.getElementById('loadingOverlay')
  const loadingText = document.getElementById('loadingText')
  if (overlay) {
    overlay.classList.remove('hidden')
    if (loadingText) loadingText.textContent = text
  }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay')
  if (overlay) overlay.classList.add('hidden')
}

// ===== INITIALIZATION =====
async function init() {
  if (AUTH_STATE.token) {
    try {
      const result = await apiCall('/api/auth/me')
      AUTH_STATE.isAuthenticated = true
      AUTH_STATE.user = result.user
      showDashboard()
    } catch (error) {
      renderLoginScreen()
    }
  } else {
    renderLoginScreen()
  }
}

// Start app
init()
