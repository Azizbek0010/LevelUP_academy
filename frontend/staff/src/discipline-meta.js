import { TriangleAlert, ShieldAlert, Coins, Ban } from 'lucide-react';

/**
 * Единый источник правды для 4 уровней дисциплины — используется и в панели
 * Super Admin (pages/super/Discipline.jsx: выдача взыскания, каталог правил,
 * графики), и в самопросмотре сотрудника (components/MyDiscipline.jsx). Раньше
 * MyDiscipline.jsx держал свою копию только с shtraf/qora — sariq/qizil там
 * тихо попадали в fallback и подписывались как «Штраф».
 *
 * От мягкого к жёсткому: sariq (жёлтое) → qizil (красное) → shtraf (деньги,
 * отдельная ось) → qora (увольнение). НЕ автоматика — количество sariq/qizil
 * нигде не считается порогом и не порождает qora само.
 */
export const TYPE_META = {
  sariq: { label: 'Жёлтое предупреждение', Icon: TriangleAlert, cls: 'bg-[#eab308]/10 text-[#b45309]', color: '#eab308' },
  qizil: { label: 'Красное предупреждение', Icon: ShieldAlert, cls: 'bg-error/10 text-error', color: '#dc2626' },
  shtraf: { label: 'Штраф', Icon: Coins, cls: 'bg-info/10 text-info', color: '#2563eb' },
  qora: { label: 'Увольнение', Icon: Ban, cls: 'bg-neutral text-neutral-content', color: '#111827' },
};
