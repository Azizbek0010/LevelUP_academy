import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../auth.jsx';
import { Building2, Globe, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useSuperOrganization, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { dateShort } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis } from '../../components/Skeleton.jsx';

const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/;

const settingsSchema = z.object({
  name: z.string().trim().min(2, 'Мин. 2 символа').max(160),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(domainRegex, 'Неверный формат (например, levelup.uz)')
    .or(z.literal('')),
});

export default function SuperSettings() {
  const { token } = useAuth();
  const { data, isLoading, error } = useSuperOrganization();
  const invalidate = useInvalidate();
  const [successMsg, setSuccessMsg] = useState('');
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);

  const org = data?.organization;

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name: org?.name || '', domain: org?.domain || '' },
    values: org ? { name: org.name || '', domain: org.domain || '' } : undefined,
  });

  const onSubmit = async (formData) => {
    setBusy(true);
    setServerErr('');
    try {
      await api.superUpdateOrganization(token, {
        name: formData.name.trim(),
        domain: formData.domain.trim() || null,
      });
      invalidate('super-organization');
      setSuccessMsg('Настройки сохранены!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      setServerErr(e.message || 'Ошибка сохранения');
    } finally {
      setBusy(false);
    }
  };

  if (error && error.status !== 401)
    return <div className="alert alert-error text-sm"><span>{error.message}</span></div>;

  if (isLoading || !org) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader title="Настройки организации" subtitle="Профиль учебного центра и параметры системы" />
        <SkeletonKpis count={2} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Настройки организации" subtitle="Профиль учебного центра и параметры системы" />

      {successMsg && (
        <div className="alert alert-success text-sm flex items-center gap-2">
          <CheckCircle2 size={16} /><span>{successMsg}</span>
        </div>
      )}
      {serverErr && (
        <div className="alert alert-error text-sm"><span>{serverErr}</span></div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="md:col-span-1">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-5 items-center text-center">
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Building2 size={36} className="text-primary" />
              </div>
              <h2 className="text-lg font-bold mt-3">{org.name}</h2>
              <div className="flex items-center gap-1 text-xs text-base-content/50 mt-1">
                <Globe size={12} /><span>{org.domain || 'домен не привязан'}</span>
              </div>
              <div className="divider my-3" />
              <div className="w-full space-y-3 text-left text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-base-content/50">Статус:</span>
                  <span className={`badge badge-sm ${org.status === 'active' ? 'badge-success' : 'badge-ghost'}`}>
                    {org.status === 'active' ? 'Активен' : org.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/50">Создана:</span>
                  <span className="font-semibold">{dateShort(org.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form + Security */}
        <div className="md:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-6">
              <h2 className="text-base font-bold mb-4">Основные настройки</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <label className="form-control w-full">
                  <span className="label-text mb-1.5 font-medium">Название организации *</span>
                  <input
                    {...register('name')}
                    placeholder="LevelUp Academy"
                    className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                  />
                  {errors.name && <span className="text-xs text-error mt-1">{errors.name.message}</span>}
                </label>
                <label className="form-control w-full">
                  <span className="label-text mb-1.5 font-medium">Собственный домен</span>
                  <div className="relative">
                    <input
                      {...register('domain')}
                      placeholder="levelup.uz"
                      className={`input input-bordered w-full pl-9 ${errors.domain ? 'input-error' : ''}`}
                    />
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                  </div>
                  <span className="text-[11px] text-base-content/40 mt-1">
                    Домен для брендирования кабинетов студентов и преподавателей.
                  </span>
                  {errors.domain && <span className="text-xs text-error mt-1">{errors.domain.message}</span>}
                </label>
                <div className="flex justify-end pt-4">
                  <button type="submit" className="btn btn-primary" disabled={!isDirty || busy}>
                    {busy && <span className="loading loading-spinner loading-sm" />}
                    Сохранить изменения
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-6">
              <h2 className="text-base font-bold mb-2 flex items-center gap-2">
                <ShieldCheck size={18} /> Лицензия и лимиты
              </h2>
              <p className="text-xs text-base-content/50 leading-relaxed">
                Для продления или изменения тарифа обратитесь к Main Admin.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
                <div className="p-3.5 bg-base-200/50 rounded-xl space-y-1">
                  <div className="font-bold">Лимит филиалов</div>
                  <div className="text-base-content/50">
                    {org.plan?.branchLimit ? `${org.plan.branchLimit} филиалов` : 'Без ограничений'}
                  </div>
                </div>
                <div className="p-3.5 bg-base-200/50 rounded-xl space-y-1">
                  <div className="font-bold">Дисковое пространство</div>
                  <div className="text-base-content/50">{org.plan?.diskSpace || '500 ГБ'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
