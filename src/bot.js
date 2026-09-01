require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { v4: uuidv4 } = require('uuid');
const http = require('https');
const db = require('./db');
const { generateReviewExcelBuffer, parseAndProcessReviewedExcel } = require('./excel');
const { analyzeMembers, askAiAssistant, setSetting, getSetting } = require('./ai');

const BOT_TOKEN = process.env.BOT_TOKEN || '8230743719:AAElY61ZmjFjdDjEMWg7G-l4f352ovHk0Zo';
const DEFAULT_ADMIN_IDS = ['5744542264', '7041203698'];
const DEFAULT_GROUP_ID = process.env.GROUP_ID || '-1001607742536';

const bot = new Telegraf(BOT_TOKEN);

// Sessions helper
function getSession(telegramId) {
  const row = db.prepare('SELECT step, temp_data FROM bot_sessions WHERE telegram_id = ?').get(String(telegramId));
  if (!row) return { step: 'idle', tempData: {} };
  return {
    step: row.step,
    tempData: row.temp_data ? JSON.parse(row.temp_data) : {}
  };
}

function updateSession(telegramId, step, tempData = {}) {
  db.prepare(`
    INSERT OR REPLACE INTO bot_sessions (telegram_id, step, temp_data, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(String(telegramId), step, JSON.stringify(tempData));
}

function clearSession(telegramId) {
  db.prepare('DELETE FROM bot_sessions WHERE telegram_id = ?').run(String(telegramId));
}

function getAdminIds() {
  const customAdmin = getSetting('admin_id');
  const list = [...DEFAULT_ADMIN_IDS];
  if (customAdmin && !list.includes(String(customAdmin))) {
    list.push(String(customAdmin));
  }
  return list;
}

function isAdmin(telegramId) {
  return getAdminIds().includes(String(telegramId));
}

// Admin Keyboard
function getAdminKeyboard() {
  return Markup.keyboard([
    ['📥 Ma\'lumotlarni olish (Excel)', '📋 Kutilayotganlar'],
    ['✅ Tasdiqlanganlar', '❌ Taqiqlanganlar'],
    ['📊 Statistika', '🧠 AI Tahlil'],
    ['⚙️ Ulangan Guruh', '🔄 Foydalanuvchi sifatida ko\'rish']
  ]).resize();
}

// AI Chat Keyboard
function getAiChatKeyboard() {
  return Markup.keyboard([
    ['❌ AI Suhbatni Yakunlash']
  ]).resize();
}

// Download file buffer from Telegram
async function downloadFileBuffer(fileUrl) {
  return new Promise((resolve, reject) => {
    http.get(fileUrl, (res) => {
      const data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
      res.on('error', reject);
    });
  });
}

// --- /start COMMAND ---
bot.command('start', async (ctx) => {
  const telegramId = String(ctx.from.id);

  if (isAdmin(telegramId)) {
    clearSession(telegramId);
    const total = db.prepare('SELECT COUNT(*) as count FROM members').get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'pending'").get().count;
    const approved = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'approved'").get().count;
    const rejected = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'rejected'").get().count;

    const startDateStr = getSetting('deadline_start_date') || new Date().toISOString();
    const deadlineDays = Number(getSetting('deadline_days') || 7);
    const endDate = new Date(new Date(startDateStr).getTime() + deadlineDays * 24 * 60 * 60 * 1000);
    const daysLeft = Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)));

    return ctx.reply(
      `👑 <b>Assalomu alaykum, Mahalla Yordamchisi (Admin)!</b>\n\n` +
      `Damariq mahallasi Telegram guruhi a'zolarini tasdiqlash tizimiga xush kelibsiz.\n\n` +
      `⏱ <b>7 kunlik muddatdan qoldi:</b> <b>${daysLeft} kun</b>\n\n` +
      `📊 <b>Hozirgi holat:</b>\n` +
      `• Jami a'zolar: <b>${total} ta</b> (1662+ a'zodan)\n` +
      `• 🟡 Kutilmoqda: <b>${pending} ta</b>\n` +
      `• ✅ Tasdiqlangan: <b>${approved} ta</b>\n` +
      `• ❌ Rad etilgan: <b>${rejected} ta</b>\n\n` +
      `Kerakli bo'limni tanlang:`,
      {
        parse_mode: 'HTML',
        ...getAdminKeyboard()
      }
    );
  }

  // Registered Citizen check
  const existing = db.prepare('SELECT * FROM members WHERE telegram_id = ?').get(telegramId);
  if (existing) {
    let statusText = '🟡 Kutilmoqda';
    if (existing.status === 'approved') statusText = '✅ Tasdiqlangan (Guruhda qolasiz)';
    if (existing.status === 'rejected') statusText = '❌ Rad etilgan';

    return ctx.reply(
      `Assalomu alaykum, <b>${existing.full_name}</b>!\n\n` +
      `Siz allaqachon ro'yxatdan o'tgansiz.\n` +
      `Arizangiz holati: <b>${statusText}</b>\n\n` +
      `📍 Manzil: ${existing.street}, ${existing.house_number}\n` +
      `📞 Telefon: ${existing.phone_number}\n\n` +
      `Ma'lumotlaringizni yangilamoqchi bo'lsangiz:`,
      {
        parse_mode: 'HTML',
        ...Markup.keyboard([['🔄 Ma\'lumotlarni qayta kiritish']]).resize()
      }
    );
  }

  // Welcome New Citizen
  updateSession(telegramId, 'idle', {});

  await ctx.reply(
    `Assalomu alaykum.\n\n` +
    `Mahalla Telegram guruhida qolish uchun ma'lumotlaringizni tasdiqlang.\n\n` +
    `Jarayon 1 daqiqadan kam vaqt oladi.\n\n` +
    `Pastdagi tugmani bosing.`,
    Markup.keyboard([['🚀 Tasdiqlashni boshlash']]).resize()
  );
});

