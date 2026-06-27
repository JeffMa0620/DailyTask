import { useCallback, useEffect, useMemo, useState } from 'react';
import { db, seedInitialData } from '../db/database';
import { todayKey } from '../domain/date';
import { makeId } from '../domain/id';
import { hasDuplicateBoardTask, upsertDailyPlan } from '../domain/planRules';
import { calculateRollover, historyKey } from '../domain/dayRollover';
import { markPlanDone } from '../domain/progressRules';
import {
  AppState,
  DailyBoardTask,
  DailyPlanTask,
  QuadrantType,
  TaskFrequency,
  TaskMaster,
  TaskProgress,
} from '../domain/models';
import { getRotationSuggestion } from '../domain/rotationRules';
import { parseTaskMasterTransferFile } from '../domain/taskTransfer';

export interface DailyState {
  loading: boolean;
  error: string | undefined;
  currentDate: string;
  taskMasters: TaskMaster[];
  boardTasks: DailyBoardTask[];
  planTasks: DailyPlanTask[];
  progress: TaskProgress[];
  appState: AppState | undefined;
  reload: () => Promise<void>;
  addTaskMaster: (name: string, icon?: string) => Promise<void>;
  updateTaskMaster: (
    id: string,
    changes: Pick<TaskMaster, 'name' | 'icon' | 'frequency'>,
  ) => Promise<void>;
  deleteTaskMaster: (id: string, deleteTodayCopy: boolean) => Promise<void>;
  addBoardTask: (taskMasterId: string, quadrant: QuadrantType) => Promise<boolean>;
  moveBoardTask: (id: string, quadrant: QuadrantType) => Promise<void>;
  toggleBoardTaskSelected: (id: string) => Promise<{ selected: boolean; suggestion?: string } | undefined>;
  deleteBoardTask: (id: string) => Promise<void>;
  generatePlan: () => Promise<boolean>;
  markDone: (planTaskId: string) => Promise<void>;
  importTaskMasters: (text: string) => Promise<number>;
  resetToday: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

export function useDailyState(): DailyState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [currentDate, setCurrentDate] = useState(todayKey());
  const [taskMasters, setTaskMasters] = useState<TaskMaster[]>([]);
  const [boardTasks, setBoardTasks] = useState<DailyBoardTask[]>([]);
  const [planTasks, setPlanTasks] = useState<DailyPlanTask[]>([]);
  const [progress, setProgress] = useState<TaskProgress[]>([]);
  const [appState, setAppState] = useState<AppState>();

  const reload = useCallback(async () => {
    setError(undefined);
    const today = todayKey();
    await seedInitialData(db, today);
    const state = await db.appState.get('singleton');
    if (state && state.currentDate !== today) {
      const previousPlanTasks = await db.dailyPlanTasks.where('date').equals(state.currentDate).toArray();
      const allProgress = await db.taskProgress.toArray();
      const previousHistories = await db.completionHistory
        .where('date')
        .equals(state.currentDate)
        .toArray();
      const rollover = calculateRollover({
        appState: state,
        today,
        previousPlanTasks,
        progressByTaskId: new Map(allProgress.map((item) => [item.taskMasterId, item])),
        historyByTaskAndDate: new Map(
          previousHistories.map((item) => [historyKey(item.taskMasterId, item.date), item]),
        ),
        nowIso: new Date().toISOString(),
      });
      if (rollover.shouldRollover) {
        await db.transaction(
          'rw',
          db.appState,
          db.taskProgress,
          db.completionHistory,
          db.dailyBoardTasks,
          db.dailyPlanTasks,
          async () => {
            await db.taskProgress.bulkPut(rollover.progress);
            await db.completionHistory.bulkPut(rollover.histories);
            await db.dailyBoardTasks.where('date').equals(state.currentDate).delete();
            await db.dailyPlanTasks.where('date').equals(state.currentDate).delete();
            await db.appState.put(rollover.appState);
          },
        );
      }
    }

    const freshState = await db.appState.get('singleton');
    const date = freshState?.currentDate ?? today;
    const [masters, boards, plans, progressRows] = await Promise.all([
      db.taskMasters.orderBy('createdAt').toArray(),
      db.dailyBoardTasks.where('date').equals(date).toArray(),
      db.dailyPlanTasks.where('date').equals(date).toArray(),
      db.taskProgress.toArray(),
    ]);
    setCurrentDate(date);
    setTaskMasters(masters);
    setBoardTasks(boards);
    setPlanTasks(plans);
    setProgress(progressRows);
    setAppState(freshState);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload().catch((caught) => {
      console.error(caught);
      setError('よみこめませんでした');
      setLoading(false);
    });
  }, [reload]);

