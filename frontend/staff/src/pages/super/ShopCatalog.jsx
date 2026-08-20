import { useState } from 'react';
import { Plus, Gift, Pencil, Archive, ArchiveRestore, Coins } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useSuperShopItems, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Card, EmptyState, Modal, RowSkeleton } from './_ui.jsx';

const emptyForm = { id: null, name: '', imageKey: '', coinPrice: '' };

export default function SuperShopCatalog() {
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const itemsQ = useSuperShopItems();

  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const items = itemsQ.data?.items || [];
  const openCreate = () => { setForm({ ...emptyForm }); setErr(''); };
  const openEdit = (item) => {
    setForm({
      id: item.id, name: item.name,
      imageKey: item.image_key || '', coinPrice: String(item.coin_price),
    });
    setErr('');
  };

  const save = async () => {
    setBusy(true); setErr('');
    try {
      if (form.id) {
        await api.superUpdateShopItem(token, form.id, {
          name: form.name.trim(), imageKey: form.imageKey.trim() || undefined,
          coinPrice: Number(form.coinPrice),
        });
      } else {
        await api.superCreateShopItem(token, {
          name: form.name.trim(),
          imageKey: form.imageKey.trim() || undefined, coinPrice: Number(form.coinPrice),
        });
      }
      setForm(null);
      invalidate(['super-shop-items']);
    } catch (e) { setErr(e.message || 'Не удалось сохранить товар'); }
    finally { setBusy(false); }
  };

  const toggleArchived = async (item) => {
    try {
      await api.superSetShopItemArchived(token, item.id, !item.is_archived);
      invalidate(['super-shop-items']);
    } catch (e) { alert(e.message || 'Не удалось изменить статус'); }
  };

  const valid = form && form.name.trim() && form.coinPrice !== '' && Number(form.coinPrice) > 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Магазин" subtitle="Единый каталог организации: товар SEO автоматически появляется во всех филиалах.">
        <button className="btn btn-primary btn-sm gap-1.5" onClick={openCreate}>
          <Plus size={16} /> Новый товар
        </button>
      </PageHeader>

      {itemsQ.isLoading ? (
        <RowSkeleton count={4} />
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <EmptyState icon={Gift} title="Пока нет товаров" hint="Создайте первый товар — он появится во всех филиалах организации" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-base-200 grid place-items-center shrink-0 overflow-hidden">
                  {item.image_key ? (
                    <img src={item.image_key} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Gift size={20} className="text-base-content/35" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-base-content truncate">{item.name}</div>
                  <div className="text-[11px] text-success font-medium">Все филиалы · {item.branch_count} филиалов</div>
                  <div className="flex items-center gap-1 text-[11px] text-base-content/60 mt-1">
                    <Coins size={11} className="text-warning" /> {item.coin_price} · общий остаток {item.total_stock}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <button className="btn btn-ghost btn-xs gap-1" onClick={() => openEdit(item)}>
                  <Pencil size={12} /> Изменить
                </button>
                <button className="btn btn-ghost btn-xs gap-1" onClick={() => toggleArchived(item)}>
                  {item.is_archived ? <><ArchiveRestore size={12} /> Вернуть</> : <><Archive size={12} /> В архив</>}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Изменить товар' : 'Новый товар'}
        className="max-w-sm border border-base-300"
        actions={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setForm(null)} disabled={busy}>Отмена</button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={busy || !valid}>
              {busy && <span className="loading loading-spinner loading-xs" />} Сохранить
            </button>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            {err && <div className="alert alert-error py-2 text-sm">{err}</div>}
            {!form.id && <div className="alert alert-info py-2 text-xs">Товар автоматически появится во всех филиалах. Остаток каждый филиал ведёт отдельно.</div>}
            <input className="input input-bordered w-full" placeholder="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input input-bordered w-full" placeholder="Ссылка на фото (необязательно)" value={form.imageKey} onChange={(e) => setForm({ ...form, imageKey: e.target.value })} />
            <input type="number" min="1" className="input input-bordered w-full" placeholder="Цена, коины" value={form.coinPrice} onChange={(e) => setForm({ ...form, coinPrice: e.target.value })} />
          </div>
        )}
      </Modal>
    </div>
  );
}