// --- ADMIN /admin COMMAND ---
bot.command('admin', async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return ctx.reply('❌ Bu bo\'lim faqat mahalla administratori uchun.');

  clearSession(telegramId);
  await ctx.reply('👑 Admin Boshqaruv Menyusi:', getAdminKeyboard());
});

// --- 1. MA'LUMOTLARNI OLISH (EXCEL) ---
bot.hears(['📥 Ma\'lumotlarni olish (Excel)', '📥 Excel yuklab olish'], async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const waitMsg = await ctx.reply('⏳ Barcha kutilayotgan arizalar Excel jadvali tayyorlanmoqda...');

  try {
    const buffer = await generateReviewExcelBuffer(null, 'DAMARIQ MAHALLASI – A\'ZOLARNI TEKSHIRISH JADVALI');
    
    await ctx.replyWithDocument(
      {
        source: buffer,
        filename: `Mahalla_Tekshirish_${new Date().toISOString().slice(0, 10)}.xlsx`
      },
      {
        caption: `📥 <b>Barcha Arizalar Excel Jadvali</b>\n\n` +
                 `<b>Ko'rsatma:</b>\n` +
                 `1. Faylni oching.\n` +
                 `2. <b>QAROR</b> ustuniga <b>✅</b> (Tasdiqlash) yoki <b>❌</b> (Rad etish) belgisini qo'ying.\n` +
                 `3. Faylni saqlab, <b>to'g'ridan-to'g'ri botga qayta tashlang</b>.\n` +
                 `4. Bot qaysi qatorgacha qilganingizni so'raydi va darhol guruhdan chiqarish/tasdiqlashni bajaradi!`,
        parse_mode: 'HTML'
      }
    );

    await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
  } catch (err) {
    console.error('Excel export error:', err);
    await ctx.reply('❌ Excel fayl yaratishda xatolik: ' + err.message);
  }
});

// --- 2. TASDIQLANGANLAR EXCEL ---
bot.hears('✅ Tasdiqlanganlar', async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const count = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'approved'").get().count;
  const waitMsg = await ctx.reply(`⏳ Tasdiqlanganlar ro'yxati tayyorlanmoqda (${count} ta)...`);

  try {
    const buffer = await generateReviewExcelBuffer('approved', 'DAMARIQ MAHALLASI – TASDIQLANGAN FUQAROLAR');
    
    await ctx.replyWithDocument(
      {
        source: buffer,
        filename: `Tasdiqlanganlar_${new Date().toISOString().slice(0, 10)}.xlsx`
      },
      {
        caption: `✅ <b>Tasdiqlangan Fuqarolar Ro'yxati (${count} ta)</b>\n\n` +
                 `<i>Agar adashib tasdiqlab yuborilgan odam bo'lsa, Excelda uning QAROR ustuniga ❌ qo'yib faylni botga qayta tashlang. Bot uni avtomatik guruhdan chiqaradi.</i>`,
        parse_mode: 'HTML'
      }
    );

    await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
  } catch (err) {
    await ctx.reply('❌ Xatolik: ' + err.message);
  }
});

