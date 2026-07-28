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

/** Цветной маркер уровня — закрашенный кружок с лёгкой тенью для объёма
    (плоский однотонный круг на белой карточке выглядел дёшево), без иконок
    и цветных плашек вокруг. */
export function Dot({ color, size = 10 }) {
  return (
    <span
      className="rounded-full shrink-0 inline-block"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${color} 70%, white), ${color})`,
        boxShadow: `0 1px 2px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.06)`,
      }}
    />
  );
}
