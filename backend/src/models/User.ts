import { getDatabase } from '../db/database';
import { User } from '../../../shared/types';

export class UserModel {
  static create(user: User): User {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO users (id, session_id, display_name, is_host, color, cursor_position, joined_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      user.id,
      user.sessionId,
      user.displayName,
      user.isHost ? 1 : 0,
      user.color,
      user.cursorPosition ? JSON.stringify(user.cursorPosition) : null,
      user.joinedAt
    );

    return user;
  }

  static findById(id: string): User | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToUser(row);
  }

  static findBySessionId(sessionId: string): User[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE session_id = ?');
    const rows = stmt.all(sessionId) as any[];

    return rows.map(row => this.rowToUser(row));
  }

  static update(id: string, updates: Partial<User>): void {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.displayName !== undefined) {
      fields.push('display_name = ?');
      values.push(updates.displayName);
    }
    if (updates.cursorPosition !== undefined) {
      fields.push('cursor_position = ?');
      values.push(updates.cursorPosition ? JSON.stringify(updates.cursorPosition) : null);
    }

    if (fields.length === 0) return;

    values.push(id);
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  static delete(id: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
  }

  private static rowToUser(row: any): User {
    return {
      id: row.id,
      sessionId: row.session_id,
      displayName: row.display_name,
      isHost: row.is_host === 1,
      color: row.color,
      cursorPosition: row.cursor_position ? JSON.parse(row.cursor_position) : null,
      joinedAt: row.joined_at
    };
  }
}
