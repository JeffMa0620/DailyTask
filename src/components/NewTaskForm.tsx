import { FormEvent, useEffect, useState } from 'react';
import { validateKidText } from '../domain/validation';

interface NewTaskFormProps {
  onAdd: (name: string, icon?: string) => Promise<void>;
  resetSignal: number;
}

export function NewTaskForm({ onAdd, resetSignal }: NewTaskFormProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [error, setError] = useState<string>();

  useEffect(() => {
    setName('');
    setIcon('⭐');
    setError(undefined);
  }, [resetSignal]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextError = validateKidText(name);
    if (nextError) {
      setError(nextError);
      return;
    }
    await onAdd(name, icon);
    setName('');
    setIcon('⭐');
    setError(undefined);
  }

  return (
    <section className="side-section">
      <h2>あたらしい たすく</h2>
      <form className="new-task-form" onSubmit={submit}>
        <input
          aria-label="え"
          className="icon-input"
          value={icon}
          maxLength={4}
          onChange={(event) => setIcon(event.target.value)}
        />
        <input
          aria-label="なまえ"
          value={name}
          placeholder="なまえを いれてね"
          onChange={(event) => setName(event.target.value)}
        />
        <button type="submit">ついか</button>
      </form>
      {error ? <p className="soft-error">{error}</p> : null}
    </section>
  );
}
