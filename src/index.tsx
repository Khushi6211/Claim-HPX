import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { hashPassword, verifyPassword, createSession, verifySession, hashToken, User } from './auth'
import { sanitizeExcelValue, sanitizeFilename, validateInput, validatePassword } from './security'
import { generateTourAllowanceExcel, TourAllowanceData } from './excel-tour-print-ready'
import { generateOPDMedicalExcel, OPDMedicalData } from './excel-opd-medical'
import { generateContingencyExcel, ContingencyData } from './excel-contingency'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// ===== SECURITY: Restricted CORS =====
app.use('/api/*', cors({
  origin: (origin) => {
    // Allow main domain and all subdomains (deployment previews)
    if (origin === 'https://hpx-travel-reimb.pages.dev' || 
        (origin && origin.endsWith('.hpx-travel-reimb.pages.dev'))) {
      return origin
    }
    return 'https://hpx-travel-reimb.pages.dev'
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ===== AUTHENTICATION MIDDLEWARE =====
async function requireAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401)
  }
  
  const token = authHeader.replace('Bearer ', '')
  const user = await verifySession(c.env.DB, token)
  
  if (!user) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
  
  c.set('user', user)
  await next()
}

// ===== AUTHENTICATION APIs =====

// Register
app.post('/api/auth/register', async (c) => {
  try {
    const { employee_code, employee_name, designation, department, password } = await c.req.json()
    
    if (!employee_code || !employee_name || !password) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    
    // SECURITY: Validate password (minimum 10 characters)
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return c.json({ error: passwordValidation.error }, 400)
    }
    
    // Check if user exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE employee_code = ?'
    ).bind(employee_code).first()
    
    if (existing) {
      return c.json({ error: 'Employee code already registered' }, 400)
    }
    
    // Hash password
    const password_hash = await hashPassword(password)
    
    // Create user
    const result = await c.env.DB.prepare(`
      INSERT INTO users (employee_code, employee_name, designation, department, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      validateInput(employee_code),
      validateInput(employee_name),
      validateInput(designation || ''),
      validateInput(department || ''),
      password_hash
    ).run()
    
    if (!result.success) {
      return c.json({ error: 'Failed to create user' }, 500)
    }
    
    // Get created user
    const user = await c.env.DB.prepare(
      'SELECT id, employee_code, employee_name, designation, department FROM users WHERE employee_code = ?'
    ).bind(employee_code).first() as any
    
    // Create session
    const session = createSession({
      id: user.id,
      employee_code: user.employee_code,
      employee_name: user.employee_name,
      designation: user.designation,
      department: user.department
    })
    
    // SECURITY: Hash token before storing
    const hashedToken = await hashToken(session.token)
    
    // Store hashed session
    await c.env.DB.prepare(`
      INSERT INTO sessions (user_id, session_token, expires_at)
      VALUES (?, ?, ?)
    `).bind(user.id, hashedToken, session.expiresAt.toISOString()).run()
    
    // Update last login
    await c.env.DB.prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?')
      .bind(user.id).run()
    
    return c.json({
      success: true,
      user: session.user,
      token: session.token  // Return unhashed token to client
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Login
app.post('/api/auth/login', async (c) => {
  try {
    const { employee_code, password } = await c.req.json()
    
    if (!employee_code || !password) {
      return c.json({ error: 'Missing employee code or password' }, 400)
    }
    
    // Get user
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE employee_code = ?'
    ).bind(employee_code).first() as any
    
    if (!user) {
      return c.json({ error: 'Invalid employee code or password' }, 401)
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return c.json({ error: 'Invalid employee code or password' }, 401)
    }
    
    // Create new session
    const session = createSession({
      id: user.id,
      employee_code: user.employee_code,
      employee_name: user.employee_name,
      designation: user.designation,
      department: user.department
    })
    
    // SECURITY: Hash token before storing
    const hashedToken = await hashToken(session.token)
    
    // Store hashed session
    await c.env.DB.prepare(`
      INSERT INTO sessions (user_id, session_token, expires_at)
      VALUES (?, ?, ?)
    `).bind(user.id, hashedToken, session.expiresAt.toISOString()).run()
    
    // Update last login
    await c.env.DB.prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?')
      .bind(user.id).run()
    
    return c.json({
      success: true,
      user: session.user,
      token: session.token  // Return unhashed token to client
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Get current user
app.get('/api/auth/me', requireAuth, async (c) => {
  const user = c.get('user') as User
  return c.json({ user })
})

// Logout
app.post('/api/auth/logout', requireAuth, async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    
    // SECURITY: Hash token to find and delete
    const hashedToken = await hashToken(token)
    
    await c.env.DB.prepare('DELETE FROM sessions WHERE session_token = ?')
      .bind(hashedToken).run()
    
    return c.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    return c.json({ error: 'Logout failed' }, 500)
  }
})

// ===== DRAFTS APIs =====

// Get all drafts for user
app.get('/api/drafts', requireAuth, async (c) => {
  try {
    const user = c.get('user') as User
    
    const result = await c.env.DB.prepare(`
      SELECT id, draft_name, created_at, updated_at
      FROM drafts
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `).bind(user.id).all()
    
    return c.json({ drafts: result.results || [] })
  } catch (error) {
    return c.json({ error: 'Failed to fetch drafts' }, 500)
  }
})

// Get specific draft
app.get('/api/drafts/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user') as User
    const draftId = c.req.param('id')
    
    const draft = await c.env.DB.prepare(`
      SELECT *
      FROM drafts
      WHERE id = ? AND user_id = ?
    `).bind(draftId, user.id).first() as any
    
    if (!draft) {
      return c.json({ error: 'Draft not found' }, 404)
    }
    
    return c.json({
      draft: {
        id: draft.id,
        draft_name: draft.draft_name,
        form_data: JSON.parse(draft.form_data),
        receipts_data: JSON.parse(draft.receipts_data || '[]'),
        created_at: draft.created_at,
        updated_at: draft.updated_at
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch draft' }, 500)
  }
})

// Create or update draft
app.post('/api/drafts', requireAuth, async (c) => {
  try {
    const user = c.get('user') as User
    const { draft_name, form_data, receipts_data, draft_id } = await c.req.json()
    
    const formDataStr = JSON.stringify(form_data || {})
    const receiptsDataStr = JSON.stringify(receipts_data || [])
    
    if (draft_id) {
      // Update existing
      await c.env.DB.prepare(`
        UPDATE drafts
        SET draft_name = ?, form_data = ?, receipts_data = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `).bind(draft_name || 'Untitled', formDataStr, receiptsDataStr, draft_id, user.id).run()
      
      return c.json({ success: true, draft_id })
    } else {
      // Create new
      const result = await c.env.DB.prepare(`
        INSERT INTO drafts (user_id, draft_name, form_data, receipts_data)
        VALUES (?, ?, ?, ?)
      `).bind(user.id, draft_name || 'Untitled', formDataStr, receiptsDataStr).run()
      
      return c.json({ success: true, draft_id: result.meta.last_row_id })
    }
  } catch (error) {
    console.error('Save draft error:', error)
    return c.json({ error: 'Failed to save draft' }, 500)
  }
})

// Delete draft
app.delete('/api/drafts/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user') as User
    const draftId = c.req.param('id')
    
    await c.env.DB.prepare('DELETE FROM drafts WHERE id = ? AND user_id = ?')
      .bind(draftId, user.id).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete draft' }, 500)
  }
})

// ===== CLAIMS APIs (NEW) =====

// Submit claim (POST)
app.post('/api/claims', requireAuth, async (c) => {
  try {
    const user = c.get('user') as User
    const claimData = await c.req.json()
    
    const claimType = claimData.claim_type || 'tour'
    const claimPeriod = claimData.periodOfClaim || claimData.dateOfClaim || new Date().toISOString().split('T')[0]
    const purpose = claimData.purposeOfTravel || claimData.purpose || ''
    
    // Calculate totals based on claim type
    let totalAmount = 0
    let journeyAmount = 0
    let hotelAmount = 0
    let conveyanceAmount = 0
    let daAmount = 0
    let otherAmount = 0
    
    if (claimType === 'tour') {
      journeyAmount = (claimData.journeys || []).reduce((sum: number, j: any) => sum + (j.amountClaimed || j.amount || 0), 0)
      const miscTotal = (claimData.miscExpenses || []).reduce((sum: number, m: any) => sum + (m.amount || 0), 0)
      conveyanceAmount = (claimData.conveyances || []).reduce((sum: number, c: any) => sum + (c.amount || 0), 0)
      daAmount = (claimData.daEntries || []).reduce((sum: number, d: any) => sum + (d.daAmount || 0), 0)
      hotelAmount = (claimData.daEntries || []).reduce((sum: number, d: any) => sum + (d.hotelAmount || 0), 0)
      otherAmount = miscTotal
      totalAmount = journeyAmount + hotelAmount + conveyanceAmount + daAmount + otherAmount
    } else if (claimType === 'opd') {
      totalAmount = claimData.totalAmount || 0
    } else if (claimType === 'contingency') {
      totalAmount = claimData.totalAmount || 0
    }
    
    // Store in claims table
    const result = await c.env.DB.prepare(`
      INSERT INTO claims (
        user_id, claim_type, claim_period, purpose_of_travel,
        total_amount, journey_amount, hotel_amount, conveyance_amount,
        da_amount, other_amount, form_data, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      user.id,
      claimType,
      claimPeriod,
      purpose,
      totalAmount,
      journeyAmount,
      hotelAmount,
      conveyanceAmount,
      daAmount,
      otherAmount,
      JSON.stringify(claimData)
    ).run()
    
    return c.json({
      success: true,
      claim_id: result.meta.last_row_id,
      totalAmount
    })
  } catch (error) {
    console.error('Submit claim error:', error)
    return c.json({ error: 'Failed to submit claim' }, 500)
  }
})

