const OpenAI = require('openai');
const db = require('./db');

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));
}

// Local smart heuristic analyzer
function runLocalHeuristicAnalysis(members) {
  const phoneMap = new Map();
  const duplicates = [];
  const suspicious = [];

  members.forEach(m => {
    const cleanPhone = m.phone_number.replace(/\D/g, '');
    if (!phoneMap.has(cleanPhone)) phoneMap.set(cleanPhone, []);
    phoneMap.get(cleanPhone).push(m);
  });

  for (const [phone, list] of phoneMap.entries()) {
    if (list.length > 1) {
      duplicates.push({
        phone: list[0].phone_number,
        count: list.length,
        names: list.map(x => `${x.full_name} (TG: ${x.telegram_id})`).join(', ')
      });
    }
  }

  const suspiciousKeywords = ['boshqa', 'qoshni', 'qo\'shni', 'notanish', 'test', 'admin', 'bilmayman', 'asdasd', '1234'];
  members.forEach(m => {
    const combined = `${m.street} ${m.house_number}`.toLowerCase();
    if (suspiciousKeywords.some(k => combined.includes(k))) {
      suspicious.push({
        name: m.full_name,
        phone: m.phone_number,
        address: `${m.street}, ${m.house_number}`
      });
    }
  });

  let message = `🧠 <b>Intellektual Tahlil Natijasi (7 kunlik monitoring):</b>\n\n`;
  message += `📊 Jami bazadagi a'zolar: <b>${members.length} ta</b>\n\n`;

  if (duplicates.length > 0) {
    message += `⚠️ <b>Takroriy telefon raqamlar (${duplicates.length} ta):</b>\n`;
    duplicates.forEach((d, i) => {
      message += `${i + 1}. Tel: <code>${d.phone}</code> (${d.count} ta hisob)\n   A'zolar: ${d.names}\n\n`;
    });
  } else {
    message += `✅ Takroriy telefon raqamlari aniqlanmadi.\n\n`;
  }

  if (suspicious.length > 0) {
    message += `🚩 <b>Shubhali / Begona ko'chalar (${suspicious.length} ta):</b>\n`;
    suspicious.forEach((s, i) => {
      message += `${i + 1}. <b>${s.name}</b> (${s.phone})\n   Manzil: ${s.address}\n\n`;
    });
  } else {
    message += `✅ Shubhali manzillar aniqlanmadi.\n\n`;
  }

  message += `💡 <i>Eslatma: Yakuniy qarorni mahalla yordamchisi qabul qiladi.</i>`;
  return message;
}

// Full AI Analysis with OpenAI
async function analyzeMembers() {
  const members = db.prepare('SELECT * FROM members ORDER BY created_at DESC').all();
  if (members.length === 0) {
    return 'Hozircha hech qanday a\'zo ro\'yxatdan o\'tmagan.';
  }

  const apiKey = getSetting('openai_api_key') || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return runLocalHeuristicAnalysis(members) + '\n\n🔑 <i>OpenAI API kalitini kiritish uchun: /setkey sk-... buyrug\'ini yuboring.</i>';
  }

  try {
    const openai = new OpenAI({ apiKey });
    const promptData = members.map(m => ({
      name: m.full_name,
      phone: m.phone_number,
      street: m.street,
      house: m.house_number,
      tg_id: m.telegram_id,
      status: m.status
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Siz Mahalla Telegram guruhi a\'zolarini tekshiruvchi AI mutaxassisisiz. Berilgan ro\'yxatdan takroriy odamlarni, shubhali/begona manzillarni aniqlang va 7 kunlik tekshiruv jarayoni bo\'yicha mahalla yordamchisiga o\'zbek tilida HTML formatda chiroyli, aniq tavsiyalar va xulosa bering.'
        },
        {
          role: 'user',
          content: JSON.stringify(promptData)
        }
      ]
    });

    return `🧠 <b>OpenAI GPT-4o Tahlil va Xulosasi:</b>\n\n` + response.choices[0].message.content;
  } catch (err) {
    console.warn('OpenAI error:', err.message);
    return runLocalHeuristicAnalysis(members) + `\n\n⚠️ <i>OpenAI xatosi: ${err.message}. Kalitni yangilash uchun: /setkey sk-...</i>`;
  }
}

module.exports = {
  analyzeMembers,
  setSetting,
  getSetting
};
