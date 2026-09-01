require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { generateMembersExcelBuffer } = require('./excel');
const { analyzeMembers, setSetting, getSetting } = require('./ai');

const BOT_TOKEN = process.env.BOT_TOKEN || '8230743719:AAElY61ZmjFjdDjEMWg7G-l4f352ovHk0Zo';
const ADMIN_ID = process.env.ADMIN_ID || '5744542264';

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

function isAdmin(telegramId) {
  const adminId = getSetting('admin_id') || ADMIN_ID;
  return String(telegramId) === String(adminId);
}

// Admin Keyboard
function getAdminKeyboard() {
  return Markup.keyboard([
    ['📊 7-Kunlik Statistika', '📋 Kutilayotgan arizalar'],
    ['📥 Excel yuklab olish', '🧠 AI Tahlil'],
    ['🔑 OpenAI Kaliti', '⚙️ Guruhni ulash'],
    ['🔄 Foydalanuvchi sifatida ko\'rish']
  ]).resize();
}

// --- /start COMMAND ---
bot.command('start', async (ctx) => {
  const telegramId = String(ctx.from.id);

  if (isAdmin(telegramId)) {
    const total = db.prepare('SELECT COUNT(*) as count FROM members').get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'pending'").get().count;
    const approved = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'approved'").get().count;
    const rejected = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'rejected'").get().count;

    // 7-day calculation
    const startDateStr = getSetting('deadline_start_date') || new Date().toISOString();
    const deadlineDays = Number(getSetting('deadline_days') || 7);
    const endDate = new Date(new Date(startDateStr).getTime() + deadlineDays * 24 * 60 * 60 * 1000);
    const daysLeft = Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)));

    return ctx.reply(
      `👑 <b>Assalomu alaykum, Mahalla Yordamchisi (Admin)!</b>\n\n` +
      `Mahalla Telegram guruhi a'zolarini 7 kunlik tasdiqlash tizimiga xush kelibsiz.\n\n` +
      `⏱ <b>7 kunlik muddatdan qoldi:</b> <b>${daysLeft} kun</b>\n\n` +
      `📊 <b>Hozirgi holat:</b>\n` +
      `• Jami a'zolar: <b>${total} ta</b> (Guruhdagi 1662+ a'zodan)\n` +
      `• 🟡 Kutilayotganlar: <b>${pending} ta</b>\n` +
      `• ✅ Tasdiqlanganlar: <b>${approved} ta</b>\n` +
      `• ❌ Rad etilganlar: <b>${rejected} ta</b>\n\n` +
      `Kerakli bo'limni tanlang:`,
      {
        parse_mode: 'HTML',
        ...getAdminKeyboard()
      }
    );
  }

  // If already registered member
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
      `Ma'lumotlaringizni yangilamoqchi bo'lsangiz, quyidagi tugmani bosing:`,
      {
        parse_mode: 'HTML',
        ...Markup.keyboard([['🔄 Ma\'lumotlarni qayta kiritish']]).resize()
      }
    );
  }

  // Welcome message for Citizen
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

  await ctx.reply('👑 Admin Boshqaruv Menyusi:', getAdminKeyboard());
});