// Get claims list
app.get('/api/claims', requireAuth, async (c) => {
  try {
    const user = c.get('user') as User
    const limit = parseInt(c.req.query('limit') || '50')
    const cappedLimit = Math.min(Math.max(limit, 1), 100) // Cap between 1-100
    
    const result = await c.env.DB.prepare(`
      SELECT id, total_amount, net_claim, status, submitted_at
      FROM claims
      WHERE user_id = ?
      ORDER BY submitted_at DESC
      LIMIT ?
    `).bind(user.id, cappedLimit).all()
    
    return c.json({ claims: result.results || [] })
  } catch (error) {
    return c.json({ error: 'Failed to fetch claims' }, 500)
  }
})

// Get claims summary (for dashboard)
app.get('/api/claims/summary', requireAuth, async (c) => {
  try {
    const user = c.get('user') as User
    
    // Total claims
    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
      FROM claims
      WHERE user_id = ?
    `).bind(user.id).first() as any
    
    // Recent claims (last 5) - using actual table columns
    const recentResult = await c.env.DB.prepare(`
      SELECT id, claim_period, total_amount, submitted_at
      FROM claims
      WHERE user_id = ?
      ORDER BY submitted_at DESC
      LIMIT 5
    `).bind(user.id).all()
    
    return c.json({
      totalClaims: totalResult?.count || 0,
      totalAmount: totalResult?.total || 0,
      recentClaims: recentResult.results || []
    })
  } catch (error) {
    console.error('Claims summary error:', error)
    return c.json({ error: 'Failed to fetch summary' }, 500)
  }
})

// ===== EXCEL GENERATION (NEW FORMAT) =====
app.post('/api/generate-excel', async (c) => {
  try {
    const data = await c.req.json() as TourAllowanceData
    
    // Generate Excel with new format
    const buffer = await generateTourAllowanceExcel(data)
    
    // SECURITY: Sanitize filename
    const filename = sanitizeFilename(`Tour_Allowance_${data.employeeName}_${data.dateOfClaim}.xlsx`)
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
    
  } catch (error) {
    console.error('Error generating Excel:', error)
    return c.json({ error: 'Failed to generate Excel file' }, 500)
  }
})

// Generate OPD Medical Excel
app.post('/api/generate-excel-opd', async (c) => {
  try {
    const data = await c.req.json() as OPDMedicalData
    const buffer = await generateOPDMedicalExcel(data)
    const filename = sanitizeFilename(`OPD_Medical_${data.employeeName}_${data.dateOfClaim}.xlsx`)
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error generating OPD Excel:', error)
    return c.json({ error: 'Failed to generate OPD Excel file' }, 500)
  }
})

// Generate Contingency Excel
app.post('/api/generate-excel-contingency', async (c) => {
  try {
    const data = await c.req.json() as ContingencyData
    const buffer = await generateContingencyExcel(data)
    const filename = sanitizeFilename(`Contingency_${data.employeeName}_${data.dateOfClaim}.xlsx`)
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error generating Contingency Excel:', error)
    return c.json({ error: 'Failed to generate Contingency Excel file' }, 500)
  }
})

// Main form page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HPX Tour Allowance Claim - Login</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        <script src="/static/app-tour-allowance.js"></script>
    </body>
    </html>
  `)
})

export default app