// --- 3. TAQIQLANGANLAR (RAD ETILGANLAR) EXCEL ---
bot.hears('❌ Taqiqlanganlar', async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const count = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'rejected'").get().count;
  const waitMsg = await ctx.reply(`⏳ Rad etilganlar ro'yxati tayyorlanmoqda (${count} ta)...`);

  try {
    const buffer = await generateReviewExcelBuffer('rejected', 'DAMARIQ MAHALLASI – RAD ETILGANLAR VA CHIQARILGANLAR');
    
    await ctx.replyWithDocument(
      {
        source: buffer,
        filename: `Taqiqlanganlar_${new Date().toISOString().slice(0, 10)}.xlsx`
      },
      {
        caption: `❌ <b>Rad etilgan va Chiqarilganlar Ro'yxati (${count} ta)</b>\n\n` +
                 `<i>Agar adashib chiqarib yuborilgan haqiqiy fuqaro bo'lsa, Excelda uning QAROR ustuniga ✅ qo'yib faylni botga qayta tashlang. Bot uni qayta tasdiqlaydi.</i>`,
        parse_mode: 'HTML'
      }
    );

    await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
  } catch (err) {
    await ctx.reply('❌ Xatolik: ' + err.message);
  }
});

// --- 4. EXCEL FAYL YUKLANGANDA (FILE UPLOAD PROCESSING) ---
bot.on('document', async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const doc = ctx.message.document;
  if (!doc.file_name || (!doc.file_name.endsWith('.xlsx') && !doc.file_name.endsWith('.xls'))) {
    return ctx.reply('⚠️ Iltimos, faqat to\'ldirilgan .xlsx formatdagi Excel faylni yuboring.');
  }

  const waitMsg = await ctx.reply('📥 Fayl qabul qilindi va yuklanmoqda...');

  try {
    const fileLink = await ctx.telegram.getFileLink(doc.file_id);
    const fileBuffer = await downloadFileBuffer(fileLink.href);

    // Save uploaded buffer to admin session
    updateSession(telegramId, 'ask_excel_row_limit', {
      bufferBase64: fileBuffer.toString('base64'),
      fileName: doc.file_name
    });

    await ctx.deleteMessage(waitMsg.message_id).catch(() => {});

    await ctx.reply(
      `📥 <b>Excel fayl qabul qilindi!</b>\n\n` +
      `Nechanchi qatorgacha tekshirib to'ldirdingiz?\n` +
      `(Masalan: <b>50</b> deb yozing yoki pastdagi tugmalardan birini tanlang):`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Hammasini qildim (100%)', 'apply_excel_all'),
            Markup.button.callback('50-qatorgacha', 'apply_excel_50')
          ],
          [
            Markup.button.callback('25-qatorgacha', 'apply_excel_25'),
            Markup.button.callback('10-qatorgacha', 'apply_excel_10')
          ]
        ])
      }
    );
  } catch (err) {
    console.error('File upload error:', err);
    await ctx.reply('❌ Faylni yuklab olishda xatolik yuz berdi: ' + err.message);
  }
});

