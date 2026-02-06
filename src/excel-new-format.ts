// New Tour Allowance Claim Format Generator
import ExcelJS from 'exceljs';
import { sanitizeExcelValue } from './security';

export interface TourAllowanceData {
  // Employee Info
  employeeName: string;
  designation: string;
  employeeCode: string;
  grade: string;
  department: string;
  dateOfClaim: string;
  
  // Section II: Miscellaneous Expenses
  miscExpenses: Array<{
    sno: number;
    particulars: string;
    amount: number;
  }>;
  
  // Section III: Journey Details
  journeys: Array<{
    departureDate: string;
    departureTime: string;
    departureStation: string;
    arrivalDate: string;
    arrivalTime: string;
    arrivalStation: string;
    modeClass: string;
    trainNo: string;
    purpose: string;
    amount: number;
    ticketNo: string;
    remarks: string;
  }>;
  
  // Section IV: DA & Accommodation
  daDetails: Array<{
    cityType: string; // 'Principal City' | 'Ordinary City' | 'Journey'
    station: string;
    dates: string;
    daysForDA: number;
    ratePerDay: number;
    hotelName: string;
    hotelAmount: number;
    sharedWith: string;
  }>;
  
  // Section V: Conveyance Charges
  conveyances: Array<{
    date: string;
    station: string;
    placeFrom: string;
    placeTo: string;
    distanceKm: number;
    meansOfTravel: string;
    amount: number;
    purpose: string;
  }>;
  
  // Section I: Totals (calculated)
  advanceDrawn: number;
}

