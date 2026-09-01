const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'skyline.db'));
db.pragma('journal_mode = WAL');

// Initialize full schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student')),
    avatar TEXT,
    specialty TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    badge TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS levels (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    course_id TEXT NOT NULL,
    level_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    days TEXT NOT NULL,
    time TEXT NOT NULL,
    room TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(course_id) REFERENCES courses(id),
    FOREIGN KEY(level_id) REFERENCES levels(id),
    FOREIGN KEY(teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS group_students (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, student_id),
    FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS homeworks (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    resources TEXT, -- JSON array of links/files
    deadline DATETIME NOT NULL,
    max_score INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY(teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    homework_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    github_url TEXT,
    demo_url TEXT,
    file_urls TEXT, -- JSON array
    audio_url TEXT,
    text_notes TEXT,
    score INTEGER,
    teacher_feedback TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'graded', 'need_work')),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    graded_at DATETIME,
    UNIQUE(homework_id, student_id),
    FOREIGN KEY(homework_id) REFERENCES homeworks(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS direct_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    attachment_type TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'excused')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, student_id, date),
    FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    course_id TEXT,
    group_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK(type IN ('video', 'telegram_post', 'pdf', 'link')),
    url TEXT NOT NULL,
    lesson_number INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(course_id) REFERENCES courses(id),
    FOREIGN KEY(group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    badge TEXT DEFAULT 'Elon',
    target_group_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(author_id) REFERENCES users(id),
    FOREIGN KEY(target_group_id) REFERENCES groups(id)
  );
`);

try {
  db.exec("ALTER TABLE direct_messages ADD COLUMN attachment_type TEXT");
} catch (e) {}

// Add sample data for materials and announcements if missing
const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials').get().count;
if (materialCount === 0) {
  console.log('Seeding initial materials, attendance and announcements...');

  const insertMat = db.prepare(`
    INSERT INTO materials (id, course_id, group_id, title, description, type, url, lesson_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMat.run('m_1', 'course_frontend', 'grp_fe_14', '01-Dars: Web Asoslari & HTML Semantikasi', 'Telegram guruhga yuklangan video dars yozuvi', 'video', 'https://t.me/skyline_frontend_group/105', 1);
  insertMat.run('m_2', 'course_frontend', 'grp_fe_14', '02-Dars: CSS Flexbox Layouts & Responsive Dizayn', 'Flexbox amaliy dars videosi', 'video', 'https://t.me/skyline_frontend_group/118', 2);
  insertMat.run('m_3', 'course_frontend', 'grp_fe_14', 'CSS Grid & Flexbox Cheat Sheet (PDF)', 'Muhim CSS qoidalari to\'plami', 'pdf', 'https://skyline.uz/materials/css_cheatsheet.pdf', 2);
  insertMat.run('m_4', 'course_english', 'grp_ielts_jasur', 'IELTS Writing Task 2 Video Tutorial', 'Band 8.0 Essay yozish sirlari', 'video', 'https://t.me/skyline_ielts/45', 1);
  insertMat.run('m_5', 'course_russian', 'grp_rus_yelena', 'Rus tili So\'zlashuv audio darslik', 'Kundalik dialoglar to\'plami', 'link', 'https://t.me/skyline_russian/12', 1);

  const insertAnnounce = db.prepare(`
    INSERT INTO announcements (id, author_id, title, content, badge)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertAnnounce.run('ann_1', 'admin_1', 'Skyline Education platformasiga xush kelibsiz!', 'Barcha o\'quvchilar va ustozlar uchun yangi o\'quv portali ishga tushirildi. Endi barcha vazifalar, dars jadvallari va shaxsiy feedbacklar shu yerda bo\'ladi.', 'Muhim');
  insertAnnounce.run('ann_2', 'teacher_frontend', 'Frontend: Hackathon & Real Loyihalar Taqvimi', 'Ushbu haftada Frontend guruhlari uchun mini-hackathon o\'tkaziladi. O\'zingizning portfoliongizga yangi real loyiha qo\'shing!', 'Frontend');

  // Sample Attendance for today
  const todayStr = new Date().toISOString().slice(0, 10);
  const insertAtt = db.prepare(`
    INSERT OR IGNORE INTO attendance (id, group_id, student_id, date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAtt.run('att_1', 'grp_fe_14', 'student_1', todayStr, 'present', 'Faol qatnashdi');
  insertAtt.run('att_2', 'grp_fe_14', 'student_3', todayStr, 'present', 'Vaqtida keldi');
  insertAtt.run('att_3', 'grp_ielts_jasur', 'student_1', todayStr, 'present', 'Speaking faol');
  insertAtt.run('att_4', 'grp_ielts_jasur', 'student_2', todayStr, 'present', 'A\'lo');

  console.log('Extra seed completed!');
}

module.exports = db;
