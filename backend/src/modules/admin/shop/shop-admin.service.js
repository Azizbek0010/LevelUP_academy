import { withTransaction } from '../../../config/db.js';
import { AppError } from '../../../utils/AppError.js';
import { changeCoins, emitCoinsChanged } from '../../coins/coins.service.js';
import { createItem as insertItem, updateItem as patchItem } from '../../student/shop/shop.repository.js';
import * as repo from './shop-admin.repository.js';

// ==================== каталог (SEO, вся организация) ====================

export async function listItemsForOrg(organizationId, branchId) {
  return repo.findItemsByOrg(organizationId, branchId);
}

export async function createItemForOrg(organizationId, body) {
  const branch = await repo.findBranchInOrg(body.branchId, organizationId);
  if (!branch) throw new AppError(404, 'Branch not found in your organization');
  return insertItem({
    branchId: body.branchId,
    name: body.name,
    imageKey: body.imageKey,
    coinPrice: body.coinPrice,
    stock: body.stock ?? 0,
  });
}

export async function updateItemForOrg(organizationId, itemId, patch) {
  const item = await repo.findItemBranchOrg(itemId);
  if (!item || item.organization_id !== organizationId) {
    throw new AppError(404, 'Item not found in your organization');
  }
  const updated = await patchItem(itemId, item.branch_id, patch);
  if (!updated) throw new AppError(404, 'Item not found');
  return updated;
}

export async function setItemArchivedForOrg(organizationId, itemId, archived) {
  const item = await repo.findItemBranchOrg(itemId);
  if (!item || item.organization_id !== organizationId) {
    throw new AppError(404, 'Item not found in your organization');
  }
  const updated = await repo.setItemArchived(itemId, item.branch_id, archived);
  if (!updated) throw new AppError(404, 'Item not found');
  return updated;
}

// ==================== инвентарь и заказы (admin/branch_manager, свой филиал) ====================

export async function listItemsForBranch(branchId) {
  return repo.findItemsByBranch(branchId);
}

/** Пополнение остатка — единственное поле, которое может трогать филиал (цену/название держит SEO). */
export async function restockItem(branchId, itemId, stock) {
  const updated = await patchItem(itemId, branchId, { stock });
  if (!updated) throw new AppError(404, 'Item not found in your branch');
  return updated;
}

function mapOrder(o) {
  return {
    id: o.id,
    itemId: o.item_id,
    itemName: o.item_name,
    studentId: o.student_id,
    studentName: `${o.student_first} ${o.student_last}`,
    coinPrice: o.coin_price,
    status: o.status,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

export async function listOrders(branchId, query) {
  const limit = Math.min(Number(query.limit) || 20, 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const offset = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    repo.listOrdersByBranch(branchId, { status: query.status, limit, offset }),
    repo.countOrdersByBranch(branchId, { status: query.status }),
  ]);
  return {
    orders: rows.map(mapOrder),
    meta: { total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** Приз выдан студенту физически — просто помечает заказ закрытым, коины уже списаны при покупке. */
export async function fulfillOrder(branchId, orderId) {
  return withTransaction(async (client) => {
    const ord = await repo.lockOrderInBranch(orderId, branchId, client);
    if (!ord) throw new AppError(404, 'Order not found in your branch');
    if (ord.status !== 'pending') throw new AppError(409, `Order is already ${ord.status}`);
    return repo.setOrderStatus(orderId, 'fulfilled', null, client);
  });
}

/**
 * Отмена заказа: возврат коинов студенту + возврат единицы товара на склад,
 * в одной транзакции — зеркало покупки (shop.service.js purchaseItem), только
 * в обратную сторону. 'system' — операция для changeCoins: в coin_operation
 * enum нет 'refund' (см. отчёт исследования), заводить его отдельной миграцией
 * ради одного места сочли лишним — reason текстом объясняет, что это возврат.
 */
export async function cancelOrder(branchId, orderId, actorId) {
  const { order, studentId } = await withTransaction(async (client) => {
    const ord = await repo.lockOrderInBranch(orderId, branchId, client);
    if (!ord) throw new AppError(404, 'Order not found in your branch');
    if (ord.status !== 'pending') throw new AppError(409, `Order is already ${ord.status}`);

    await changeCoins(
      {
        studentId: ord.student_id,
        actorId,
        amount: ord.coin_price,
        operation: 'system',
        reason: 'Shop order cancelled — refund',
        refType: 'shop_order',
        refId: ord.id,
      },
      client,
    );
    await repo.incrementStock(ord.item_id, client);
    const updated = await repo.setOrderStatus(orderId, 'cancelled', actorId, client);
    return { order: updated, studentId: ord.student_id };
  });

  await emitCoinsChanged({
    studentId,
    branchId,
    amount: order.coin_price,
    reason: 'Shop order cancelled — refund',
  });
  return order;
}
