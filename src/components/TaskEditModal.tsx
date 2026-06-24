import { FormEvent, useState } from 'react';
import { TaskFrequency, TaskMaster } from '../domain/models';
import { validateKidText } from '../domain/validation';
import { FrequencyEditor } from './FrequencyEditor';

interface TaskEditModalProps {
  task: TaskMaster;
  onSave: (changes: Pick<TaskMaster, 'name' | 'icon' | 'frequency'>) => void;
  onClose: () => void;
}

export function TaskEditModal({ task, onSave, onClose }: TaskEditModalProps) {
  const [name, setName] = useState(task.name);
  const [icon, setIcon] = useState(task.icon);
  const [frequency, setFrequency] = useState<TaskFrequency>(task.frequency);
  const [error, setError] = useState<string>();

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextError = validateKidText(name);
    if (nextError) {
      setError(nextError);
      return;
    }
    onSave({ name: name.trim(), icon, frequency });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true">
        <h2>たすくを なおす</h2>
        <label>
          <span>え</span>
          <input value={icon} maxLength={4} onChange={(event) => setIcon(event.target.value)} />
        </label>
        <label>
          <span>なまえ</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <FrequencyEditor value={frequency} onChange={setFrequency} />
        {error ? <p className="soft-error">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            やめる
          </button>
          <button type="submit">しまう</button>
        </div>
      </form>
    </div>
  );
}
