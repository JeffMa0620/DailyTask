import { CSSProperties } from 'react';
import type { ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';

interface TaskCardProps {
  id: string;
  icon: string;
  name: string;
  dragId?: string;
  note?: string;
  className?: string;
  actions?: ReactNode;
}

export function TaskCard({ id, icon, name, dragId, note, className = '', actions }: TaskCardProps) {
  const draggable = useDraggable({
    id: dragId ?? id,
    disabled: !dragId,
  });
  const style: CSSProperties = draggable.transform
    ? {
        transform: `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`,
      }
    : {};

  return (
    <div
      ref={draggable.setNodeRef}
      style={style}
      className={`task-card ${className} ${draggable.isDragging ? 'is-dragging' : ''}`}
      {...draggable.listeners}
      {...draggable.attributes}
    >
      <div className="task-card-main">
        <span className="task-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="task-name">{name}</span>
      </div>
      {note ? <span className="task-note">{note}</span> : null}
      {actions ? <div className="task-actions">{actions}</div> : null}
    </div>
  );
}
