import { getDatabase } from '../db/database';
import { Session, SessionSettings, SessionStage } from '../../../shared/types';

export class SessionModel {
  static create(session: Session): Session {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO sessions (id, host_id, name, stage, settings, timer_end_at, ice_breakers_revealed, votes_revealed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      session.id,
      session.hostId,
      session.name,
      session.stage,
      JSON.stringify(session.settings),
      session.timerEndAt,
      session.iceBreakersRevealed ? 1 : 0,
      session.votesRevealed ? 1 : 0,
      session.createdAt,
      session.updatedAt
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
      settings: JSON.parse(row.settings) as SessionSettings,
      timerEndAt: row.timer_end_at,
      iceBreakersRevealed: row.ice_breakers_revealed === 1,
      votesRevealed: row.votes_revealed === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
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

    return rows.map(row => ({
      id: row.id,
      hostId: row.host_id,
      name: row.name,
      stage: row.stage as SessionStage,
      settings: JSON.parse(row.settings) as SessionSettings,
      timerEndAt: row.timer_end_at,
      iceBreakersRevealed: row.ice_breakers_revealed === 1,
      votesRevealed: row.votes_revealed === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
}
