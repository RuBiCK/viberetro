import { getDatabase } from '../db/database';
import { SessionParticipant } from '../../../shared/types';

export class SessionParticipantModel {
  static add(participant: SessionParticipant): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO session_participants (session_id, user_id, user_display_name, joined_at)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      participant.sessionId,
      participant.userId,
      participant.userDisplayName,
      participant.joinedAt
    );
  }

  static findBySessionId(sessionId: string): SessionParticipant[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM session_participants WHERE session_id = ? ORDER BY joined_at ASC');
    const rows = stmt.all(sessionId) as any[];

    return rows.map(row => ({
      sessionId: row.session_id,
      userId: row.user_id,
      userDisplayName: row.user_display_name,
      joinedAt: row.joined_at
    }));
  }

  static findByUserId(userId: string): SessionParticipant[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM session_participants WHERE user_id = ? ORDER BY joined_at DESC');
    const rows = stmt.all(userId) as any[];

    return rows.map(row => ({
      sessionId: row.session_id,
      userId: row.user_id,
      userDisplayName: row.user_display_name,
      joinedAt: row.joined_at
    }));
  }

  static exists(sessionId: string, userId: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('SELECT 1 FROM session_participants WHERE session_id = ? AND user_id = ? LIMIT 1');
    const row = stmt.get(sessionId, userId);
    return !!row;
  }

  static getParticipantCount(sessionId: string): number {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM session_participants WHERE session_id = ?');
    const row = stmt.get(sessionId) as any;
    return row?.count || 0;
  }
}
