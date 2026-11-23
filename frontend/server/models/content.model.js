import { query } from '../config/db.js';

let isTableInitialized = false;

/**
 * Memastikan tabel custom_contents sudah tersedia di Cloudflare D1
 */
export const ensureCustomContentTable = async () => {
  if (isTableInitialized) return;
  const sql = `
    CREATE TABLE IF NOT EXISTS custom_contents (
      id TEXT PRIMARY KEY,
      content_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      item_id TEXT NOT NULL,
      action TEXT NOT NULL DEFAULT 'upsert',
      payload TEXT NOT NULL,
      updated_by TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await query(sql, []);
  isTableInitialized = true;
};

/**
 * Mengambil seluruh data kustomisasi Materi & Latihan Soal dari Cloudflare D1
 */
export const getAllCustomContents = async () => {
  await ensureCustomContentTable();
  const sql = `
    SELECT id, content_type, subject, item_id, action, payload, updated_by, updated_at
    FROM custom_contents
    ORDER BY updated_at ASC
  `;
  const response = await query(sql, []);
  return (response.results || []).map((row) => {
    let parsedPayload = null;
    try {
      parsedPayload = row.payload ? JSON.parse(row.payload) : null;
    } catch (_) {
      parsedPayload = null;
    }
    return {
      id: row.id,
      contentType: row.content_type,
      subject: row.subject,
      itemId: row.item_id,
      action: row.action,
      payload: parsedPayload,
      updatedBy: row.updated_by,
      updatedAt: row.updated_at,
    };
  });
};

/**
 * Menyimpan atau memperbarui item Materi / Latihan Soal di Cloudflare D1
 */
export const upsertCustomContent = async ({
  contentType,
  subject,
  itemId,
  action = 'upsert',
  payload,
  updatedBy = '',
}) => {
  await ensureCustomContentTable();
  const id = `${contentType}:${subject}:${itemId}`;
  const payloadStr = JSON.stringify(payload || {});

  const sql = `
    INSERT INTO custom_contents (
      id, content_type, subject, item_id, action, payload, updated_by, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      action = excluded.action,
      payload = excluded.payload,
      updated_by = excluded.updated_by,
      updated_at = CURRENT_TIMESTAMP
  `;

  await query(sql, [id, contentType, subject, String(itemId), action, payloadStr, updatedBy]);

  return {
    id,
    contentType,
    subject,
    itemId: String(itemId),
    action,
    payload,
    updatedBy,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Menghapus override kustom (mengembalikan item ke data bawaan kode)
 */
export const deleteCustomContentOverride = async ({ contentType, subject, itemId }) => {
  await ensureCustomContentTable();
  const id = `${contentType}:${subject}:${itemId}`;
  const sql = 'DELETE FROM custom_contents WHERE id = ?';
  await query(sql, [id]);
  return { id, deleted: true };
};
