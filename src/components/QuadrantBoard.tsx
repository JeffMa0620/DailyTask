import { DailyBoardTask, QUADRANTS } from '../domain/models';
import { Quadrant } from './Quadrant';

interface QuadrantBoardProps {
  tasks: DailyBoardTask[];
  onDeleteTask: (id: string) => void;
  onToggleSelected: (id: string) => void;
}

export function QuadrantBoard({ tasks, onDeleteTask, onToggleSelected }: QuadrantBoardProps) {
  return (
    <main className="board-panel">
      <div className="quadrant-grid">
        {QUADRANTS.map((quadrant) => (
          <Quadrant
            key={quadrant.type}
            config={quadrant}
            tasks={tasks.filter((task) => task.quadrant === quadrant.type)}
            onDeleteTask={onDeleteTask}
            onToggleSelected={onToggleSelected}
          />
        ))}
      </div>
    </main>
  );
}
