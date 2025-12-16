import { getDatabase } from '../db/database';
import { IceBreaker } from '../../../shared/types';

export class IceBreakerModel {
  static create(iceBreaker: IceBreaker): IceBreaker {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO ice_breakers (id, session_id, user_id, content, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      iceBreaker.id,
      iceBreaker.sessionId,
      iceBreaker.userId,
      iceBreaker.content,
      iceBreaker.type,
      iceBreaker.createdAt
    );

    return iceBreaker;
  }

  static findBySessionId(sessionId: string): IceBreaker[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM ice_breakers WHERE session_id = ?');
    const rows = stmt.all(sessionId) as any[];

    return rows.map(row => this.rowToIceBreaker(row));
  }

  private static rowToIceBreaker(row: any): IceBreaker {
    return {
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      content: row.content,
      type: row.type,
      createdAt: row.created_at
    };
  }
}
