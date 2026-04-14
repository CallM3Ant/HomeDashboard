import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbDir = path.join(process.cwd(), '.db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(path.join(dbDir, 'studycards.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_streaks (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      streak INTEGER DEFAULT 0,
      last_studied DATE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT REFERENCES categories(id),
      path TEXT UNIQUE NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES categories(id),
      text TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('single', 'multiple')),
      correct TEXT NOT NULL,
      incorrect TEXT NOT NULL DEFAULT '[]',
      difficulty INTEGER DEFAULT 1,
      tags TEXT NOT NULL DEFAULT '[]',
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      user_id INTEGER NOT NULL REFERENCES users(id),
      question_id TEXT NOT NULL REFERENCES questions(id),
      correct_count INTEGER DEFAULT 0,
      incorrect_count INTEGER DEFAULT 0,
      total_attempts INTEGER DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      interval_days INTEGER DEFAULT 1,
      next_review DATETIME DEFAULT CURRENT_TIMESTAMP,
      in_review_pool INTEGER DEFAULT 0,
      last_answered DATETIME,
      PRIMARY KEY (user_id, question_id)
    );
  `);
}