import { useState } from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import { Plus, Trash2, Pencil, DoorOpen, Users2 } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminSchedule, useAdminRooms, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { EmptyState, RowSkeleton } from '../mentor/_ui.jsx';

const DAYS = [
  { key: 'mon', label: 'Пн' }, { key: 'tue', label: 'Вт' }, { key: 'wed', label: 'Ср' },
  { key: 'thu', label: 'Чт' }, { key: 'fri', label: 'Пт' }, { key: 'sat', label: 'Сб' }, { key: 'sun', label: 'Вс' },
];
const NO_ROOM = '__none__';

function GroupBlock({ group, day, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${group.id}:${day}`,
    data: { groupId: group.id },
  });
  const slot = group.schedule.find((s) => s.day === day);
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`rounded-[8px] border border-primary/25 bg-primary/10 px-2 py-1 text-[11px] cursor-grab active:cursor-grabbing select-none ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-bold text-primary truncate">{group.name}</span>
        <button
          className="shrink-0 text-primary/50 hover:text-primary"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(group)}
        >
          <Pencil size={10} />
        </button>
      </div>
      <div className="text-primary/70">{slot?.start}–{slot?.end}</div>
      <div className="text-primary/50 truncate">{group.mentor.name}</div>
    </div>
  );
}

function RoomRow({ room, groups, onEdit }) {
  const { setNodeRef, isOver } = useDroppable({ id: room?.id ?? NO_ROOM });
  return (
    <div className={`grid grid-cols-[140px_repeat(7,1fr)] border-b border-base-300 last:border-b-0 ${isOver ? 'bg-primary/5' : ''}`}>
      <div className="p-3 flex items-center gap-2 border-r border-base-300 bg-base-100">
        <DoorOpen size={14} className="text-base-content/35 shrink-0" />
        <span className="text-[12px] font-bold text-base-content truncate">{room?.name ?? 'Без кабинета'}</span>
      </div>
      <div ref={setNodeRef} className="col-span-7 grid grid-cols-7 min-h-[64px]">
        {DAYS.map((d) => (
          <div key={d.key} className="border-r border-base-300 last:border-r-0 p-1.5 space-y-1">
            {groups
              .filter((g) => g.schedule.some((s) => s.day === d.key))
              .map((g) => (
                <GroupBlock key={`${g.id}:${d.key}`} group={g} day={d.key} onEdit={onEdit} />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditTimeModal({ group, onClose, onSaved }) {
  const { token } = useAuth();
  const [days, setDays] = useState(group.schedule.map((s) => s.day));
  const [startTime, setStartTime] = useState(group.schedule[0]?.start || '14:00');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const toggleDay = (key) => setDays((d) => (d.includes(key) ? d.filter((x) => x !== key) : [...d, key]));

  const save = async () => {
    if (days.length === 0) { setErr('Выберите хотя бы один день'); return; }
    setBusy(true); setErr('');
    try {
      await api.adminUpdateGroup(token, group.id, { days, startTime });
      onSaved();
    } catch (e) { setErr(e.message || 'Не удалось сохранить'); }
    finally { setBusy(false); }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box card bg-base-100 border border-base-300 max-w-sm">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-lg">{group.name}</h3>
          <button className="btn btn-ghost btn-sm btn-square -mt-1 -mr-1" onClick={onClose}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
        <p className="text-[12px] text-base-content/45 mb-4">Дни и время начала занятий</p>
        {err && <div className="alert alert-error py-2 text-sm mb-3">{err}</div>}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {DAYS.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`btn btn-xs ${days.includes(d.key) ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
              onClick={() => toggleDay(d.key)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <input
          type="time"
          className="input input-bordered w-full"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Отмена</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy && <span className="loading loading-spinner loading-xs" />} Сохранить
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}

export default function AdminSchedule() {
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const scheduleQ = useAdminSchedule();
  const roomsQ = useAdminRooms();

  const [editGroup, setEditGroup] = useState(null);
  const [newRoomOpen, setNewRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [activeGroupId, setActiveGroupId] = useState(null);

  const rooms = scheduleQ.data?.rooms || [];
  const groups = scheduleQ.data?.groups || [];

  const refreshAll = () => { invalidate(['admin-schedule']); invalidate(['admin-rooms']); };

  const groupsInRoom = (roomId) => groups.filter((g) => (roomId === NO_ROOM ? !g.roomId : g.roomId === roomId));

  const handleDragStart = (event) => {
    setActiveGroupId(event.active.data.current?.groupId ?? null);
  };

  const handleDragEnd = async (event) => {
    setActiveGroupId(null);
    const { active, over } = event;
    if (!over) return;
    const groupId = active.data.current?.groupId;
    const targetRoomId = over.id === NO_ROOM ? null : over.id;
    const group = groups.find((g) => g.id === groupId);
    if (!group || group.roomId === targetRoomId) return;
    setErr('');
    try {
      await api.adminUpdateGroup(token, groupId, { roomId: targetRoomId });
      refreshAll();
    } catch (e) { setErr(e.message || 'Не удалось перенести группу'); }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    setBusy(true); setErr('');
    try {
      await api.adminCreateRoom(token, {
        name: newRoomName.trim(),
        capacity: newRoomCapacity ? Number(newRoomCapacity) : undefined,
      });
      setNewRoomOpen(false); setNewRoomName(''); setNewRoomCapacity('');
      refreshAll();
    } catch (e) { setErr(e.message || 'Не удалось создать кабинет'); }
    finally { setBusy(false); }
  };

  const deleteRoom = async (room) => {
    if (!confirm(`Удалить кабинет «${room.name}»? Группы нужно сначала перенести в другой кабинет.`)) return;
    try {
      await api.adminDeleteRoom(token, room.id);
      refreshAll();
    } catch (e) { alert(e.message || 'Не удалось удалить кабинет'); }
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const loading = scheduleQ.isLoading || roomsQ.isLoading;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Расписание" subtitle="Перетащите группу в другой кабинет; время — через карандаш на карточке.">
        <button className="btn btn-primary btn-sm gap-1.5" onClick={() => setNewRoomOpen(true)}>
          <Plus size={16} /> Кабинет
        </button>
      </PageHeader>

      {err && <div className="alert alert-error py-2 text-sm">{err}</div>}

      {loading ? (
        <RowSkeleton count={4} height="h-16" />
      ) : rooms.length === 0 && groups.length === 0 ? (
        <EmptyState icon={DoorOpen} title="Пока нет ни кабинетов, ни групп" hint="Создайте кабинет и группы появятся на сетке по мере назначения" />
      ) : (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="card bg-base-100 border border-base-300 overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[140px_repeat(7,1fr)] border-b border-base-300 bg-base-200/40">
                <div className="p-2 text-[11px] font-bold text-base-content/45 uppercase border-r border-base-300">Кабинет</div>
                {DAYS.map((d) => (
                  <div key={d.key} className="p-2 text-[11px] font-bold text-base-content/45 uppercase text-center border-r border-base-300 last:border-r-0">
                    {d.label}
                  </div>
                ))}
              </div>

              {rooms.map((room) => (
                <div key={room.id} className="group/room relative">
                  <RoomRow room={room} groups={groupsInRoom(room.id)} onEdit={setEditGroup} />
                  <button
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded grid place-items-center text-base-content/25 hover:text-error hover:bg-error/10 opacity-0 group-hover/room:opacity-100 transition-opacity"
                    title="Удалить кабинет"
                    onClick={() => deleteRoom(room)}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}

              <RoomRow room={null} groups={groupsInRoom(NO_ROOM)} onEdit={setEditGroup} />
            </div>
          </div>

          <DragOverlay>
            {activeGroup && (
              <div className="rounded-[8px] border border-primary bg-base-100 shadow-lg px-2 py-1 text-[11px]">
                <span className="font-bold text-primary flex items-center gap-1"><Users2 size={11} /> {activeGroup.name}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {newRoomOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box card bg-base-100 border border-base-300 max-w-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg">Новый кабинет</h3>
              <button className="btn btn-ghost btn-sm btn-square -mt-1 -mr-1" onClick={() => setNewRoomOpen(false)}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
            </div>
            <div className="space-y-3">
              <input className="input input-bordered w-full" placeholder="Название (напр. 204)" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
              <input type="number" min="1" className="input input-bordered w-full" placeholder="Вместимость (необязательно)" value={newRoomCapacity} onChange={(e) => setNewRoomCapacity(e.target.value)} />
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setNewRoomOpen(false)} disabled={busy}>Отмена</button>
              <button className="btn btn-primary" onClick={createRoom} disabled={busy || !newRoomName.trim()}>
                {busy && <span className="loading loading-spinner loading-xs" />} Создать
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setNewRoomOpen(false)} />
        </dialog>
      )}

      {editGroup && (
        <EditTimeModal
          group={editGroup}
          onClose={() => setEditGroup(null)}
          onSaved={() => { setEditGroup(null); refreshAll(); }}
        />
      )}
    </div>
  );
}
