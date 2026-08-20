import { useEffect, useState } from 'react';
import { Megaphone, Building2, Clock3, UserRound } from 'lucide-react';
import { api } from '../api.js';

const dateTime = (value) => new Intl.DateTimeFormat('uz-UZ', {
  dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value));

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.announcements().then((r) => setItems(r.announcements || [])).finally(() => setLoading(false));
  }, []);

  return <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-7">
    <div><h1 className="text-2xl font-bold text-slate-900">Anonslar</h1><p className="mt-1 text-sm text-slate-500">O‘quv markazingizdan muhim xabarlar</p></div>
    {loading ? <div className="py-16 text-center text-slate-500">Yuklanmoqda...</div> : items.map((a) => <article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Megaphone size={21}/></div><div className="min-w-0 flex-1">{a.imageUrl && <img src={a.imageUrl} alt="" className="mb-4 max-h-96 w-full rounded-2xl object-cover"/>}<h2 className="font-bold text-slate-900">{a.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{a.body}</p><div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><UserRound size={13}/>{a.senderName || 'Markaz'}</span><span className="inline-flex items-center gap-1"><Building2 size={13}/>{a.branchName || 'Barcha filiallar'}</span><span className="inline-flex items-center gap-1"><Clock3 size={13}/>{dateTime(a.createdAt)}</span>{a.expiresAt && <span className="text-amber-700">Tugaydi: {dateTime(a.expiresAt)}</span>}</div></div></div>
    </article>)}
  </div>;
}
