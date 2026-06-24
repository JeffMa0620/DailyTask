import { TaskFrequency } from '../domain/models';

interface FrequencyEditorProps {
  value: TaskFrequency;
  onChange: (value: TaskFrequency) => void;
}

export function FrequencyEditor({ value, onChange }: FrequencyEditorProps) {
  return (
    <fieldset className="frequency-editor">
      <legend>どれくらい</legend>
      <label>
        <input
          type="radio"
          checked={value.type === 'daily'}
          onChange={() => onChange({ type: 'daily' })}
        />
        <span>まいにち</span>
      </label>
      <label>
        <input
          type="radio"
          checked={value.type === 'weekly'}
          onChange={() => onChange({ type: 'weekly', timesPerWeek: 3 })}
        />
        <span>しゅうに</span>
      </label>
      {value.type === 'weekly' ? (
        <select
          value={value.timesPerWeek}
          onChange={(event) => onChange({ type: 'weekly', timesPerWeek: Number(event.target.value) })}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((count) => (
            <option key={count} value={count}>
              {count}かい
            </option>
          ))}
        </select>
      ) : null}
      <label>
        <input
          type="radio"
          checked={value.type === 'free'}
          onChange={() => onChange({ type: 'free' })}
        />
        <span>じゆう</span>
      </label>
    </fieldset>
  );
}
