// Excel Generator - Tour Allowance (Print-Ready with Page Breaks & Logo)
import ExcelJS from 'exceljs'

export interface TourAllowanceData {
  employeeName: string
  designation: string
  empId: string
  grade?: string
  department: string
  dateOfClaim: string
  periodOfClaim: string
  purposeOfTravel: string
  miscExpenses: Array<{ particulars: string; amount: number }>
  journeys: Array<{
    departureFrom: string
    arrivalTo: string
    date: string
    modeOfTravel: string
    classOfTravel: string
    trainFlightNo: string
    amountClaimed: number
    purpose: string
  }>
  daEntries: Array<{
    date: string
    station: string
    daAmount: number
    hotelAmount: number
    hotelName?: string
    billNo?: string
  }>
  conveyances: Array<{
    date: string
    station: string
    placeOfVisit: string
    distanceKm: number
    meansOfTravel: string
    amount: number
    purpose: string
  }>
  advanceDrawn?: number
}

export async function generateTourAllowanceExcel(data: TourAllowanceData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Tour Allowance Claim')

  // Set print options
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'portrait',
    fitToPage: false,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3
    }
  }

  // Set column widths
  worksheet.columns = [
    { width: 8 }, { width: 12 }, { width: 12 }, { width: 15 }, { width: 15 },
    { width: 12 }, { width: 10 }, { width: 10 }, { width: 12 }, { width: 12 },
    { width: 15 }, { width: 12 }, { width: 15 }
  ]

  let currentRow = 1

  // ===== PAGE 1: HEADER + SECTION I =====
  
  // Row 1-3: Logo & Company Name
  worksheet.mergeCells('A1:M3')
  const headerCell = worksheet.getCell('A1')
  headerCell.value = 'HINDUSTAN POWER EXCHANGE LIMITED'
  headerCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FF003DA5' } }
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' }
  currentRow = 4

  // Row 4: Address
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`)
  const addressCell = worksheet.getCell(`A${currentRow}`)
  addressCell.value = 'Unit No 810-816, 8th Floor, World Trade Tower Sector 16 Noida'
  addressCell.font = { name: 'Arial', size: 10 }
  addressCell.alignment = { horizontal: 'center' }
  currentRow++

  // Row 5: CIN
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`)
  const cinCell = worksheet.getCell(`A${currentRow}`)
  cinCell.value = '(CIN NO - U74999MH2018PLC308448)'
  cinCell.font = { name: 'Arial', size: 9 }
  cinCell.alignment = { horizontal: 'center' }
  currentRow += 2

  // Row 7: Title
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`)
  const titleCell = worksheet.getCell(`A${currentRow}`)
  titleCell.value = 'TOUR TRAVELING ALLOWANCE CLAIM'
  titleCell.font = { name: 'Arial', size: 14, bold: true }
  titleCell.alignment = { horizontal: 'center' }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  currentRow += 2

  // Employee Info
  worksheet.getCell(`A${currentRow}`).value = 'Name:'
  worksheet.getCell(`B${currentRow}`).value = data.employeeName
  worksheet.getCell(`E${currentRow}`).value = 'Designation:'
  worksheet.getCell(`F${currentRow}`).value = data.designation
  worksheet.getCell(`I${currentRow}`).value = 'Emp. ID:'
  worksheet.getCell(`J${currentRow}`).value = data.empId
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = 'Grade:'
  worksheet.getCell(`B${currentRow}`).value = data.grade || ''
  worksheet.getCell(`E${currentRow}`).value = 'Department:'
  worksheet.getCell(`F${currentRow}`).value = data.department
  worksheet.getCell(`I${currentRow}`).value = 'Date:'
  worksheet.getCell(`J${currentRow}`).value = data.dateOfClaim
  currentRow += 2

  // Section I
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`)
  const sec1Cell = worksheet.getCell(`A${currentRow}`)
  sec1Cell.value = 'Section I: Calculation of Total TA Admissible'
  sec1Cell.font = { bold: true, size: 11 }
  sec1Cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }
  currentRow++

  const journeyTotal = data.journeys.reduce((sum, j) => sum + j.amountClaimed, 0)
  const miscTotal = data.miscExpenses.reduce((sum, m) => sum + m.amount, 0)
  const conveyanceTotal = data.conveyances.reduce((sum, c) => sum + c.amount, 0)
  const daTotal = data.daEntries.reduce((sum, d) => sum + d.daAmount, 0)
  const hotelTotal = data.daEntries.reduce((sum, d) => sum + d.hotelAmount, 0)
  const totalClaimed = journeyTotal + miscTotal + conveyanceTotal + daTotal + hotelTotal
  const advanceDrawn = data.advanceDrawn || 0
  const netClaim = totalClaimed - advanceDrawn

  worksheet.getCell(`A${currentRow}`).value = '1. Journey Fares (Section III)'
  worksheet.getCell(`I${currentRow}`).value = journeyTotal
  currentRow++
  worksheet.getCell(`A${currentRow}`).value = '2. Conveyance & Misc (II + V)'
  worksheet.getCell(`I${currentRow}`).value = miscTotal + conveyanceTotal
  currentRow++
  worksheet.getCell(`A${currentRow}`).value = '3. Accommodation charges'
  worksheet.getCell(`I${currentRow}`).value = hotelTotal
  currentRow++
  worksheet.getCell(`A${currentRow}`).value = '4. Daily Allowance'
  worksheet.getCell(`I${currentRow}`).value = daTotal
  currentRow++
  worksheet.getCell(`A${currentRow}`).value = 'A. Total (1 to 4)'
  worksheet.getCell(`I${currentRow}`).value = totalClaimed
  worksheet.getCell(`I${currentRow}`).font = { bold: true }
  currentRow++
  worksheet.getCell(`A${currentRow}`).value = 'B. Advance Drawn'
  worksheet.getCell(`I${currentRow}`).value = advanceDrawn
  currentRow++
  worksheet.getCell(`A${currentRow}`).value = 'C. NET CLAIM (A-B)'
  worksheet.getCell(`I${currentRow}`).value = netClaim
  worksheet.getCell(`I${currentRow}`).font = { bold: true, color: { argb: 'FFFF0000' } }
  currentRow += 2

  // PAGE BREAK
  worksheet.getRow(currentRow).addPageBreak()

  // ===== PAGE 2: SECTIONS II, III, IV =====
  
  // Section II: Misc Expenses
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`)
  const sec2Cell = worksheet.getCell(`A${currentRow}`)
  sec2Cell.value = 'Section II: Details of Miscellaneous Expenses'
  sec2Cell.font = { bold: true, size: 11 }
  sec2Cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = 'S.No.'
  worksheet.getCell(`B${currentRow}`).value = 'Particulars'
  worksheet.getCell(`F${currentRow}`).value = 'Amount (Rs.)'
  currentRow++

  data.miscExpenses.forEach((misc, idx) => {
    worksheet.getCell(`A${currentRow}`).value = idx + 1
    worksheet.getCell(`B${currentRow}`).value = misc.particulars
    worksheet.getCell(`F${currentRow}`).value = misc.amount
    currentRow++
  })

  worksheet.getCell(`B${currentRow}`).value = 'Total'
  worksheet.getCell(`B${currentRow}`).font = { bold: true }
  worksheet.getCell(`F${currentRow}`).value = miscTotal
  worksheet.getCell(`F${currentRow}`).font = { bold: true }
  currentRow += 2

  // Section III: Journey Details
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`)
  const sec3Cell = worksheet.getCell(`A${currentRow}`)
  sec3Cell.value = 'Section III: Journey Details'
  sec3Cell.font = { bold: true, size: 11 }
  sec3Cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = 'S.No.'
  worksheet.getCell(`B${currentRow}`).value = 'From'
  worksheet.getCell(`C${currentRow}`).value = 'To'
  worksheet.getCell(`D${currentRow}`).value = 'Date'
  worksheet.getCell(`E${currentRow}`).value = 'Mode'
  worksheet.getCell(`F${currentRow}`).value = 'Class'
  worksheet.getCell(`G${currentRow}`).value = 'Train/Flight No'
  worksheet.getCell(`H${currentRow}`).value = 'Amount'
  worksheet.getCell(`I${currentRow}`).value = 'Purpose'
  currentRow++

  data.journeys.forEach((journey, idx) => {
    worksheet.getCell(`A${currentRow}`).value = idx + 1
    worksheet.getCell(`B${currentRow}`).value = journey.departureFrom
    worksheet.getCell(`C${currentRow}`).value = journey.arrivalTo
    worksheet.getCell(`D${currentRow}`).value = journey.date
    worksheet.getCell(`E${currentRow}`).value = journey.modeOfTravel
    worksheet.getCell(`F${currentRow}`).value = journey.classOfTravel
    worksheet.getCell(`G${currentRow}`).value = journey.trainFlightNo
    worksheet.getCell(`H${currentRow}`).value = journey.amountClaimed
    worksheet.getCell(`I${currentRow}`).value = journey.purpose
    currentRow++
  })

  worksheet.getCell(`G${currentRow}`).value = 'Total'
  worksheet.getCell(`G${currentRow}`).font = { bold: true }
  worksheet.getCell(`H${currentRow}`).value = journeyTotal
  worksheet.getCell(`H${currentRow}`).font = { bold: true }
  currentRow += 2

  // Section IV: DA & Accommodation
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`)
  const sec4Cell = worksheet.getCell(`A${currentRow}`)
  sec4Cell.value = 'Section IV: Details of DA & Expenditure for Accommodation'
  sec4Cell.font = { bold: true, size: 11 }
  sec4Cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = 'S.No.'
  worksheet.getCell(`B${currentRow}`).value = 'Date'
  worksheet.getCell(`C${currentRow}`).value = 'Station'
  worksheet.getCell(`D${currentRow}`).value = 'DA (Rs.)'
  worksheet.getCell(`E${currentRow}`).value = 'Hotel Amt'
  worksheet.getCell(`F${currentRow}`).value = 'Hotel Name'
  worksheet.getCell(`G${currentRow}`).value = 'Bill No'
  currentRow++

  data.daEntries.forEach((da, idx) => {
    worksheet.getCell(`A${currentRow}`).value = idx + 1
    worksheet.getCell(`B${currentRow}`).value = da.date
    worksheet.getCell(`C${currentRow}`).value = da.station
    worksheet.getCell(`D${currentRow}`).value = da.daAmount
    worksheet.getCell(`E${currentRow}`).value = da.hotelAmount
    worksheet.getCell(`F${currentRow}`).value = da.hotelName || ''
    worksheet.getCell(`G${currentRow}`).value = da.billNo || ''
    currentRow++
  })

  worksheet.getCell(`C${currentRow}`).value = 'Total'
  worksheet.getCell(`C${currentRow}`).font = { bold: true }
  worksheet.getCell(`D${currentRow}`).value = daTotal
  worksheet.getCell(`D${currentRow}`).font = { bold: true }
  worksheet.getCell(`E${currentRow}`).value = hotelTotal
  worksheet.getCell(`E${currentRow}`).font = { bold: true }
  currentRow += 2

  // PAGE BREAK
  worksheet.getRow(currentRow).addPageBreak()

  // ===== PAGE 3: SECTION V + SIGNATURES =====
  
  // Section V: Conveyance
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`)
  const sec5Cell = worksheet.getCell(`A${currentRow}`)
  sec5Cell.value = 'Section V: Details of Conveyance Charges'
  sec5Cell.font = { bold: true, size: 11 }
  sec5Cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = 'S.No.'
  worksheet.getCell(`B${currentRow}`).value = 'Date'
  worksheet.getCell(`C${currentRow}`).value = 'Station'
  worksheet.getCell(`D${currentRow}`).value = 'Place of Visit'
  worksheet.getCell(`E${currentRow}`).value = 'Distance (km)'
  worksheet.getCell(`F${currentRow}`).value = 'Means'
  worksheet.getCell(`G${currentRow}`).value = 'Amount'
  worksheet.getCell(`H${currentRow}`).value = 'Purpose'
  currentRow++

  data.conveyances.forEach((conv, idx) => {
    worksheet.getCell(`A${currentRow}`).value = idx + 1
    worksheet.getCell(`B${currentRow}`).value = conv.date
    worksheet.getCell(`C${currentRow}`).value = conv.station
    worksheet.getCell(`D${currentRow}`).value = conv.placeOfVisit
    worksheet.getCell(`E${currentRow}`).value = conv.distanceKm
    worksheet.getCell(`F${currentRow}`).value = conv.meansOfTravel
    worksheet.getCell(`G${currentRow}`).value = conv.amount
    worksheet.getCell(`H${currentRow}`).value = conv.purpose
    currentRow++
  })

  worksheet.getCell(`F${currentRow}`).value = 'Total'
  worksheet.getCell(`F${currentRow}`).font = { bold: true }
  worksheet.getCell(`G${currentRow}`).value = conveyanceTotal
  worksheet.getCell(`G${currentRow}`).font = { bold: true }
  currentRow += 3

  // Signatures
  worksheet.getCell(`A${currentRow}`).value = 'Counter Signed:'
  worksheet.getCell(`G${currentRow}`).value = 'Signature of Employee:'
  currentRow += 3
  worksheet.getCell(`A${currentRow}`).value = 'Date:'
  worksheet.getCell(`G${currentRow}`).value = 'Date:'

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
