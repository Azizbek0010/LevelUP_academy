import { useEffect, useState } from 'react';
import { ShoppingBag, Coins, Gift, History } from 'lucide-react';
import { api } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { PageHeader, Skeleton, EmptyState, Modal, Pill, Tabs } from '../components/ui.jsx';
import { fmtNum, fmtDateTime } from '../format.js';

export default function Shop() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [orders, setOrders] = useState(null);
  const [balance, setBalance] = useState(null);
  const [confirm, setConfirm] = useState(null); // товар для подтверждения
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('items');

  const load = () => {
    api.shopItems().then((d) => setItems(d.data)).catch((err) => toast(err.message, 'error'));
    api.orders().then((d) => setOrders(d.data)).catch(() => {});
    api.home().then((d) => setBalance(d.data.coins)).catch(() => {});
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buy = async () => {
    setBusy(true);
    try {
      await api.purchase(confirm.id);
      toast(`«${confirm.name}» — покупка оформлена! Забери у администратора.`, 'success');
      setConfirm(null);
      load();
    } catch (err) {
      toast(err.status === 422 ? 'Не хватает коинов 😢' : err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Магазин"
        subtitle="Обменяй заработанные коины на призы"
        actions={
          balance !== null && (
            <Pill tone="primary" className="text-sm px-3.5 py-2">
              <Coins size={15} /> {fmtNum(balance)} коинов
            </Pill>
          )
        }
      />

      <div className="mb-5">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[{ value: 'items', label: 'Витрина' }, { value: 'orders', label: 'Мои покупки' }]}
        />
      </div>

      {tab === 'items' ? (
        !items ? (
          <Skeleton h={180} count={2} />
        ) : items.length === 0 ? (
          <div className="card bg-base-100">
            <EmptyState icon={ShoppingBag} title="Витрина пуста" text="Товары скоро появятся — копи коины!" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const affordable = balance === null || balance >= item.coin_price;
              return (
                <div key={item.id} className="card bg-base-100 card-hover-premium p-4 flex flex-col gap-3">
                  <div className="h-28 rounded-xl bg-base-200 border border-base-300 grid place-items-center text-primary/70 overflow-hidden">
                    {item.image_key ? <img src={item.image_key} alt="" className="w-full h-full object-cover" /> : <Gift size={38} />}
                  </div>
                  <div className="font-bold text-[15px] flex-1 leading-snug">{item.name}</div>
                  <div className="flex items-center justify-between gap-2">
                    <Pill tone="primary" className="tabular-nums">
                      <Coins size={13} /> {fmtNum(item.coin_price)}
                    </Pill>
                    <span className="text-xs text-base-content/45 tabular-nums">осталось {item.stock}</span>
                  </div>
                  <button
                    className="btn btn-sm btn-neutral w-full"
                    disabled={!affordable}
                    onClick={() => setConfirm(item)}
                  >
                    {affordable ? 'Купить' : 'Не хватает коинов'}
                  </button>
                </div>
              );
            })}
          </div>
        )
      ) : !orders ? (
        <Skeleton h={64} count={3} />
      ) : orders.length === 0 ? (
        <div className="card bg-base-100">
          <EmptyState icon={History} title="Покупок пока нет" text="Всё заработанное — впереди." />
        </div>
      ) : (
        <div className="card bg-base-100 divide-y divide-base-200">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <Gift size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate">{o.item_name}</div>
                <div className="text-xs text-base-content/45 mt-0.5">{fmtDateTime(o.created_at)}</div>
              </div>
              <span className="text-sm font-extrabold tabular-nums whitespace-nowrap">
                −{fmtNum(o.coin_price)} <span className="text-primary">коинов</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <Modal title="Подтверди покупку" onClose={() => !busy && setConfirm(null)}>
          <p className="text-sm text-base-content/60 mb-1.5">
            Купить <b className="text-base-content">«{confirm.name}»</b> за{' '}
            <b className="text-base-content">{fmtNum(confirm.coin_price)} коинов</b>?
          </p>
          <p className="text-xs text-base-content/45">
            Коины спишутся сразу, приз выдаст администратор филиала.
          </p>
          <div className="flex justify-end gap-2.5 mt-6">
            <button className="btn btn-ghost" onClick={() => setConfirm(null)} disabled={busy}>Отмена</button>
            <button className="btn btn-primary" onClick={buy} disabled={busy}>
              {busy ? <span className="loading loading-spinner loading-sm" /> : 'Купить'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
