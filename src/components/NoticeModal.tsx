interface NoticeModalProps {
  message: string;
  onClose: () => void;
}

export function NoticeModal({ message, onClose }: NoticeModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true">
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            もどる
          </button>
        </div>
      </div>
    </div>
  );
}