  const addTaskMaster = useCallback(
    async (name: string, icon = '⭐') => {
      const now = new Date().toISOString();
      await db.taskMasters.add({
        id: makeId('master'),
        name: name.trim(),
        icon,
        frequency: { type: 'free' },
        createdAt: now,
        updatedAt: now,
      });
      await reload();
    },
    [reload],
  );

  const updateTaskMaster = useCallback(
    async (id: string, changes: Pick<TaskMaster, 'name' | 'icon' | 'frequency'>) => {
      await db.taskMasters.update(id, { ...changes, updatedAt: new Date().toISOString() });
      await reload();
    },
    [reload],
  );

  const deleteTaskMaster = useCallback(
    async (id: string, deleteTodayCopy: boolean) => {
      await db.transaction('rw', db.taskMasters, db.dailyBoardTasks, async () => {
        await db.taskMasters.delete(id);
        if (deleteTodayCopy) {
          const todayCopies = await db.dailyBoardTasks
            .where('[date+taskMasterId]')
            .equals([currentDate, id])
            .toArray();
          for (const copy of todayCopies) {
            await db.dailyBoardTasks.delete(copy.id);
          }
        }
      });
      await reload();
    },
    [currentDate, reload],
  );

  const addBoardTask = useCallback(
    async (taskMasterId: string, quadrant: QuadrantType) => {
      const master = await db.taskMasters.get(taskMasterId);
      if (!master) return false;
      const existing = await db.dailyBoardTasks
        .where('[date+taskMasterId]')
        .equals([currentDate, taskMasterId])
        .first();
      if (existing || hasDuplicateBoardTask(boardTasks, currentDate, taskMasterId)) return false;
      const now = new Date().toISOString();
      await db.dailyBoardTasks.add({
        id: makeId('board'),
        date: currentDate,
        taskMasterId,
        displayName: master.name,
        icon: master.icon,
        quadrant,
        selectedForToday: false,
        createdAt: now,
        updatedAt: now,
      });
      await reload();
      return true;
    },
    [boardTasks, currentDate, reload],
  );

  const moveBoardTask = useCallback(
    async (id: string, quadrant: QuadrantType) => {
      await db.dailyBoardTasks.update(id, { quadrant, updatedAt: new Date().toISOString() });
      await reload();
    },
    [reload],
  );

  const toggleBoardTaskSelected = useCallback(
    async (id: string) => {
      const task = await db.dailyBoardTasks.get(id);
      if (!task) return undefined;
      const selected = !task.selectedForToday;
      await db.dailyBoardTasks.update(id, {
        selectedForToday: selected,
        updatedAt: new Date().toISOString(),
      });
      let suggestion: string | undefined;
      if (selected) {
        const [master, progressRow] = await Promise.all([
          db.taskMasters.get(task.taskMasterId),
          db.taskProgress.get(task.taskMasterId),
        ]);
        if (master) {
          suggestion = getRotationSuggestion(master.frequency, progressRow)?.message;
        }
      }
      await reload();
      return { selected, suggestion };
    },
    [reload],
  );

  const deleteBoardTask = useCallback(
    async (id: string) => {
      const task = await db.dailyBoardTasks.get(id);
      await db.transaction('rw', db.dailyBoardTasks, db.dailyPlanTasks, async () => {
        if (task) {
          const plans = await db.dailyPlanTasks.where('boardTaskId').equals(id).toArray();
          const now = new Date().toISOString();
          for (const plan of plans) {
            await db.dailyPlanTasks.update(plan.id, {
              displayName: plan.displayName || task.displayName,
              icon: plan.icon || task.icon,
              updatedAt: now,
            });
          }
        }
        await db.dailyBoardTasks.delete(id);
      });
      await reload();
    },
    [reload],
  );

