import { ShieldAlert, Coins, Ban, ScrollText } from 'lucide-react';
import { useMyPenalties, useMyCharter } from '../queries.js';
import { money } from '../format.js';
import { Panel, EmptyState } from '../pages/mentor/_ui.jsx';

/**
 * K-DISC-FRONT: read-only дисциплина сотрудника (mentor/methodist) — свои
 * штрафы/увольнения и устав организации. Только просмотр: выписывает и
 * редактирует устав Super Admin (см. pages/super/Discipline.jsx), CAN_ISSUE
 * не даёт mentor/methodist никаких прав на запись.
 */

const TYPE_META = {
  shtraf: { label: 'Штраф', Icon: Coins, cls: 'bg-warning/10 text-warning' },
  qora: { label: 'Увольнение', Icon: Ban, cls: 'bg-error/10 text-error' },
};

const ROLE_LABEL = {
  admin: 'Администратор',
  superadmin: 'Super Admin',
};

function dateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MyDiscipline() {
  const { data: penaltiesData, isLoading: penaltiesLoading } = useMyPenalties();
  const { data: charterData, isLoading: charterLoading } = useMyCharter();

  const items = penaltiesData?.data ?? [];
  const charter = charterData?.data;
  const empty = !charter?.content?.trim();

  return (
    <div className="space-y-5">
      <Panel title="Мои взыскания" icon={ShieldAlert} bodyClass="p-0">
        {penaltiesLoading ? (
          <div className="p-4 space-y-2">
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Взысканий нет"
            hint="Хорошая новость: чистая история."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm tabular-nums">
              <thead>
                <tr>
                  <th>Вид</th>
                  <th className="text-right">Сумма</th>
                  <th>Причина</th>
                  <th>Кто выписал</th>
                  <th>Когда</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const meta = TYPE_META[p.type] ?? TYPE_META.shtraf;
                  return (
                    <tr key={p.id} className="hover">
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${meta.cls}`}>
                          <meta.Icon size={12} /> {meta.label}
                        </span>
                      </td>
                      <td className="text-right font-semibold">
                        {p.amount == null ? '—' : money(Number(p.amount))}
                      </td>
                      <td className="max-w-xs"><span className="text-sm">{p.reason}</span></td>
                      <td className="text-sm text-base-content/60">
                        {ROLE_LABEL[p.issuer_role] ?? p.issuer_role ?? '—'}
                      </td>
                      <td className="text-xs text-base-content/55 whitespace-nowrap">
                        {dateTime(p.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title={charter?.title || 'Устав организации'} icon={ScrollText}>
        {charterLoading ? (
          <div className="skeleton h-32 w-full rounded-xl" />
        ) : empty ? (
          <EmptyState
            icon={ScrollText}
            title="Устав ещё не написан"
            hint="Организация пока не опубликовала правила."
          />
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap text-base-content/75 leading-relaxed">
              {charter.content}
            </p>
            {charter.updated_at && (
              <p className="text-xs text-base-content/40 mt-4 pt-3 border-t border-base-200">
                Обновлён {dateTime(charter.updated_at)}
              </p>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