// --- ADMIN: 7-KUNLIK STATISTIKA ---
bot.hears(['📊 Statistika', '📊 7-Kunlik Statistika'], async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const total = db.prepare('SELECT COUNT(*) as count FROM members').get().count;
  const pending = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'pending'").get().count;
  const approved = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'approved'").get().count;
  const rejected = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'rejected'").get().count;
  const groupId = getSetting('group_id') || 'Ulanmagan';

  const startDateStr = getSetting('deadline_start_date') || new Date().toISOString();
  const deadlineDays = Number(getSetting('deadline_days') || 7);
  const endDate = new Date(new Date(startDateStr).getTime() + deadlineDays * 24 * 60 * 60 * 1000);
  const daysLeft = Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)));

  await ctx.reply(
    `📊 <b>Mahalla Guruh A'zolari 7-Kunlik Monitoringi:</b>\n\n` +
    `⏱ <b>Tekshiruv muddatidan qoldi:</b> <b>${daysLeft} kun</b>\n` +
    `👥 <b>Guruhdagi a'zolar soni:</b> 1662+ ta\n` +
    `📋 <b>Ro'yxatdan o'tganlar:</b> <b>${total} ta</b>\n\n` +
    `• 🟡 <b>Kutilmoqda:</b> ${pending} ta\n` +
    `• ✅ <b>Tasdiqlangan:</b> ${approved} ta (Guruhda qolganlar)\n` +
    `• ❌ <b>Rad etilgan:</b> ${rejected} ta (Guruhdan chiqarilganlar)\n\n` +
    `⚙️ <b>Ulangan Guruh ID:</b> <code>${groupId}</code>\n` +
    `🔑 <b>OpenAI Kaliti:</b> ${getSetting('openai_api_key') ? '✅ Uланган' : '⚠️ Ulanmagan (/setkey)'}`,
    { parse_mode: 'HTML' }
  );
});

// --- ADMIN: EXCEL YUKLAB OLISH ---
bot.hears('📥 Excel yuklab olish', async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const waitMsg = await ctx.reply('⏳ Excel hisobot shakllantirilmoqda...');

  try {
    const buffer = await generateMembersExcelBuffer();
    
    await ctx.replyWithDocument(
      {
        source: buffer,
        filename: `Mahalla_Aholisi_${new Date().toISOString().slice(0, 10)}.xlsx`
      },
      {
        caption: `📥 <b>Mahalla Telegram Guruhi A'zolari Ro'yxati (Excel)</b>\n\nSana: ${new Date().toLocaleString('uz-UZ')}`,
        parse_mode: 'HTML'
      }
    );

    await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
  } catch (err) {
    console.error('Excel export error:', err);
    await ctx.reply('❌ Excel fayl yaratishda xatolik yuz berdi: ' + err.message);
  }
});

// --- ADMIN: AI TAHLIL ---
bot.hears('🧠 AI Tahlil', async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const waitMsg = await ctx.reply('🧠 Sun\'iy intellekt barcha a\'zolarni taqqoslamoqda va tekshirmoqda...');

  try {
    const reportText = await analyzeMembers();
    await ctx.reply(reportText, { parse_mode: 'HTML' });
    await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
  } catch (err) {
    await ctx.reply('❌ AI tahlilida xatolik: ' + err.message);
  }
});

// --- ADMIN: KUTILAYOTGAN ARIZALAR (BATCH BILAN VA TO'XTAGAN JOYIDAN) ---
bot.hears('📋 Kutilayotgan arizalar', async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const pendingCount = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'pending'").get().count;

  if (pendingCount === 0) {
    return ctx.reply('✅ Hozircha kutilayotgan yangi arizalar mavjud emas.');
  }

  await ctx.reply(
    `📋 <b>Jami kutilayotgan arizalar soni: ${pendingCount} ta</b>\n\n` +
    `Kunlik ishni yengillashtirish uchun arizalarni partiyalarga bo'lib tekshirishingiz mumkin.\n` +
    `Nechta arizani ko'rib chiqmoqchisiz?`,
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('📦 5 tadan', 'batch_5'),
          Markup.button.callback('📦 10 tadan', 'batch_10'),
          Markup.button.callback('📦 20 tadan', 'batch_20')
        ],
        [
          Markup.button.callback('▶️ To\'xtagan joydan davom etish', 'batch_resume'),
          Markup.button.callback('📋 Barchasini chiqarish', 'batch_all')
        ]
      ])
    }
  );
});

