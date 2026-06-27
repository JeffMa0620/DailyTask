import { ChangeEvent, useRef } from 'react';

interface ParentSettingsProps {
  onExportTasks: () => void;
  onImportTasks: (file: File) => void;
  onResetToday: () => void;
  onResetAll: () => void;
  onClose: () => void;
}

export function ParentSettings({ onExportTasks, onImportTasks, onResetToday, onResetAll, onClose }: ParentSettingsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onImportTasks(file);
    event.target.value = '';
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal parent-modal" role="dialog" aria-modal="true">
        <h2>おとなの せってい</h2>
        <p>きょうの ばしょや よていを なおせます。</p>
        <div className="settings-actions">
          <button type="button" onClick={onExportTasks}>
            だす
          </button>
          <button type="button" onClick={() => inputRef.current?.click()}>
            いれる
          </button>
          <input
            ref={inputRef}
            className="hidden-file-input"
            type="file"
            accept="application/json,.json"
            onChange={importFile}
          />
        </div>
        <div className="settings-actions">
          <button type="button" onClick={onResetToday}>
            きょうを けす
          </button>
          <button type="button" className="danger-button" onClick={onResetAll}>
            ぜんぶ けす
          </button>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            とじる
          </button>
        </div>
      </div>
    </div>
  );
}
