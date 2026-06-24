import Dexie, { Table } from 'dexie';
import {
  AppState,
  CompletionHistory,
  DailyBoardTask,
  DailyPlanTask,
  TaskMaster,
  TaskProgress,
} from '../domain/models';
import { todayKey } from '../domain/date';
import { seedTasks } from './seedData';

function seedTaskId(name: string): string {
  return `seed-${name}`;
}

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
    this.version(2)
      .stores({
        taskMasters: 'id, name, createdAt',
        dailyBoardTasks: 'id, [date+taskMasterId], date, taskMasterId, quadrant',
        dailyPlanTasks: 'id, date, taskMasterId, boardTaskId, group, status',
        taskProgress: 'taskMasterId',
        completionHistory: 'id, [taskMasterId+date], date, taskMasterId',
        appState: 'id',
      })
      .upgrade(async (tx) => {
        const boardTasks = tx.table<DailyBoardTask, string>('dailyBoardTasks');
        await boardTasks.toCollection().modify((task) => {
          task.selectedForToday = task.selectedForToday ?? false;
        });
      });
    this.version(3)
      .stores({
        taskMasters: 'id, name, createdAt',
        dailyBoardTasks: 'id, [date+taskMasterId], date, taskMasterId, quadrant',
        dailyPlanTasks: 'id, date, taskMasterId, boardTaskId, group, status',
        taskProgress: 'taskMasterId',
        completionHistory: 'id, [taskMasterId+date], date, taskMasterId',
        appState: 'id',
      })
      .upgrade(async (tx) => {
        const seedNames = new Set(seedTasks.map((task) => task.name));
        const masters = await tx.table<TaskMaster, string>('taskMasters').toArray();
        const boardTasks = await tx.table<DailyBoardTask, string>('dailyBoardTasks').toArray();
        const planTasks = await tx.table<DailyPlanTask, string>('dailyPlanTasks').toArray();
        const referencedIds = new Set([
          ...boardTasks.map((task) => task.taskMasterId),
          ...planTasks.map((task) => task.taskMasterId),
        ]);

        for (const seedName of seedNames) {
          const duplicates = masters
            .filter((task) => task.name === seedName)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          const unreferencedDuplicates = duplicates
            .slice(1)
            .filter((task) => !referencedIds.has(task.id));
          for (const duplicate of unreferencedDuplicates) {
            await tx.table<TaskMaster, string>('taskMasters').delete(duplicate.id);
          }
        }
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
        id: seedTaskId(task.name),
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
