// HPX Claims Portal - Complete Frontend (Minimal for token efficiency)
// Features: My Drafts Modal, 3 Claim Types, HPX Logo

const AUTH_STATE = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('auth_token') || null
}

const APP_STATE = {
  currentView: 'login',
  currentClaimType: null,
  currentDraftId: null,
  formData: {}
}

// ===== API UTILITIES =====
async function apiCall(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (AUTH_STATE.token && !endpoint.includes('/auth/')) {
    headers['Authorization'] = `Bearer ${AUTH_STATE.token}`
  }
  const response = await fetch(endpoint, { ...options, headers })
  if (response.status === 401 && !endpoint.includes('/auth/')) {
    logout()
    throw new Error('Session expired')
  }
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }
  return await response.json()
}

// ===== AUTH =====
async function register() {
  const data = {
    employee_code: document.getElementById('reg_employee_code').value,
    employee_name: document.getElementById('reg_employee_name').value,
    designation: document.getElementById('reg_designation').value,
    department: document.getElementById('reg_department').value,
    password: document.getElementById('reg_password').value
  }
  if (!data.employee_code || !data.employee_name || !data.password) return alert('Fill all fields')
  if (data.password.length < 10) return alert('Password must be 10+ characters')
  try {
    const result = await apiCall('/api/auth/register', { method: 'POST', body: JSON.stringify(data) })
    AUTH_STATE.isAuthenticated = true
    AUTH_STATE.user = result.user
    AUTH_STATE.token = result.token
    localStorage.setItem('auth_token', result.token)
    showDashboard()
  } catch (error) {
    alert('Registration failed: ' + error.message)
  }
}