// Function to execute decisions from parsed Excel
async function executeExcelBatch(ctx, rowLimit = null) {
  const telegramId = String(ctx.from.id);
  const session = getSession(telegramId);

  if (!session.tempData || !session.tempData.bufferBase64) {
    return ctx.reply('⚠️ Avval Excel faylni botga yuboring.');
  }

  const fileBuffer = Buffer.from(session.tempData.bufferBase64, 'base64');
  const waitMsg = await ctx.reply('⚙️ <b>Qarorlar bajarilmoqda va guruhdan chiqarilmoqda...</b>', { parse_mode: 'HTML' });

  try {
    const results = await parseAndProcessReviewedExcel(fileBuffer, rowLimit);
    const groupId = getSetting('group_id') || DEFAULT_GROUP_ID;

    let actuallyApproved = 0;
    let actuallyKicked = 0;

    for (const item of results.actionsToExecute) {
      // 1. Update Database
      db.prepare(`
        UPDATE members 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE telegram_id = ?
      `).run(item.newStatus, item.telegram_id);

      // 2. Execute Telegram Action
      if (item.newStatus === 'approved') {
        actuallyApproved++;
        // Agar ilgari guruhdan chiqarilgan bo'lsa, blokni yechish (Unban)
        if (groupId) {
          try {
            await bot.telegram.unbanChatMember(groupId, Number(item.telegram_id));
          } catch (e) {}
        }

        try {
          await bot.telegram.sendMessage(
            item.telegram_id,
            `✅ <b>Assalomu alaykum, ${item.full_name}!</b>\n\n` +
            `Sizning ma'lumotlaringiz mahalla ma'muriyati tomonidan tasdiqlandi.\n` +
            `Mahalla Telegram guruhida qolishingiz tasdiqlandi! Faol bo'ling.`,
            { parse_mode: 'HTML' }
          );
        } catch (e) {}
      } else if (item.newStatus === 'rejected') {
        actuallyKicked++;
        // 1. Darhol va so'zsiz guruhdan chiqarish (Immediate Kick)
        if (groupId) {
          try {
            await bot.telegram.banChatMember(groupId, Number(item.telegram_id));
            await bot.telegram.unbanChatMember(groupId, Number(item.telegram_id));
            console.log(`✅ [GURUHDAN CHIQARILDI] Telegram ID: ${item.telegram_id}, Ism: ${item.full_name}`);
          } catch (e) {
            console.warn(`⚠️ [Guruhdan chiqarish xatosi] ${item.telegram_id}:`, e.message);
          }
        }
        // 2. Fuqaroning shaxsiyiga tushuntirish xati (DM)
        try {
          await bot.telegram.sendMessage(
            item.telegram_id,
            `❌ <b>Hurmatli fuqaro!</b>\n\n` +
            `Sizning a'zoligingiz mahalla ma'muriyati tomonidan rad etildi va siz mahalla Telegram guruhidan chiqarildingiz.\n\n` +
            `Agar bu xatolik bo'lsa, mahalla yordamchisiga murojaat qilishingiz mumkin.`,
            { parse_mode: 'HTML' }
          );
        } catch (e) {}
      }
    }

    clearSession(telegramId);
    await ctx.deleteMessage(waitMsg.message_id).catch(() => {});

    // Check remaining pending members in database
    const remainingPending = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'pending'").get().count;

    let responseMsg = `✅ <b>Qarorlar muvaffaqiyatli saqlandi va bajarildi!</b>\n\n` +
      `📊 <b>Bajarilgan ishlar:</b>\n` +
      `• Ko'rib chiqilgan arizalar: <b>${results.processedCount} ta</b>\n` +
      `• ✅ Tasdiqlanganlar: <b>${actuallyApproved} ta</b>\n` +
      `• ❌ Rad etilgan va Guruhdan chiqarilganlar: <b>${actuallyKicked} ta</b>\n`;

    if (rowLimit && results.skippedCount > 0) {
      responseMsg += `• 🟡 Qolgan arizalar keyingi safarga kutilmoqda holatida qoldirildi.\n`;
    }

    if (remainingPending > 0) {
      responseMsg += `\n❓ <b>Bazada yana ${remainingPending} ta kutilayotgan yangi arizalar bor. Ularni ham Excel qilib tekshirishni xohlaysizmi?</b>`;
      await ctx.reply(responseMsg, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('📥 Ha, Excelni yuklab ber', 'quick_download_pending'),
            Markup.button.callback('Yo\'q, keyinroq', 'quick_no_pending')
          ]
        ])
      });
    } else {
      responseMsg += `\n🎉 <i>Barcha kutilayotgan arizalar to'liq ko'rib chiqildi!</i>`;
      await ctx.reply(responseMsg, {
        parse_mode: 'HTML',
        ...getAdminKeyboard()
      });
    }

  } catch (err) {
    console.error('Excel processing error:', err);
    await ctx.reply('❌ Excelni qayta ishlashda xatolik: ' + err.message);
  }
}

// Inline actions for Excel batch row choice
bot.action('apply_excel_all', async (ctx) => {
  await ctx.answerCbQuery('Barcha qatorlar o\'qilmoqda...');
  await executeExcelBatch(ctx, null);
});

bot.action('apply_excel_50', async (ctx) => {
  await ctx.answerCbQuery('50-qatorgacha o\'qilmoqda...');
  await executeExcelBatch(ctx, 50);
});

bot.action('apply_excel_25', async (ctx) => {
  await ctx.answerCbQuery('25-qatorgacha o\'qilmoqda...');
  await executeExcelBatch(ctx, 25);
});

bot.action('apply_excel_10', async (ctx) => {
  await ctx.answerCbQuery('10-qatorgacha o\'qilmoqda...');
  await executeExcelBatch(ctx, 10);
});

// Follow-up question actions
bot.action('quick_download_pending', async (ctx) => {
  await ctx.answerCbQuery('Excel tayyorlanmoqda...');
  const buffer = await generateReviewExcelBuffer('pending', 'DAMARIQ MAHALLASI – KUTILAYOTGAN ARIZALAR');
  await ctx.replyWithDocument(
    {
      source: buffer,
      filename: `Kutilayotgan_Arizalar_${Date.now()}.xlsx`
    },
    {
      caption: `📥 <b>Qolgan Kutilayotgan Arizalar</b>\n\nQAROR ustunini to'ldirib qayta tashlang.`,
      parse_mode: 'HTML'
    }
  );
});

bot.action('quick_no_pending', async (ctx) => {
  await ctx.answerCbQuery('Tushunarli');
  await ctx.reply('👑 Asosiy Admin menyusi:', getAdminKeyboard());
});

