import { useState } from 'react';
import { Plus, Check, X, Pencil, Trash2, Inbox, Package } from 'lucide-react';
import { useAddonPrices, useFeatureRequests, useInvalidate } from '../queries.js';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { money, dateShort } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonList } from '../components/Skeleton.jsx';

/**
 * Каталог платных фич — не фиксированный список (не только AI/Shop).
 * Main Admin заводит здесь любую новую фичу (название + цена), она сразу
 * становится тумблером на вкладке «Финансы» у любого партнёра
 * (OrgDetail.jsx). Партнёры сами не переключают — только просят (заявки
 * ниже), Main Admin решает.
 */
function NewFeatureForm({ token, invalidate }) {
  const [label, setLabel] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!label.trim() || price === '') return;
    setBusy(true);
    setErr('');
    try {
      await api.createAddonFeature(token, { label: label.trim(), price: Number(price) });
      setLabel('');
      setPrice('');
      invalidate('addonPrices');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2 p-4 bg-base-200/40 rounded-2xl">
      <div className="flex-1 min-w-[180px]">
        <label className="text-xs font-semibold text-base-content/50 mb-1 block">Название фичи</label>
        <input
          className="input input-bordered input-sm w-full"
          placeholder="напр. TG-бот, Скриншоты в чат"
          value={label} onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="w-40">
        <label className="text-xs font-semibold text-base-content/50 mb-1 block">Цена / мес, UZS</label>
        <input
          type="number" min="0" className="input input-bordered input-sm w-full"
          value={price} onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      {err && <div className="text-xs text-error basis-full">{err}</div>}
      <button type="submit" className="btn btn-sm bg-lime-400 hover:bg-lime-500 border-0 text-lime-950 gap-1.5" disabled={busy}>
        {busy ? <span className="loading loading-spinner loading-xs" /> : <><Plus size={14} /> Добавить</>}
      </button>
    </form>
  );
}

function CatalogRow({ feature, token, invalidate }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(feature.label);
  const [price, setPrice] = useState(feature.price);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.updateAddonFeature(token, feature.feature_key, { label, price: Number(price) });
      invalidate('addonPrices');
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async () => {
    setBusy(true);
    try {
      await api.deactivateAddonFeature(token, feature.feature_key);
      invalidate('addonPrices');
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 p-3 border border-base-200 rounded-xl">
        <input className="input input-bordered input-xs flex-1" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input type="number" min="0" className="input input-bordered input-xs w-28" value={price} onChange={(e) => setPrice(e.target.value)} />
        <button className="btn btn-xs btn-success" onClick={save} disabled={busy}><Check size={12} /></button>
        <button className="btn btn-xs btn-ghost" onClick={() => setEditing(false)}><X size={12} /></button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 border border-base-200 rounded-xl ${!feature.is_active ? 'opacity-40' : ''}`}>
      <div>
        <div className="font-semibold text-sm flex items-center gap-2">
          {feature.label}
          {!feature.is_active && <span className="badge badge-ghost badge-xs">снята с продажи</span>}
        </div>
        <div className="text-xs text-base-content/45 font-mono">{feature.feature_key} · {money(feature.price)}/мес</div>
      </div>
      {feature.is_active && (
        <div className="flex gap-1">
          <button className="btn btn-xs btn-ghost" onClick={() => setEditing(true)} title="Изменить"><Pencil size={13} /></button>
          <button className="btn btn-xs btn-ghost text-error" onClick={deactivate} disabled={busy} title="Снять с продажи"><Trash2 size={13} /></button>
        </div>
      )}
    </div>
  );
}

const REQUEST_TYPE_LABEL = { add: 'подключить', remove: 'отключить' };

function RequestRow({ request, token, invalidate }) {
  const [busy, setBusy] = useState(false);

  const decide = async (decision) => {
    setBusy(true);
    try {
      await api.decideFeatureRequest(token, request.id, decision);
      invalidate('featureRequests', 'dashboard', 'partnerFeatures');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border border-base-200 rounded-xl">
      <div>
        <div className="font-semibold text-sm">
          {request.organization_name} просит <span className="text-lime-700">{REQUEST_TYPE_LABEL[request.type]}</span> «{request.feature_label ?? request.feature_key}»
        </div>
        <div className="text-xs text-base-content/45">
          {request.requested_by_name} · {dateShort(request.created_at)}
          {request.note && <span> · «{request.note}»</span>}
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button className="btn btn-xs btn-success gap-1" onClick={() => decide('approve')} disabled={busy}><Check size={12} /> Одобрить</button>
        <button className="btn btn-xs btn-ghost text-error gap-1" onClick={() => decide('reject')} disabled={busy}><X size={12} /> Отклонить</button>
      </div>
    </div>
  );
}

export default function Features() {
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const { data: catalog, isLoading: catalogLoading } = useAddonPrices();
  const { data: pending, isLoading: pendingLoading } = useFeatureRequests('pending');

  return (
    <div className="space-y-8">
      <PageHeader title="Фичи" subtitle="Каталог платных фич и заявки партнёров на подключение/отключение" />

      <section className="space-y-3">
        <h2 className="font-bold text-sm flex items-center gap-2"><Inbox size={15} className="text-lime-600" /> Входящие заявки{pending?.length ? ` (${pending.length})` : ''}</h2>
        {pendingLoading ? (
          <SkeletonList count={2} />
        ) : !pending?.length ? (
          <div className="text-sm text-base-content/40 p-4 text-center border border-dashed border-base-200 rounded-2xl">Нет заявок</div>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => <RequestRow key={r.id} request={r} token={token} invalidate={invalidate} />)}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-sm flex items-center gap-2"><Package size={15} className="text-lime-600" /> Каталог</h2>
        <NewFeatureForm token={token} invalidate={invalidate} />
        {catalogLoading ? (
          <SkeletonList count={3} />
        ) : !catalog?.length ? (
          <div className="text-sm text-base-content/40 p-4 text-center">Каталог пуст</div>
        ) : (
          <div className="space-y-2">
            {catalog.map((f) => <CatalogRow key={f.feature_key} feature={f} token={token} invalidate={invalidate} />)}
          </div>
        )}
      </section>
    </div>
  );
}
