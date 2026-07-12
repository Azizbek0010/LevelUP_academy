import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineInformationCircle, HiOutlineCheckCircle, HiOutlineArrowPath,
} from 'react-icons/hi2';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import {
  fetchSettings as apiFetchSettings,
  updateSettings as apiUpdateSettings,
} from '../services/adminService.js';

// ─── Branch settings — no backend /admin/settings endpoint yet ───
// TODO: Backend endpoint TBD. The form submits optimistically and will 404
// until the endpoint is implemented. Replace the entire form then.

export default function Settings() {
  const [formData, setFormData] = useState({
    branchName: '',
    address: '',
    phone: '',
    email: '',
    workingHours: '',
    timezone: 'Asia/Tashkent',
    currency: 'UZS',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(null); // null = unknown, true/false

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetchSettings();
      const s = data.settings || data.branch || data;
      if (s.branchName || s.name) {
        setFormData({
          branchName: s.branchName || s.name || '',
          address: s.address || '',
          phone: s.phone || '',
          email: s.email || '',
          workingHours: s.workingHours || '',
          timezone: s.timezone || 'Asia/Tashkent',
          currency: s.currency || 'UZS',
        });
      }
      setApiAvailable(true);
    } catch (err) {
      // Backend endpoint doesn't exist yet — that's expected
      console.warn('Settings API not available yet:', err.message);
      setApiAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiUpdateSettings({
        branchName: formData.branchName,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        workingHours: formData.workingHours,
        timezone: formData.timezone,
        currency: formData.currency,
      });
      setSuccess('Sozlamalar muvaffaqiyatli saqlandi');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Save settings failed:', err);
      setError(err.response?.data?.message || err.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="glass-strong rounded-[20px] p-12 flex flex-col items-center justify-center">
        <HiOutlineArrowPath className="w-8 h-8 text-[var(--text-muted)] animate-spin mb-3" />
        <p className="text-[13px] text-[var(--text-secondary)]">Sozlamalar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API not available banner */}
      {apiAvailable === false && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-[12px] text-[12px] font-semibold"
          style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <HiOutlineInformationCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Backend API mavjud emas</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              /admin/settings endpoint i hali yaratilmagan. Ma'lumotlar faqat frontendda saqlanadi
              va sahifa yangilanganda yo'qoladi. Backend tayyor bo'lgach, ushbu forma ishlaydi.
            </p>
          </div>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-[12px] font-semibold"
          style={{ background: 'rgba(46,204,113,0.12)', color: '#2ECC71', border: '1px solid rgba(46,204,113,0.2)' }}
        >
          <HiOutlineCheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-[12px] font-semibold"
          style={{ background: 'rgba(232,84,62,0.12)', color: '#E8543E', border: '1px solid rgba(232,84,62,0.2)' }}
        >
          <HiOutlineInformationCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-70 transition-opacity">
            <HiOutlineArrowPath className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Branch Information */}
      <div className="glass-strong rounded-[20px] p-6">
        <h3 className="text-[14px] font-extrabold text-[var(--text)] mb-1">Filial ma'lumotlari</h3>
        <p className="text-[11px] text-[var(--text-secondary)] mb-5">
          Ushbu filialning asosiy ma'lumotlarini o'zgartiring
        </p>

        <div className="space-y-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Input
              label="Filial nomi"
              value={formData.branchName}
              onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
              placeholder="LevelUp Academy — Chilonzor"
            />
            <Input
              label="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+998 71 200 00 00"
            />
          </div>
          <Input
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="chilonzor@levelup.uz"
          />
          <Input
            label="Manzil"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Chilonzor tumani, Navoiy ko'chasi, 12-uy"
          />
          <Input
            label="Ish vaqti"
            value={formData.workingHours}
            onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
            placeholder="Du — Shu: 09:00 — 21:00"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div className="mb-3.5">
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-[0.06em]">Vaqt zonasi</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full h-10 px-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none focus:border-[var(--green)] transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238FA283' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                <option value="Asia/Samarkand">Asia/Samarkand (UTC+5)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
              </select>
            </div>
            <div className="mb-3.5">
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-[0.06em]">Valyuta</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full h-10 px-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none focus:border-[var(--green)] transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238FA283' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                <option value="UZS">UZS (so'm)</option>
                <option value="USD">USD ($)</option>
                <option value="RUB">RUB (₽)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => loadSettings()} disabled={saving}>
            Qayta yuklash
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !formData.branchName.trim()}>
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </div>
      </div>

      {/* Danger Zone — TODO */}
      <div className="glass-strong rounded-[20px] p-6" style={{ borderColor: 'rgba(232,84,62,0.2)' }}>
        <h3 className="text-[14px] font-extrabold text-[var(--danger)] mb-1">Xavfli zona</h3>
        <p className="text-[11px] text-[var(--text-secondary)] mb-4">
          Filialni o'chirish yoki arxivlash — bu amallarni qaytarib bo'lmaydi
        </p>
        <div className="flex items-center gap-3">
          <Button variant="danger" size="sm" disabled>
            Filialni arxivlash
          </Button>
          <Button variant="ghost" size="sm" disabled className="text-[var(--danger)]">
            Filialni o'chirish
          </Button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-3">
          {/* TODO: Backend endpoint for archive/delete branch — currently disabled */}
          Bu amallar hali mavjud emas. Backend tayyor bo'lgach ishga tushadi.
        </p>
      </div>
    </div>
  );
}