// --- STATISTIKA ---
bot.hears(['📊 Statistika', '📊 7-Kunlik Statistika'], async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const total = db.prepare('SELECT COUNT(*) as count FROM members').get().count;
  const pending = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'pending'").get().count;
  const approved = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'approved'").get().count;
  const rejected = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'rejected'").get().count;
  const groupId = getSetting('group_id') || DEFAULT_GROUP_ID;

  const startDateStr = getSetting('deadline_start_date') || new Date().toISOString();
  const deadlineDays = Number(getSetting('deadline_days') || 7);
  const endDate = new Date(new Date(startDateStr).getTime() + deadlineDays * 24 * 60 * 60 * 1000);
  const daysLeft = Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)));

  await ctx.reply(
    `📊 <b>Damariq Mahallasi 7-Kunlik Monitoringi:</b>\n\n` +
    `⏱ <b>Tekshiruv muddatidan qoldi:</b> <b>${daysLeft} kun</b>\n` +
    `👥 <b>Guruhdagi a'zolar:</b> 1662+ ta\n` +
    `📋 <b>Ro'yxatdan o'tganlar:</b> <b>${total} ta</b>\n\n` +
    `• 🟡 <b>Kutilmoqda:</b> ${pending} ta\n` +
    `• ✅ <b>Tasdiqlangan:</b> ${approved} ta (Guruhda qolganlar)\n` +
    `• ❌ <b>Rad etilgan:</b> ${rejected} ta (Guruhdan chiqarilganlar)\n\n` +
    `🏛 <b>Ulangan Guruh ID:</b> <code>${groupId}</code>\n` +
    `🔑 <b>OpenAI Kaliti:</b> ✅ Faol (GPT-4o)`,
    { parse_mode: 'HTML' }
  );
});

// --- AI TAHLIL ---
bot.hears('🧠 AI Tahlil', async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  updateSession(telegramId, 'ai_chat_mode', {});

  await ctx.reply(
    `🧠 <b>AI Tahlilchi Faollashtirildi!</b>\n\n` +
    `Guruh a'zolari va arizalar bo'yicha <b>istalgan savolingizni</b> yozishingiz mumkin. Men to'g'ridan-to'g'ri bazani tahlil qilib javob beraman.\n\n` +
    `<b>Misollar:</b>\n` +
    `• <i>"Nechta odam tasdiqlandi va nechta rad etildi?"</i>\n` +
    `• <i>"Navbahor ko'chasidan kimlar ro'yxatdan o'tdi?"</i>\n` +
    `• <i>"Eng ko'p qaysi ko'chadan a'zo kirdi?"</i>\n` +
    `• <i>"Bir xil telefon raqam bilan qayta kirganlar bormi?"</i>\n\n` +
    `Savolingizni yozing (Suhbatdan chiqish uchun: <b>"❌ AI Suhbatni Yakunlash"</b>):`,
    {
      parse_mode: 'HTML',
      ...getAiChatKeyboard()
    }
  );
});

bot.hears(['❌ AI Suhbatni Yakunlash', 'chiqish', 'exit', 'bekor qilish'], async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (isAdmin(telegramId)) {
    clearSession(telegramId);
    return ctx.reply('👑 Asosiy Admin menyusiga qaytdingiz:', getAdminKeyboard());
  }
});

// --- KUTILAYOTGANLAR (LIST VIEW) ---
bot.hears(['📋 Kutilayotganlar', '📋 Kutilayotgan arizalar'], async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const pendingList = db.prepare("SELECT * FROM members WHERE status = 'pending' ORDER BY created_at ASC LIMIT 10").all();

  if (pendingList.length === 0) {
    return ctx.reply('✅ Hozircha kutilayotgan yangi arizalar mavjud emas.');
  }

  await ctx.reply(`📋 <b>Tekshirilishi kutilayotgan arizalar (${pendingList.length} ta):</b>`, { parse_mode: 'HTML' });

  for (let i = 0; i < pendingList.length; i++) {
    const m = pendingList[i];
    await ctx.reply(
      `<b>[№ ${i + 1}]</b> 👤 <b>Ism:</b> ${m.full_name}\n` +
      `📞 <b>Tel:</b> <code>${m.phone_number}</code>\n` +
      `📍 <b>Manzil:</b> ${m.street}, ${m.house_number}-uy\n` +
      `🆔 <b>TG ID:</b> <code>${m.telegram_id}</code>\n` +
      `🔗 <b>Username:</b> ${m.telegram_username ? '@' + m.telegram_username : 'Mavjud emas'}`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Tasdiqlash', `approve_${m.telegram_id}`),
            Markup.button.callback('❌ Rad etish va Chiqarish', `reject_${m.telegram_id}`)
          ]
        ])
      }
    );
  }
});

