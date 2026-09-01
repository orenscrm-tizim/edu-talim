require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'mahalla.db'));
db.pragma('journal_mode = WAL');

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    telegram_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    street TEXT NOT NULL,
    house_number TEXT NOT NULL,
    telegram_username TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bot_sessions (
    telegram_id TEXT PRIMARY KEY,
    step TEXT NOT NULL DEFAULT 'idle',
    temp_data TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS review_sessions (
    admin_id TEXT PRIMARY KEY,
    last_reviewed_id TEXT,
    reviewed_today INTEGER DEFAULT 0,
    batch_size INTEGER DEFAULT 10,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Default settings
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
insertSetting.run('admin_id', process.env.ADMIN_ID || '5744542264');
insertSetting.run('group_id', process.env.GROUP_ID || '');
insertSetting.run('openai_api_key', process.env.OPENAI_API_KEY || '');
insertSetting.run('mahalla_name', 'Damariq Mahallasi');
insertSetting.run('deadline_days', '7');
insertSetting.run('deadline_start_date', new Date().toISOString());

module.exports = db;
