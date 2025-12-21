import { getDatabase } from '../db/database';
import { Session, SessionSettings, SessionStage, SessionStatus } from '../../../shared/types';

export class SessionModel {
  static create(session: Session): Session {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO sessions (id, host_id, name, stage, status, settings, timer_end_at, ice_breakers_revealed, votes_revealed, created_at, updated_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      session.id,
      session.hostId,
      session.name,
      session.stage,
      session.status,
      JSON.stringify(session.settings),
      session.timerEndAt,
      session.iceBreakersRevealed ? 1 : 0,
      session.votesRevealed ? 1 : 0,
      session.createdAt,
      session.updatedAt,
      session.completedAt || null
    );

    return session;
  }

  static findById(id: string): Session | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      hostId: row.host_id,
      name: row.name,
      stage: row.stage as SessionStage,
      status: (row.status as SessionStatus) || SessionStatus.ACTIVE,
      settings: JSON.parse(row.settings) as SessionSettings,
      timerEndAt: row.timer_end_at,
      iceBreakersRevealed: row.ice_breakers_revealed === 1,
      votesRevealed: row.votes_revealed === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at || undefined
    };
  }

  static update(id: string, updates: Partial<Session>): void {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.stage !== undefined) {
      fields.push('stage = ?');
      values.push(updates.stage);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.settings !== undefined) {
      fields.push('settings = ?');
      values.push(JSON.stringify(updates.settings));
    }
    if (updates.timerEndAt !== undefined) {
      fields.push('timer_end_at = ?');
      values.push(updates.timerEndAt);
    }
    if (updates.iceBreakersRevealed !== undefined) {
      fields.push('ice_breakers_revealed = ?');
      values.push(updates.iceBreakersRevealed ? 1 : 0);
    }
    if (updates.votesRevealed !== undefined) {
      fields.push('votes_revealed = ?');
      values.push(updates.votesRevealed ? 1 : 0);
    }
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt || null);
    }

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    const stmt = db.prepare(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  static delete(id: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
    stmt.run(id);
  }

  static deleteOlderThan(timestamp: number): number {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM sessions WHERE created_at < ?');
    const result = stmt.run(timestamp);
    return result.changes;
  }

  static getAll(): Session[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM sessions');
    const rows = stmt.all() as any[];

    return rows.map(row => this.rowToSession(row));
  }

  static findByUserId(userId: string): Session[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT DISTINCT s.*
      FROM sessions s
      INNER JOIN session_participants sp ON s.id = sp.session_id
      WHERE sp.user_id = ?
      ORDER BY s.created_at DESC
    `);
    const rows = stmt.all(userId) as any[];
    return rows.map(row => this.rowToSession(row));
  }

  static findByStatus(status: SessionStatus): Session[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM sessions WHERE status = ? ORDER BY created_at DESC');
    const rows = stmt.all(status) as any[];
    return rows.map(row => this.rowToSession(row));
  }

  static searchSessions(userId: string, searchTerm?: string, status?: SessionStatus): Session[] {
    const db = getDatabase();
    let query = `
      SELECT DISTINCT s.*
      FROM sessions s
      INNER JOIN session_participants sp ON s.id = sp.session_id
      WHERE sp.user_id = ?
    `;
    const params: any[] = [userId];

    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    if (searchTerm) {
      query += ' AND s.name LIKE ?';
      params.push(`%${searchTerm}%`);
    }

    query += ' ORDER BY s.created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.rowToSession(row));
  }

  private static rowToSession(row: any): Session {
    return {
      id: row.id,
      hostId: row.host_id,
      name: row.name,
      stage: row.stage as SessionStage,
      status: (row.status as SessionStatus) || SessionStatus.ACTIVE,
      settings: JSON.parse(row.settings) as SessionSettings,
      timerEndAt: row.timer_end_at,
      iceBreakersRevealed: row.ice_breakers_revealed === 1,
      votesRevealed: row.votes_revealed === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at || undefined
    };
  }
}