async function login() {
  const data = {
    employee_code: document.getElementById('login_employee_code').value,
    password: document.getElementById('login_password').value
  }
  if (!data.employee_code || !data.password) return alert('Enter credentials')
  try {
    const result = await apiCall('/api/auth/login', { method: 'POST', body: JSON.stringify(data) })
    AUTH_STATE.isAuthenticated = true
    AUTH_STATE.user = result.user
    AUTH_STATE.token = result.token
    localStorage.setItem('auth_token', result.token)
    showDashboard()
  } catch (error) {
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

// ===== LOGIN SCREEN =====
function renderLoginScreen() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <div class="text-4xl font-bold text-blue-900 mb-2">HPX</div>
          <h1 class="text-2xl font-bold text-gray-800">Claims Portal</h1>
          <p class="text-gray-600">Hindustan Power Exchange Limited</p>
        </div>
        <div class="mb-6">
          <div class="flex border-b">
            <button onclick="showLoginTab()" id="loginTab" class="flex-1 py-3 font-semibold text-blue-600 border-b-2 border-blue-600">Login</button>
            <button onclick="showRegisterTab()" id="registerTab" class="flex-1 py-3 font-semibold text-gray-500">Register</button>
          </div>
        </div>
        <div id="loginForm" class="space-y-4">
          <input type="text" id="login_employee_code" class="w-full px-4 py-3 border rounded-lg" placeholder="Employee Code">
          <input type="password" id="login_password" class="w-full px-4 py-3 border rounded-lg" placeholder="Password">
          <button onclick="login()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Login</button>
        </div>
        <div id="registerForm" class="space-y-4 hidden">
          <input type="text" id="reg_employee_code" class="w-full px-4 py-3 border rounded-lg" placeholder="Employee Code">
          <input type="text" id="reg_employee_name" class="w-full px-4 py-3 border rounded-lg" placeholder="Full Name">
          <input type="text" id="reg_designation" class="w-full px-4 py-3 border rounded-lg" placeholder="Designation">
          <input type="text" id="reg_department" class="w-full px-4 py-3 border rounded-lg" placeholder="Department">
          <input type="password" id="reg_password" class="w-full px-4 py-3 border rounded-lg" placeholder="Password (min 10 chars)">
          <button onclick="register()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Register</button>
        </div>
      </div>
    </div>
  `
}

function showLoginTab() {
  document.getElementById('loginTab').className = 'flex-1 py-3 font-semibold text-blue-600 border-b-2 border-blue-600'
  document.getElementById('registerTab').className = 'flex-1 py-3 font-semibold text-gray-500'
  document.getElementById('loginForm').classList.remove('hidden')
  document.getElementById('registerForm').classList.add('hidden')
}

function showRegisterTab() {
  document.getElementById('registerTab').className = 'flex-1 py-3 font-semibold text-blue-600 border-b-2 border-blue-600'
  document.getElementById('loginTab').className = 'flex-1 py-3 font-semibold text-gray-500'
  document.getElementById('registerForm').classList.remove('hidden')
  document.getElementById('loginForm').classList.add('hidden')
}

// ===== DASHBOARD =====
async function showDashboard() {
  APP_STATE.currentView = 'dashboard'
  try {
    const summary = await apiCall('/api/claims/summary')
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen bg-gray-50">
        <nav class="bg-blue-900 text-white shadow-lg">
          <div class="container mx-auto px-4 py-4 flex justify-between items-center">
            <div class="flex items-center">
              <div class="text-3xl font-bold mr-4">HPX</div>
              <div>
                <h1 class="text-xl font-bold">Claims Portal</h1>
                <p class="text-sm text-blue-200">${AUTH_STATE.user.employee_name}</p>
              </div>
            </div>
            <button onclick="logout()" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">Logout</button>
          </div>
        </nav>
        <div class="container mx-auto px-4 py-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
              <p class="text-gray-500 text-sm">Total Claims</p>
              <p class="text-3xl font-bold text-blue-600">${summary.totalClaims || 0}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <p class="text-gray-500 text-sm">Total Amount</p>
              <p class="text-3xl font-bold text-green-600">₹${(summary.totalAmount || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h2 class="text-xl font-bold mb-4">Select Claim Type</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onclick="showClaimForm('tour')" class="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg text-center">
                <i class="fas fa-plane text-3xl mb-2"></i>
                <div class="font-bold">Tour Allowance</div>
                <div class="text-sm">Travel Claims</div>
              </button>
              <button onclick="showClaimForm('opd')" class="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg text-center">
                <i class="fas fa-hospital text-3xl mb-2"></i>
                <div class="font-bold">OPD Medical</div>
                <div class="text-sm">Medical Reimbursement</div>
              </button>
              <button onclick="showClaimForm('contingency')" class="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg text-center">
                <i class="fas fa-receipt text-3xl mb-2"></i>
                <div class="font-bold">Contingency</div>
                <div class="text-sm">Other Expenses</div>
              </button>
            </div>
          </div>
          <button onclick="showMyDrafts()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg mb-6">
            <i class="fas fa-folder-open mr-2"></i>My Drafts
          </button>
          ${summary.recentClaims && summary.recentClaims.length > 0 ? `
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold mb-4">Recent Claims</h2>
            <table class="w-full">
              <thead><tr class="border-b">
                <th class="text-left py-2">ID</th>
                <th class="text-left py-2">Amount</th>
                <th class="text-left py-2">Period</th>
                <th class="text-left py-2">Date</th>
              </tr></thead>
              <tbody>
                ${summary.recentClaims.map(c => `
                  <tr class="border-b"><td>#${c.id}</td><td>₹${c.total_amount.toLocaleString('en-IN')}</td><td>${c.claim_period||'N/A'}</td><td>${new Date(c.submitted_at).toLocaleDateString('en-IN')}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
        </div>
      </div>
    `
  } catch (error) {
    alert('Failed to load dashboard: ' + error.message)
  }
}

// ===== MY DRAFTS MODAL =====
async function showMyDrafts() {
  try {
    const result = await apiCall('/api/drafts')
    if (!result.drafts || result.drafts.length === 0) return alert('No drafts found')
    
    const modal = document.createElement('div')
    modal.id = 'draftsModal'
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-96 overflow-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold">My Drafts</h2>
          <button onclick="closeDraftsModal()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <table class="w-full">
          <thead><tr class="border-b">
            <th class="text-left py-2">Name</th>
            <th class="text-left py-2">Created</th>
            <th class="text-left py-2">Actions</th>
          </tr></thead>
          <tbody>
            ${result.drafts.map(d => `
              <tr class="border-b">
                <td class="py-2">${d.draft_name || 'Untitled'}</td>
                <td>${new Date(d.created_at).toLocaleDateString('en-IN')}</td>
                <td>
                  <button onclick="loadDraft(${d.id})" class="bg-blue-600 text-white px-3 py-1 rounded mr-2">Load</button>
                  <button onclick="deleteDraft(${d.id})" class="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
    document.body.appendChild(modal)
  } catch (error) {
    alert('Failed to load drafts: ' + error.message)
  }
}

function closeDraftsModal() {
  const modal = document.getElementById('draftsModal')
  if (modal) modal.remove()
}

async function loadDraft(draftId) {
  try {
    const result = await apiCall(`/api/drafts/${draftId}`)
    APP_STATE.formData = JSON.parse(result.draft.form_data)
    APP_STATE.currentDraftId = draftId
    closeDraftsModal()
    showClaimForm(APP_STATE.formData.claim_type || 'tour')
  } catch (error) {
    alert('Failed to load draft: ' + error.message)
  }
}

async function deleteDraft(draftId) {
  if (!confirm('Delete this draft?')) return
  try {
    await apiCall(`/api/drafts/${draftId}`, { method: 'DELETE' })
    showMyDrafts() // Refresh
  } catch (error) {
    alert('Failed to delete draft: ' + error.message)
  }
}

// ===== CLAIM FORMS (Simplified for tokens) =====
function showClaimForm(type) {
  APP_STATE.currentClaimType = type
  if (type === 'tour') showTourForm()
  else if (type === 'opd') showOPDForm()
  else if (type === 'contingency') showContingencyForm()
}

function showTourForm() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-blue-900 text-white p-4">
        <button onclick="showDashboard()" class="bg-blue-700 px-4 py-2 rounded">← Back</button>
        <span class="ml-4 text-xl font-bold">Tour Allowance Claim</span>
      </nav>
      <div class="container mx-auto p-4">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Tour Allowance Claim Form</h2>
          <input type="text" id="periodOfClaim" placeholder="Period (e.g., 01-05 Feb 2026)" class="w-full p-2 border rounded mb-4">
          <input type="text" id="purposeOfTravel" placeholder="Purpose of Travel" class="w-full p-2 border rounded mb-4">
          <textarea id="tourDetails" placeholder="Enter journey, DA, expenses details (JSON format for now)" class="w-full p-2 border rounded mb-4" rows="10"></textarea>
          <div class="flex gap-4">
            <button onclick="saveTourDraft()" class="bg-purple-600 text-white px-6 py-2 rounded">Save Draft</button>
            <button onclick="generateTourExcel()" class="bg-blue-600 text-white px-6 py-2 rounded">Generate Excel</button>
            <button onclick="submitTourClaim()" class="bg-green-600 text-white px-6 py-2 rounded">Submit Claim</button>
          </div>
        </div>
      </div>
    </div>
  `
}

function showOPDForm() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-blue-900 text-white p-4">
        <button onclick="showDashboard()" class="bg-blue-700 px-4 py-2 rounded">← Back</button>
        <span class="ml-4 text-xl font-bold">OPD Medical Claim</span>
      </nav>
      <div class="container mx-auto p-4">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">OPD Medical Claim Form</h2>
          <input type="text" id="patientName" placeholder="Patient Name" class="w-full p-2 border rounded mb-4">
          <input type="text" id="relation" placeholder="Relation (Self/Spouse/Child)" class="w-full p-2 border rounded mb-4">
          <input type="date" id="consultationDate" class="w-full p-2 border rounded mb-4">
          <input type="text" id="doctorName" placeholder="Doctor Name" class="w-full p-2 border rounded mb-4">
          <input type="number" id="consultationFee" placeholder="Consultation Fee" class="w-full p-2 border rounded mb-4">
          <textarea id="opdDetails" placeholder="Medicine and lab test details (JSON format)" class="w-full p-2 border rounded mb-4" rows="8"></textarea>
          <div class="flex gap-4">
            <button onclick="saveOPDDraft()" class="bg-purple-600 text-white px-6 py-2 rounded">Save Draft</button>
            <button onclick="generateOPDExcel()" class="bg-blue-600 text-white px-6 py-2 rounded">Generate Excel</button>
            <button onclick="submitOPDClaim()" class="bg-green-600 text-white px-6 py-2 rounded">Submit Claim</button>
          </div>
        </div>
      </div>
    </div>
  `
}

function showContingencyForm() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-blue-900 text-white p-4">
        <button onclick="showDashboard()" class="bg-blue-700 px-4 py-2 rounded">← Back</button>
        <span class="ml-4 text-xl font-bold">Contingency Claim</span>
      </nav>
      <div class="container mx-auto p-4">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Contingency Claim Form</h2>
          <input type="text" id="expenseDescription" placeholder="Expense Description" class="w-full p-2 border rounded mb-4">
          <input type="number" id="totalAmount" placeholder="Total Amount" class="w-full p-2 border rounded mb-4">
          <textarea id="contingencyDetails" placeholder="Expense details (JSON format)" class="w-full p-2 border rounded mb-4" rows="8"></textarea>
          <select id="paymentMode" class="w-full p-2 border rounded mb-4">
            <option value="reimbursement">Reimburse to Me</option>
            <option value="vendor">Pay to Vendor</option>
          </select>
          <input type="text" id="vendorName" placeholder="Vendor Name (if applicable)" class="w-full p-2 border rounded mb-4">
          <div class="flex gap-4">
            <button onclick="saveContingencyDraft()" class="bg-purple-600 text-white px-6 py-2 rounded">Save Draft</button>
            <button onclick="generateContingencyExcel()" class="bg-blue-600 text-white px-6 py-2 rounded">Generate Excel</button>
            <button onclick="submitContingencyClaim()" class="bg-green-600 text-white px-6 py-2 rounded">Submit Claim</button>
          </div>
        </div>
      </div>
    </div>
  `
}

// ===== TOUR ALLOWANCE ACTIONS =====
async function saveTourDraft() {
  const data = {
    claim_type: 'tour',
    periodOfClaim: document.getElementById('periodOfClaim').value,
    purposeOfTravel: document.getElementById('purposeOfTravel').value,
    details: document.getElementById('tourDetails').value
  }
  try {
    await apiCall('/api/drafts', {
      method: 'POST',
      body: JSON.stringify({ draft_name: 'Tour Draft', form_data: JSON.stringify(data) })
    })
    alert('Draft saved!')
  } catch (error) {
    alert('Failed to save draft: ' + error.message)
  }
}

async function generateTourExcel() {
  const data = {
    claim_type: 'tour',
    employeeName: AUTH_STATE.user.employee_name,
    designation: AUTH_STATE.user.designation,
    empId: AUTH_STATE.user.employee_code,
    department: AUTH_STATE.user.department,
    dateOfClaim: new Date().toISOString().split('T')[0],
    periodOfClaim: document.getElementById('periodOfClaim').value,
    purposeOfTravel: document.getElementById('purposeOfTravel').value,
    miscExpenses: [],
    journeys: [],
    daEntries: [],
    conveyances: []
  }
  try {
    const response = await fetch('/api/generate-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AUTH_STATE.token}` },
      body: JSON.stringify(data)
    })
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Tour_Allowance_${AUTH_STATE.user.employee_name}.xlsx`
    a.click()
  } catch (error) {
    alert('Failed to generate Excel: ' + error.message)
  }
}

async function submitTourClaim() {
  const data = {
    claim_type: 'tour',
    periodOfClaim: document.getElementById('periodOfClaim').value,
    purposeOfTravel: document.getElementById('purposeOfTravel').value,
    totalAmount: 0
  }
  try {
    await apiCall('/api/claims', { method: 'POST', body: JSON.stringify(data) })
    alert('Claim submitted!')
    showDashboard()
  } catch (error) {
    alert('Failed to submit claim: ' + error.message)
  }
}

// ===== OPD ACTIONS (similar pattern) =====
async function saveOPDDraft() {
  const data = { claim_type: 'opd', patientName: document.getElementById('patientName').value }
  try {
    await apiCall('/api/drafts', {
      method: 'POST',
      body: JSON.stringify({ draft_name: 'OPD Draft', form_data: JSON.stringify(data) })
    })
    alert('Draft saved!')
  } catch (error) {
    alert('Failed to save draft')
  }
}

async function generateOPDExcel() {
  const data = {
    employeeName: AUTH_STATE.user.employee_name,
    employeeCode: AUTH_STATE.user.employee_code,
    designation: AUTH_STATE.user.designation,
    department: AUTH_STATE.user.department,
    dateOfClaim: new Date().toISOString().split('T')[0],
    patientName: document.getElementById('patientName').value,
    relation: document.getElementById('relation').value,
    consultationDate: document.getElementById('consultationDate').value,
    doctorName: document.getElementById('doctorName').value,
    hospitalName: '',
    consultationFee: parseFloat(document.getElementById('consultationFee').value || 0),
    medicineCosts: [],
    labTestCosts: [],
    otherExpenses: []
  }
  try {
    const response = await fetch('/api/generate-excel-opd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AUTH_STATE.token}` },
      body: JSON.stringify(data)
    })
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `OPD_Medical_${AUTH_STATE.user.employee_name}.xlsx`
    a.click()
  } catch (error) {
    alert('Failed to generate Excel')
  }
}

