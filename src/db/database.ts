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

const seedTaskRenames = [
  { from: 'うくれれ', to: 'ウクレレ', icon: '🎸' },
  { from: 'えいごれんしゅう', to: 'English', icon: '🔤' },
  { from: 'かんあぷり', to: 'Kahn', icon: '📱' },
  { from: 'かんじ', to: 'ポケモンかんじどり', icon: '✏️' },
  { from: 'こくごれんしゅう', to: 'こくごのえほん', icon: '📖' },
] as const;

const removedSeedTaskNames = ['おえかき'] as const;
const freeSeedTaskNames = ['すとれっち', 'えほん'] as const;

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
    this.version(4)
      .stores({
        taskMasters: 'id, name, createdAt',
        dailyBoardTasks: 'id, [date+taskMasterId], date, taskMasterId, quadrant',
        dailyPlanTasks: 'id, date, taskMasterId, boardTaskId, group, status',
        taskProgress: 'taskMasterId',
        completionHistory: 'id, [taskMasterId+date], date, taskMasterId',
        appState: 'id',
      })
      .upgrade(async (tx) => {
        const boardTasks = await tx.table<DailyBoardTask, string>('dailyBoardTasks').toArray();
        const boardById = new Map(boardTasks.map((task) => [task.id, task]));
        await tx.table<DailyPlanTask, string>('dailyPlanTasks').toCollection().modify((plan) => {
          const board = boardById.get(plan.boardTaskId);
          plan.displayName = plan.displayName || board?.displayName || 'たすく';
          plan.icon = plan.icon || board?.icon || '⭐';
        });
      });
    this.version(5)
      .stores({
        taskMasters: 'id, name, createdAt',
        dailyBoardTasks: 'id, [date+taskMasterId], date, taskMasterId, quadrant',
        dailyPlanTasks: 'id, date, taskMasterId, boardTaskId, group, status',
        taskProgress: 'taskMasterId',
        completionHistory: 'id, [taskMasterId+date], date, taskMasterId',
        appState: 'id',
      })
      .upgrade(async (tx) => {
        const now = new Date().toISOString();
        const taskMasters = tx.table<TaskMaster, string>('taskMasters');
        const dailyBoardTasks = tx.table<DailyBoardTask, string>('dailyBoardTasks');
        const dailyPlanTasks = tx.table<DailyPlanTask, string>('dailyPlanTasks');
        const taskProgress = tx.table<TaskProgress, string>('taskProgress');
        const completionHistory = tx.table<CompletionHistory, string>('completionHistory');

        for (const task of seedTaskRenames) {
          const existing = await taskMasters.where('name').equals(task.from).first();
          if (!existing) continue;
          await taskMasters.update(existing.id, {
            name: task.to,
            icon: task.icon,
            frequency: { type: 'free' },
            updatedAt: now,
          });
          await dailyBoardTasks.where('taskMasterId').equals(existing.id).modify((boardTask) => {
            boardTask.displayName = task.to;
            boardTask.icon = task.icon;
            boardTask.updatedAt = now;
          });
          await dailyPlanTasks.where('taskMasterId').equals(existing.id).modify((planTask) => {
            planTask.displayName = task.to;
            planTask.icon = task.icon;
            planTask.updatedAt = now;
          });
        }

        for (const name of freeSeedTaskNames) {
          const existing = await taskMasters.where('name').equals(name).first();
          if (existing) {
            await taskMasters.update(existing.id, { frequency: { type: 'free' }, updatedAt: now });
          }
        }

        for (const name of removedSeedTaskNames) {
          const removedTasks = await taskMasters.where('name').equals(name).toArray();
          for (const task of removedTasks) {
            await taskMasters.delete(task.id);
            await dailyBoardTasks.where('taskMasterId').equals(task.id).delete();
            await dailyPlanTasks.where('taskMasterId').equals(task.id).delete();
            await taskProgress.delete(task.id);
            await completionHistory.where('taskMasterId').equals(task.id).delete();
          }
        }

        const hasKumon = await taskMasters.where('name').equals('くもん').first();
        if (!hasKumon) {
          await taskMasters.add({
            id: seedTaskId('くもん'),
            name: 'くもん',
            icon: '📝',
            frequency: { type: 'free' },
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    this.version(6)
      .stores({
        taskMasters: 'id, name, createdAt',
        dailyBoardTasks: 'id, [date+taskMasterId], date, taskMasterId, quadrant',
        dailyPlanTasks: 'id, date, taskMasterId, boardTaskId, group, status',
        taskProgress: 'taskMasterId',
        completionHistory: 'id, [taskMasterId+date], date, taskMasterId',
        appState: 'id',
      })
      .upgrade(async (tx) => {
        const taskMasters = tx.table<TaskMaster, string>('taskMasters');
        const hasThinkThink = await taskMasters.where('name').equals('ThinkThink').first();
        if (!hasThinkThink) {
          const now = new Date().toISOString();
          await taskMasters.add({
            id: seedTaskId('ThinkThink'),
            name: 'ThinkThink',
            icon: '🎮',
            frequency: { type: 'free' },
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    this.version(7)
      .stores({
        taskMasters: 'id, name, createdAt',
        dailyBoardTasks: 'id, [date+taskMasterId], date, taskMasterId, quadrant',
        dailyPlanTasks: 'id, date, taskMasterId, boardTaskId, group, status',
        taskProgress: 'taskMasterId',
        completionHistory: 'id, [taskMasterId+date], date, taskMasterId',
        appState: 'id',
      })
      .upgrade(async (tx) => {
        const taskMasters = tx.table<TaskMaster, string>('taskMasters');
        const now = new Date().toISOString();
        const additions = [
          { name: 'しゅくだい', icon: '📘' },
          { name: 'がっこうのじゅんび', icon: '🏫' },
        ];
        for (const task of additions) {
          const existing = await taskMasters.where('name').equals(task.name).first();
          if (existing) continue;
          await taskMasters.add({
            id: seedTaskId(task.name),
            name: task.name,
            icon: task.icon,
            frequency: { type: 'free' },
            createdAt: now,
            updatedAt: now,
          });
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
