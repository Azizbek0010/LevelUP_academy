import { useState } from 'react';
import { Gift, PackagePlus, ShoppingBag, CheckCircle2, XCircle, Coins, Archive } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminShopItems, useAdminShopOrders, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { EmptyState, Kpi, RowSkeleton } from '../mentor/_ui.jsx';

const STATUS = {
  pending: { label: 'Ожидает', bg: '#F5A62315', text: '#F5A623' },
  fulfilled: { label: 'Выдан', bg: '#2ECC7115', text: '#2ECC71' },
  cancelled: { label: 'Отменён', bg: '#E8543E15', text: '#E8543E' },
};

function ItemRow({ item, onRestock, busy }) {
  const [stock, setStock] = useState(String(item.stock));
  const dirty = Number(stock) !== item.stock;
  return (
    <div className="card bg-base-100 p-4 flex flex-row items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-base-200 grid place-items-center shrink-0 overflow-hidden">
        {item.image_key ? (
          <img src={item.image_key} alt="" className="w-full h-full object-cover" />
        ) : (
          <Gift size={20} className="text-base-content/35" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-base-content truncate">{item.name}</span>
          {item.is_archived && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-base-200 text-base-content/45">
              <Archive size={10} /> В архиве (не заводит SEO)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-base-content/45 mt-0.5">
          <Coins size={11} className="text-warning" /> {item.coin_price} коинов
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number" min="0"
          className="input input-bordered input-sm w-20 text-center"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
        <button
          className="btn btn-sm btn-primary gap-1"
          disabled={busy || !dirty || stock === '' || Number(stock) < 0}
          onClick={() => onRestock(item.id, Number(stock))}
        >
          {busy ? <span className="loading loading-spinner loading-xs" /> : <PackagePlus size={13} />}
          Обновить
        </button>
      </div>
    </div>
  );
}

function OrderRow({ order, onFulfill, onCancel, busy }) {
  const s = STATUS[order.status] || STATUS.pending;
  return (
    <div className="card bg-base-100 p-4 flex flex-row items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-base-content truncate">{order.itemName}</div>
        <div className="text-[11px] text-base-content/45">{order.studentName} · {order.coinPrice} коинов</div>
      </div>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
        style={{ background: s.bg, color: s.text }}>
        {s.label}
      </span>
      {order.status === 'pending' && (
        <div className="flex items-center gap-1.5">
          <button className="btn btn-sm btn-ghost gap-1 text-success" disabled={busy} onClick={() => onFulfill(order.id)}>
            <CheckCircle2 size={14} /> Выдать
          </button>
          <button className="btn btn-sm btn-ghost gap-1 text-error" disabled={busy} onClick={() => onCancel(order.id)}>
            <XCircle size={14} /> Отменить
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminShop() {
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const [tab, setTab] = useState('items');
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');

  const itemsQ = useAdminShopItems();
  const ordersQ = useAdminShopOrders();

  const items = itemsQ.data?.items || [];
  const orders = ordersQ.data?.orders || [];
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  const restock = async (itemId, stock) => {
    setBusyId(itemId); setErr('');
    try {
      await api.adminRestockShopItem(token, itemId, stock);
      invalidate(['admin-shop-items']);
    } catch (e) { setErr(e.message || 'Не удалось обновить остаток'); }
    finally { setBusyId(null); }
  };

  const fulfill = async (orderId) => {
    setBusyId(orderId); setErr('');
    try {
      await api.adminFulfillShopOrder(token, orderId);
      invalidate(['admin-shop-orders']);
    } catch (e) { setErr(e.message || 'Не удалось отметить выдачу'); }
    finally { setBusyId(null); }
  };

  const cancel = async (orderId) => {
    if (!confirm('Отменить заказ? Коины вернутся студенту, товар вернётся на склад.')) return;
    setBusyId(orderId); setErr('');
    try {
      await api.adminCancelShopOrder(token, orderId);
      invalidate(['admin-shop-orders']);
      invalidate(['admin-shop-items']);
    } catch (e) { setErr(e.message || 'Не удалось отменить заказ'); }
    finally { setBusyId(null); }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Магазин" subtitle="Остаток товаров и заказы студентов филиала. Каталог (название/цена/фото) заводит SEO." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi Icon={Gift} title="Товаров" value={items.length} tone="neutral" />
        <Kpi Icon={ShoppingBag} title="Заказов" value={orders.length} tone="neutral" />
        <Kpi Icon={PackagePlus} title="Ожидают выдачи" value={pendingCount} tone="warning" />
      </div>

      <div role="tablist" className="tabs tabs-boxed w-fit">
        <button role="tab" className={`tab ${tab === 'items' ? 'tab-active' : ''}`} onClick={() => setTab('items')}>Товары</button>
        <button role="tab" className={`tab ${tab === 'orders' ? 'tab-active' : ''}`} onClick={() => setTab('orders')}>Заказы</button>
      </div>

      {err && <div className="alert alert-error py-2 text-sm">{err}</div>}

      {tab === 'items' && (
        itemsQ.isLoading ? (
          <RowSkeleton count={3} />
        ) : items.length === 0 ? (
          <EmptyState icon={Gift} title="Пока нет товаров" hint="SEO ещё не завёл товары для этого филиала" />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <ItemRow key={item.id} item={item} onRestock={restock} busy={busyId === item.id} />
            ))}
          </div>
        )
      )}

      {tab === 'orders' && (
        ordersQ.isLoading ? (
          <RowSkeleton count={3} />
        ) : orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="Пока нет заказов" hint="Студенты ещё не покупали товары" />
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} onFulfill={fulfill} onCancel={cancel} busy={busyId === order.id} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
