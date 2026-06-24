import { useDroppable } from '@dnd-kit/core';
import { DailyBoardTask, QuadrantConfig } from '../domain/models';
import { TaskCard } from './TaskCard';

interface QuadrantProps {
  config: QuadrantConfig;
  tasks: DailyBoardTask[];
  onDeleteTask: (id: string) => void;
  onToggleSelected: (id: string) => void;
}

export function Quadrant({ config, tasks, onDeleteTask, onToggleSelected }: QuadrantProps) {
  const droppable = useDroppable({ id: `quadrant:${config.type}` });

  return (
    <section
      ref={droppable.setNodeRef}
      className={`quadrant ${config.className} ${droppable.isOver ? 'is-over' : ''}`}
      aria-label={`${config.icon} ${config.title}`}
    >
      <div className="quadrant-watermark" aria-hidden="true">
        {config.watermark}
      </div>
      <header className="quadrant-header">
        <span className="quadrant-icon">{config.icon}</span>
        <h2>{config.title}</h2>
      </header>
      <div className="quadrant-drop-hint">ここに おいてね</div>
      <div className="quadrant-tasks">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            id={task.id}
            dragId={`board:${task.id}`}
            icon={task.icon}
            name={task.displayName}
            className="sticky-note"
            actions={
              <>
                <button
                  className={`star-button ${task.selectedForToday ? 'is-selected' : ''}`}
                  type="button"
                  onClick={() => onToggleSelected(task.id)}
                  aria-label={task.selectedForToday ? 'きょう やるよ' : 'きょう やる'}
                >
                  <span aria-hidden="true">{task.selectedForToday ? '★' : '☆'}</span>
                  <span>{task.selectedForToday ? 'きょう やるよ' : 'きょう やる'}</span>
                </button>
                <button className="tiny-button" type="button" onClick={() => onDeleteTask(task.id)}>
                  けす
                </button>
              </>
            }
          />
        ))}
      </div>
    </section>
  );
}