// --- GURUH STATUSI ---
bot.hears(['⚙️ Guruhni ulash', '⚙️ Ulangan Guruh', '⚙️ Guruh holati'], async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const currentGroupId = getSetting('group_id') || DEFAULT_GROUP_ID;

  let groupTitle = 'Damariq Mahallasi Guruhi';
  let isBotAdminInGroup = false;

  try {
    const chat = await bot.telegram.getChat(currentGroupId);
    if (chat && chat.title) groupTitle = chat.title;
    const member = await bot.telegram.getChatMember(currentGroupId, bot.botInfo.id);
    if (member && (member.status === 'administrator' || member.status === 'creator')) {
      isBotAdminInGroup = true;
    }
  } catch (e) {}

  await ctx.reply(
    `🏛 <b>Mahalla Telegram Guruhi Holati:</b>\n\n` +
    `• <b>Guruh Nomi:</b> ${groupTitle}\n` +
    `• <b>Guruh ID:</b> <code>${currentGroupId}</code>\n` +
    `• <b>Bot Admin Holati:</b> ${isBotAdminInGroup ? '✅ Bot Guruhda Admin (Chiqarish huquqi faol)' : '⚠️ Botni guruhga Admin qilish kerak'}\n\n` +
    `<i>Barcha tasdiqlanmagan yoki rad etilgan shaxslar ushbu guruhdan avtomatik chiqariladi.</i>`,
    { parse_mode: 'HTML' }
  );
});

// Test Citizen mode
bot.hears('🔄 Foydalanuvchi sifatida ko\'rish', async (ctx) => {
  const telegramId = String(ctx.from.id);
  updateSession(telegramId, 'idle', {});

  await ctx.reply(
    `Assalomu alaykum.\n\n` +
    `Mahalla Telegram guruhida qolish uchun ma'lumotlaringizni tasdiqlang.\n\n` +
    `Jarayon 1 daqiqadan kam vaqt oladi.\n\n` +
    `Pastdagi tugmani bosing.`,
    Markup.keyboard([['🚀 Tasdiqlashni boshlash'], ['👑 Admin menyusiga qaytish']]).resize()
  );
});

bot.hears('👑 Admin menyusiga qaytish', async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (isAdmin(telegramId)) {
    clearSession(telegramId);
    return ctx.reply('👑 Admin menyusi:', getAdminKeyboard());
  }
});

// --- CITIZEN FLOW (STEP 1: NAME) ---
bot.hears(['🚀 Tasdiqlashni boshlash', 'Tasdiqlashni boshlash', '🔄 Ma\'lumotlarni qayta kiritish'], async (ctx) => {
  const telegramId = String(ctx.from.id);
  updateSession(telegramId, 'ask_name', {
    username: ctx.from.username || ''
  });

  await ctx.reply(
    `1-qadam:\n\nIsm va familiyangizni kiriting.\n\nMisol:\nAliyev Alisher`,
    Markup.removeKeyboard()
  );
});

// --- CITIZEN FLOW (STEP 2: CONTACT) ---
bot.on('contact', async (ctx) => {
  const telegramId = String(ctx.from.id);
  const session = getSession(telegramId);

  if (session.step === 'ask_phone' || session.step === 'ask_name') {
    let phoneNumber = ctx.message.contact.phone_number;
    if (!phoneNumber.startsWith('+')) phoneNumber = '+' + phoneNumber;

    const updatedData = { ...session.tempData, phone: phoneNumber };
    updateSession(telegramId, 'ask_street', updatedData);

    await ctx.reply(
      `3-qadam:\n\nYashayotgan ko'changiz nomini kiriting.\n\nMisol:\nNavbahor ko'chasi`,
      Markup.removeKeyboard()
    );
  }
});

