import { getDatabase } from '../db/database';
import { ActionItem } from '../../../shared/types';

export class ActionItemModel {
  static create(actionItem: ActionItem): ActionItem {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO action_items (id, session_id, owner, task, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      actionItem.id,
      actionItem.sessionId,
      actionItem.owner,
      actionItem.task,
      actionItem.createdAt
    );

    return actionItem;
  }

  static findById(id: string): ActionItem | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM action_items WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToActionItem(row);
  }

  static findBySessionId(sessionId: string): ActionItem[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM action_items WHERE session_id = ?');
    const rows = stmt.all(sessionId) as any[];

    return rows.map(row => this.rowToActionItem(row));
  }

  static update(id: string, updates: Partial<ActionItem>): void {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.owner !== undefined) {
      fields.push('owner = ?');
      values.push(updates.owner);
    }
    if (updates.task !== undefined) {
      fields.push('task = ?');
      values.push(updates.task);
    }

    if (fields.length === 0) return;

    values.push(id);
    const stmt = db.prepare(`UPDATE action_items SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  static delete(id: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM action_items WHERE id = ?');
    stmt.run(id);
  }

  private static rowToActionItem(row: any): ActionItem {
    return {
      id: row.id,
      sessionId: row.session_id,
      owner: row.owner,
      task: row.task,
      createdAt: row.created_at
    };
  }
}
