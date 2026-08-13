import { useState } from 'react';
import {
  MapPin, Phone, Building2, Landmark, Send, Check, Copy,
} from 'lucide-react';
import { fmt, money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Panel } from '../mentor/_ui.jsx';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import { useBranchManagerInfo, useBranchManagerTelegramStatus } from '../../queries.js';

function InfoRow({ Icon, label, value, href }) {
  const inner = (
    <>
      <span className="w-9 h-9 rounded-xl grid place-items-center bg-primary/10 text-primary shrink-0">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-base-content/45">
          {label}
        </span>
        <span className="block text-[14px] font-semibold text-base-content truncate">
          {value || '—'}
        </span>
      </span>
    </>
  );
  const cls = 'flex items-center gap-3 p-3 rounded-xl hover:bg-base-200/60 transition-colors';
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** Ota-onalar guruhini Telegram-botga ulash. Bot guruhga QO'LDA qo'shiladi
 * (Branch Manager o'zi qiladi — botni tashqaridan avtomatik qo'shib bo'lmaydi),
 * so'ng kod guruhning o'ziga /bindbranch <kod> buyrug'i sifatida yuboriladi. */
function TelegramGroupCard() {
  const { token, user } = useAuth();
  // Karis (13.08.2026): Main Admin не включил Telegram-интеграцию партнёру —
  // карточки не должно быть вообще, не только кнопки внутри неё.
  const tgEnabled = Boolean(user?.orgFeatures?.telegramIntegration);
  // Хук ниже не умеет condition-fetch — вызываем его всегда (правило хуков),
  // но пока фича выключена, просто не рендерим карточку с его данными.
  const { data: status, isLoading, refetch } = useBranchManagerTelegramStatus();
  const [issuing, setIssuing] = useState(false);
  const [code, setCode] = useState(null);

  if (!tgEnabled) return null;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  async function issueCode() {
    setIssuing(true);
    setError(null);
    try {
      const res = await api.branchManagerTelegramBindToken(token);
      setCode(res.data);
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIssuing(false);
    }
  }

  async function unlink() {
    if (!window.confirm("Guruh bilan ulanishni uzmoqchimisiz?")) return;
    await api.branchManagerTelegramUnlink(token);
    setCode(null);
    refetch();
  }

  function copyCommand() {
    if (!code) return;
    navigator.clipboard.writeText(`/bindbranch ${code.token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isLoading) return null;

  if (status?.linked) {
    return (
      <Panel title="Ota-onalar guruhi (Telegram)" icon={Send} bodyClass="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-success font-semibold">
            <Check size={18} /> Guruh ulangan
          </div>
          <button type="button" className="btn btn-sm btn-ghost text-error" onClick={unlink}>
            Uzish
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Ota-onalar guruhi (Telegram)" icon={Send} bodyClass="p-5">
      {!code ? (
        <>
          <p className="text-sm text-base-content/60 mb-3">
            Davomat va o'zlashtirish haqida xabarlar shu guruhga avtomatik ketadi.
            Avval botni guruhga qo'shing, keyin ulash kodini oling.
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={issueCode} disabled={issuing}>
            {issuing ? 'Yuklanmoqda...' : 'Ulash kodini olish'}
          </button>
          {error && <p className="text-error text-sm mt-2">{error}</p>}
        </>
      ) : (
        <div className="space-y-3">
          <ol className="text-sm text-base-content/70 list-decimal list-inside space-y-1">
            <li>
              Guruhga botni qo'shing: <b>@{code.botUsername}</b>
            </li>
            <li>Guruhning o'ziga quyidagi buyruqni yuboring:</li>
          </ol>
          <div className="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2 font-mono text-sm">
            <span className="flex-1 select-all">/bindbranch {code.token}</span>
            <button type="button" className="btn btn-xs btn-ghost" onClick={copyCommand}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-xs text-base-content/45">Kod {Math.round(code.expiresIn / 60)} daqiqa amal qiladi.</p>
        </div>
      )}
    </Panel>
  );
}

export default function BranchManagerBranch() {
  const { data: branch, isLoading, error } = useBranchManagerInfo();

  if (isLoading) return <div className="p-8 text-center text-base-content/45">Yuklanmoqda...</div>;
  if (error) return <div className="p-8 text-center text-error">Xatolik yuz berdi</div>;
  if (!branch) return <div className="p-8 text-center text-base-content/45">Ma'lumot topilmadi</div>;

  const s = branch.stats;

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title="Filial" subtitle={`${branch.name} · joylashuv va statistika`} />

      {/* ── Bosh karta ── */}
      <Panel title="Filial haqida" icon={Building2} bodyClass="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl grid place-items-center bg-primary/15 text-primary">
              <Landmark size={22} />
            </span>
            <h3 className="text-lg font-extrabold text-base-content">{branch.name}</h3>
          </div>
          {branch.isMain && <span className="badge badge-primary badge-lg">Asosiy filial</span>}
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="rounded-xl border border-base-200 p-4">
            <dt className="text-[11px] text-base-content/45">Talabalar</dt>
            <dd className="text-2xl font-extrabold tabular-nums mt-1">{fmt(s.students)}</dd>
          </div>
          <div className="rounded-xl border border-base-200 p-4">
            <dt className="text-[11px] text-base-content/45">Guruhlar</dt>
            <dd className="text-2xl font-extrabold tabular-nums mt-1">{fmt(s.groups)}</dd>
          </div>
          <div className="rounded-xl border border-base-200 p-4">
            <dt className="text-[11px] text-base-content/45">Mentorlar</dt>
            <dd className="text-2xl font-extrabold tabular-nums mt-1">{fmt(s.mentors)}</dd>
          </div>
          <div className="rounded-xl border border-base-200 p-4">
            <dt className="text-[11px] text-base-content/45">Qarzdorlik</dt>
            <dd className={`text-2xl font-extrabold tabular-nums mt-1 ${s.debt > 0 ? 'text-error' : ''}`}>
              {money(s.debt)}
            </dd>
          </div>
        </dl>
      </Panel>

      {/* ── Telegram: ota-onalar guruhi ── */}
      <TelegramGroupCard />

      {/* ── Kontaktlar ── */}
      <Panel title="Kontaktlar" icon={MapPin} bodyClass="p-5">
        <div className="space-y-1">
          <InfoRow Icon={MapPin} label="Manzil" value={branch.address} />
          <InfoRow Icon={Phone} label="Telefon" value={branch.phone} href={branch.phone ? `tel:${branch.phone.replace(/\s/g, '')}` : undefined} />
        </div>
      </Panel>

      {/* ── Moliya ── */}
      <Panel title="Moliya (jami)" icon={Building2} bodyClass="p-5">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <dt className="text-[11px] text-base-content/45">Daromad</dt>
            <dd className="text-xl font-extrabold tabular-nums mt-1 text-success">{money(s.revenue)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-base-content/45">Xarajat</dt>
            <dd className="text-xl font-extrabold tabular-nums mt-1">{money(s.expenses)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-base-content/45">Foyda</dt>
            <dd className={`text-xl font-extrabold tabular-nums mt-1 ${s.profit >= 0 ? 'text-success' : 'text-error'}`}>
              {money(s.profit)}
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