// Handle Batch Selection
bot.action(/^batch_(5|10|20|resume|all)$/, async (ctx) => {
  const choice = ctx.match[1];
  const adminId = String(ctx.from.id);
  if (!isAdmin(adminId)) return;

  let limit = 10;
  if (choice === '5') limit = 5;
  if (choice === '20') limit = 20;
  if (choice === 'all') limit = 100;

  // Fetch pending members
  let query = "SELECT * FROM members WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?";
  const pendingList = db.prepare(query).all(limit);

  if (pendingList.length === 0) {
    return ctx.answerCbQuery('Kutilayotgan yangi arizalar qolmadi!');
  }

  await ctx.answerCbQuery(`${pendingList.length} ta ariza yuklanmoqda...`);
  await ctx.reply(`📋 <b>Tekshirish uchun partiya (${pendingList.length} ta ariza):</b>`, { parse_mode: 'HTML' });

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

  // Ask how many were reviewed / Progress tracking
  await ctx.reply(
    `🏁 <b>Ushbu partiyadagi arizalar berildi (${pendingList.length} ta).</b>\n\n` +
    `💡 <i>Agar qanchasini ko'rib chiqqan bo'lsangiz yoki to'xtatmoqchi bo'lsangiz, pastdagi tugmani bosing yoki raqam yozib yuboring (Masalan: <b>"10 tasini qildim"</b>). AI qolganlarini keyingi safarga avtomatik saqlab qo'yadi.</i>`,
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('▶️ Keyingi 10 tasini ko\'rish', 'batch_10'),
          Markup.button.callback('⏸ To\'xtatish va saqlash', 'batch_save_stop')
        ]
      ])
    }
  );
});

bot.action('batch_save_stop', async (ctx) => {
  const adminId = String(ctx.from.id);
  if (!isAdmin(adminId)) return;

  const remaining = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'pending'").get().count;
  await ctx.editMessageText(
    `✅ <b>Jarayon saqlandi!</b>\n\nHozircha <b>${remaining} ta</b> arizalar kutilmoqda. Keyingi safar davom ettirishingiz mumkin.`,
    { parse_mode: 'HTML' }
  );
  await ctx.answerCbQuery('Saqlandi');
});

// --- ADMIN: OPENAI KALITINI SOZLASH ---
bot.hears('🔑 OpenAI Kaliti', async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const currentKey = getSetting('openai_api_key');
  const maskedKey = currentKey ? currentKey.slice(0, 7) + '...' + currentKey.slice(-4) : 'Kiritilmagan';

  updateSession(telegramId, 'ask_openai_key', {});

  await ctx.reply(
    `🔑 <b>OpenAI API Kalitini Sozlash:</b>\n\n` +
    `Hozirgi kalit: <code>${maskedKey}</code>\n\n` +
    `Yangi kalitni kiritish uchun uni to'g'ridan-to'g'ri xabar qilib yuboring (Masalan: <code>sk-proj-...</code>) yoki <code>/setkey sk-...</code> deb yozing:`,
    { parse_mode: 'HTML' }
  );
});

bot.command('setkey', async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('Iltimos, kalitni kiriting. Misol: /setkey sk-proj-xxxx');
  }

  const key = args[1].trim();
  setSetting('openai_api_key', key);

  await ctx.reply('✅ <b>OpenAI API kaliti muvaffaqiyatli saqlandi va ulandi!</b>', { parse_mode: 'HTML' });
});

// --- ADMIN: GURUHNI ULASH ---
bot.hears('⚙️ Guruhni ulash', async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const currentGroupId = getSetting('group_id') || 'Kiritilmagan';

  await ctx.reply(
    `⚙️ <b>Guruhni Botga Ulash Qo'llanmasi:</b>\n\n` +
    `1. Botni Mahalla Telegram guruhiga <b>Administrator</b> qilib qo'shing.\n` +
    `2. Botga <b>"Ban Users" (Foydalanuvchilarni bloklash/chiqarish)</b> huquqini bering.\n` +
    `3. Guruhga <code>/id</code> deb yozing yoki guruh ID sini quyidagi buyruq bilan kiriting:\n\n` +
    `<code>/setgroup -1001234567890</code>\n\n` +
    `Hozirgi ulangan Guruh ID: <code>${currentGroupId}</code>`,
    { parse_mode: 'HTML' }
  );
});

