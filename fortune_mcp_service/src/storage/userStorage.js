import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs/promises';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'users.db');

let db = null;

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function initDatabase() {
  if (db) return db;
  
  await ensureDataDir();
  
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('SQLite连接错误:', err);
        reject(err);
      } else {
        console.log('SQLite数据库连接成功');
        
        db.serialize(() => {
          db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            birth_date TEXT NOT NULL,
            birth_time TEXT NOT NULL,
            city TEXT NOT NULL,
            gender TEXT NOT NULL,
            is_lunar BOOLEAN NOT NULL DEFAULT 0,
            astrolabe_data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`, (err) => {
            if (err) {
              console.error('创建表失败:', err);
              reject(err);
            } else {
              console.log('用户表初始化完成');
              resolve(db);
            }
          });
        });
      }
    });
  });
}

export async function saveUser(name, userData) {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const stmt = database.prepare(`
      INSERT OR REPLACE INTO users 
      (name, birth_date, birth_time, city, gender, is_lunar, astrolabe_data, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run([
      name,
      userData.birthDate,
      userData.birthTime,
      userData.city,
      userData.gender,
      userData.isLunar ? 1 : 0,
      JSON.stringify(userData.astrolabeData)
    ], function(err) {
      if (err) {
        console.error('保存用户失败:', err);
        reject(err);
      } else {
        console.log(`用户 ${name} 保存成功, ID: ${this.lastID}`);
        resolve({ ...userData, id: this.lastID });
      }
    });
    
    stmt.finalize();
  });
}

export async function getUser(name) {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    database.get(
      'SELECT * FROM users WHERE name = ?',
      [name],
      (err, row) => {
        if (err) {
          console.error('查询用户失败:', err);
          reject(err);
        } else if (row) {
          resolve({
            id: row.id,
            name: row.name,
            birthDate: row.birth_date,
            birthTime: row.birth_time,
            city: row.city,
            gender: row.gender,
            isLunar: Boolean(row.is_lunar),
            astrolabeData: JSON.parse(row.astrolabe_data),
            createdAt: row.created_at,
            updatedAt: row.updated_at
          });
        } else {
          resolve(null);
        }
      }
    );
  });
}

export async function listUsers() {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    database.all(
      'SELECT id, name, birth_date, city, gender, created_at, updated_at FROM users ORDER BY updated_at DESC',
      [],
      (err, rows) => {
        if (err) {
          console.error('查询用户列表失败:', err);
          reject(err);
        } else {
          const users = rows.map(row => ({
            id: row.id,
            name: row.name,
            birthDate: row.birth_date,
            city: row.city,
            gender: row.gender,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));
          resolve(users);
        }
      }
    );
  });
}