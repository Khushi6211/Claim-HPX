// Excel Generator - Contingency Claim
import ExcelJS from 'exceljs'

export interface ContingencyData {
  employeeName: string
  employeeCode: string
  designation: string
  department: string
  dateOfClaim: string
  totalAmount: number
  expenses: Array<{
    sno: number
    description: string
    vendor: string
    date: string
    amount: number
    voucherNo: string
    purpose: string
  }>
  paymentMode: 'reimbursement' | 'vendor'
  vendorName?: string
  vendorDetails?: string
}

export async function generateContingencyExcel(data: ContingencyData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Contingency Claim')

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
  titleCell.value = 'CONTINGENT CLAIM'
  titleCell.font = { size: 14, bold: true }
  titleCell.alignment = { horizontal: 'center' }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
  currentRow += 2

  // Employee Info
  worksheet.getCell(`A${currentRow}`).value = 'Name of Employee:'
  worksheet.getCell(`B${currentRow}`).value = data.employeeName
  worksheet.getCell(`E${currentRow}`).value = 'Emp. No.:'
  worksheet.getCell(`F${currentRow}`).value = data.employeeCode
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = 'Designation:'
  worksheet.getCell(`B${currentRow}`).value = data.designation
  worksheet.getCell(`E${currentRow}`).value = 'Department:'
  worksheet.getCell(`F${currentRow}`).value = data.department
  currentRow++

  worksheet.getCell(`A${currentRow}`).value = 'Claim Date:'
  worksheet.getCell(`B${currentRow}`).value = data.dateOfClaim
  currentRow += 2

  // Expense Table
  worksheet.mergeCells(`A${currentRow}:J${currentRow}`)
  const tableHeaderCell = worksheet.getCell(`A${currentRow}`)
  tableHeaderCell.value = 'Details of Expenditure'
  tableHeaderCell.font = { bold: true }
  tableHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }
  currentRow++

  // Table Headers
  worksheet.getCell(`A${currentRow}`).value = 'S.No.'
  worksheet.getCell(`B${currentRow}`).value = 'Description'
  worksheet.getCell(`D${currentRow}`).value = 'Vendor/Party'
  worksheet.getCell(`F${currentRow}`).value = 'Date'
  worksheet.getCell(`G${currentRow}`).value = 'Amount (Rs.)'
  worksheet.getCell(`H${currentRow}`).value = 'Voucher No.'
  worksheet.getCell(`I${currentRow}`).value = 'Purpose'
  
  const headerRow = worksheet.getRow(currentRow)
  headerRow.font = { bold: true }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } }
  currentRow++

  // Expense Rows
  let totalAmount = 0
  data.expenses.forEach((expense) => {
    worksheet.getCell(`A${currentRow}`).value = expense.sno
    worksheet.getCell(`B${currentRow}`).value = expense.description
    worksheet.getCell(`D${currentRow}`).value = expense.vendor
    worksheet.getCell(`F${currentRow}`).value = expense.date
    worksheet.getCell(`G${currentRow}`).value = expense.amount
    worksheet.getCell(`H${currentRow}`).value = expense.voucherNo
    worksheet.getCell(`I${currentRow}`).value = expense.purpose
    totalAmount += expense.amount
    currentRow++
  })

  // Total Row
  worksheet.getCell(`F${currentRow}`).value = 'Total:'
  worksheet.getCell(`F${currentRow}`).font = { bold: true }
  worksheet.getCell(`G${currentRow}`).value = totalAmount
  worksheet.getCell(`G${currentRow}`).font = { bold: true, color: { argb: 'FFFF0000' } }
  currentRow += 2

  // Payment Mode
  worksheet.mergeCells(`A${currentRow}:J${currentRow}`)
  const paymentCell = worksheet.getCell(`A${currentRow}`)
  paymentCell.value = `I have incurred an expenditure of INR ${totalAmount.toLocaleString('en-IN')} ` +
    `(Rupees ${numberToWords(totalAmount)} only/-)`
  paymentCell.alignment = { wrapText: true }
  currentRow += 2

  worksheet.mergeCells(`A${currentRow}:J${currentRow}`)
  const vouchersCell = worksheet.getCell(`A${currentRow}`)
  vouchersCell.value = 'The relevant vouchers are enclosed herewith.'
  currentRow += 2

  if (data.paymentMode === 'reimbursement') {
    worksheet.mergeCells(`A${currentRow}:J${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = '☑ The amount may be reimbursed to me.'
  } else {
    worksheet.mergeCells(`A${currentRow}:J${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = `☑ The amount may be paid to the party M/s ${data.vendorName || '_______'}`
  }
  currentRow += 3

  // Signatures
  worksheet.getCell(`A${currentRow}`).value = 'SIGNATURE:'
  currentRow++
  worksheet.getCell(`A${currentRow}`).value = 'DESIGNATION:'
  currentRow += 3

  worksheet.getCell(`A${currentRow}`).value = 'Approved By:'
  worksheet.getCell(`G${currentRow}`).value = 'Finance Approval:'
  currentRow += 3
  worksheet.getCell(`A${currentRow}`).value = 'Date:'
  worksheet.getCell(`G${currentRow}`).value = 'Date:'

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

function numberToWords(num: number): string {
  if (num === 0) return 'Zero'
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  
  function convertHundreds(n: number): string {
    if (n === 0) return ''
    if (n < 10) return ones[n]
    if (n < 20) return teens[n - 10]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertHundreds(n % 100) : '')
  }
  
  if (num < 1000) return convertHundreds(num)
  if (num < 100000) {
    const thousands = Math.floor(num / 1000)
    const remainder = num % 1000
    return convertHundreds(thousands) + ' Thousand' + (remainder ? ' ' + convertHundreds(remainder) : '')
  }
  if (num < 10000000) {
    const lakhs = Math.floor(num / 100000)
    const remainder = num % 100000
    return convertHundreds(lakhs) + ' Lakh' + (remainder >= 1000 ? ' ' + numberToWords(remainder) : remainder ? ' ' + convertHundreds(remainder) : '')
  }
  
  const crores = Math.floor(num / 10000000)
  const remainder = num % 10000000
  return convertHundreds(crores) + ' Crore' + (remainder ? ' ' + numberToWords(remainder) : '')
}
