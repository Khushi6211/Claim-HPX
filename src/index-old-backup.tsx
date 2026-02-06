import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import ExcelJS from 'exceljs'
import { hashPassword, verifyPassword, createSession, verifySession, User } from './auth'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ==================== AUTHENTICATION APIs ====================

// Register new user
app.post('/api/auth/register', async (c) => {
  try {
    const { employee_code, employee_name, designation, department, password } = await c.req.json()
    
    // Validate input
    if (!employee_code || !employee_name || !password) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    
    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400)
    }
    
    // Check if user already exists
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
    `).bind(employee_code, employee_name, designation || '', department || '', password_hash).run()
    
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
    
    // Store session
    await c.env.DB.prepare(`
      INSERT INTO sessions (user_id, session_token, expires_at)
      VALUES (?, ?, ?)
    `).bind(user.id, session.token, session.expiresAt.toISOString()).run()
    
    return c.json({
      success: true,
      user: session.user,
      token: session.token
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
    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return c.json({ error: 'Invalid employee code or password' }, 401)
    }
    
    // Create session
    const session = createSession({
      id: user.id,
      employee_code: user.employee_code,
      employee_name: user.employee_name,
      designation: user.designation,
      department: user.department
    })
    
    // Store session
    await c.env.DB.prepare(`
      INSERT INTO sessions (user_id, session_token, expires_at)
      VALUES (?, ?, ?)
    `).bind(user.id, session.token, session.expiresAt.toISOString()).run()
    
    // Update last login
    await c.env.DB.prepare(
      'UPDATE users SET last_login = datetime("now") WHERE id = ?'
    ).bind(user.id).run()
    
    return c.json({
      success: true,
      user: session.user,
      token: session.token
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Get current user
app.get('/api/auth/me', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return c.json({ error: 'No token provided' }, 401)
    }
    
    const user = await verifySession(c.env.DB, token)
    
    if (!user) {
      return c.json({ error: 'Invalid or expired token' }, 401)
    }
    
    return c.json({ user })
    
  } catch (error) {
    console.error('Auth check error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

// Logout
app.post('/api/auth/logout', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    
    if (token) {
      await c.env.DB.prepare(
        'DELETE FROM sessions WHERE session_token = ?'
      ).bind(token).run()
    }
    
    return c.json({ success: true })
    
  } catch (error) {
    console.error('Logout error:', error)
    return c.json({ error: 'Logout failed' }, 500)
  }
})

// ==================== DRAFT APIs ====================

// Middleware to verify auth
async function requireAuth(c: any, next: any) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const user = await verifySession(c.env.DB, token)
  
  if (!user) {
    return c.json({ error: 'Invalid token' }, 401)
  }
  
  c.set('user', user)
  await next()
}

// List user's drafts
app.get('/api/drafts', requireAuth, async (c) => {
  try {
    const user = c.get('user') as User
    
    const drafts = await c.env.DB.prepare(`
      SELECT id, draft_name, created_at, updated_at
      FROM drafts
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `).bind(user.id).all()
    
    return c.json({ drafts: drafts.results })
    
  } catch (error) {
    console.error('List drafts error:', error)
    return c.json({ error: 'Failed to fetch drafts' }, 500)
  }
})

// Get specific draft
app.get('/api/drafts/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user') as User
    const draftId = c.req.param('id')
    
    const draft = await c.env.DB.prepare(`
      SELECT * FROM drafts WHERE id = ? AND user_id = ?
    `).bind(draftId, user.id).first() as any
    
    if (!draft) {
      return c.json({ error: 'Draft not found' }, 404)
    }
    
    return c.json({
      draft: {
        ...draft,
        form_data: JSON.parse(draft.form_data || '{}'),
        receipts_data: JSON.parse(draft.receipts_data || '[]')
      }
    })
    
  } catch (error) {
    console.error('Get draft error:', error)
    return c.json({ error: 'Failed to fetch draft' }, 500)
  }
})

// Create/Update draft
app.post('/api/drafts', requireAuth, async (c) => {
  try {
    const user = c.get('user') as User
    const { draft_name, form_data, receipts_data } = await c.req.json()
    
    // Check if draft exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM drafts WHERE user_id = ? AND draft_name = ?
    `).bind(user.id, draft_name || 'auto_save').first()
    
    if (existing) {
      // Update existing draft
      await c.env.DB.prepare(`
        UPDATE drafts 
        SET form_data = ?, receipts_data = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        JSON.stringify(form_data),
        JSON.stringify(receipts_data || []),
        existing.id
      ).run()
      
      return c.json({ success: true, draft_id: existing.id })
    } else {
      // Create new draft
      const result = await c.env.DB.prepare(`
        INSERT INTO drafts (user_id, draft_name, form_data, receipts_data)
        VALUES (?, ?, ?, ?)
      `).bind(
        user.id,
        draft_name || 'auto_save',
        JSON.stringify(form_data),
        JSON.stringify(receipts_data || [])
      ).run()
      
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
    
    await c.env.DB.prepare(`
      DELETE FROM drafts WHERE id = ? AND user_id = ?
    `).bind(draftId, user.id).run()
    
    return c.json({ success: true })
    
  } catch (error) {
    console.error('Delete draft error:', error)
    return c.json({ error: 'Failed to delete draft' }, 500)
  }
})

// ==================== OCR Pattern Learning ====================

// Store OCR correction for learning
app.post('/api/ocr/learn', requireAuth, async (c) => {
  try {
    const user = c.get('user') as User
    const { merchant_name, category, amount, location } = await c.req.json()
    
    // Check if pattern exists
    const existing = await c.env.DB.prepare(`
      SELECT id, times_used FROM ocr_patterns 
      WHERE user_id = ? AND merchant_name = ? AND category = ?
    `).bind(user.id, merchant_name, category).first() as any
    
    if (existing) {
      // Update existing pattern
      await c.env.DB.prepare(`
        UPDATE ocr_patterns
        SET times_used = ?, typical_amount = ?, last_used = datetime('now')
        WHERE id = ?
      `).bind(existing.times_used + 1, amount, existing.id).run()
    } else {
      // Create new pattern
      await c.env.DB.prepare(`
        INSERT INTO ocr_patterns 
        (user_id, merchant_name, category, typical_amount, location, confidence_score)
        VALUES (?, ?, ?, ?, ?, 1.0)
      `).bind(user.id, merchant_name, category, amount, location || '').run()
    }
    
    return c.json({ success: true })
    
  } catch (error) {
    console.error('OCR learn error:', error)
    return c.json({ error: 'Failed to store pattern' }, 500)
  }
})

// Get user's learned patterns
app.get('/api/ocr/patterns', requireAuth, async (c) => {
  try {
    const user = c.get('user') as User
    const merchant = c.req.query('merchant')
    
    let query = `
      SELECT * FROM ocr_patterns 
      WHERE user_id = ?
    `
    const params = [user.id]
    
    if (merchant) {
      query += ' AND merchant_name LIKE ?'
      params.push(`%${merchant}%`)
    }
    
    query += ' ORDER BY times_used DESC, last_used DESC LIMIT 10'
    
    const patterns = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({ patterns: patterns.results })
    
  } catch (error) {
    console.error('Get patterns error:', error)
    return c.json({ error: 'Failed to fetch patterns' }, 500)
  }
})

// ==================== EXCEL GENERATION (Existing) ====================

app.post('/api/generate-excel', async (c) => {
  try {
    const data = await c.req.json()
    
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Travel Reimbursement')
    
    // Set page setup for printing
    worksheet.pageSetup.paperSize = 9 // A4
    worksheet.pageSetup.orientation = 'portrait'
    worksheet.pageSetup.fitToPage = true
    worksheet.pageSetup.fitToWidth = 1
    worksheet.pageSetup.fitToHeight = 0
    
    // Set default column widths
    worksheet.columns = [
      { width: 5 },   // A - S.No
      { width: 15 },  // B
      { width: 12 },  // C
      { width: 12 },  // D
      { width: 15 },  // E
      { width: 12 },  // F
      { width: 12 },  // G
      { width: 15 },  // H
      { width: 12 },  // I
    ]
    
    // Header Section
    worksheet.mergeCells('A1:I1')
    const headerCell = worksheet.getCell('A1')
    headerCell.value = 'HINDUSTAN POWER EXCHANGE LIMITED'
    headerCell.font = { bold: true, size: 12 }
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' }
    
    worksheet.mergeCells('A2:I2')
    const addressCell = worksheet.getCell('A2')
    addressCell.value = 'Unit No 810-816, 8th Floor, World Trade Tower Sector 16 Noida'
    addressCell.font = { size: 10 }
    addressCell.alignment = { horizontal: 'center', vertical: 'middle' }
    
    worksheet.mergeCells('A3:I3')
    const cinCell = worksheet.getCell('A3')
    cinCell.value = '(CIN NO -U74999MH2018PLC308448)'
    cinCell.font = { size: 9 }
    cinCell.alignment = { horizontal: 'center', vertical: 'middle' }
    
    worksheet.mergeCells('A5:I5')
    const titleCell = worksheet.getCell('A5')
    titleCell.value = 'TRAVEL REIMBURSEMENT CLAIM FORM'
    titleCell.font = { bold: true, size: 14 }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    
    let currentRow = 7
    
    // Employee Information Section
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Name of Employee/Traveller'
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
    worksheet.mergeCells(`D${currentRow}:I${currentRow}`)
    worksheet.getCell(`D${currentRow}`).value = data.employeeName || ''
    currentRow++
    
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Employee Code'
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
    worksheet.mergeCells(`D${currentRow}:I${currentRow}`)
    worksheet.getCell(`D${currentRow}`).value = data.employeeCode || ''
    currentRow++
    
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Designation'
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
    worksheet.mergeCells(`D${currentRow}:I${currentRow}`)
    worksheet.getCell(`D${currentRow}`).value = data.designation || ''
    currentRow++
    
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Department & Budget Code'
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
    worksheet.mergeCells(`D${currentRow}:I${currentRow}`)
    worksheet.getCell(`D${currentRow}`).value = data.department || ''
    currentRow++
    
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Period of Claim'
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
    worksheet.mergeCells(`D${currentRow}:I${currentRow}`)
    worksheet.getCell(`D${currentRow}`).value = data.periodOfClaim || ''
    currentRow++
    
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Purpose of Travel'
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
    worksheet.mergeCells(`D${currentRow}:I${currentRow}`)
    worksheet.getCell(`D${currentRow}`).value = data.purposeOfTravel || ''
    currentRow += 2
    
    // Detail of Journey Section
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Detail of Journey'
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' }
    currentRow++
    
    const journeyHeaderRow = currentRow
    worksheet.getCell(`A${currentRow}`).value = 'S.No.'
    worksheet.getCell(`B${currentRow}`).value = 'Departure from'
    worksheet.getCell(`C${currentRow}`).value = 'Date'
    worksheet.getCell(`D${currentRow}`).value = 'Time'
    worksheet.getCell(`E${currentRow}`).value = 'Arrived at'
    worksheet.getCell(`F${currentRow}`).value = 'Date'
    worksheet.getCell(`G${currentRow}`).value = 'Time'
    worksheet.getCell(`H${currentRow}`).value = 'Arranged By Company (Yes/No)'
    worksheet.getCell(`I${currentRow}`).value = 'Amount *'
    
    for (let col = 1; col <= 9; col++) {
      const cell = worksheet.getCell(currentRow, col)
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    }
    currentRow++
    
    let journeyTotal = 0
    if (data.journeys && data.journeys.length > 0) {
      data.journeys.forEach((journey: any, index: number) => {
        worksheet.getCell(`A${currentRow}`).value = index + 1
        worksheet.getCell(`B${currentRow}`).value = journey.departureFrom || ''
        worksheet.getCell(`C${currentRow}`).value = journey.departureDate || ''
        worksheet.getCell(`D${currentRow}`).value = journey.departureTime || ''
        worksheet.getCell(`E${currentRow}`).value = journey.arrivedAt || ''
        worksheet.getCell(`F${currentRow}`).value = journey.arrivalDate || ''
        worksheet.getCell(`G${currentRow}`).value = journey.arrivalTime || ''
        worksheet.getCell(`H${currentRow}`).value = journey.arrangedByCompany || ''
        const amount = parseFloat(journey.amount) || 0
        worksheet.getCell(`I${currentRow}`).value = amount
        journeyTotal += amount
        
        for (let col = 1; col <= 9; col++) {
          const cell = worksheet.getCell(currentRow, col)
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
        currentRow++
      })
    }
    
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Total'
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' }
    worksheet.getCell(`I${currentRow}`).value = `₹ ${journeyTotal.toFixed(2)}`
    worksheet.getCell(`I${currentRow}`).font = { bold: true }
    currentRow += 2
    
    // Hotel Charges Section
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Hotel Charges'
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' }
    currentRow++
    
    worksheet.getCell(`A${currentRow}`).value = 'S.No.'
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`)
    worksheet.getCell(`B${currentRow}`).value = 'Name of Hotel'
    worksheet.mergeCells(`E${currentRow}:F${currentRow}`)
    worksheet.getCell(`E${currentRow}`).value = 'Place'
    worksheet.getCell(`G${currentRow}`).value = 'Arranged By Company (Yes/No)'
    worksheet.getCell(`H${currentRow}`).value = 'Period of Stay'
    worksheet.getCell(`I${currentRow}`).value = 'Amount *'
    
    for (let col = 1; col <= 9; col++) {
      const cell = worksheet.getCell(currentRow, col)
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    }
    currentRow++
    
    let hotelTotal = 0
    if (data.hotels && data.hotels.length > 0) {
      data.hotels.forEach((hotel: any, index: number) => {
        worksheet.getCell(`A${currentRow}`).value = index + 1
        worksheet.mergeCells(`B${currentRow}:D${currentRow}`)
        worksheet.getCell(`B${currentRow}`).value = hotel.hotelName || ''
        worksheet.mergeCells(`E${currentRow}:F${currentRow}`)
        worksheet.getCell(`E${currentRow}`).value = hotel.place || ''
        worksheet.getCell(`G${currentRow}`).value = hotel.arrangedByCompany || ''
        worksheet.getCell(`H${currentRow}`).value = hotel.periodOfStay || ''
        const amount = parseFloat(hotel.amount) || 0
        worksheet.getCell(`I${currentRow}`).value = amount
        hotelTotal += amount
        
        for (let col = 1; col <= 9; col++) {
          const cell = worksheet.getCell(currentRow, col)
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
        currentRow++
      })
    }
    
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Total'
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' }
    worksheet.getCell(`I${currentRow}`).value = `₹ ${hotelTotal.toFixed(2)}`
    worksheet.getCell(`I${currentRow}`).font = { bold: true }
    currentRow += 2
    
    // Local Conveyance Section
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Detail of Local Conveyance'
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' }
    currentRow++
    
    worksheet.getCell(`A${currentRow}`).value = 'S.No.'
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`)
    worksheet.getCell(`B${currentRow}`).value = 'Date'
    worksheet.mergeCells(`D${currentRow}:E${currentRow}`)
    worksheet.getCell(`D${currentRow}`).value = 'From'
    worksheet.mergeCells(`F${currentRow}:G${currentRow}`)
    worksheet.getCell(`F${currentRow}`).value = 'To'
    worksheet.getCell(`H${currentRow}`).value = 'Mode of Travel'
    worksheet.getCell(`I${currentRow}`).value = 'Amount'
    
    for (let col = 1; col <= 9; col++) {
      const cell = worksheet.getCell(currentRow, col)
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    }
    currentRow++
    
    let conveyanceTotal = 0
    if (data.conveyance && data.conveyance.length > 0) {
      data.conveyance.forEach((conv: any, index: number) => {
        worksheet.getCell(`A${currentRow}`).value = index + 1
        worksheet.mergeCells(`B${currentRow}:C${currentRow}`)
        worksheet.getCell(`B${currentRow}`).value = conv.date || ''
        worksheet.mergeCells(`D${currentRow}:E${currentRow}`)
        worksheet.getCell(`D${currentRow}`).value = conv.from || ''
        worksheet.mergeCells(`F${currentRow}:G${currentRow}`)
        worksheet.getCell(`F${currentRow}`).value = conv.to || ''
        worksheet.getCell(`H${currentRow}`).value = conv.mode || ''
        const amount = parseFloat(conv.amount) || 0
        worksheet.getCell(`I${currentRow}`).value = amount
        conveyanceTotal += amount
        
        for (let col = 1; col <= 9; col++) {
          const cell = worksheet.getCell(currentRow, col)
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
        currentRow++
      })
    }
    
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Total'
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' }
    worksheet.getCell(`I${currentRow}`).value = `₹ ${conveyanceTotal.toFixed(2)}`
    worksheet.getCell(`I${currentRow}`).font = { bold: true }
    currentRow += 2
    
    // DA Claimed Section
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Detail of DA Claimed'
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' }
    currentRow++
    
    worksheet.getCell(`A${currentRow}`).value = 'S.No.'
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`)
    worksheet.getCell(`B${currentRow}`).value = 'Date'
    worksheet.mergeCells(`E${currentRow}:G${currentRow}`)
    worksheet.getCell(`E${currentRow}`).value = 'City Name'
    worksheet.mergeCells(`H${currentRow}:I${currentRow}`)
    worksheet.getCell(`H${currentRow}`).value = 'Dearness Allowance Claimed'
    
    for (let col = 1; col <= 9; col++) {
      const cell = worksheet.getCell(currentRow, col)
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    }
    currentRow++
    
    let daTotal = 0
    if (data.daClaimed && data.daClaimed.length > 0) {
      data.daClaimed.forEach((da: any, index: number) => {
        worksheet.getCell(`A${currentRow}`).value = index + 1
        worksheet.mergeCells(`B${currentRow}:D${currentRow}`)
        worksheet.getCell(`B${currentRow}`).value = da.date || ''
        worksheet.mergeCells(`E${currentRow}:G${currentRow}`)
        worksheet.getCell(`E${currentRow}`).value = da.cityName || ''
        const amount = parseFloat(da.amount) || 0
        worksheet.mergeCells(`H${currentRow}:I${currentRow}`)
        worksheet.getCell(`H${currentRow}`).value = amount
        daTotal += amount
        
        for (let col = 1; col <= 9; col++) {
          const cell = worksheet.getCell(currentRow, col)
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
        currentRow++
      })
    }
    
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Total'
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' }
    worksheet.mergeCells(`H${currentRow}:I${currentRow}`)
    worksheet.getCell(`H${currentRow}`).value = `₹ ${daTotal.toFixed(2)}`
    worksheet.getCell(`H${currentRow}`).font = { bold: true }
    currentRow += 2
    
    // Other Incidental Expense Section
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Other Incidental Expense'
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' }
    currentRow++
    
    worksheet.getCell(`A${currentRow}`).value = 'S.No.'
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`)
    worksheet.getCell(`B${currentRow}`).value = 'Date'
    worksheet.mergeCells(`E${currentRow}:H${currentRow}`)
    worksheet.getCell(`E${currentRow}`).value = 'Particulars'
    worksheet.getCell(`I${currentRow}`).value = 'Amount'
    
    for (let col = 1; col <= 9; col++) {
      const cell = worksheet.getCell(currentRow, col)
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    }
    currentRow++
    
    let otherTotal = 0
    if (data.otherExpenses && data.otherExpenses.length > 0) {
      data.otherExpenses.forEach((expense: any, index: number) => {
        worksheet.getCell(`A${currentRow}`).value = index + 1
        worksheet.mergeCells(`B${currentRow}:D${currentRow}`)
        worksheet.getCell(`B${currentRow}`).value = expense.date || ''
        worksheet.mergeCells(`E${currentRow}:H${currentRow}`)
        worksheet.getCell(`E${currentRow}`).value = expense.particulars || ''
        const amount = parseFloat(expense.amount) || 0
        worksheet.getCell(`I${currentRow}`).value = amount
        otherTotal += amount
        
        for (let col = 1; col <= 9; col++) {
          const cell = worksheet.getCell(currentRow, col)
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
        currentRow++
      })
    }
    
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Total'
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' }
    worksheet.getCell(`I${currentRow}`).value = `₹ ${otherTotal.toFixed(2)}`
    worksheet.getCell(`I${currentRow}`).font = { bold: true }
    currentRow += 2
    
    // Grand Total
    const grandTotal = journeyTotal + hotelTotal + conveyanceTotal + daTotal + otherTotal
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Grand Total'
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right' }
    worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }
    worksheet.getCell(`I${currentRow}`).value = `₹ ${grandTotal.toFixed(2)}`
    worksheet.getCell(`I${currentRow}`).font = { bold: true, size: 12 }
    worksheet.getCell(`I${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }
    currentRow += 2
    
    // Amount in words
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = `AMOUNT IN WORDS: ${data.amountInWords || ''}`
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    currentRow += 2
    
    // Declaration
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'DECLARATION:'
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    currentRow++
    
    worksheet.mergeCells(`A${currentRow}:I${currentRow + 1}`)
    worksheet.getCell(`A${currentRow}`).value = 'I hereby declare that the expenses mentioned above are incurred for official purpose only, and all information given above are true & correct to the best of my knowledge.'
    worksheet.getCell(`A${currentRow}`).alignment = { wrapText: true, vertical: 'middle' }
    currentRow += 3
    
    // Signature Section
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Date of Submission:'
    currentRow += 2
    
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'HOD Sign'
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    worksheet.getCell(`A${currentRow}`).border = { top: { style: 'thin' } }
    
    worksheet.mergeCells(`D${currentRow}:F${currentRow}`)
    worksheet.getCell(`D${currentRow}`).value = 'Name of HOD & Designation'
    worksheet.getCell(`D${currentRow}`).font = { bold: true }
    worksheet.getCell(`D${currentRow}`).border = { top: { style: 'thin' } }
    
    worksheet.getCell(`H${currentRow}`).value = 'HR/Admin Signature'
    worksheet.getCell(`H${currentRow}`).font = { bold: true }
    worksheet.getCell(`H${currentRow}`).border = { top: { style: 'thin' } }
    
    worksheet.getCell(`I${currentRow}`).value = 'Employee Signature'
    worksheet.getCell(`I${currentRow}`).font = { bold: true }
    worksheet.getCell(`I${currentRow}`).border = { top: { style: 'thin' } }
    currentRow += 2
    
    // Notes
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Note 1- In case of hotel & travel arrangement made by company, amount is to be mentioned as "NIL"'
    worksheet.getCell(`A${currentRow}`).font = { size: 9, italic: true }
    currentRow++
    
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = 'Note 2- Please use one claim form for one round Trip.'
    worksheet.getCell(`A${currentRow}`).font = { size: 9, italic: true }
    
    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer()
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Travel_Reimbursement_${data.employeeName}_${data.periodOfClaim}.xlsx"`
      }
    })
    
  } catch (error) {
    console.error('Error generating Excel:', error)
    return c.json({ error: 'Failed to generate Excel file' }, 500)
  }
})

// Main form page (will be updated with login)
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HPX Travel Reimbursement - Login</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        <script src="/static/app-new.js"></script>
    </body>
    </html>
  `)
})

export default app
