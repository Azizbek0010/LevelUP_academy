import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesApi, type BranchItem } from '../../../shared/api/endpoints/branches';
import { ApiError } from '../../../shared/api/http';
import { Modal } from '../../../shared/ui/Modal';
import { toast } from '../../../shared/ui/Toast';

interface Props {
  open: boolean;
  onClose: () => void;
  editing: BranchItem | null;
}

interface FormState {
  name: string;
  address: string;
  phone: string;
}

const EMPTY: FormState = { name: '', address: '', phone: '' };

export function BranchFormModal({ open, onClose, editing }: Props): React.ReactElement {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!editing;

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setForm({ name: editing.name, address: editing.address ?? '', phone: editing.phone ?? '' });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

  const mut = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
      };
      return isEdit ? branchesApi.update(editing!.id, payload) : branchesApi.create(payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['branches'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(isEdit ? 'Филиал обновлён' : 'Филиал создан');
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.payload.message : 'Ошибка сохранения');
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Название обязательно'); return; }
    setError(null);
    mut.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Редактировать: ${editing?.name}` : 'Открыть новый филиал'}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Отмена</button>
          <button type="submit" form="branch-form" className="btn btn-primary btn-sm gap-1.5" disabled={mut.isPending}>
            {mut.isPending && <span className="loading loading-spinner loading-xs" />}
            Сохранить
          </button>
        </>
      }
    >
      <form id="branch-form" className="space-y-4" onSubmit={onSubmit}>
        <label className="form-control">
          <span className="label label-text">Название <span className="text-error">*</span></span>
          <input
            autoFocus
            className="input input-bordered"
            placeholder="Центральный (Мирзо-Улугбек)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>

        <label className="form-control">
          <span className="label label-text">Адрес</span>
          <input
            className="input input-bordered"
            placeholder="Ташкент, ул. Амира Темура, 108"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </label>

        <label className="form-control">
          <span className="label label-text">Телефон</span>
          <input
            type="tel"
            className="input input-bordered font-mono"
            placeholder="+998712001234"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <span className="label label-text-alt text-base-content/40">Формат: +998XXXXXXXXX</span>
        </label>

        {error && (
          <div role="alert" className="alert alert-error text-sm py-2">
            <span>{error}</span>
          </div>
        )}
      </form>
    </Modal>
  );
}
