import { TaskMaster } from '../domain/models';
import { TaskProgress } from '../domain/models';
import { TaskCard } from './TaskCard';

interface CommonTaskListProps {
  tasks: TaskMaster[];
  addedTaskIds: Set<string>;
  progress: TaskProgress[];
  onEdit: (task: TaskMaster) => void;
  onDelete: (task: TaskMaster) => void;
}

export function CommonTaskList({ tasks, addedTaskIds, progress, onEdit, onDelete }: CommonTaskListProps) {
  return (
    <section className="side-section common-section">
      <h2>いつもの たすく</h2>
      <div className="common-task-list">
        {tasks.map((task) => {
          const added = addedTaskIds.has(task.id);
          const progressRow = progress.find((row) => row.taskMasterId === task.id);
          return (
            <TaskCard
              key={task.id}
              id={task.id}
              dragId={`master:${task.id}`}
              icon={task.icon}
              name={task.name}
              note={added ? 'はいってる' : progressRow ? `${progressRow.totalCompletedCount}かい` : undefined}
              className={added ? 'is-added' : ''}
              actions={
                <>
                  <button className="tiny-button" type="button" onClick={() => onEdit(task)}>
                    なおす
                  </button>
                  <button className="tiny-button" type="button" onClick={() => onDelete(task)}>
                    けす
                  </button>
                </>
              }
            />
          );
        })}
      </div>
    </section>
  );
}
