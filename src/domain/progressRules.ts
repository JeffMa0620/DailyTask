import { CompletionHistory, DailyPlanTask, TaskProgress } from './models';
import { isSameLocalWeek, isYesterday } from './date';

export function emptyProgress(taskMasterId: string, nowIso: string): TaskProgress {
  return {
    taskMasterId,
    totalCompletedCount: 0,
    consecutiveCompletedCount: 0,
    currentWeekCompletedCount: 0,
    updatedAt: nowIso,
  };
}

export function markPlanDone(
  planTask: DailyPlanTask,
  existingProgress: TaskProgress | undefined,
  existingHistory: CompletionHistory | undefined,
  nowIso: string,
): { planTask: DailyPlanTask; progress: TaskProgress; history: CompletionHistory } {
  const alreadyCompleted = existingHistory?.completed === true || planTask.status === 'done';
  const current = existingProgress ?? emptyProgress(planTask.taskMasterId, nowIso);
  const sameWeek = isSameLocalWeek(current.lastCompletedDate, planTask.date);

  const progress: TaskProgress = alreadyCompleted
    ? { ...current, updatedAt: nowIso }
    : {
        ...current,
        totalCompletedCount: current.totalCompletedCount + 1,
        consecutiveCompletedCount: isYesterday(current.lastCompletedDate, planTask.date)
          ? current.consecutiveCompletedCount + 1
          : current.lastCompletedDate === planTask.date
            ? current.consecutiveCompletedCount
            : 1,
        currentWeekCompletedCount: sameWeek ? current.currentWeekCompletedCount + 1 : 1,
        lastCompletedDate: planTask.date,
        lastPlannedResult: 'done',
        updatedAt: nowIso,
      };

  return {
    planTask: {
      ...planTask,
      status: 'done',
      completedAt: planTask.completedAt ?? nowIso,
      updatedAt: nowIso,
    },
    progress,
    history: {
      id: existingHistory?.id ?? `${planTask.taskMasterId}-${planTask.date}`,
      taskMasterId: planTask.taskMasterId,
      date: planTask.date,
      planned: true,
      completed: true,
      completedAt: existingHistory?.completedAt ?? nowIso,
    },
  };
}

export function markMissedPlan(
  planTask: DailyPlanTask,
  existingProgress: TaskProgress | undefined,
  existingHistory: CompletionHistory | undefined,
  nowIso: string,
): { progress: TaskProgress; history: CompletionHistory } {
  const current = existingProgress ?? emptyProgress(planTask.taskMasterId, nowIso);
  return {
    progress: {
      ...current,
      consecutiveCompletedCount: 0,
      lastPlannedResult: 'notDone',
      updatedAt: nowIso,
    },
    history: {
      id: existingHistory?.id ?? `${planTask.taskMasterId}-${planTask.date}`,
      taskMasterId: planTask.taskMasterId,
      date: planTask.date,
      planned: true,
      completed: false,
    },
  };
}