// --- TEXT MESSAGES ---
bot.on('text', async (ctx) => {
  const telegramId = String(ctx.from.id);
  const text = ctx.message.text.trim();
  const session = getSession(telegramId);

  // Group commands
  if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
    if (text === '/id' || text === '/id@' + ctx.botInfo.username) {
      return ctx.reply(`Ushbu guruh ID si: <code>${ctx.chat.id}</code>`, { parse_mode: 'HTML' });
    }
    return;
  }

  // --- INTERACTIVE AI CHAT MODE ---
  if (isAdmin(telegramId) && session.step === 'ai_chat_mode') {
    if (text === '❌ AI Suhbatni Yakunlash' || text.toLowerCase() === 'chiqish') {
      clearSession(telegramId);
      return ctx.reply('👑 Asosiy Admin menyusiga qaytdingiz:', getAdminKeyboard());
    }

    const waitMsg = await ctx.reply('🧠 <i>AI tahlil qilmoqda...</i>', { parse_mode: 'HTML' });

    try {
      const answer = await askAiAssistant(text, telegramId);
      await ctx.reply(answer, {
        parse_mode: 'HTML',
        ...getAiChatKeyboard()
      });
      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
    } catch (err) {
      await ctx.reply('❌ AI xatosi: ' + err.message);
    }
    return;
  }

  // Admin typed row count after uploading Excel (e.g. "50", "50-qatorgacha", "50 tasini qildim")
  if (isAdmin(telegramId) && session.step === 'ask_excel_row_limit') {
    const match = text.match(/\d+/);
    if (match) {
      const rowCount = Number(match[0]);
      await ctx.reply(`⚙️ <b>${rowCount}-qatorgacha bo'lgan ma'lumotlar qayta ishlanmoqda...</b>`, { parse_mode: 'HTML' });
      await executeExcelBatch(ctx, rowCount);
      return;
    } else if (text.toLowerCase().includes('hamma') || text.toLowerCase().includes('all')) {
      await ctx.reply('⚙️ <b>Barcha qatorlar qayta ishlanmoqda...</b>', { parse_mode: 'HTML' });
      await executeExcelBatch(ctx, null);
      return;
    }
  }

  // Step 1: Name
  if (session.step === 'ask_name') {
    if (text.length < 3) {
      return ctx.reply('Iltimos, ism va familiyangizni to\'liq kiriting (Misol: Aliyev Alisher).');
    }

    const updatedData = { ...session.tempData, name: text };
    updateSession(telegramId, 'ask_phone', updatedData);

    return ctx.reply(
      `2-qadam:\n\nTelefon raqamingizni yuboring.\n\nQuyidagi "📱 Telefon raqamni yuborish" tugmasini bosing:`,
      Markup.keyboard([
        [Markup.button.contactRequest('📱 Telefon raqamni yuborish')]
      ]).resize()
    );
  }

  // Step 2: Phone warning
  if (session.step === 'ask_phone') {
    return ctx.reply(
      `Iltimos, telefon raqamingizni pastdagi "📱 Telefon raqamni yuborish" tugmasini bosish orqali yuboring (qo'lda yozilmaydi).`,
      Markup.keyboard([
        [Markup.button.contactRequest('📱 Telefon raqamni yuborish')]
      ]).resize()
    );
  }

  // Step 3: Street
  if (session.step === 'ask_street') {
    if (text.length < 2) {
      return ctx.reply('Iltimos, ko\'cha nomini to\'g\'ri kiriting (Misol: Navbahor ko\'chasi).');
    }

    const updatedData = { ...session.tempData, street: text };
    updateSession(telegramId, 'ask_house', updatedData);

    return ctx.reply(
      `4-qadam:\n\nUy raqamingizni kiriting.\n\nMisol:\n15`,
      Markup.removeKeyboard()
    );
  }

  // Step 4: House & Finish
  if (session.step === 'ask_house') {
    const finalData = { ...session.tempData, house: text };
    
    const existing = db.prepare('SELECT id FROM members WHERE telegram_id = ?').get(telegramId);
    const memberId = existing ? existing.id : 'm_' + uuidv4().slice(0, 8);

    db.prepare(`
      INSERT INTO members (id, telegram_id, full_name, phone_number, street, house_number, telegram_username, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      ON CONFLICT(telegram_id) DO UPDATE SET
        full_name = excluded.full_name,
        phone_number = excluded.phone_number,
        street = excluded.street,
        house_number = excluded.house_number,
        telegram_username = excluded.telegram_username,
        status = 'pending',
        updated_at = CURRENT_TIMESTAMP
    `).run(
      memberId,
      telegramId,
      finalData.name,
      finalData.phone,
      finalData.street,
      finalData.house,
      finalData.username || ctx.from.username || ''
    );

    clearSession(telegramId);

    await ctx.reply(
      `Yakun:\n\n` +
      `Ma'lumotlaringiz qabul qilindi.\n\n` +
      `Mahalla ma'muriyati tomonidan tekshirilgandan so'ng tasdiqlanadi.\n\n` +
      `Rahmat.`,
      Markup.keyboard([['🔄 Ma\'lumotlarni qayta kiritish']]).resize()
    );

    // Notify all admins
    const adminIds = getAdminIds();
    for (const admId of adminIds) {
      try {
        await bot.telegram.sendMessage(
          admId,
          `📩 <b>Yangi Aholi Arizasi Kelib Tushdi:</b>\n\n` +
          `👤 <b>Ism:</b> ${finalData.name}\n` +
          `📞 <b>Telefon:</b> <code>${finalData.phone}</code>\n` +
          `📍 <b>Manzil:</b> ${finalData.street}, ${finalData.house}-uy\n` +
          `🆔 <b>Telegram ID:</b> <code>${telegramId}</code>\n` +
          `🔗 <b>Username:</b> ${finalData.username ? '@' + finalData.username : 'Mavjud emas'}`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback('✅ Tasdiqlash', `approve_${telegramId}`),
                Markup.button.callback('❌ Rad etish va Chiqarish', `reject_${telegramId}`)
              ]
            ])
          }
        );
      } catch (err) {
        console.warn(`Could not send notification to admin ${admId}:`, err.message);
      }
    }
  }
});

