# 🤖 Damariq Mahalla Tekshiruv Boti (@damariq_mahalla_bot)

Mahalla Telegram guruhidagi (1662+ a'zo) haqiqiy mahalla aholisini aniqlash, begonalar yoki soxta a'zolarni avtomatik tarzda guruhdan chiqarish hamda mahalla yordamchisiga to'liq nazorat va Excel hisobot beruvchi Telegram bot tizimi.

---

## 🌟 Bot Imkoniyatlari

### 📱 1. Foydalanuvchilar (Mahalla Aholisi) uchun:
1. **/start** bosilganda:
   - "Assalomu alaykum. Mahalla Telegram guruhida qolish uchun ma'lumotlaringizni tasdiqlang..."
   - **`[🚀 Tasdiqlashni boshlash]`** tugmasi.
2. **1-qadam:** Ism va familiyani kiritish (Masalan: *Aliyev Alisher*).
3. **2-qadam:** **`[📱 Telefon raqamni yuborish]`** (Telegram Contact Request tugmasi orqali – xatosiz va qo'lda terilmaydi).
4. **3-qadam:** Yashayotgan ko'cha nomi (Masalan: *Navbahor ko'chasi*).
5. **4-qadam:** Uy raqami (Masalan: *15*).
6. **Yakun:** Ariza qabul qilinadi va avtomatik ravishda **Admin (Mahalla Yordamchisi)** ga yuboriladi.

---

### 👑 2. Mahalla Yordamchisi (Admin - ID: 5744542264) uchun:
- Har bir yangi ariza tushganda bot to'g'ridan-to'g'ri adminga bildirishnoma yuboradi:
  - **`[✅ Tasdiqlash]`** -> Foydalanuvchi guruhda qoladi va unga tasdiqlash xabari boradi.
  - **`[❌ Rad etish]`** -> **Bot avtomatik ravishda fuqaroni guruhdan chiqaradi (kick/ban)** va xabardor qiladi.
- **Admin Menyu:**
  - 📊 **Statistika:** Jami a'zolar, kutilayotganlar, tasdiqlanganlar, rad etilganlar soni.
  - 📥 **Excel yuklab olish:** Barcha a'zolar ro'yxatini rangli `.xlsx` formatda to'g'ridan-to'g'ri Telegram orqali yuklab olish.
  - 📋 **Kutilayotgan arizalar:** Tasdiqlanishi kutilayotgan arizalarni ketma-ket ko'rish va boshqarish.
  - 🧠 **AI Tahlil:** Takroriy telefon raqamlar va shubhali manzillarni aniqlash.
  - ⚙️ **Guruhni ulash:** Botni guruhga admin qilib qo'shish va guruh ID sini kiritish (`/setgroup`).

---

## 🚀 Ishga Tushirish (Lokal)

```bash
npm install
npm start
```

---

## 🌐 Railway ga Deploy Qilish:
1. [Railway.app](https://railway.app) ga kiring va GitHub repozitoriyani ulang (`https://github.com/orenscrm-tizim/edu-talim.git`).
2. **Environment Variables**:
   - `BOT_TOKEN`: `8230743719:AAElY61ZmjFjdDjEMWg7G-l4f352ovHk0Zo`
   - `ADMIN_ID`: `5744542264`
   - `GROUP_ID`: Guruh ID si (Masalan: `-100...`)
3. **Deploy** tugmasini bosing! Bot 24/7 rejimda bulutda to'xtovsiz ishlaydi.
