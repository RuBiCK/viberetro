import { getDatabase } from '../db/database';
import { Vote } from '../../../shared/types';

export class VoteModel {
  static create(vote: Vote): Vote {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO votes (id, session_id, user_id, target_id, target_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      vote.id,
      vote.sessionId,
      vote.userId,
      vote.targetId,
      vote.targetType,
      vote.createdAt
    );

    return vote;
  }

  static findById(id: string): Vote | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM votes WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToVote(row);
  }

  static findBySessionId(sessionId: string): Vote[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM votes WHERE session_id = ?');
    const rows = stmt.all(sessionId) as any[];

    return rows.map(row => this.rowToVote(row));
  }

  static findByUserId(userId: string): Vote[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM votes WHERE user_id = ?');
    const rows = stmt.all(userId) as any[];

    return rows.map(row => this.rowToVote(row));
  }

  static countByTarget(targetId: string): number {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM votes WHERE target_id = ?');
    const row = stmt.get(targetId) as any;
    return row.count;
  }

  static delete(id: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM votes WHERE id = ?');
    stmt.run(id);
  }

  static deleteBySessionId(sessionId: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM votes WHERE session_id = ?');
    stmt.run(sessionId);
  }

  private static rowToVote(row: any): Vote {
    return {
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      targetId: row.target_id,
      targetType: row.target_type,
      createdAt: row.created_at
    };
  }
}
