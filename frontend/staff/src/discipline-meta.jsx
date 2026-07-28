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
 *
 * Только label + color, без иконки и цветной плашки: серьёзный учебный центр,
 * не набор стикеров (см. Dot ниже — везде рисуем закрашенный кружок цвета, а
 * не иконку в цветном бейдже).
 */
export const TYPE_META = {
  sariq: { label: 'Жёлтое предупреждение', color: '#eab308' },
  qizil: { label: 'Красное предупреждение', color: '#dc2626' },
  shtraf: { label: 'Штраф', color: '#2563eb' },
  qora: { label: 'Увольнение', color: '#111827' },
};

/** Цветной маркер уровня — просто закрашенный кружок, без иконок и плашек. */
export function Dot({ color, size = 9 }) {
  return (
    <span
      className="rounded-full shrink-0 inline-block"
      style={{ width: size, height: size, background: color }}
    />
  );
}
