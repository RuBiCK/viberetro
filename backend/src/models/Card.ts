import { getDatabase } from '../db/database';
import { Card } from '../../../shared/types';

export class CardModel {
  static create(card: Card): Card {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO cards (id, session_id, user_id, column_name, content, position, cluster_id, is_revealed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      card.id,
      card.sessionId,
      card.userId,
      card.column,
      card.content,
      JSON.stringify(card.position),
      card.clusterId,
      card.isRevealed ? 1 : 0,
      card.createdAt,
      card.updatedAt
    );

    return card;
  }

  static findById(id: string): Card | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM cards WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToCard(row);
  }

  static findBySessionId(sessionId: string): Card[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM cards WHERE session_id = ?');
    const rows = stmt.all(sessionId) as any[];

    return rows.map(row => this.rowToCard(row));
  }

  static findByClusterId(clusterId: string): Card[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM cards WHERE cluster_id = ?');
    const rows = stmt.all(clusterId) as any[];

    return rows.map(row => this.rowToCard(row));
  }

  static update(id: string, updates: Partial<Card>): void {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.position !== undefined) {
      fields.push('position = ?');
      values.push(JSON.stringify(updates.position));
    }
    if (updates.clusterId !== undefined) {
      fields.push('cluster_id = ?');
      values.push(updates.clusterId);
    }
    if (updates.isRevealed !== undefined) {
      fields.push('is_revealed = ?');
      values.push(updates.isRevealed ? 1 : 0);
    }
    if (updates.column !== undefined) {
      fields.push('column_name = ?');
      values.push(updates.column);
    }

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    const stmt = db.prepare(`UPDATE cards SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  static delete(id: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM cards WHERE id = ?');
    stmt.run(id);
  }

  static revealAll(sessionId: string): void {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE cards SET is_revealed = 1, updated_at = ? WHERE session_id = ?');
    stmt.run(Date.now(), sessionId);
  }

  private static rowToCard(row: any): Card {
    return {
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      column: row.column_name,
      content: row.content,
      position: JSON.parse(row.position),
      clusterId: row.cluster_id,
      isRevealed: row.is_revealed === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