// --- INLINE ACTIONS: APPROVE / REJECT ---
bot.action(/^approve_(\d+)$/, async (ctx) => {
  const telegramId = ctx.match[1];
  const adminId = String(ctx.from.id);

  if (!isAdmin(adminId)) return ctx.answerCbQuery('❌ Faqat administrator tasdiqlay oladi!', { show_alert: true });

  const member = db.prepare('SELECT * FROM members WHERE telegram_id = ?').get(telegramId);
  if (!member) return ctx.answerCbQuery('A\'zo topilmadi.');

  db.prepare("UPDATE members SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?").run(telegramId);

  // Unban if previously kicked
  const groupId = getSetting('group_id') || DEFAULT_GROUP_ID;
  if (groupId) {
    try {
      await bot.telegram.unbanChatMember(groupId, Number(telegramId));
    } catch (e) {}
  }

  try {
    await bot.telegram.sendMessage(
      telegramId,
      `✅ <b>Assalomu alaykum, ${member.full_name}!</b>\n\n` +
      `Sizning ma'lumotlaringiz mahalla ma'muriyati tomonidan tasdiqlandi.\n` +
      `Mahalla Telegram guruhida qolishingiz tasdiqlandi! Faol bo'ling.`,
      { parse_mode: 'HTML' }
    );
  } catch (e) {}

  await ctx.editMessageText(
    ctx.callbackQuery.message.text + `\n\n✅ <b>TASDIQLANDI</b> (Admin tomonidan)`,
    { parse_mode: 'HTML' }
  );

  await ctx.answerCbQuery('✅ Foydalanuvchi tasdiqlandi!');
});

bot.action(/^reject_(\d+)$/, async (ctx) => {
  const telegramId = ctx.match[1];
  const adminId = String(ctx.from.id);

  if (!isAdmin(adminId)) return ctx.answerCbQuery('❌ Faqat administrator rad eta oladi!', { show_alert: true });

  const member = db.prepare('SELECT * FROM members WHERE telegram_id = ?').get(telegramId);
  if (!member) return ctx.answerCbQuery('A\'zo topilmadi.');

  db.prepare("UPDATE members SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?").run(telegramId);

  const groupId = getSetting('group_id') || DEFAULT_GROUP_ID;
  let kickStatus = '';

  if (groupId) {
    try {
      await bot.telegram.banChatMember(groupId, Number(telegramId));
      await bot.telegram.unbanChatMember(groupId, Number(telegramId));
      kickStatus = ' (Guruhdan chiqarildi)';
    } catch (err) {
      kickStatus = ' (Guruhdan chiqarishda xatolik: bot guruhda admin emas)';
    }
  }

  try {
    await bot.telegram.sendMessage(
      telegramId,
      `❌ <b>Hurmatli fuqaro!</b>\n\n` +
      `Sizning a'zoligingiz mahalla ma'muriyati tomonidan rad etildi va siz mahalla Telegram guruhidan chiqarildingiz.\n\n` +
      `Agar bu xatolik bo'lsa, mahalla yordamchisiga murojaat qiling.`,
      { parse_mode: 'HTML' }
    );
  } catch (e) {}

  await ctx.editMessageText(
    ctx.callbackQuery.message.text + `\n\n❌ <b>RAD ETILDI</b>${kickStatus}`,
    { parse_mode: 'HTML' }
  );

  await ctx.answerCbQuery('❌ A\'zo rad etildi!');
});

// Launch Bot
bot.launch({
  dropPendingUpdates: true
})
  .then(() => {
    console.log(`🤖 Mahalla Telegram Boti muvaffaqiyatli ishga tushdi!`);
    console.log(`Admin IDs: ${getAdminIds().join(', ')}`);
  })
  .catch((err) => {
    if (err.message && err.message.includes('409: Conflict')) {
      console.log('ℹ️ Bot boshqa serverda (Railway) muvaffaqiyatli ishlab turibdi.');
    } else {
      console.error('❌ Bot xatosi:', err.message);
    }
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
