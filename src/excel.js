const ExcelJS = require('exceljs');
const db = require('./db');

async function generateMembersExcelBuffer() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mahalla Telegram Boti';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Mahalla Aholisi', {
    properties: { tabColor: { argb: 'FF1E293B' } },
    views: [{ state: 'frozen', ySplit: 3 }]
  });

  // Title Header
  worksheet.mergeCells('A1:H1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'MAHALLA TELEGRAM GURUHI A\'ZOLARI RO\'YXATI';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' } // Royal Blue
  };
  worksheet.getRow(1).height = 35;

  // Subtitle
  worksheet.mergeCells('A2:H2');
  const subCell = worksheet.getCell('A2');
  subCell.value = `Shakllantirilgan sana: ${new Date().toLocaleString('uz-UZ')}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  // Columns Header
  worksheet.getRow(3).values = [
    '№',
    'Ism Familiya',
    'Telefon Raqami',
    'Ko\'cha',
    'Uy Raqami',
    'Telegram ID',
    'Username',
    'Status'
  ];
  worksheet.getRow(3).height = 26;

  worksheet.getRow(3).eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
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

  // Query All Members
  const members = db.prepare('SELECT * FROM members ORDER BY created_at DESC').all();

  members.forEach((m, idx) => {
    let statusText = '🟡 Kutilmoqda';
    if (m.status === 'approved') statusText = '✅ Tasdiqlangan';
    if (m.status === 'rejected') statusText = '❌ Rad etilgan';

    const row = worksheet.addRow([
      idx + 1,
      m.full_name,
      m.phone_number,
      m.street,
      m.house_number,
      m.telegram_id,
      m.telegram_username ? '@' + m.telegram_username : '—',
      statusText
    ]);

    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 || colNumber === 5 || colNumber === 6 || colNumber === 8 ? 'center' : 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      if (colNumber === 8) {
        cell.font = { name: 'Arial', size: 10, bold: true };
      }
    });
  });

  // Column widths
  worksheet.columns = [
    { width: 6 },  // №
    { width: 28 }, // Ism Familiya
    { width: 18 }, // Telefon
    { width: 25 }, // Ko'cha
    { width: 12 }, // Uy
    { width: 15 }, // Telegram ID
    { width: 20 }, // Username
    { width: 18 }  // Status
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = {
  generateMembersExcelBuffer
};
