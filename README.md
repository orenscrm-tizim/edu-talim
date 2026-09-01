# 🎓 Skyline Education – LMS & Homework Management Platform

Zamonaviy o'quv markazlari uchun mo'ljallangan to'liq Full-Stack ta'lim platformasi (Frontend + Backend + Database + 1-on-1 Chat + Davomat + Video Darslar + Reyting).

---

## 🌟 Asosiy Imkoniyatlar

1. **👥 Guruhlar va Dars Jadvallari:**
   - Bir kunda bir nechta darsi bor ustozlar uchun alohida soatdagi guruhlar (masalan: *Frontend 14:00*, *Frontend 18:00*).
   - Bitta yo'nalishda bir nechta ustozlar (*IELTS Jasur Shokirov*, *General English Nilufar Karimova*).
   - O'quvchilar faqat o'zlari o'qiydigan guruh vazifalari va darslarini ko'radi.

2. **📝 Uyga Vazifalar Tizimi:**
   - Ustoz deadline muddati, vazifa shartlari, Telegram dars videosi va materiallarni biriktiradi.
   - **Frontend:** GitHub kod linki va jonli demo (Vercel/Netlify) topshirish.
   - **IELTS & Rus tili:** Brauzerdan ovoz yozib (Speaking) yoki PDF/rasm yuklab topshirish.
   - Ustoz ball (0-100) va shaxsiy feedback beradi.

3. **📋 Dars Davomati (Jurnal):**
   - Har bir guruh uchun kunlik davomat olish moduli (**Keldi**, **Kelmadi**, **Sababli**).
   - O'quvchilarning umumiy davomat foizi avtomatik hisoblanadi.

4. **🎥 Video Darslar va O'quv Materiallari:**
   - Telegram dars videolari, konspektlar va PDF kitoblarni kurslar bo'yicha tartibli saqlash.

5. **🏆 O'quvchilar Reytingi (Leaderboard):**
   - Topshiriqlar ballari va davomat asosida avtomatik hisoblanadigan Top 3 podium.

6. **💬 1-on-1 Shaxsiy Chat (Lichka):**
   - Ustoz va o'quvchi o'rtasida to'g'ridan-to'g'ri shaxsiy muloqot, ovozli xabarlar va fayl almashish.

7. **👑 Admin Paneli:**
   - Yangi guruh ochish, o'quvchilarni biriktirish, markaz bo'ylab e'lonlar chiqarish va statistika.

---

## 🚀 O'rnatish va Ishga Tushirish

### 1. Lokal Ishga Tushirish:
```bash
# Backend ni ishga tushirish (Port: 5001)
cd server
npm install
npm start

# Frontend ni ishga tushirish (Port: 3000)
cd client
npm install
npm run dev
```

---

## 🌐 Deploy Qilish Ko'rsatmasi (Vercel & Railway)

### 1. Backend ni Railway ga joylash:
1. [Railway.app](https://railway.app) ga kiring va GitHub repozitoriyani ulang (`https://github.com/orenscrm-tizim/edu-talim.git`).
2. **Root Directory** sifatida `server` ni tanlang.
3. Deploy tugagach, Railway sizga bergan URL manzilni nusxalang (Masalan: `https://edu-talim-backend.up.railway.app`).

### 2. Frontend ni Vercel ga joylash:
1. [Vercel.com](https://vercel.com) ga kiring va repozitoriyani import qiling.
2. **Root Directory** sifatida `client` ni tanlang.
3. **Environment Variables** bo'limida quyidagi o'zgaruvchini kiriting:
   - `VITE_API_URL` = `https://edu-talim-backend.up.railway.app` (Railway backend manzilingiz).
4. **Deploy** tugmasini bosing!
