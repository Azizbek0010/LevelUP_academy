import { useEffect, useState } from 'react';
import { ShoppingBag, Coins, Gift, History } from 'lucide-react';
import { api } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { Skeleton, EmptyState, Modal } from '../components/ui.jsx';
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
      <div className="page-head">
        <div>
          <h1>Магазин</h1>
          <p>Обменяй заработанные коины на призы</p>
        </div>
        {balance !== null && (
          <span className="pill pill--lime" style={{ fontSize: 14, padding: '9px 18px' }}>
            <Coins size={15} /> {fmtNum(balance)} коинов
          </span>
        )}
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={tab === 'items' ? 'active' : ''} onClick={() => setTab('items')}>
          Витрина
        </button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
          Мои покупки
        </button>
      </div>

      {tab === 'items' ? (
        !items ? (
          <Skeleton h={180} count={2} />
        ) : items.length === 0 ? (
          <div className="card">
            <EmptyState icon={ShoppingBag} title="Витрина пуста" text="Товары скоро появятся — копи коины!" />
          </div>
        ) : (
          <div className="shop-grid">
            {items.map((item) => {
              const affordable = balance === null || balance >= item.coin_price;
              return (
                <div key={item.id} className="shop-item">
                  <div className="shop-item__img">
                    {item.image_key ? <img src={item.image_key} alt="" /> : <Gift size={38} />}
                  </div>
                  <div className="shop-item__name">{item.name}</div>
                  <div className="shop-item__meta">
                    <span className="pill pill--lime num">
                      <Coins size={13} /> {fmtNum(item.coin_price)}
                    </span>
                    <span className="shop-item__stock num">осталось {item.stock}</span>
                  </div>
                  <button
                    className="btn btn--dark btn--sm"
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
        <div className="card">
          <EmptyState icon={History} title="Покупок пока нет" text="Всё заработанное — впереди." />
        </div>
      ) : (
        <div className="card">
          {orders.map((o) => (
            <div key={o.id} className="row">
              <div className="avatar" style={{ borderRadius: 10 }}>
                <Gift size={16} />
              </div>
              <div className="row__body">
                <div className="row__title">{o.item_name}</div>
                <div className="row__sub">{fmtDateTime(o.created_at)}</div>
              </div>
              <span className="row__score num">
                −{fmtNum(o.coin_price)} <span>коинов</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <Modal title="Подтверди покупку" onClose={() => !busy && setConfirm(null)}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14.5, marginBottom: 6 }}>
            Купить <b style={{ color: 'var(--text)' }}>«{confirm.name}»</b> за{' '}
            <b style={{ color: 'var(--text)' }}>{fmtNum(confirm.coin_price)} коинов</b>?
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Коины спишутся сразу, приз выдаст администратор филиала.
          </p>
          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={() => setConfirm(null)} disabled={busy}>
              Отмена
            </button>
            <button className="btn btn--accent" onClick={buy} disabled={busy}>
              {busy ? 'Покупаем…' : 'Купить'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
