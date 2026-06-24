import Dexie, { Table } from 'dexie';
import {
  AppState,
  CompletionHistory,
  DailyBoardTask,
  DailyPlanTask,
  TaskMaster,
  TaskProgress,
} from '../domain/models';
import { makeId } from '../domain/id';
import { todayKey } from '../domain/date';
import { seedTasks } from './seedData';

export class PlannerDatabase extends Dexie {
  taskMasters!: Table<TaskMaster, string>;
  dailyBoardTasks!: Table<DailyBoardTask, string>;
  dailyPlanTasks!: Table<DailyPlanTask, string>;
  taskProgress!: Table<TaskProgress, string>;
  completionHistory!: Table<CompletionHistory, string>;
  appState!: Table<AppState, string>;

  constructor(name = 'kids-task-planner') {
    super(name);
    this.version(1).stores({
      taskMasters: 'id, name',
      dailyBoardTasks: 'id, [date+taskMasterId], date, taskMasterId, quadrant',
      dailyPlanTasks: 'id, date, taskMasterId, boardTaskId, group, status',
      taskProgress: 'taskMasterId',
      completionHistory: 'id, [taskMasterId+date], date, taskMasterId',
      appState: 'id',
    });
  }
}

export const db = new PlannerDatabase();

export async function seedInitialData(database: PlannerDatabase = db, date = todayKey()) {
  const now = new Date().toISOString();
  const count = await database.taskMasters.count();
  if (count === 0) {
    await database.taskMasters.bulkAdd(
      seedTasks.map((task) => ({
        id: makeId('master'),
        name: task.name,
        icon: task.icon,
        frequency: task.frequency,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  const state = await database.appState.get('singleton');
  if (!state) {
    await database.appState.put({ id: 'singleton', currentDate: date, planGenerated: false });
  }
}
