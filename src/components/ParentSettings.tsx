interface ParentSettingsProps {
  onResetToday: () => void;
  onResetAll: () => void;
  onClose: () => void;
}

export function ParentSettings({ onResetToday, onResetAll, onClose }: ParentSettingsProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal parent-modal" role="dialog" aria-modal="true">
        <h2>おとなの せってい</h2>
        <p>きょうの ばしょや よていを なおせます。</p>
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
