import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import ExcelJS from 'exceljs'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API endpoint to generate Excel file
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

// Main form page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HPX Travel Reimbursement</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen py-8 px-4">
            <div class="max-w-6xl mx-auto">
                <!-- Header -->
                <div class="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
                    <h1 class="text-2xl font-bold text-gray-800 mb-2">HINDUSTAN POWER EXCHANGE LIMITED</h1>
                    <p class="text-sm text-gray-600">Unit No 810-816, 8th Floor, World Trade Tower Sector 16 Noida</p>
                    <p class="text-xs text-gray-500">(CIN NO -U74999MH2018PLC308448)</p>
                    <h2 class="text-xl font-bold text-blue-600 mt-4">TRAVEL REIMBURSEMENT CLAIM FORM</h2>
                    <p class="text-xs text-gray-500 mt-2" id="autoSaveIndicator"></p>
                </div>

                <!-- Quick Actions Bar -->
                <div class="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div class="flex flex-wrap gap-3 justify-center">
                        <button onclick="saveDraft()" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
                            <i class="fas fa-save mr-2"></i>Save Draft
                        </button>
                        <button onclick="loadDraft()" class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
                            <i class="fas fa-folder-open mr-2"></i>Load Draft
                        </button>
                        <button onclick="clearDraft()" class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
                            <i class="fas fa-trash mr-2"></i>Clear Draft
                        </button>
                        <button onclick="saveAsTemplate()" class="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition">
                            <i class="fas fa-bookmark mr-2"></i>Save as Template
                        </button>
                        <button onclick="document.getElementById('templatesModal').classList.remove('hidden')" 
                            class="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition">
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
                                <p class="text-xs text-gray-500 mt-1">PNG, JPG (max 5MB) - OCR will auto-extract amount</p>
                            </div>
                            <input type="file" accept="image/*" multiple onchange="handleReceiptUpload(event)" class="hidden">
                        </label>
                    </div>
                    <div id="receiptsContainer" class="mt-4">
                        <p class="text-gray-500 text-sm">No receipts uploaded yet</p>
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

                <!-- Main Form -->
                <form id="reimbursementForm" class="bg-white rounded-lg shadow-md p-6">
                    <!-- Employee Information -->
                    <div class="mb-8">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">
                            <i class="fas fa-user mr-2"></i>Employee Information
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Name of Employee/Traveller *</label>
                                <input type="text" id="employeeName" required 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter full name">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Employee Code *</label>
                                <input type="text" id="employeeCode" required 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter employee code">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Designation *</label>
                                <input type="text" id="designation" required 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter designation">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Department & Budget Code *</label>
                                <input type="text" id="department" required 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter department">
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
                        <p class="text-lg font-medium">Generating Excel file...</p>
                    </div>
                </div>
            </div>
        </div>

        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