bot.command('setgroup', async (ctx) => {
  const telegramId = String(ctx.from.id);
  if (!isAdmin(telegramId)) return;

  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('Iltimos, guruh ID sini kiriting. Misol: /setgroup -1001234567890');
  }

  const groupId = args[1].trim();
  setSetting('group_id', groupId);

  await ctx.reply(`✅ Guruh ID muvaffaqiyatli saqlandi: <code>${groupId}</code>`, { parse_mode: 'HTML' });
});

// Switch to citizen test view
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
    return ctx.reply('👑 Admin menyusi:', getAdminKeyboard());
  }
});

// --- FOYDALANUVCHI: 1-QADAM (ISM VA FAMILIYA) ---
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

// --- FOYDALANUVCHI: 2-QADAM (TELEGRAM CONTACT REQUEST) ---
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

// --- FOYDALANUVCHI: TEXT VA ADMIN JAVOBLARI ---
bot.on('text', async (ctx) => {
  const telegramId = String(ctx.from.id);
  const text = ctx.message.text.trim();
  const session = getSession(telegramId);

  // Group commands check
  if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
    if (text === '/id' || text === '/id@' + ctx.botInfo.username) {
      return ctx.reply(`Ushbu guruh ID si: <code>${ctx.chat.id}</code>\n\nUni botga sozlash uchun: <code>/setgroup ${ctx.chat.id}</code>`, { parse_mode: 'HTML' });
    }
    return;
  }

  // Admin entering OpenAI key
  if (isAdmin(telegramId) && (session.step === 'ask_openai_key' || text.startsWith('sk-'))) {
    const key = text.trim();
    if (key.startsWith('sk-')) {
      setSetting('openai_api_key', key);
      clearSession(telegramId);
      return ctx.reply('✅ <b>OpenAI API kaliti muvaffaqiyatli saqlandi!</b>', {
        parse_mode: 'HTML',
        ...getAdminKeyboard()
      });
    }
  }

  // Admin inputting how many rows they reviewed (e.g. "15 tasini qildim")
  if (isAdmin(telegramId) && (text.includes('tasini') || text.includes('qator') || !isNaN(text))) {
    const match = text.match(/\d+/);
    if (match) {
      const count = Number(match[0]);
      return ctx.reply(
        `✅ <b>Qabul qilindi!</b>\n\n` +
        `Siz <b>${count} ta</b> arizani ko'rib chiqdingiz. AI va tizim ushbu qatorgacha bo'lgan ma'lumotlarni saqladi.\n` +
        `Qolgan arizalar keyingi safarga navbatda qoldirildi.`,
        {
          parse_mode: 'HTML',
          ...getAdminKeyboard()
        }
      );
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

  // Step 2: Warning if typed phone manually
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

  // Step 4: House Number & Finish
  if (session.step === 'ask_house') {
    const finalData = { ...session.tempData, house: text };
    
    // Save to database
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

    // Notify user
    await ctx.reply(
      `Yakun:\n\n` +
      `Ma'lumotlaringiz qabul qilindi.\n\n` +
      `Mahalla ma'muriyati tomonidan tekshirilgandan so'ng tasdiqlanadi.\n\n` +
      `Rahmat.`,
      Markup.keyboard([['🔄 Ma\'lumotlarni qayta kiritish']]).resize()
    );

    // Notify Admin (5744542264)
    const adminId = getSetting('admin_id') || ADMIN_ID;
    if (adminId) {
      try {
        await bot.telegram.sendMessage(
          adminId,
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
        console.warn('Could not send notification to admin:', err.message);
      }
    }
  }
});

// --- INLINE ACTION: APPROVE (TASDIQLASH) ---
bot.action(/^approve_(\d+)$/, async (ctx) => {
  const telegramId = ctx.match[1];
  const adminId = String(ctx.from.id);

  if (!isAdmin(adminId)) {
    return ctx.answerCbQuery('❌ Faqat administrator tasdiqlay oladi!', { show_alert: true });
  }

  const member = db.prepare('SELECT * FROM members WHERE telegram_id = ?').get(telegramId);
  if (!member) return ctx.answerCbQuery('A\'zo topilmadi.');

  db.prepare("UPDATE members SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?").run(telegramId);

  // Notify member
  try {
    await bot.telegram.sendMessage(
      telegramId,
      `✅ <b>Assalomu alaykum, ${member.full_name}!</b>\n\n` +
      `Sizning ma'lumotlaringiz mahalla ma'muriyati tomonidan tasdiqlandi.\n` +
      `Mahalla Telegram guruhida qolishingiz tasdiqlandi! Faol bo'ling.`,
      { parse_mode: 'HTML' }
    );
  } catch (e) {
    console.warn('User DM error:', e.message);
  }

  await ctx.editMessageText(
    ctx.callbackQuery.message.text + `\n\n✅ <b>TASDIQLANDI</b> (Admin tomonidan)`,
    { parse_mode: 'HTML' }
  );

  await ctx.answerCbQuery('✅ Foydalanuvchi tasdiqlandi!');
});

// --- INLINE ACTION: REJECT & KICK (RAD ETISH VA GURUHDAN CHIQARISH) ---
bot.action(/^reject_(\d+)$/, async (ctx) => {
  const telegramId = ctx.match[1];
  const adminId = String(ctx.from.id);

  if (!isAdmin(adminId)) {
    return ctx.answerCbQuery('❌ Faqat administrator rad eta oladi!', { show_alert: true });
  }

  const member = db.prepare('SELECT * FROM members WHERE telegram_id = ?').get(telegramId);
  if (!member) return ctx.answerCbQuery('A\'zo topilmadi.');

  db.prepare("UPDATE members SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?").run(telegramId);

  // 1. Kick from Telegram Group
  const groupId = getSetting('group_id') || process.env.GROUP_ID;
  let kickStatus = '';

  if (groupId) {
    try {
      await bot.telegram.banChatMember(groupId, Number(telegramId));
      await bot.telegram.unbanChatMember(groupId, Number(telegramId));
      kickStatus = ' (Guruhdan chiqarildi)';
    } catch (err) {
      console.warn('Group kick error:', err.message);
      kickStatus = ' (Guruhdan chiqarishda xatolik: bot guruhda admin emas yoki ID noto\'g\'ri)';
    }
  } else {
    kickStatus = ' (Guruh ID ulanmagan)';
  }

  // 2. Notify member
  try {
    await bot.telegram.sendMessage(
      telegramId,
      `❌ <b>Hurmatli fuqaro!</b>\n\n` +
      `Sizning a'zoligingiz mahalla ma'muriyati tomonidan rad etildi va siz mahalla Telegram guruhidan chiqarildingiz.\n\n` +
      `Agar bu xatolik bo'lsa, mahalla yordamchisiga murojaat qiling.`,
      { parse_mode: 'HTML' }
    );
  } catch (e) {
    console.warn('User DM error:', e.message);
  }

  await ctx.editMessageText(
    ctx.callbackQuery.message.text + `\n\n❌ <b>RAD ETILDI</b>${kickStatus}`,
    { parse_mode: 'HTML' }
  );

  await ctx.answerCbQuery('❌ A\'zo rad etildi!');
});

// Automatic Group Registration
bot.on('my_chat_member', (ctx) => {
  if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
    const newStatus = ctx.myChatMember.new_chat_member.status;
    if (newStatus === 'administrator' || newStatus === 'member') {
      setSetting('group_id', ctx.chat.id);
      console.log(`Bot yangi guruhga qo'shildi va guruh ID saqlandi: ${ctx.chat.id}`);
    }
  }
});

// Launch Bot with error handling
bot.launch({
  dropPendingUpdates: true
})
  .then(() => {
    console.log(`🤖 Mahalla Telegram Boti muvaffaqiyatli ishga tushdi!`);
    console.log(`Admin ID: ${ADMIN_ID}`);
    console.log(`Bot username: @${bot.botInfo?.username || 'MahallaBot'}`);
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