  const generatePlan = useCallback(async () => {
    const now = new Date().toISOString();
    const existingPlan = await db.dailyPlanTasks.where('date').equals(currentDate).toArray();
    const nextPlan = upsertDailyPlan(boardTasks, existingPlan, now);
    const retainedDoneCount = existingPlan.filter((task) => task.status === 'done').length;
    await db.transaction('rw', db.dailyPlanTasks, db.appState, async () => {
      if (nextPlan.upserts.length) await db.dailyPlanTasks.bulkPut(nextPlan.upserts);
      for (const id of nextPlan.removeIds) {
        await db.dailyPlanTasks.delete(id);
      }
      await db.appState.put({
        id: 'singleton',
        currentDate,
        planGenerated: nextPlan.selectedCount > 0 || retainedDoneCount > 0,
      });
    });
    await reload();
    return nextPlan.selectedCount > 0 || retainedDoneCount > 0;
  }, [boardTasks, currentDate, reload]);

  const markDone = useCallback(
    async (planTaskId: string) => {
      const planTask = await db.dailyPlanTasks.get(planTaskId);
      if (!planTask) return;
      const [progressRow, historyRow] = await Promise.all([
        db.taskProgress.get(planTask.taskMasterId),
        db.completionHistory.get(`${planTask.taskMasterId}-${planTask.date}`),
      ]);
      const result = markPlanDone(planTask, progressRow, historyRow, new Date().toISOString());
      await db.transaction('rw', db.dailyPlanTasks, db.taskProgress, db.completionHistory, async () => {
        await db.dailyPlanTasks.put(result.planTask);
        await db.taskProgress.put(result.progress);
        await db.completionHistory.put(result.history);
      });
      await reload();
    },
    [reload],
  );

  const importTaskMasters = useCallback(
    async (text: string) => {
      const transfer = parseTaskMasterTransferFile(text);
      const now = new Date().toISOString();
      let changedCount = 0;
      await db.transaction('rw', db.taskMasters, async () => {
        const existingTasks = await db.taskMasters.toArray();
        const existingByName = new Map(existingTasks.map((task) => [task.name, task]));
        for (const task of transfer.tasks) {
          const existing = existingByName.get(task.name);
          if (existing) {
            await db.taskMasters.update(existing.id, {
              icon: task.icon,
              frequency: task.frequency,
              updatedAt: now,
            });
          } else {
            await db.taskMasters.add({
              id: makeId('master'),
              name: task.name,
              icon: task.icon,
              frequency: task.frequency,
              createdAt: now,
              updatedAt: now,
            });
          }
          changedCount += 1;
        }
      });
      await reload();
      return changedCount;
    },
    [reload],
  );

  const resetToday = useCallback(async () => {
    await db.transaction('rw', db.dailyBoardTasks, db.dailyPlanTasks, db.appState, async () => {
      await db.dailyBoardTasks.where('date').equals(currentDate).delete();
      await db.dailyPlanTasks.where('date').equals(currentDate).delete();
      await db.appState.put({ id: 'singleton', currentDate, planGenerated: false });
    });
    await reload();
  }, [currentDate, reload]);

  const resetAllData = useCallback(async () => {
    await db.transaction(
      'rw',
      [
        db.taskMasters,
        db.dailyBoardTasks,
        db.dailyPlanTasks,
        db.taskProgress,
        db.completionHistory,
        db.appState,
      ],
      async () => {
        await db.taskMasters.clear();
        await db.dailyBoardTasks.clear();
        await db.dailyPlanTasks.clear();
        await db.taskProgress.clear();
        await db.completionHistory.clear();
        await db.appState.clear();
      },
    );
    await seedInitialData(db, todayKey());
    await reload();
  }, [reload]);

  return useMemo(
    () => ({
      loading,
      error,
      currentDate,
      taskMasters,
      boardTasks,
      planTasks,
      progress,
      appState,
      reload,
      addTaskMaster,
      updateTaskMaster,
      deleteTaskMaster,
      addBoardTask,
      moveBoardTask,
      toggleBoardTaskSelected,
      deleteBoardTask,
      generatePlan,
      markDone,
      importTaskMasters,
      resetToday,
      resetAllData,
    }),
    [
      loading,
      error,
      currentDate,
      taskMasters,
      boardTasks,
      planTasks,
      progress,
      appState,
      reload,
      addTaskMaster,
      updateTaskMaster,
      deleteTaskMaster,
      addBoardTask,
      moveBoardTask,
      toggleBoardTaskSelected,
      deleteBoardTask,
      generatePlan,
      markDone,
      importTaskMasters,
      resetToday,
      resetAllData,
    ],
  );
}