export async function generateTourAllowanceExcel(data: TourAllowanceData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tour Allowance Claim');
  
  // Set column widths
  worksheet.columns = [
    { width: 10 },  // A
    { width: 12 },  // B
    { width: 10 },  // C
    { width: 12 },  // D
    { width: 10 },  // E
    { width: 10 },  // F
    { width: 12 },  // G
    { width: 12 },  // H
    { width: 15 },  // I
    { width: 10 },  // J
    { width: 8 },   // K
    { width: 12 },  // L
    { width: 12 }   // M
  ];
  
  let currentRow = 1;
  
  // ===== HEADER =====
  const titleCell = worksheet.getCell('A1');
  worksheet.mergeCells('A1:C1');
  titleCell.value = sanitizeExcelValue('TOUR TRAVELING ALLOWANCE CLAIM');
  titleCell.font = { name: 'Arial', size: 13, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
  worksheet.getRow(1).height = 20;
  
  currentRow = 2;
  
  // Employee details
  worksheet.getCell(`A${currentRow}`).value = `Name: ${sanitizeExcelValue(data.employeeName)}`;
  worksheet.getCell(`B${currentRow}`).value = `Designation: ${sanitizeExcelValue(data.designation)}`;
  worksheet.getCell(`C${currentRow}`).value = `Emp. ID: ${sanitizeExcelValue(data.employeeCode)}`;
  
  currentRow++;
  worksheet.getCell(`A${currentRow}`).value = `Grade: ${sanitizeExcelValue(data.grade)}`;
  worksheet.getCell(`B${currentRow}`).value = `Department: ${sanitizeExcelValue(data.department)}`;
  worksheet.getCell(`C${currentRow}`).value = `Date: ${sanitizeExcelValue(data.dateOfClaim)}`;
  
  currentRow += 2; // Skip one row
  
  // ===== SECTION I: CALCULATION OF TOTAL TA =====
  const section1Cell = worksheet.getCell(`A${currentRow}`);
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  section1Cell.value = 'Section I:   Calculation of Total TA Admissible (please fill this Section after filling Section II to V.)';
  section1Cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  section1Cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } };
  section1Cell.alignment = { horizontal: 'left', vertical: 'center', wrapText: true };
  worksheet.getRow(currentRow).height = 25;
  
  currentRow++;
  
  // Calculate totals
  const journeyTotal = data.journeys.reduce((sum, j) => sum + (j.amount || 0), 0);
  const miscTotal = data.miscExpenses.reduce((sum, m) => sum + (m.amount || 0), 0);
  const conveyanceTotal = data.conveyances.reduce((sum, c) => sum + (c.amount || 0), 0);
  const daTotal = data.daDetails.reduce((sum, d) => sum + (d.daysForDA * d.ratePerDay), 0);
  const hotelTotal = data.daDetails.reduce((sum, d) => sum + (d.hotelAmount || 0), 0);
  
  const totalClaimed = journeyTotal + miscTotal + conveyanceTotal + daTotal + hotelTotal;
  const netClaim = totalClaimed - (data.advanceDrawn || 0);
  
  // Section I table
  worksheet.getCell(`A${currentRow + 2}`).value = '1.  Journey Fares (Section –III)';
  worksheet.getCell(`B${currentRow + 2}`).value = journeyTotal;
  
  worksheet.getCell(`A${currentRow + 3}`).value = '2.  Conveyance Charges & Misc. expenses (II + V)';
  worksheet.getCell(`B${currentRow + 3}`).value = miscTotal + conveyanceTotal;
  
  worksheet.getCell(`A${currentRow + 4}`).value = '3.  Accommodation charges';
  worksheet.getCell(`B${currentRow + 4}`).value = hotelTotal;
  
  worksheet.getCell(`A${currentRow + 5}`).value = '4.  Daily Allowance';
  worksheet.getCell(`B${currentRow + 5}`).value = daTotal;
  
  worksheet.getCell(`A${currentRow + 6}`).value = 'A. Total 1 to 4';
  worksheet.getCell(`B${currentRow + 6}`).value = totalClaimed;
  worksheet.getCell(`B${currentRow + 6}`).font = { bold: true };
  
  worksheet.getCell(`A${currentRow + 7}`).value = 'B.  Advance Drawn';
  worksheet.getCell(`B${currentRow + 7}`).value = data.advanceDrawn || 0;
  
  worksheet.getCell(`A${currentRow + 10}`).value = 'C.  NET CLAIM (A-B)';
  worksheet.getCell(`B${currentRow + 10}`).value = netClaim;
  worksheet.getCell(`B${currentRow + 10}`).font = { bold: true };
  worksheet.getCell(`C${currentRow + 10}`).value = netClaim >= 0 ? '+' : '-';
  
  currentRow += 15;
  
  // ===== SECTION II: MISCELLANEOUS EXPENSES =====
  const section2Cell = worksheet.getCell(`A${currentRow}`);
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  section2Cell.value = 'SECTION II:    Details of Miscellaneous Expenses incidental to Tour';
  section2Cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  section2Cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } };
  section2Cell.alignment = { horizontal: 'left', vertical: 'center', wrapText: true };
  
  currentRow++;
  worksheet.getCell(`A${currentRow}`).value = 'Note:  Enclose receipts for amount claimed.';
  
  currentRow++;
  worksheet.getCell(`A${currentRow}`).value = 'S. No.';
  worksheet.getCell(`B${currentRow}`).value = 'Particulars of Expenses';
  worksheet.getCell(`C${currentRow}`).value = 'Amount';
  worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
  
  currentRow++;
  data.miscExpenses.forEach((exp, idx) => {
    worksheet.getCell(`A${currentRow}`).value = exp.sno || (idx + 1);
    worksheet.getCell(`B${currentRow}`).value = sanitizeExcelValue(exp.particulars);
    worksheet.getCell(`C${currentRow}`).value = exp.amount || 0;
    currentRow++;
  });
  
  worksheet.getCell(`A${currentRow}`).value = 'Total';
  worksheet.getCell(`C${currentRow}`).value = miscTotal;
  worksheet.getCell(`C${currentRow}`).font = { bold: true };
  
  currentRow += 3;
  
  // ===== SECTION III: JOURNEY DETAILS =====
  const section3Cell = worksheet.getCell(`A${currentRow}`);
  worksheet.mergeCells(`A${currentRow}:M${currentRow}`);
  section3Cell.value = 'SECTION III:    JOURNEY DETAILS (Please indicate ticket/PNR No. or attach M/R wherever fare claimed is for other than IInd Class and for air journeys and bus journeys enclose used ticket/folders).';
  section3Cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  section3Cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } };
  section3Cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
  worksheet.getRow(currentRow).height = 30;
  
  currentRow++;
  
  // Journey table headers
  worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = 'Departure';
  worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
  worksheet.getCell(`D${currentRow}`).value = 'Arrival';
  
  currentRow++;
  worksheet.getCell(`A${currentRow}`).value = 'Date';
  worksheet.getCell(`B${currentRow}`).value = 'Time (hrs.)';
  worksheet.getCell(`C${currentRow}`).value = 'Station';
  worksheet.getCell(`D${currentRow}`).value = 'Date';
  worksheet.getCell(`E${currentRow}`).value = 'Time (hrs.)';
  worksheet.getCell(`F${currentRow}`).value = 'Station';
  worksheet.getCell(`G${currentRow}`).value = 'Mode & class of travel';
  worksheet.getCell(`H${currentRow}`).value = 'Train No. & Name';
  worksheet.getCell(`I${currentRow}`).value = 'Purpose of journey';
  worksheet.mergeCells(`J${currentRow}:K${currentRow}`);
  worksheet.getCell(`J${currentRow}`).value = 'Amount claimed';
  worksheet.getCell(`L${currentRow}`).value = 'Ticket no./ MR no.';
  worksheet.getCell(`M${currentRow}`).value = 'Remarks';
  
  currentRow++;
  
  // Journey data
  data.journeys.forEach((journey) => {
    worksheet.getCell(`A${currentRow}`).value = sanitizeExcelValue(journey.departureDate);
    worksheet.getCell(`B${currentRow}`).value = sanitizeExcelValue(journey.departureTime);
    worksheet.getCell(`C${currentRow}`).value = sanitizeExcelValue(journey.departureStation);
    worksheet.getCell(`D${currentRow}`).value = sanitizeExcelValue(journey.arrivalDate);
    worksheet.getCell(`E${currentRow}`).value = sanitizeExcelValue(journey.arrivalTime);
    worksheet.getCell(`F${currentRow}`).value = sanitizeExcelValue(journey.arrivalStation);
    worksheet.getCell(`G${currentRow}`).value = sanitizeExcelValue(journey.modeClass);
    worksheet.getCell(`H${currentRow}`).value = sanitizeExcelValue(journey.trainNo);
    worksheet.getCell(`I${currentRow}`).value = sanitizeExcelValue(journey.purpose);
    worksheet.getCell(`J${currentRow}`).value = journey.amount || 0;
    worksheet.getCell(`L${currentRow}`).value = sanitizeExcelValue(journey.ticketNo);
    worksheet.getCell(`M${currentRow}`).value = sanitizeExcelValue(journey.remarks);
    currentRow++;
  });
  
  currentRow += 2;
  
  // ===== SECTION IV: DA & ACCOMMODATION =====
  const section4Cell = worksheet.getCell(`A${currentRow}`);
  worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
  section4Cell.value = 'SECTION IV:    Details of Claim for DA & Expenditure Incurred for Accommodation (Excluding leave availed)';
  section4Cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  section4Cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } };
  section4Cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
  
  currentRow++;
  
  // DA table headers
  worksheet.getCell(`A${currentRow}`).value = 'Midnight (00 hrs.) spent in';
  worksheet.getCell(`B${currentRow}`).value = 'Station';
  worksheet.getCell(`C${currentRow}`).value = 'Date(s)';
  worksheet.getCell(`D${currentRow}`).value = 'No. of days for DA';
  worksheet.getCell(`E${currentRow}`).value = 'Rate per day';
  worksheet.mergeCells(`F${currentRow}:G${currentRow}`);
  worksheet.getCell(`F${currentRow}`).value = 'Amount of daily allowance';
  worksheet.getCell(`H${currentRow}`).value = 'Name of Hotel/ Guest House';
  worksheet.mergeCells(`I${currentRow}:J${currentRow}`);
  worksheet.getCell(`I${currentRow}`).value = 'Amount for Hotel accommodation';
  worksheet.getCell(`K${currentRow}`).value = 'Name of persons with whom accommodation shared';
  
  currentRow++;
  
  // DA data
  data.daDetails.forEach((da) => {
    worksheet.getCell(`A${currentRow}`).value = sanitizeExcelValue(da.cityType);
    worksheet.getCell(`B${currentRow}`).value = sanitizeExcelValue(da.station);
    worksheet.getCell(`C${currentRow}`).value = sanitizeExcelValue(da.dates);
    worksheet.getCell(`D${currentRow}`).value = da.daysForDA || 0;
    worksheet.getCell(`E${currentRow}`).value = da.ratePerDay || 0;
    worksheet.getCell(`F${currentRow}`).value = (da.daysForDA || 0) * (da.ratePerDay || 0);
    worksheet.getCell(`H${currentRow}`).value = sanitizeExcelValue(da.hotelName);
    worksheet.getCell(`I${currentRow}`).value = da.hotelAmount || 0;
    worksheet.getCell(`K${currentRow}`).value = sanitizeExcelValue(da.sharedWith);
    currentRow++;
  });
  
  worksheet.getCell(`C${currentRow}`).value = 'Total';
  worksheet.getCell(`E${currentRow}`).value = 'Total';
  worksheet.getCell(`F${currentRow}`).value = daTotal;
  worksheet.getCell(`F${currentRow}`).font = { bold: true };
  worksheet.getCell(`H${currentRow}`).value = 'Total';
  worksheet.getCell(`I${currentRow}`).value = hotelTotal;
  worksheet.getCell(`I${currentRow}`).font = { bold: true };
  
  currentRow += 3;
  
  // ===== SECTION V: CONVEYANCE CHARGES =====
  const section5Cell = worksheet.getCell(`A${currentRow}`);
  worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
  section5Cell.value = 'SECTION V:    Details of Conveyance Charges Claimed';
  section5Cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  section5Cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } };
  section5Cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
  
  currentRow++;
  
  // Conveyance table headers
  worksheet.getCell(`A${currentRow}`).value = 'Sl No.';
  worksheet.getCell(`B${currentRow}`).value = 'Date';
  worksheet.getCell(`C${currentRow}`).value = 'Station';
  worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
  worksheet.getCell(`D${currentRow}`).value = 'Place of visit(s) (specify locality)';
  worksheet.getCell(`F${currentRow}`).value = 'Distt. In Kms. (Approx)';
  worksheet.getCell(`G${currentRow}`).value = 'Means of Travel';
  worksheet.mergeCells(`H${currentRow}:I${currentRow}`);
  worksheet.getCell(`H${currentRow}`).value = 'Amount';
  worksheet.getCell(`J${currentRow}`).value = 'Purpose (In brief)';
  worksheet.getCell(`K${currentRow}`).value = 'Station-wise weekly total';
  
  currentRow++;
  worksheet.getCell(`D${currentRow}`).value = 'From';
  worksheet.getCell(`E${currentRow}`).value = 'To';
  
  currentRow++;
  
  // Conveyance data
  data.conveyances.forEach((conv, idx) => {
    worksheet.getCell(`A${currentRow}`).value = idx + 1;
    worksheet.getCell(`B${currentRow}`).value = sanitizeExcelValue(conv.date);
    worksheet.getCell(`C${currentRow}`).value = sanitizeExcelValue(conv.station);
    worksheet.getCell(`D${currentRow}`).value = sanitizeExcelValue(conv.placeFrom);
    worksheet.getCell(`E${currentRow}`).value = sanitizeExcelValue(conv.placeTo);
    worksheet.getCell(`F${currentRow}`).value = conv.distanceKm || 0;
    worksheet.getCell(`G${currentRow}`).value = sanitizeExcelValue(conv.meansOfTravel);
    worksheet.getCell(`H${currentRow}`).value = conv.amount || 0;
    worksheet.getCell(`J${currentRow}`).value = sanitizeExcelValue(conv.purpose);
    currentRow++;
  });
  
  worksheet.getCell(`H${currentRow}`).value = 'Total';
  worksheet.getCell(`H${currentRow + 1}`).value = conveyanceTotal;
  worksheet.getCell(`H${currentRow + 1}`).font = { bold: true };
  
  currentRow += 4;
  
  // ===== CERTIFICATE & SIGNATURE =====
  worksheet.getCell(`A${currentRow}`).value = 'CERTIFICATE:';
  worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
  worksheet.getCell(`B${currentRow}`).value = 'Certified that: (i) I am/am not in receipt of HRA or availing the facility of leased accommodation at any of the tour stations for which daily allowance has been claimed.';
  worksheet.getCell(`B${currentRow}`).alignment = { wrapText: true };
  
  currentRow += 2;
  worksheet.getCell(`A${currentRow}`).value = 'Counter Signed';
  worksheet.getCell(`C${currentRow}`).value = 'Signature of Employee';
  
  currentRow++;
  worksheet.getCell(`C${currentRow}`).value = 'Date:';
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as Buffer;
}
