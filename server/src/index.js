const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Setup uploads folder
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Multer configuration for file, image, and audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

// File Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Fayl yuklanmadi' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// --- AUTH & USERS ---
app.post('/api/auth/login', (req, res) => {
  const { phone, password, userId } = req.body;
  
  if (userId) {
    const user = db.prepare('SELECT id, name, phone, email, role, avatar, specialty FROM users WHERE id = ?').get(userId);
    if (user) return res.json({ user, token: 'demo-token-' + user.id });
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ? AND password = ?').get(phone, password);
  if (!user) {
    return res.status(401).json({ error: 'Telefon raqam yoki parol noto\'g\'ri' });
  }
  delete user.password;
  res.json({ user, token: 'demo-token-' + user.id });
});

app.get('/api/users', (req, res) => {
  const { role } = req.query;
  let query = 'SELECT id, name, phone, email, role, avatar, specialty, created_at FROM users';
  const params = [];
  if (role) {
    query += ' WHERE role = ?';
    params.push(role);
  }
  query += ' ORDER BY name ASC';
  const users = db.prepare(query).all(...params);
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { name, phone, email, password = '123', role, avatar, specialty } = req.body;
  if (!name || !phone || !role) {
    return res.status(400).json({ error: 'Ism, telefon va rol kiritilishi shart' });
  }

  const id = (role === 'teacher' ? 'teacher_' : role === 'admin' ? 'admin_' : 'student_') + uuidv4().slice(0, 8);
  const defaultAvatar = avatar || (role === 'teacher' 
    ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' 
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');

  try {
    const insert = db.prepare(`
      INSERT INTO users (id, name, phone, email, password, role, avatar, specialty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(id, name, phone, email || null, password, role, defaultAvatar, specialty || '');
    res.json({ success: true, id });
  } catch (err) {
    res.status(400).json({ error: 'Ushbu telefon raqam allaqachon mavjud yoki xatolik yuz berdi: ' + err.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  const { name, phone, email, avatar, specialty } = req.body;
  const userId = req.params.id;

  try {
    const update = db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          avatar = COALESCE(?, avatar),
          specialty = COALESCE(?, specialty)
      WHERE id = ?
    `);
    update.run(name, phone, email, avatar, specialty, userId);
    
    const updated = db.prepare('SELECT id, name, phone, email, role, avatar, specialty FROM users WHERE id = ?').get(userId);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- COURSES & LEVELS ---
app.get('/api/courses', (req, res) => {
  const courses = db.prepare('SELECT * FROM courses ORDER BY created_at ASC').all();
  const levels = db.prepare('SELECT * FROM levels').all();
  
  const result = courses.map(course => ({
    ...course,
    levels: levels.filter(lvl => lvl.course_id === course.id)
  }));
  res.json(result);
});

app.post('/api/courses', (req, res) => {
  const { title, description, icon, badge, levels = [] } = req.body;
  const id = 'course_' + uuidv4().slice(0, 8);
  
  const insertCourse = db.prepare('INSERT INTO courses (id, title, description, icon, badge) VALUES (?, ?, ?, ?, ?)');
  insertCourse.run(id, title, description, icon || 'BookOpen', badge || 'Asosiy');

  const insertLevel = db.prepare('INSERT INTO levels (id, course_id, name, description) VALUES (?, ?, ?, ?)');
  levels.forEach(lvl => {
    insertLevel.run('lvl_' + uuidv4().slice(0, 8), id, lvl.name, lvl.description || '');
  });

  res.json({ success: true, id });
});

// --- GROUPS ---
app.get('/api/groups', (req, res) => {
  const { teacher_id, student_id } = req.query;

  let query = `
    SELECT g.*, 
           c.title as course_title, 
           l.name as level_name,
           u.name as teacher_name,
           u.avatar as teacher_avatar,
           (SELECT COUNT(*) FROM group_students WHERE group_id = g.id) as student_count
    FROM groups g
    LEFT JOIN courses c ON g.course_id = c.id
    LEFT JOIN levels l ON g.level_id = l.id
    LEFT JOIN users u ON g.teacher_id = u.id
  `;

  const params = [];
  if (teacher_id) {
    query += ' WHERE g.teacher_id = ?';
    params.push(teacher_id);
  } else if (student_id) {
    query += ' INNER JOIN group_students gs ON gs.group_id = g.id WHERE gs.student_id = ?';
    params.push(student_id);
  }

  query += ' ORDER BY g.created_at DESC';
  const groups = db.prepare(query).all(...params);
  res.json(groups);
});

app.get('/api/groups/:id', (req, res) => {
  const group = db.prepare(`
    SELECT g.*, 
           c.title as course_title, 
           l.name as level_name,
           u.name as teacher_name,
           u.avatar as teacher_avatar
    FROM groups g
    LEFT JOIN courses c ON g.course_id = c.id
    LEFT JOIN levels l ON g.level_id = l.id
    LEFT JOIN users u ON g.teacher_id = u.id
    WHERE g.id = ?
  `).get(req.params.id);

  if (!group) return res.status(404).json({ error: 'Guruh topilmadi' });

  const students = db.prepare(`
    SELECT u.id, u.name, u.phone, u.avatar, u.specialty, gs.joined_at
    FROM group_students gs
    JOIN users u ON gs.student_id = u.id
    WHERE gs.group_id = ?
  `).all(req.params.id);

  const homeworks = db.prepare(`
    SELECT h.*, 
           (SELECT COUNT(*) FROM submissions WHERE homework_id = h.id) as submissions_count
    FROM homeworks h
    WHERE h.group_id = ?
    ORDER BY h.deadline DESC
  `).all(req.params.id);

  res.json({ ...group, students, homeworks });
});

app.post('/api/groups', (req, res) => {
  const { name, course_id, level_id, teacher_id, days, time, room, student_ids = [] } = req.body;
  const id = 'grp_' + uuidv4().slice(0, 8);

  const insert = db.prepare(`
    INSERT INTO groups (id, name, course_id, level_id, teacher_id, days, time, room)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(id, name, course_id, level_id, teacher_id, days, time, room);

  const insertStudent = db.prepare('INSERT OR IGNORE INTO group_students (id, group_id, student_id) VALUES (?, ?, ?)');
  student_ids.forEach(student_id => {
    insertStudent.run('gs_' + uuidv4().slice(0, 8), id, student_id);
  });

  res.json({ success: true, id });
});

app.delete('/api/groups/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- HOMEWORKS ---
app.get('/api/homeworks', (req, res) => {
  const { group_id, teacher_id, student_id } = req.query;

  let query = `
    SELECT h.*, 
           g.name as group_name,
           c.title as course_title,
           l.name as level_name,
           u.name as teacher_name,
           u.avatar as teacher_avatar,
           (SELECT COUNT(*) FROM group_students WHERE group_id = h.group_id) as total_students,
           (SELECT COUNT(*) FROM submissions WHERE homework_id = h.id) as total_submissions
    FROM homeworks h
    JOIN groups g ON h.group_id = g.id
    LEFT JOIN courses c ON g.course_id = c.id
    LEFT JOIN levels l ON g.level_id = l.id
    LEFT JOIN users u ON h.teacher_id = u.id
  `;

  const params = [];
  if (group_id) {
    query += ' WHERE h.group_id = ?';
    params.push(group_id);
  } else if (teacher_id) {
    query += ' WHERE h.teacher_id = ?';
    params.push(teacher_id);
  } else if (student_id) {
    query += ' INNER JOIN group_students gs ON gs.group_id = h.group_id WHERE gs.student_id = ?';
    params.push(student_id);
  }

  query += ' ORDER BY h.deadline DESC';
  const homeworks = db.prepare(query).all(...params);

  if (student_id) {
    const subs = db.prepare('SELECT * FROM submissions WHERE student_id = ?').all(student_id);
    const subMap = new Map(subs.map(s => [s.homework_id, s]));

    const enriched = homeworks.map(h => ({
      ...h,
      resources: h.resources ? JSON.parse(h.resources) : [],
      my_submission: subMap.get(h.id) ? {
        ...subMap.get(h.id),
        file_urls: subMap.get(h.id).file_urls ? JSON.parse(subMap.get(h.id).file_urls) : []
      } : null
    }));
    return res.json(enriched);
  }

  const result = homeworks.map(h => ({
    ...h,
    resources: h.resources ? JSON.parse(h.resources) : []
  }));

  res.json(result);
});

app.get('/api/homeworks/:id', (req, res) => {
  const hw = db.prepare(`
    SELECT h.*, 
           g.name as group_name,
           c.title as course_title,
           l.name as level_name,
           u.name as teacher_name,
           u.avatar as teacher_avatar
    FROM homeworks h
    JOIN groups g ON h.group_id = g.id
    LEFT JOIN courses c ON g.course_id = c.id
    LEFT JOIN levels l ON g.level_id = l.id
    LEFT JOIN users u ON h.teacher_id = u.id
    WHERE h.id = ?
  `).get(req.params.id);

  if (!hw) return res.status(404).json({ error: 'Uyga vazifa topilmadi' });

  const students = db.prepare(`
    SELECT u.id as student_id, u.name as student_name, u.phone, u.avatar,
           s.id as submission_id, s.github_url, s.demo_url, s.audio_url, s.text_notes,
           s.file_urls, s.score, s.teacher_feedback, s.status, s.submitted_at, s.graded_at
    FROM group_students gs
    JOIN users u ON gs.student_id = u.id
    LEFT JOIN submissions s ON s.homework_id = ? AND s.student_id = u.id
    WHERE gs.group_id = ?
    ORDER BY u.name ASC
  `).all(req.params.id, hw.group_id);

  res.json({
    ...hw,
    resources: hw.resources ? JSON.parse(hw.resources) : [],
    submissions: students.map(s => ({
      ...s,
      file_urls: s.file_urls ? JSON.parse(s.file_urls) : []
    }))
  });
});

app.post('/api/homeworks', (req, res) => {
  const { group_id, teacher_id, title, description, resources = [], deadline, max_score = 100 } = req.body;
  if (!group_id || !teacher_id || !title || !deadline) {
    return res.status(400).json({ error: 'Barcha majburiy maydonlarni to\'ldiring' });
  }

  const id = 'hw_' + uuidv4().slice(0, 8);
  const insert = db.prepare(`
    INSERT INTO homeworks (id, group_id, teacher_id, title, description, resources, deadline, max_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(id, group_id, teacher_id, title, description, JSON.stringify(resources), deadline, max_score);
  res.json({ success: true, id });
});

app.delete('/api/homeworks/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM homeworks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- SUBMISSIONS ---
app.post('/api/submissions', (req, res) => {
  const { homework_id, student_id, github_url, demo_url, audio_url, file_urls = [], text_notes } = req.body;

  if (!homework_id || !student_id) {
    return res.status(400).json({ error: 'Vazifa va o\'quvchi ID si talab qilinadi' });
  }

  const existing = db.prepare('SELECT id FROM submissions WHERE homework_id = ? AND student_id = ?').get(homework_id, student_id);

  if (existing) {
    const update = db.prepare(`
      UPDATE submissions 
      SET github_url = ?, demo_url = ?, audio_url = ?, file_urls = ?, text_notes = ?, status = 'submitted', submitted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    update.run(github_url, demo_url, audio_url, JSON.stringify(file_urls), text_notes, existing.id);
    return res.json({ success: true, id: existing.id, updated: true });
  }

  const id = 'sub_' + uuidv4().slice(0, 8);
  const insert = db.prepare(`
    INSERT INTO submissions (id, homework_id, student_id, github_url, demo_url, audio_url, file_urls, text_notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
  `);
  insert.run(id, homework_id, student_id, github_url, demo_url, audio_url, JSON.stringify(file_urls), text_notes);
  res.json({ success: true, id });
});

app.post('/api/submissions/:id/grade', (req, res) => {
  const { score, teacher_feedback, status = 'graded' } = req.body;
  const subId = req.params.id;

  const update = db.prepare(`
    UPDATE submissions 
    SET score = ?, teacher_feedback = ?, status = ?, graded_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  update.run(score, teacher_feedback, status, subId);

  // Send automated DM
  const sub = db.prepare(`
    SELECT s.student_id, h.teacher_id, h.title as hw_title
    FROM submissions s
    JOIN homeworks h ON s.homework_id = h.id
    WHERE s.id = ?
  `).get(subId);

  if (sub) {
    const msgId = 'm_' + uuidv4().slice(0, 8);
    const msg = `✅ "${sub.hw_title}" vazifangiz baholandi!\nBall: ${score} ball.\nUstoz fikri: ${teacher_feedback || "Yaxshi bajarilgan."}`;
    db.prepare('INSERT INTO direct_messages (id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)').run(msgId, sub.teacher_id, sub.student_id, msg);
  }

  res.json({ success: true });
});

// --- 1-ON-1 DIRECT MESSAGES (LICHKA) ---
app.get('/api/messages', (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) {
    return res.status(400).json({ error: 'user1 va user2 ko\'rsatilishi shart' });
  }

  const messages = db.prepare(`
    SELECT dm.*, 
           sender.name as sender_name, sender.avatar as sender_avatar,
           receiver.name as receiver_name, receiver.avatar as receiver_avatar
    FROM direct_messages dm
    JOIN users sender ON dm.sender_id = sender.id
    JOIN users receiver ON dm.receiver_id = receiver.id
    WHERE (dm.sender_id = ? AND dm.receiver_id = ?)
       OR (dm.sender_id = ? AND dm.receiver_id = ?)
    ORDER BY dm.created_at ASC
  `).all(user1, user2, user2, user1);

  // Mark unread as read
  db.prepare('UPDATE direct_messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?').run(user1, user2);

  res.json(messages);
});

app.post('/api/messages', (req, res) => {
  const { sender_id, receiver_id, message, attachment_url, attachment_type } = req.body;
  if (!sender_id || !receiver_id || (!message && !attachment_url)) {
    return res.status(400).json({ error: 'Sender, receiver va xabar matni talab qilinadi' });
  }

  const id = 'msg_' + uuidv4().slice(0, 8);
  const insert = db.prepare(`
    INSERT INTO direct_messages (id, sender_id, receiver_id, message, attachment_url, attachment_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insert.run(id, sender_id, receiver_id, message || '', attachment_url || null, attachment_type || null);

  const newMsg = db.prepare(`
    SELECT dm.*, 
           sender.name as sender_name, sender.avatar as sender_avatar,
           receiver.name as receiver_name, receiver.avatar as receiver_avatar
    FROM direct_messages dm
    JOIN users sender ON dm.sender_id = sender.id
    JOIN users receiver ON dm.receiver_id = receiver.id
    WHERE dm.id = ?
  `).get(id);

  res.json(newMsg);
});

app.get('/api/messages/contacts/:userId', (req, res) => {
  const userId = req.params.userId;
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

  let contacts = [];
  if (user.role === 'teacher') {
    contacts = db.prepare(`
      SELECT DISTINCT u.id, u.name, u.role, u.avatar, u.specialty, u.phone,
             (SELECT COUNT(*) FROM direct_messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count,
             (SELECT message FROM direct_messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM direct_messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM users u
      JOIN group_students gs ON gs.student_id = u.id
      JOIN groups g ON gs.group_id = g.id
      WHERE g.teacher_id = ?
      ORDER BY last_message_time DESC NULLS LAST
    `).all(userId, userId, userId, userId, userId, userId);
  } else if (user.role === 'student') {
    contacts = db.prepare(`
      SELECT DISTINCT u.id, u.name, u.role, u.avatar, u.specialty, u.phone,
             (SELECT COUNT(*) FROM direct_messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count,
             (SELECT message FROM direct_messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM direct_messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM users u
      JOIN groups g ON g.teacher_id = u.id
      JOIN group_students gs ON gs.group_id = g.id
      WHERE gs.student_id = ?
      ORDER BY last_message_time DESC NULLS LAST
    `).all(userId, userId, userId, userId, userId, userId);
  } else {
    contacts = db.prepare(`
      SELECT u.id, u.name, u.role, u.avatar, u.specialty, u.phone,
             (SELECT COUNT(*) FROM direct_messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count,
             (SELECT message FROM direct_messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM direct_messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message_time
      FROM users u
      WHERE u.id != ?
      ORDER BY last_message_time DESC NULLS LAST
    `).all(userId, userId, userId, userId, userId, userId);
  }

  res.json(contacts);
});

// --- ATTENDANCE (DAVOMAT) ---
app.get('/api/attendance', (req, res) => {
  const { group_id, date, student_id } = req.query;

  let query = `
    SELECT a.*, u.name as student_name, u.avatar as student_avatar, g.name as group_name
    FROM attendance a
    JOIN users u ON a.student_id = u.id
    JOIN groups g ON a.group_id = g.id
    WHERE 1=1
  `;
  const params = [];

  if (group_id) {
    query += ' AND a.group_id = ?';
    params.push(group_id);
  }
  if (date) {
    query += ' AND a.date = ?';
    params.push(date);
  }
  if (student_id) {
    query += ' AND a.student_id = ?';
    params.push(student_id);
  }

  query += ' ORDER BY a.date DESC';
  const list = db.prepare(query).all(...params);
  res.json(list);
});

app.post('/api/attendance', (req, res) => {
  const { group_id, date, records = [] } = req.body;
  if (!group_id || !date) {
    return res.status(400).json({ error: 'Guruh va sana ko\'rsatilishi kerak' });
  }

  const upsert = db.prepare(`
    INSERT INTO attendance (id, group_id, student_id, date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(group_id, student_id, date) DO UPDATE SET
      status = excluded.status,
      notes = excluded.notes
  `);

  const tx = db.transaction((rows) => {
    for (const r of rows) {
      const id = 'att_' + uuidv4().slice(0, 8);
      upsert.run(id, group_id, r.student_id, date, r.status || 'present', r.notes || '');
    }
  });

  tx(records);
  res.json({ success: true });
});

// --- MATERIALS & VIDEOS ---
app.get('/api/materials', (req, res) => {
  const { course_id, group_id } = req.query;
  let query = `
    SELECT m.*, c.title as course_title, g.name as group_name
    FROM materials m
    LEFT JOIN courses c ON m.course_id = c.id
    LEFT JOIN groups g ON m.group_id = g.id
    WHERE 1=1
  `;
  const params = [];

  if (course_id) {
    query += ' AND m.course_id = ?';
    params.push(course_id);
  }
  if (group_id) {
    query += ' AND (m.group_id = ? OR m.group_id IS NULL)';
    params.push(group_id);
  }

  query += ' ORDER BY m.lesson_number ASC, m.created_at DESC';
  const mats = db.prepare(query).all(...params);
  res.json(mats);
});

app.post('/api/materials', (req, res) => {
  const { course_id, group_id, title, description, type, url, lesson_number = 1 } = req.body;
  if (!title || !url || !type) {
    return res.status(400).json({ error: 'Sarlavha, tur va URL manzil talab qilinadi' });
  }

  const id = 'mat_' + uuidv4().slice(0, 8);
  db.prepare(`
    INSERT INTO materials (id, course_id, group_id, title, description, type, url, lesson_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, course_id || null, group_id || null, title, description || '', type, url, Number(lesson_number));

  res.json({ success: true, id });
});

app.delete('/api/materials/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- ANNOUNCEMENTS ---
app.get('/api/announcements', (req, res) => {
  const list = db.prepare(`
    SELECT a.*, u.name as author_name, u.avatar as author_avatar
    FROM announcements a
    JOIN users u ON a.author_id = u.id
    ORDER BY a.created_at DESC
  `).all();
  res.json(list);
});

app.post('/api/announcements', (req, res) => {
  const { author_id, title, content, badge = 'E\'lon', target_group_id } = req.body;
  if (!author_id || !title || !content) {
    return res.status(400).json({ error: 'Muallif, sarlavha va matn talab qilinadi' });
  }

  const id = 'ann_' + uuidv4().slice(0, 8);
  db.prepare(`
    INSERT INTO announcements (id, author_id, title, content, badge, target_group_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, author_id, title, content, badge, target_group_id || null);

  res.json({ success: true, id });
});

// --- LEADERBOARD & RATINGS ---
app.get('/api/leaderboard', (req, res) => {
  const students = db.prepare("SELECT id, name, avatar, specialty FROM users WHERE role = 'student'").all();
  
  const leaderboard = students.map(student => {
    const subs = db.prepare(`
      SELECT score FROM submissions 
      WHERE student_id = ? AND status = 'graded' AND score IS NOT NULL
    `).all(student.id);

    const totalSubmissions = subs.length;
    const avgScore = totalSubmissions > 0
      ? Math.round(subs.reduce((acc, s) => acc + s.score, 0) / totalSubmissions)
      : 0;

    const att = db.prepare(`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
      FROM attendance WHERE student_id = ?
    `).get(student.id);

    const attendanceRate = att.total > 0 ? Math.round((att.present / att.total) * 100) : 100;

    return {
      ...student,
      avgScore,
      totalSubmissions,
      attendanceRate,
      points: (avgScore * 10) + (totalSubmissions * 20)
    };
  }).sort((a, b) => b.points - a.points);

  res.json(leaderboard);
});

// --- STATS ---
app.get('/api/stats', (req, res) => {
  const studentsCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
  const teachersCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get().count;
  const groupsCount = db.prepare('SELECT COUNT(*) as count FROM groups').get().count;
  const homeworksCount = db.prepare('SELECT COUNT(*) as count FROM homeworks').get().count;
  const submissionsCount = db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;
  const pendingCheckCount = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'submitted'").get().count;

  res.json({
    studentsCount,
    teachersCount,
    groupsCount,
    homeworksCount,
    submissionsCount,
    pendingCheckCount
  });
});

app.listen(PORT, () => {
  console.log(`Skyline Education Backend running on http://localhost:${PORT}`);
});
