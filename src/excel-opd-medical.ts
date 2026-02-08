// Excel Generator - OPD Medical Claim
import ExcelJS from 'exceljs'

export interface OPDMedicalData {
  employeeName: string
  employeeCode: string
  designation: string
  department: string
  dateOfClaim: string
  patientName: string
  relation: string
  consultationDate: string
  doctorName: string
  hospitalName: string
  consultationFee: number
  medicineCosts: Array<{ itemName: string; amount: number }>
  labTestCosts: Array<{ testName: string; amount: number }>
  otherExpenses: Array<{ description: string; amount: number }>
}

export async function generateOPDMedicalExcel(data: OPDMedicalData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('OPD Medical Claim')

  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'portrait',
    margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75 }
  }

  worksheet.columns = Array(10).fill({ width: 12 })

  let currentRow = 1

  // Header
  worksheet.mergeCells('A1:J3')
  const headerCell = worksheet.getCell('A1')
  headerCell.value = 'HINDUSTAN POWER EXCHANGE LIMITED'
  headerCell.font = { size: 18, bold: true, color: { argb: 'FF003DA5' } }
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' }
  currentRow = 4

  worksheet.mergeCells(`A${currentRow}:J${currentRow}`)
  const addressCell = worksheet.getCell(`A${currentRow}`)
  addressCell.value = 'Unit No 810-816, 8th Floor, World Trade Tower Sector 16 Noida'
  addressCell.alignment = { horizontal: 'center' }
  currentRow += 2

  worksheet.mergeCells(`A${currentRow}:J${currentRow}`)
  const titleCell = worksheet.getCell(`A${currentRow}`)
  titleCell.value = 'OPD MEDICAL REIMBURSEMENT CLAIM'
  titleCell.font = { size: 14, bold: true }
  titleCell.alignment = { horizontal: 'center' }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  currentRow += 2

  // Employee Info
  worksheet.getCell(`A${currentRow}`).value = 'Employee Name:'
  worksheet.getCell(`B${currentRow}`).value = data.employeeName
  worksheet.getCell(`E${currentRow}`).value = 'Emp Code:'
  worksheet.getCell(`F${currentRow}`).value = data.employeeCode
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = 'Designation:'
  worksheet.getCell(`B${currentRow}`).value = data.designation
  worksheet.getCell(`E${currentRow}`).value = 'Department:'
  worksheet.getCell(`F${currentRow}`).value = data.department
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = 'Date of Claim:'
  worksheet.getCell(`B${currentRow}`).value = data.dateOfClaim
  currentRow += 2

  // Patient Info
  worksheet.mergeCells(`A${currentRow}:J${currentRow}`)
  const patientHeaderCell = worksheet.getCell(`A${currentRow}`)
  patientHeaderCell.value = 'Patient Information'
  patientHeaderCell.font = { bold: true }
  patientHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = 'Patient Name:'
  worksheet.getCell(`B${currentRow}`).value = data.patientName
  worksheet.getCell(`E${currentRow}`).value = 'Relation:'
  worksheet.getCell(`F${currentRow}`).value = data.relation
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = 'Consultation Date:'
  worksheet.getCell(`B${currentRow}`).value = data.consultationDate
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = 'Doctor Name:'
  worksheet.getCell(`B${currentRow}`).value = data.doctorName
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = 'Hospital/Clinic:'
  worksheet.getCell(`B${currentRow}`).value = data.hospitalName
  currentRow += 2

  // Expenses Breakdown
  worksheet.mergeCells(`A${currentRow}:J${currentRow}`)
  const expensesHeaderCell = worksheet.getCell(`A${currentRow}`)
  expensesHeaderCell.value = 'Expenses Breakdown'
  expensesHeaderCell.font = { bold: true }
  expensesHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = '1. Consultation Fee:'
  worksheet.getCell(`F${currentRow}`).value = data.consultationFee
  currentRow += 2

  // Medicines
  worksheet.getCell(`A${currentRow}`).value = '2. Medicine Costs:'
  currentRow++
  worksheet.getCell(`A${currentRow}`).value = 'S.No.'
  worksheet.getCell(`B${currentRow}`).value = 'Item Name'
  worksheet.getCell(`F${currentRow}`).value = 'Amount (Rs.)'
  currentRow++

  let medicineTotal = 0
  data.medicineCosts.forEach((med, idx) => {
    worksheet.getCell(`A${currentRow}`).value = idx + 1
    worksheet.getCell(`B${currentRow}`).value = med.itemName
    worksheet.getCell(`F${currentRow}`).value = med.amount
    medicineTotal += med.amount
    currentRow++
  })

  worksheet.getCell(`B${currentRow}`).value = 'Total Medicines'
  worksheet.getCell(`B${currentRow}`).font = { bold: true }
  worksheet.getCell(`F${currentRow}`).value = medicineTotal
  worksheet.getCell(`F${currentRow}`).font = { bold: true }
  currentRow += 2

  // Lab Tests
  worksheet.getCell(`A${currentRow}`).value = '3. Lab Test Costs:'
  currentRow++
  worksheet.getCell(`A${currentRow}`).value = 'S.No.'
  worksheet.getCell(`B${currentRow}`).value = 'Test Name'
  worksheet.getCell(`F${currentRow}`).value = 'Amount (Rs.)'
  currentRow++

  let labTotal = 0
  data.labTestCosts.forEach((lab, idx) => {
    worksheet.getCell(`A${currentRow}`).value = idx + 1
    worksheet.getCell(`B${currentRow}`).value = lab.testName
    worksheet.getCell(`F${currentRow}`).value = lab.amount
    labTotal += lab.amount
    currentRow++
  })

  worksheet.getCell(`B${currentRow}`).value = 'Total Lab Tests'
  worksheet.getCell(`B${currentRow}`).font = { bold: true }
  worksheet.getCell(`F${currentRow}`).value = labTotal
  worksheet.getCell(`F${currentRow}`).font = { bold: true }
  currentRow += 2

  // Other Expenses
  if (data.otherExpenses.length > 0) {
    worksheet.getCell(`A${currentRow}`).value = '4. Other Expenses:'
    currentRow++
    worksheet.getCell(`A${currentRow}`).value = 'S.No.'
    worksheet.getCell(`B${currentRow}`).value = 'Description'
    worksheet.getCell(`F${currentRow}`).value = 'Amount (Rs.)'
    currentRow++

    let otherTotal = 0
    data.otherExpenses.forEach((other, idx) => {
      worksheet.getCell(`A${currentRow}`).value = idx + 1
      worksheet.getCell(`B${currentRow}`).value = other.description
      worksheet.getCell(`F${currentRow}`).value = other.amount
      otherTotal += other.amount
      currentRow++
    })

    worksheet.getCell(`B${currentRow}`).value = 'Total Other'
    worksheet.getCell(`B${currentRow}`).font = { bold: true }
    worksheet.getCell(`F${currentRow}`).value = otherTotal
    worksheet.getCell(`F${currentRow}`).font = { bold: true }
    currentRow += 2
  }

  // Grand Total
  const grandTotal = data.consultationFee + medicineTotal + labTotal + 
    data.otherExpenses.reduce((sum, o) => sum + o.amount, 0)

  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
  worksheet.getCell(`A${currentRow}`).value = 'GRAND TOTAL CLAIMED'
  worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 }
  worksheet.getCell(`F${currentRow}`).value = grandTotal
  worksheet.getCell(`F${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FFFF0000' } }
  currentRow += 3

  // Signatures
  worksheet.getCell(`A${currentRow}`).value = 'Employee Signature:'
  worksheet.getCell(`G${currentRow}`).value = 'Approved By:'
  currentRow += 3
  worksheet.getCell(`A${currentRow}`).value = 'Date:'
  worksheet.getCell(`G${currentRow}`).value = 'Date:'

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
