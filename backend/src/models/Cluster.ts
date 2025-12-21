import { getDatabase } from '../db/database';
import { Cluster } from '../../../shared/types';

export class ClusterModel {
  static create(cluster: Cluster): Cluster {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO clusters (id, session_id, name, card_ids, column_name, position, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      cluster.id,
      cluster.sessionId,
      cluster.name,
      JSON.stringify(cluster.cardIds),
      cluster.column,
      JSON.stringify(cluster.position),
      cluster.createdAt,
      cluster.updatedAt
    );

    return cluster;
  }

  static findById(id: string): Cluster | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM clusters WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToCluster(row);
  }

  static findBySessionId(sessionId: string): Cluster[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM clusters WHERE session_id = ?');
    const rows = stmt.all(sessionId) as any[];

    return rows.map(row => this.rowToCluster(row));
  }

  static update(id: string, updates: Partial<Cluster>): void {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.cardIds !== undefined) {
      fields.push('card_ids = ?');
      values.push(JSON.stringify(updates.cardIds));
    }
    if (updates.column !== undefined) {
      fields.push('column_name = ?');
      values.push(updates.column);
    }
    if (updates.position !== undefined) {
      fields.push('position = ?');
      values.push(JSON.stringify(updates.position));
    }

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    const sql = `UPDATE clusters SET ${fields.join(', ')} WHERE id = ?`;
    console.log('🗄️  ClusterModel.update SQL:', { sql, values });

    const stmt = db.prepare(sql);
    const result = stmt.run(...values);
    console.log('🗄️  ClusterModel.update result:', { changes: result.changes });
  }

  static delete(id: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM clusters WHERE id = ?');
    stmt.run(id);
  }

  private static rowToCluster(row: any): Cluster {
    return {
      id: row.id,
      sessionId: row.session_id,
      name: row.name || 'Cluster',
      cardIds: JSON.parse(row.card_ids),
      column: row.column_name,
      position: JSON.parse(row.position),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
