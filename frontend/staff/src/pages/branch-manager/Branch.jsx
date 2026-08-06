import {
  MapPin, Phone, Mail, Clock, Building2, User as UserIcon,
  ExternalLink, Navigation, CalendarDays, Landmark,
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
          {value}
        </span>
      </span>
    </>
  );
  const cls = 'flex items-center gap-3 p-3 rounded-xl hover:bg-base-200/60 transition-colors';
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
      <ExternalLink size={13} className="ml-auto text-base-content/25 shrink-0" />
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export default function BranchManagerBranch() {
  const { data, isLoading, error } = useBranchManagerInfo();
  const branch = data?.branch;

  if (isLoading) return <div className="p-8 text-center text-base-content/45">Yuklanmoqda...</div>;
  if (error) return <div className="p-8 text-center text-error">Xatolik yuz berdi</div>;
  if (!branch) return <div className="p-8 text-center text-base-content/45">Ma'lumot topilmadi</div>;

  const s = branch.stats;

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title="Filial" subtitle={`${branch.name} · joylashuv va kontaktlar`} />

      {/* ── Bosh karta ── */}
      <Panel title="Filial haqida" icon={Building2} bodyClass="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl grid place-items-center bg-primary/15 text-primary">
              <Landmark size={22} />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-base-content">{branch.name}</h3>
              <p className="text-[12px] text-base-content/50">
                {branch.founded} dan beri ishlaydi
              </p>
            </div>
          </div>
          <span className="badge badge-primary badge-lg">Asosiy filial</span>
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
            <dt className="text-[11px] text-base-content/45">Xodimlar</dt>
            <dd className="text-2xl font-extrabold tabular-nums mt-1">{fmt(s.staff)}</dd>
          </div>
          <div className="rounded-xl border border-base-200 p-4">
            <dt className="text-[11px] text-base-content/45">Qarzdorlik</dt>
            <dd className={`text-2xl font-extrabold tabular-nums mt-1 ${s.debt > 0 ? 'text-error' : ''}`}>
              {money(s.debt)}
            </dd>
          </div>
        </dl>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Joylashuv ── */}
        <Panel title="Joylashuv" icon={MapPin} bodyClass="p-5">
          {/* Xarita placeholder — real xarita keyinchalik backend/xarita API bilan */}
          <div
            className="relative h-44 rounded-2xl overflow-hidden border border-base-200 bg-base-200/60"
            style={{
              backgroundImage:
                'linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          >
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full grid place-items-center bg-primary text-primary-content shadow-lg animate-pulse">
              <Navigation size={20} />
            </span>
            <span className="absolute bottom-3 left-3 text-[11px] font-semibold text-base-content/60 bg-base-100/90 backdrop-blur rounded-lg px-2.5 py-1.5">
              {branch.coords}
            </span>
          </div>

          <div className="mt-4 space-y-1">
            <InfoRow
              Icon={MapPin}
              label="Manzil"
              value={branch.address}
              href={branch.mapUrl}
            />
            <InfoRow
              Icon={Phone}
              label="Telefon"
              value={branch.phone}
              href={`tel:${BRANCH.phone.replace(/\s/g, '')}`}
            />
            <InfoRow Icon={Clock} label="Ish vaqti" value={branch.workHours} />
            <InfoRow Icon={CalendarDays} label="Ochilgan" value={branch.founded} />
          </div>
        </Panel>

        {/* ── Kontaktlar va rahbar ── */}
        <Panel title="Kontaktlar" icon={Building2} bodyClass="p-5">
          <div className="space-y-1">
            <InfoRow Icon={Mail} label="Email" value={branch.email} href={`mailto:${branch.email}`} />
            <InfoRow Icon={Phone} label="Telegram" value={branch.telegram} href="https://t.me" />
          </div>

          <div className="mt-5 pt-5 border-t border-base-200">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-3">
              Filial rahbari
            </h4>
            <div className="flex items-center gap-3 rounded-xl border border-base-200 p-4">
              <span className="w-11 h-11 rounded-full grid place-items-center bg-primary/15 text-primary font-bold text-base shrink-0">
                {branch.manager.firstName[0]}
                {branch.manager.lastName[0]}
              </span>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-base-content truncate">
                  {branch.manager.firstName} {branch.manager.lastName}
                </div>
                <div className="text-[12px] text-base-content/50 flex items-center gap-1">
                  <UserIcon size={12} /> Branch Manager
                </div>
              </div>
              <a
                href={`tel:${BRANCH.manager.phone.replace(/\s/g, '')}`}
                className="btn btn-ghost btn-xs text-primary gap-1 ml-auto shrink-0"
              >
                <Phone size={13} /> {branch.manager.phone}
              </a>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
