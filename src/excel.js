const ExcelJS = require('exceljs');
const db = require('./db');

// Helper to create styled workbook
function createBaseWorksheet(workbook, sheetName, titleText) {
  const worksheet = workbook.addWorksheet(sheetName, {
    properties: { tabColor: { argb: 'FF1E293B' } },
    views: [{ state: 'frozen', ySplit: 3 }]
  });

  // Title Header
  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = titleText;
  titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }
  };
  worksheet.getRow(1).height = 32;

  // Subtitle / Instructions
  worksheet.mergeCells('A2:G2');
  const subCell = worksheet.getCell('A2');
  subCell.value = `Ko'rsatma: "QAROR" ustuniga ✅ (Tasdiqlash) yoki ❌ (Rad etish) belgisini qo'yib, faylni botga qayta yuklang.`;
  subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  // Header Columns
  worksheet.getRow(3).values = [
    '№ Qator',
    'Telegram ID',
    'Ism Familiya',
    'Telefon Raqami',
    'Ko\'cha Nomi',
    'Uy Raqami',
    'QAROR (✅ Tasdiq / ❌ Rad)'
  ];
  worksheet.getRow(3).height = 26;

  worksheet.getRow(3).eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };
  });

  return worksheet;
}

// 1. Generate Excel for Pending / Review
async function generateReviewExcelBuffer(filterStatus = null, title = 'MAHALLA TELEGRAM GURUHI – A\'ZOLARNI TEKSHIRISH JADVALI') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = createBaseWorksheet(workbook, 'Tekshirish', title);

  let query = 'SELECT * FROM members';
  const params = [];
  if (filterStatus) {
    query += ' WHERE status = ?';
    params.push(filterStatus);
  }
  query += ' ORDER BY created_at ASC';

  const members = db.prepare(query).all(...params);

  members.forEach((m, idx) => {
    let qarorText = '🟡 Kutilmoqda';
    if (m.status === 'approved') qarorText = '✅';
    if (m.status === 'rejected') qarorText = '❌';

    const row = worksheet.addRow([
      idx + 1,
      m.telegram_id,
      m.full_name,
      m.phone_number,
      m.street,
      m.house_number,
      qarorText
    ]);

    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 || colNumber === 2 || colNumber === 6 || colNumber === 7 ? 'center' : 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      if (colNumber === 7) {
        cell.font = { name: 'Arial', size: 11, bold: true };
      }
    });
  });

  worksheet.columns = [
    { width: 10 }, // № Qator
    { width: 16 }, // Telegram ID
    { width: 28 }, // Ism Familiya
    { width: 18 }, // Telefon
    { width: 25 }, // Ko'cha
    { width: 12 }, // Uy
    { width: 26 }  // QAROR
  ];

  return await workbook.xlsx.writeBuffer();
}

// 2. Parse and Process Uploaded Excel file
async function parseAndProcessReviewedExcel(buffer, maxRowsToProcess = null) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error('Excel faylda ishchi varaq (sheet) topilmadi.');
  }

  const results = {
    processedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    skippedCount: 0,
    actionsToExecute: [] // { telegram_id, newStatus, full_name }
  };

  let rowIdx = 0;

  worksheet.eachRow((row, rowNumber) => {
    // Skip title and header rows (rows 1, 2, 3)
    if (rowNumber <= 3) return;

    rowIdx++;
    if (maxRowsToProcess && rowIdx > maxRowsToProcess) {
      results.skippedCount++;
      return;
    }

    const rowValues = row.values;
    // Columns: [empty, №, Telegram ID, Ism, Tel, Ko'cha, Uy, QAROR]
    const telegramId = String(row.getCell(2).value || '').trim();
    const fullName = String(row.getCell(3).value || '').trim();
    const decisionRaw = String(row.getCell(7).value || '').trim().toLowerCase();

    if (!telegramId) return;

    let newStatus = null;

    if (decisionRaw.includes('✅') || decisionRaw.includes('tasdiq') || decisionRaw.includes('ha') || decisionRaw.includes('approved') || decisionRaw.includes('+') || decisionRaw === '1') {
      newStatus = 'approved';
      results.approvedCount++;
    } else if (decisionRaw.includes('❌') || decisionRaw.includes('rad') || decisionRaw.includes('yoq') || decisionRaw.includes('yo\'q') || decisionRaw.includes('rejected') || decisionRaw.includes('-') || decisionRaw === '0') {
      newStatus = 'rejected';
      results.rejectedCount++;
    }

    if (newStatus) {
      results.processedCount++;
      results.actionsToExecute.push({
        telegram_id: telegramId,
        newStatus: newStatus,
        full_name: fullName
      });
    } else {
      results.skippedCount++;
    }
  });

  return results;
}

module.exports = {
  generateReviewExcelBuffer,
  parseAndProcessReviewedExcel
};
