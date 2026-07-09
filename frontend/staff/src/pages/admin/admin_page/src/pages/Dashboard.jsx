import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowTrendingUp, HiOutlineExclamationTriangle,
  HiOutlineBanknotes, HiOutlineCheckCircle,
  HiOutlineUserPlus, HiOutlineSquaresPlus,
  HiOutlineReceiptRefund, HiOutlineDocumentText,
  HiOutlineChatBubbleLeftRight, HiOutlineCalendarDays,
  HiOutlineClock,
} from 'react-icons/hi2';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import StatCard from '../components/StatCard.jsx';

// ==================== DATA ====================

const weeklyData = [
  { day: 'Dush', income: 4200000, outcome: 1800000 },
  { day: 'Sesh', income: 5600000, outcome: 2100000 },
  { day: 'Chor', income: 3800000, outcome: 1600000 },
  { day: 'Pay',  income: 7100000, outcome: 2500000 },
  { day: 'Juma', income: 4900000, outcome: 1900000 },
  { day: 'Shan', income: 6200000, outcome: 2200000 },
  { day: 'Yak',  income: 3500000, outcome: 1400000 },
];

const monthlyIncome = [
  { month: 'Yan', amount: 18200000 },
  { month: 'Fev', amount: 21500000 },
  { month: 'Mar', amount: 24800000 },
  { month: 'Apr', amount: 22600000 },
  { month: 'May', amount: 28900000 },
  { month: 'Iyun', amount: 32200000 },
  { month: 'Iyul', amount: 38200000 },
];

const recentPayments = [
  { id: 1, name: 'Abdulloh Karimov', amount: 1200000, date: 'Bugun 14:30', status: 'paid' },
  { id: 2, name: 'Malika Azizova', amount: 1200000, date: 'Bugun 12:15', status: 'paid' },
  { id: 3, name: 'Javohir Toshmatov', amount: 1500000, date: 'Kecha 16:45', status: 'pending' },
  { id: 4, name: 'Zarina Nurmatova', amount: 900000, date: 'Kecha 10:20', status: 'overdue' },
  { id: 5, name: 'Rustam Yuldashev', amount: 1200000, date: '03.07.2026', status: 'paid' },
];

// Backend API shu strukturada qaytaradi -> admin.service.js -> dashboard()
const MOCK = {
  totals: {
    revenue: 128_500_000,
    expenses: 42_300_000,
    profit: 86_200_000,
    outstandingDebt: 15_700_000,
    activeStudents: 342,
    groups: 18,
    overdueInvoices: 7,
    currency: 'UZS',
  },
  thisMonth: {
    revenue: 38_200_000,
    expenses: 12_600_000,
    profit: 25_600_000,
  },
};

// ==================== HELPERS ====================

function fm(n) {
  if (n === undefined || n === null) return '0';
  return Number(n).toLocaleString('uz-UZ');
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white dark:bg-[#141914] rounded-[12px] px-3 py-2 text-[11px] shadow-lg border border-[var(--border)]">
      <p className="font-bold text-[var(--text)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tabular-nums">
          {p.name}: {fm(p.value)} so'm
        </p>
      ))}
    </div>
  );
}

// ==================== COMPONENT ====================