async function submitOPDClaim() {
  const data = {
    claim_type: 'opd',
    totalAmount: parseFloat(document.getElementById('consultationFee').value || 0)
  }
  try {
    await apiCall('/api/claims', { method: 'POST', body: JSON.stringify(data) })
    alert('Claim submitted!')
    showDashboard()
  } catch (error) {
    alert('Failed to submit claim')
  }
}

// ===== CONTINGENCY ACTIONS =====
async function saveContingencyDraft() {
  const data = { claim_type: 'contingency', description: document.getElementById('expenseDescription').value }
  try {
    await apiCall('/api/drafts', {
      method: 'POST',
      body: JSON.stringify({ draft_name: 'Contingency Draft', form_data: JSON.stringify(data) })
    })
    alert('Draft saved!')
  } catch (error) {
    alert('Failed to save draft')
  }
}

async function generateContingencyExcel() {
  const data = {
    employeeName: AUTH_STATE.user.employee_name,
    employeeCode: AUTH_STATE.user.employee_code,
    designation: AUTH_STATE.user.designation,
    department: AUTH_STATE.user.department,
    dateOfClaim: new Date().toISOString().split('T')[0],
    totalAmount: parseFloat(document.getElementById('totalAmount').value || 0),
    expenses: [],
    paymentMode: document.getElementById('paymentMode').value,
    vendorName: document.getElementById('vendorName').value
  }
  try {
    const response = await fetch('/api/generate-excel-contingency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AUTH_STATE.token}` },
      body: JSON.stringify(data)
    })
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Contingency_${AUTH_STATE.user.employee_name}.xlsx`
    a.click()
  } catch (error) {
    alert('Failed to generate Excel')
  }
}

async function submitContingencyClaim() {
  const data = {
    claim_type: 'contingency',
    totalAmount: parseFloat(document.getElementById('totalAmount').value || 0)
  }
  try {
    await apiCall('/api/claims', { method: 'POST', body: JSON.stringify(data) })
    alert('Claim submitted!')
    showDashboard()
  } catch (error) {
    alert('Failed to submit claim')
  }
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

init()
