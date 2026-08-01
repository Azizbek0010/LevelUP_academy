import { useEffect, useState } from 'react';
import { ShoppingBag, Coins, Gift, History } from 'lucide-react';
import { api } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { PageHeader, Skeleton, EmptyState, ErrorState, Modal, Pill, Tabs, Button, CountUp, ConfettiBurst, IconTile, C } from '../components/ui.jsx';
import { fmtNum, fmtDateTime } from '../format.js';

export default function Shop() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [orders, setOrders] = useState(null);
  const [balance, setBalance] = useState(null);
  const [confirm, setConfirm] = useState(null); // товар для подтверждения
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('items');
  const [error, setError] = useState(null);
  const [celebrate, setCelebrate] = useState(0); // залп конфетти после удачной покупки

  const load = () => {
    setError(null);
    api.shopItems().then((d) => setItems(d.data)).catch((err) => { setError(err); toast(err.message, 'error'); });
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
      setCelebrate((k) => k + 1);
      load();
    } catch (err) {
      toast(err.status === 422 ? 'Не хватает коинов' : err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      {/* Залп конфетти после удачной покупки — виден поверх всей страницы */}
      <ConfettiBurst fireKey={celebrate} />
      <PageHeader
        title="Магазин"
        subtitle="Обменяй заработанные коины на призы"
        actions={
          balance !== null && (
            <Pill hue="lime" className="text-sm px-3.5 py-2">
              <Coins size={15} /> <CountUp value={balance} /> коинов
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
        error ? (
          <ErrorState message={error.message} onRetry={load} />
        ) : !items ? (
          <Skeleton h={180} count={2} />
        ) : items.length === 0 ? (
          <div className="k-card">
            <EmptyState icon={ShoppingBag} title="Витрина пуста" text="Товары скоро появятся — копи коины!" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, i) => {
              const affordable = balance === null || balance >= item.coin_price;
              return (
                <div
                  key={item.id}
                  className="k-pop-in k-card k-hover p-4 flex flex-col gap-3"
                  style={{ animationDelay: `${Math.min(i, 9) * 50}ms` }}
                >
                  <div className="h-28 rounded-2xl grid place-items-center overflow-hidden" style={{ background: C.bg }}>
                    {item.image_key
                      ? <img src={item.image_key} alt="" className="w-full h-full object-cover" />
                      : <IconTile icon={Gift} hue="violet" size={56} />}
                  </div>
                  <div className="font-extrabold text-[15px] flex-1 leading-snug" style={{ color: C.text }}>{item.name}</div>
                  <div className="flex items-center justify-between gap-2">
                    <Pill hue="lime" className="tabular-nums">
                      <Coins size={13} /> {fmtNum(item.coin_price)}
                    </Pill>
                    <span className="text-xs font-bold tabular-nums" style={{ color: C.muted }}>
                      осталось <CountUp value={item.stock} />
                    </span>
                  </div>
                  <Button
                    size="sm"
                    hue="lime"
                    className="w-full"
                    disabled={!affordable}
                    onClick={() => setConfirm(item)}
                  >
                    {affordable ? 'Купить' : 'Не хватает коинов'}
                  </Button>
                </div>
              );
            })}
          </div>
        )
      ) : !orders ? (
        <Skeleton h={64} count={3} />
      ) : orders.length === 0 ? (
        <div className="k-card">
          <EmptyState icon={History} title="Покупок пока нет" text="Всё заработанное — впереди." />
        </div>
      ) : (
        <div className="k-card divide-y" style={{ borderColor: C.line }}>
          {orders.map((o, i) => (
            <div
              key={o.id}
              className="k-pop-in flex items-center gap-3 px-4 py-3.5"
              style={{ animationDelay: `${Math.min(i, 9) * 50}ms` }}
            >
              <IconTile icon={Gift} hue="pink" size={42} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold truncate" style={{ color: C.text }}>{o.item_name}</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: C.muted }}>{fmtDateTime(o.created_at)}</div>
              </div>
              <span className="text-sm k-num whitespace-nowrap" style={{ color: C.text }}>
                −{fmtNum(o.coin_price)} <span style={{ color: C.limeDk }}>коинов</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <Modal title="Подтверди покупку" onClose={() => !busy && setConfirm(null)}>
          <p className="text-sm font-semibold mb-1.5" style={{ color: C.muted }}>
            Купить <b style={{ color: C.text }}>«{confirm.name}»</b> за{' '}
            <b style={{ color: C.text }}>{fmtNum(confirm.coin_price)} коинов</b>?
          </p>
          <p className="text-xs font-semibold" style={{ color: C.muted }}>
            Коины спишутся сразу, приз выдаст администратор филиала.
          </p>
          <div className="flex justify-end gap-2.5 mt-6">
            <button
              className="k-press-sm px-5 py-2.5 rounded-2xl text-[14.5px] font-extrabold"
              style={{ color: C.muted }}
              onClick={() => setConfirm(null)}
              disabled={busy}
            >
              Отмена
            </button>
            <Button hue="lime" onClick={buy} disabled={busy}>
              {busy ? <span className="loading loading-spinner loading-sm" /> : 'Купить'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
