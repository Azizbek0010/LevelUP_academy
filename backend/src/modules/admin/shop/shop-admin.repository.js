import { pool } from '../../../config/db.js';

/** Все товары филиала для управления (без фильтра по остатку/архиву — в отличие от student-стороны). */
export async function findItemsByBranch(branchId) {
  const { rows } = await pool.query(
    `SELECT id, name, image_key, coin_price, stock, is_archived, created_at
       FROM shop_items
      WHERE branch_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC`,
    [branchId],
  );
  return rows;
}

/** Каталог всей организации (SEO) — опционально сузить одним филиалом. */
export async function findItemsByOrg(organizationId, branchId = null) {
  const params = [organizationId];
  let filter = '';
  if (branchId) {
    params.push(branchId);
    filter = `AND i.branch_id = $${params.length}`;
  }
  const { rows } = await pool.query(
    `SELECT i.id, i.branch_id, i.name, i.image_key, i.coin_price, i.stock, i.is_archived, i.created_at,
            b.name AS branch_name
       FROM shop_items i
       JOIN branches b ON b.id = i.branch_id
      WHERE b.organization_id = $1 AND i.deleted_at IS NULL ${filter}
      ORDER BY i.created_at DESC`,
    params,
  );
  return rows;
}

/** branch_id + organization_id товара — чтобы SEO мог проверить владение перед правкой. */
export async function findItemBranchOrg(itemId) {
  const { rows: [row] } = await pool.query(
    `SELECT i.id, i.branch_id, b.organization_id
       FROM shop_items i
       JOIN branches b ON b.id = i.branch_id
      WHERE i.id = $1 AND i.deleted_at IS NULL`,
    [itemId],
  );
  return row ?? null;
}

export async function findBranchInOrg(branchId, organizationId) {
  const { rows: [row] } = await pool.query(
    `SELECT id FROM branches WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
    [branchId, organizationId],
  );
  return row ?? null;
}

export async function setItemArchived(itemId, branchId, archived) {
  const { rows: [row] } = await pool.query(
    `UPDATE shop_items SET is_archived = $3
      WHERE id = $1 AND branch_id = $2 AND deleted_at IS NULL
      RETURNING id, branch_id, name, image_key, coin_price, stock, is_archived, created_at`,
    [itemId, branchId, archived],
  );
  return row ?? null;
}

/** Возврат на склад при отмене заказа — зеркало student/shop/shop.repository.js decrementStock. */
export async function incrementStock(itemId, client) {
  await client.query(`UPDATE shop_items SET stock = stock + 1 WHERE id = $1`, [itemId]);
}

export async function listOrdersByBranch(branchId, { status, limit, offset }) {
  const params = [branchId];
  let statusFilter = '';
  if (status) {
    params.push(status);
    statusFilter = `AND o.status = $${params.length}`;
  }
  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const { rows } = await pool.query(
    `SELECT o.id, o.item_id, o.student_id, o.coin_price, o.status, o.created_at, o.updated_at,
            i.name AS item_name, s.first_name AS student_first, s.last_name AS student_last
       FROM shop_orders o
       JOIN shop_items i ON i.id = o.item_id
       JOIN users s ON s.id = o.student_id
      WHERE o.branch_id = $1 ${statusFilter}
      ORDER BY o.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params,
  );
  return rows;
}

export async function countOrdersByBranch(branchId, { status }) {
  const params = [branchId];
  let statusFilter = '';
  if (status) {
    params.push(status);
    statusFilter = `AND status = $${params.length}`;
  }
  const { rows: [row] } = await pool.query(
    `SELECT count(*)::int AS n FROM shop_orders WHERE branch_id = $1 ${statusFilter}`,
    params,
  );
  return row.n;
}

export async function lockOrderInBranch(orderId, branchId, client) {
  const { rows: [row] } = await client.query(
    `SELECT id, branch_id, item_id, student_id, coin_price, status
       FROM shop_orders
      WHERE id = $1 AND branch_id = $2
      FOR UPDATE`,
    [orderId, branchId],
  );
  return row ?? null;
}

export async function setOrderStatus(orderId, status, cancelledBy, client) {
  const { rows: [row] } = await client.query(
    `UPDATE shop_orders
        SET status = $2::varchar, updated_at = now(),
            cancelled_by = CASE WHEN $2::varchar = 'cancelled' THEN $3::uuid ELSE cancelled_by END
      WHERE id = $1
      RETURNING id, branch_id, item_id, student_id, coin_price, status, created_at, updated_at`,
    [orderId, status, cancelledBy],
  );
  return row;
}