export default function Dashboard() {
  const navigate = useNavigate();
  const d = useMemo(() => MOCK, []);
  const { revenue, expenses, profit, outstandingDebt: debt, activeStudents, groups: groupCount, overdueInvoices } = useMemo(() => d.totals, [d]);
  const m = useMemo(() => d.thisMonth, [d]);
  const weeklyTotal = useMemo(() => weeklyData.reduce((s, r) => s + r.income, 0), []);

  return (
    <div className="space-y-5">

      {/* ===== 4 ta StatCard ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-in stagger-1">
          <StatCard
            title="Umumiy daromad"
            value={`${fm(revenue)} so'm`}
            delta={12.5}
            deltaLabel="shu oy"
            icon={<HiOutlineArrowTrendingUp className="w-4 h-4" />}
            color="#10B981"
          />
        </div>
        <div className="animate-fade-in stagger-2">
          <StatCard
            title="Qarzdorliklar"
            value={`${fm(debt)} so'm`}
            delta={8.3}
            deltaLabel="shu oy"
            icon={<HiOutlineExclamationTriangle className="w-4 h-4" />}
            color="#F59E0B"
          />
        </div>
        <div className="animate-fade-in stagger-3">
          <StatCard
            title="Xarajatlar"
            value={`${fm(expenses)} so'm`}
            delta={3.2}
            deltaLabel="shu oy"
            icon={<HiOutlineBanknotes className="w-4 h-4" />}
            color="#EF4444"
          />
        </div>
        <div className="animate-fade-in stagger-4">
          <StatCard
            title="Sof foyda"
            value={`${fm(profit)} so'm`}
            delta={18.7}
            deltaLabel="marja"
            icon={<HiOutlineCheckCircle className="w-4 h-4" />}
            color="#3B82F6"
          />
        </div>
      </div>

      {/* ===== Chart + Summary ko'rsatkichlar ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* Bar chart */}
        <div className="glass-strong rounded-[20px] card-hover-premium p-5 animate-slide-up stagger-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-extrabold text-[var(--text)]">Daromad dinamikasi</h2>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Haftalik kirim va chiqim</p>
            </div>
            <select name="chart-period" className="text-[10px] font-semibold text-[var(--text-secondary)] bg-[var(--bg)] border border-[var(--border)] rounded-[8px] px-2.5 py-1.5 outline-none hover:border-[var(--green)] focus:border-[var(--green)] transition-colors cursor-pointer">
              <option>Bu hafta</option>
              <option>Bu oy</option>
            </select>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name="Kirim" radius={[6, 6, 0, 0]} barSize={24} fill="#10B981" cursor="pointer" isAnimationActive={false} />
                <Bar dataKey="outcome" name="Chiqim" radius={[6, 6, 0, 0]} barSize={24} fill="#EF4444" cursor="pointer" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
              <span className="w-3 h-3 rounded-full bg-[#10B981]" /> Kirim
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]" /> Chiqim
            </div>
            <div className="ml-auto text-[10px] text-[var(--text-muted)]">
              Jami: <strong className="text-[var(--text)]">{fm(weeklyTotal)} so'm</strong>
            </div>
          </div>
        </div>

        {/* Summary list */}
        <div className="glass-strong rounded-[20px] card-hover-premium p-5 animate-slide-up stagger-3">
          <h2 className="text-[14px] font-bold text-[var(--text)] mb-1">Ko'rsatkichlar</h2>
          <p className="text-[10px] text-[var(--text-muted)] mb-4">Filial bo'yicha jami</p>
          <div className="space-y-2">
            {[
              { label: 'Faol talabalar', value: `${fm(activeStudents)} ta`, color: '#10B981' },
              { label: 'Guruhlar', value: `${fm(groupCount)} ta`, color: '#3B82F6' },
              { label: "Muddat o'tgan to'lovlar", value: `${fm(overdueInvoices)} ta`, color: overdueInvoices > 0 ? '#EF4444' : '#10B981' },
              { label: 'Shu oy daromadi', value: `${fm(m.revenue)} so'm`, color: '#10B981' },
              { label: 'Shu oy xarajati', value: `${fm(m.expenses)} so'm`, color: '#EF4444' },
              { label: 'Shu oy foydasi', value: `${fm(m.profit)} so'm`, color: '#3B82F6' },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-[12px] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-default">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">{r.label}</span>
                <span className="text-[13px] font-bold tabular-nums" style={{ color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Monthly chart + Payments ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">

        <div className="glass-strong rounded-[20px] card-hover-premium p-5 animate-slide-up stagger-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[14px] font-bold text-[var(--text)]">Oylik tushum</h2>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">7 oylik ko'rsatkich</p>
            </div>
            <HiOutlineCalendarDays className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyIncome} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C6FF34" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#C6FF34" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" name="Tushum" stroke="#C6FF34" strokeWidth={2.5} fill="url(#monthlyGrad)" dot={{ fill: '#C6FF34', stroke: 'var(--bg)', strokeWidth: 2, r: 4, cursor: 'pointer' }} activeDot={{ r: 6, fill: '#C6FF34', stroke: 'var(--bg)', strokeWidth: 3, cursor: 'pointer' }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent payments */}
        <div className="glass-strong rounded-[20px] card-hover-premium p-5 animate-slide-up stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-[var(--text)]">Oxirgi to'lovlar</h2>
            <button className="text-[10px] font-bold text-[var(--green)] hover:underline transition-colors">Hammasi</button>
          </div>
          <div className="space-y-1">
            {recentPayments.map((p) => {
              const colors = {
                paid: { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: "To'landi" },
                pending: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', label: 'Kutilmoqda' },
                overdue: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', label: "Muddati o'tgan" },
              };
              const c = colors[p.status] || colors.pending;
              return (
                <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-[12px] hover:bg-[var(--surface-hover)] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: c.bg }}>
                      <HiOutlineCheckCircle className="w-4 h-4" style={{ color: c.text }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[var(--text)] truncate">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <HiOutlineClock className="w-3 h-3 text-[var(--text-muted)]" />
                        <span className="text-[10px] text-[var(--text-muted)]">{p.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-[12px] font-bold text-[var(--text)] tabular-nums">{fm(p.amount)} so'm</p>
                    <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-[6px] mt-0.5" style={{ background: c.bg, color: c.text }}>{c.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Quick actions ===== */}
      <div className="glass-strong rounded-[20px] card-hover-premium p-5 animate-slide-up stagger-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-bold text-[var(--text)]">Tezkor amallar</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { icon: HiOutlineUserPlus, label: "Talaba qo'shish", bg: '#C6FF34', txt: '#141B10', path: '/students' },
            { icon: HiOutlineSquaresPlus, label: 'Guruh yaratish', bg: '#D8EDB0', txt: '#1D2417', path: '/groups' },
            { icon: HiOutlineCheckCircle, label: "To'lov qabul qilish", bg: '#C8F0E0', txt: '#1D2417', path: '/payments' },
            { icon: HiOutlineReceiptRefund, label: 'Xarajat kiritish', bg: '#F5E6C8', txt: '#1D2417', path: '/expenses' },
            { icon: HiOutlineDocumentText, label: 'Hisobot', bg: '#D0DCF0', txt: '#1D2417', path: '/reports' },
            { icon: HiOutlineChatBubbleLeftRight, label: 'Chat', bg: '#E2EDC8', txt: '#1D2417', path: '/chat' },
          ].map((b, i) => {
            const Icon = b.icon;
            return (                <button key={i}
                onClick={() => navigate(b.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-[16px] border transition-all duration-200 hover:translate-y-[-4px] hover:shadow-[0_12px_40px_var(--shadow-lg),0_0_0_1px_var(--green)_inset] active:scale-[0.98] group"
                style={{ background: b.bg, color: b.txt, borderColor: 'var(--border)' }}
              >
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-center leading-tight">{b.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
