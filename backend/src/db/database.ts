import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_PATH = process.env.DATABASE_PATH || './data/retro.db';

let db: Database.Database;

export function initDatabase(): Database.Database {
  db = new Database(DATABASE_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Load and execute schema
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

  // Split schema into statements and execute them individually to handle migration errors
  const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      db.exec(statement);
    } catch (error: any) {
      // Ignore "duplicate column" errors from ALTER TABLE
      if (!error.message.includes('duplicate column')) {
        throw error;
      }
      console.log('Skipping migration (column already exists):', error.message);
    }
  }

  console.log('Database initialized at:', DATABASE_PATH);

  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
