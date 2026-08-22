import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Trash2, Building2, Globe2, Clock3, UserRound, Sparkles } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { api, uploadToPresignedUrl } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';

const targets = {
  'all-students': 'O‘quvchilar',
  'all-families': 'O‘quvchilar va ota-onalar',
  'all-parents': 'Ota-onalar',
  'all-staff': 'Barcha xodimlar',
  'all-admins': 'Adminlar',
  'all-mentors': 'Mentorlar',
};
const roles = { seo: 'SEO', branch_manager: 'Manager', admin: 'Admin', mentor: 'Mentor' };
const defaultExpiry = () => {
  const d = new Date(Date.now() + 86400000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const emptyDetails = () => ({ eventDateTime: '', location: '', mapUrl: '', contact: '', extra: '' });

export default function Announcements() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const isSeo = user?.role === 'seo';
  const canCreate = isSeo || user?.role === 'branch_manager';
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', targetType: 'all-families', scope: 'all', branchId: '', expiresAt: defaultExpiry(), details: emptyDetails(), imageUrl: '', imageKey: '' });
  const [imageUploading, setImageUploading] = useState(false);
  const key = ['announcements', user?.role];
  const list = useQuery({ queryKey: key, queryFn: () => isSeo ? api.superAnnouncements(token) : api.branchAnnouncements(token), enabled: !!token });
  const branches = useQuery({ queryKey: ['super-branches'], queryFn: () => api.superBranches(token), enabled: !!token && isSeo });
  const items = list.data?.items ?? list.data?.announcements ?? [];
  const branchItems = branches.data?.branches ?? branches.data?.items ?? [];
  const create = useMutation({
    mutationFn: () => {
      const payload = { title: form.title, body: form.body, targetType: form.targetType, expiresAt: new Date(form.expiresAt).toISOString(), imageUrl: form.imageUrl || null, imageKey: form.imageKey || null };
      if (isSeo) payload.branchId = form.scope === 'branch' ? form.branchId : null;
      return isSeo ? api.superCreateAnnouncement(token, payload) : api.branchCreateAnnouncement(token, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); setOpen(false); setForm({ title: '', body: '', targetType: 'all-families', scope: 'all', branchId: '', expiresAt: defaultExpiry(), details: emptyDetails(), imageUrl: '', imageKey: '' }); setSuggestion(null); },
  });
  const remove = useMutation({ mutationFn: (id) => api.superDeleteAnnouncement(token, id), onSuccess: () => qc.invalidateQueries({ queryKey: key }) });
  const improve = useMutation({
    mutationFn: () => {
      const payload = { title: form.title, body: form.body, targetType: form.targetType, expiresAt: new Date(form.expiresAt).toISOString(), details: form.details };
      if (isSeo) payload.branchId = form.scope === 'branch' ? form.branchId : null;
      return isSeo ? api.superImproveAnnouncement(token, payload) : api.branchImproveAnnouncement(token, payload);
    },
    onSuccess: (data) => setSuggestion(data.suggestion),
  });
  const submit = (e) => { e.preventDefault(); if (form.title.trim() && form.body.trim() && (!isSeo || form.scope === 'all' || form.branchId)) create.mutate(); };

  return <div className="space-y-6">
    <PageHeader title="Anonslar" subtitle="Filiallar bo‘yicha e’lonlar tarixi va Telegram tarqatmalari" />
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
      <div><div className="font-semibold text-slate-900">{items.length} ta anons</div><div className="text-sm text-slate-500">Admin faqat kuzatadi. Muallif va yaratilgan vaqt saqlanadi.</div></div>
      {canCreate && <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"><Plus size={17}/> Anons yaratish</button>}
    </div>

    {list.isLoading ? <div className="py-16 text-center text-slate-500">Yuklanmoqda...</div> : list.isError ? <div className="rounded-xl bg-red-50 p-4 text-red-700">Anonslarni yuklab bo‘lmadi</div> : items.length === 0 ?
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center"><Megaphone className="mx-auto mb-3 text-slate-400"/><div className="font-semibold">Hozircha anons yo‘q</div></div> :
      <div className="space-y-3">{items.map((a) => <article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Megaphone size={21}/></div><div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-base font-bold text-slate-900">{a.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{a.body}</p></div>{isSeo && <button title="O‘chirish" onClick={() => remove.mutate(a.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17}/></button>}</div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><UserRound size={14}/>{a.senderName || 'Noma’lum'} · {roles[a.senderRole] || a.senderRole || '—'}</span>
            <span className="inline-flex items-center gap-1.5">{a.branchId ? <Building2 size={14}/> : <Globe2 size={14}/>} {a.branchName || 'Barcha filiallar'}</span>
            <span>{targets[a.targetType] || a.targetType}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 size={14}/>{new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(a.createdAt))}</span>
            {a.expiresAt && <span className="text-amber-700">Tugaydi: {new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(a.expiresAt))}</span>}
          </div>
        </div></div>
      </article>)}</div>}

    {open && <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/45 p-3 sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}><div className="flex min-h-full items-start justify-center sm:items-center"><form onSubmit={submit} className="my-2 w-full max-w-xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-2xl bg-white p-5 shadow-2xl sm:my-0 sm:max-h-[calc(100dvh-3rem)] sm:p-6">
      <h2 className="text-xl font-bold text-slate-900">Yangi anons</h2>
      {isSeo ? <div className="mt-5"><div className="mb-2 text-sm font-semibold text-slate-700">Bugun qaysi filiallarga xabar berasiz?</div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setForm({...form, scope:'all', branchId:''})} className={`rounded-xl border p-3 text-sm ${form.scope==='all'?'border-emerald-600 bg-emerald-50 text-emerald-800':'border-slate-200'}`}>Barcha filiallar</button><button type="button" onClick={() => setForm({...form, scope:'branch'})} className={`rounded-xl border p-3 text-sm ${form.scope==='branch'?'border-emerald-600 bg-emerald-50 text-emerald-800':'border-slate-200'}`}>Bitta aniq filial</button></div>{form.scope==='branch' && <select value={form.branchId} onChange={(e)=>setForm({...form,branchId:e.target.value})} className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5" required><option value="">Filialni tanlang</option>{branchItems.map((b)=><option key={b.id} value={b.id}>{b.name}</option>)}</select>}</div> : <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Anons faqat sizning filialingizga yuboriladi.</div>}
      <label className="mt-4 block text-sm font-semibold text-slate-700">Kim uchun?</label><select value={form.targetType} onChange={(e)=>setForm({...form,targetType:e.target.value})} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"><option value="all-families">O‘quvchilar va ota-onalar</option><option value="all-students">Faqat o‘quvchilar</option><option value="all-parents">Faqat ota-onalar</option>{isSeo && <><option value="all-staff">Barcha xodimlar</option><option value="all-admins">Adminlar</option><option value="all-mentors">Mentorlar</option></>}</select>
      <label className="mt-4 block text-sm font-semibold text-slate-700">Sarlavha</label><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} maxLength={200} required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"/>
      <label className="mt-4 block text-sm font-semibold text-slate-700">Xabar</label><textarea value={form.body} onChange={(e)=>setForm({...form,body:e.target.value})} maxLength={4000} rows={6} required className="mt-1 w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5"/>
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Rasm linki <span className="font-normal text-slate-400">— ixtiyoriy</span><input type="url" value={form.imageUrl} onChange={(e)=>setForm({...form,imageUrl:e.target.value,imageKey:''})} placeholder="https://..." className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"/></label><label className="text-sm font-semibold text-slate-700">Yoki rasm fayli <span className="font-normal text-slate-400">— ixtiyoriy</span><input type="file" accept="image/*" disabled={imageUploading} onChange={async(e)=>{const file=e.target.files?.[0];if(!file)return;setImageUploading(true);try{const data=isSeo?await api.superAnnouncementImageUploadUrl(token,file.name,file.type):await api.branchAnnouncementImageUploadUrl(token,file.name,file.type);await uploadToPresignedUrl(data.uploadUrl,file);setForm({...form,imageKey:data.imageKey,imageUrl:''});}catch(err){alert(err.message||'Rasm yuklanmadi');}finally{setImageUploading(false);}}} className="mt-1 block w-full text-xs font-normal"/>{imageUploading && <span className="mt-1 block text-xs text-emerald-700">Rasm yuklanmoqda...</span>}{form.imageKey && <span className="mt-1 block text-xs text-emerald-700">Rasm yuklandi ✓</span>}</label></div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="font-semibold text-slate-800">AI uchun aniq ma’lumotlar <span className="font-normal text-slate-400">(ixtiyoriy)</span></div><p className="mt-1 text-xs text-slate-500">Faqat bilganingizni kiriting. Bu maydonlarning hech biri majburiy emas.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Tadbir sana va vaqti <span className="font-normal text-slate-400">— ixtiyoriy</span><input type="datetime-local" value={form.details.eventDateTime} onChange={(e)=>setForm({...form,details:{...form.details,eventDateTime:e.target.value}})} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-semibold text-slate-600">Joylashuv <span className="font-normal text-slate-400">— ixtiyoriy</span><input value={form.details.location} onChange={(e)=>setForm({...form,details:{...form.details,location:e.target.value}})} placeholder="Manzil yoki maydon nomi" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-semibold text-slate-600">Xarita havolasi <span className="font-normal text-slate-400">— ixtiyoriy</span><input type="url" value={form.details.mapUrl} onChange={(e)=>setForm({...form,details:{...form.details,mapUrl:e.target.value}})} placeholder="https://..." className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-semibold text-slate-600">Aloqa <span className="font-normal text-slate-400">— ixtiyoriy</span><input value={form.details.contact} onChange={(e)=>setForm({...form,details:{...form.details,contact:e.target.value}})} placeholder="Telefon yoki mas’ul shaxs" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"/></label></div><label className="mt-3 block text-xs font-semibold text-slate-600">Qo‘shimcha shartlar <span className="font-normal text-slate-400">— ixtiyoriy</span><textarea value={form.details.extra} onChange={(e)=>setForm({...form,details:{...form.details,extra:e.target.value}})} placeholder="Kiyim, kimlar qatnashadi, nimalar olib kelish kerak..." rows={2} className="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"/></label></div>
      <button type="button" disabled={improve.isPending || (!form.title.trim() && !form.body.trim()) || (isSeo && form.scope === 'branch' && !form.branchId)} onClick={() => improve.mutate()} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 disabled:opacity-50"><Sparkles size={16}/>{improve.isPending ? 'AI yaxshilamoqda...' : 'AI bilan yaxshilash'}</button>
      {improve.error && <p className="mt-2 text-sm text-red-600">{improve.error.message}</p>}
      {suggestion && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4"><div className="flex items-center gap-2 font-bold text-emerald-900"><Sparkles size={16}/> AI taklifi</div>{suggestion.questions?.length > 0 && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="text-sm font-bold text-amber-900">Aniqlashtirish kerak:</div><ul className="mt-1 list-disc pl-5 text-sm text-amber-800">{suggestion.questions.map((x,i)=><li key={i}>{x}</li>)}</ul><p className="mt-2 text-xs text-amber-700">Yuqoridagi maydonlarni to‘ldirib, AI tugmasini yana bosing.</p></div>}<div className="mt-3 text-sm font-bold text-slate-900">{suggestion.title}</div><div className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-700">{suggestion.body}</div>{suggestion.changes?.length > 0 && <ul className="mt-3 list-disc pl-5 text-xs text-slate-500">{suggestion.changes.map((x,i)=><li key={i}>{x}</li>)}</ul>}<div className="mt-4 flex gap-2"><button type="button" onClick={() => { setForm({...form,title:suggestion.title,body:suggestion.body}); setSuggestion(null); }} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Taklifni qo‘llash</button><button type="button" onClick={() => setSuggestion(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Rad etish</button></div></div>}
      <label className="mt-4 block text-sm font-semibold text-slate-700">Qachon tugaydi?</label><input type="datetime-local" value={form.expiresAt} onChange={(e)=>setForm({...form,expiresAt:e.target.value})} required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"/>
      {create.error && <p className="mt-3 text-sm text-red-600">{create.error.message}</p>}
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2.5">Bekor qilish</button><button disabled={create.isPending} className="rounded-xl bg-emerald-700 px-5 py-2.5 font-semibold text-white disabled:opacity-60">{create.isPending?'Yuborilmoqda...':'Yaratish va yuborish'}</button></div>
    </form></div></div>}
  </div>;
}
