import {
  MapPin, Phone, Building2, Landmark,
} from 'lucide-react';
import { fmt, money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Panel } from '../mentor/_ui.jsx';
import { useBranchManagerInfo } from '../../queries.js';

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
