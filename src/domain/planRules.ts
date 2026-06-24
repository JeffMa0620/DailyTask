import { DailyBoardTask, DailyPlanTask, PlanGroup } from './models';
import { makeId } from './id';

const groupByQuadrant: Record<string, PlanGroup | undefined> = {
  importantUrgent: 'must',
  importantNotUrgent: 'growth',
  notImportantUrgent: 'sudden',
  notImportantNotUrgent: 'optional',
};

export function planGroupForQuadrant(quadrant: DailyBoardTask['quadrant']): PlanGroup | undefined {
  return groupByQuadrant[quadrant];
}

export function buildDailyPlan(boardTasks: DailyBoardTask[], nowIso: string): DailyPlanTask[] {
  return boardTasks.reduce<DailyPlanTask[]>((plan, task) => {
    if (!task.selectedForToday) return plan;
    const group = planGroupForQuadrant(task.quadrant);
    if (!group) return plan;
    plan.push({
        id: makeId('plan'),
        date: task.date,
        taskMasterId: task.taskMasterId,
        boardTaskId: task.id,
        group,
        status: 'todo',
        createdAt: nowIso,
        updatedAt: nowIso,
    });
    return plan;
  }, []);
}

export function toggleSelectedForToday(task: DailyBoardTask, nowIso: string): DailyBoardTask {
  return {
    ...task,
    selectedForToday: !task.selectedForToday,
    updatedAt: nowIso,
  };
}

export function upsertDailyPlan(
  boardTasks: DailyBoardTask[],
  existingPlanTasks: DailyPlanTask[],
  nowIso: string,
): { upserts: DailyPlanTask[]; removeIds: string[]; selectedCount: number } {
  const selectedTasks = boardTasks.filter((task) => task.selectedForToday);
  const selectedBoardIds = new Set(selectedTasks.map((task) => task.id));
  const existingByBoardId = new Map(existingPlanTasks.map((task) => [task.boardTaskId, task]));
  const upserts: DailyPlanTask[] = [];

  for (const task of selectedTasks) {
    const group = planGroupForQuadrant(task.quadrant);
    if (!group) continue;
    const existing = existingByBoardId.get(task.id);
    upserts.push({
      id: existing?.id ?? makeId('plan'),
      date: task.date,
      taskMasterId: task.taskMasterId,
      boardTaskId: task.id,
      group,
      status: existing?.status ?? 'todo',
      completedAt: existing?.completedAt,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
    });
  }

  const removeIds = existingPlanTasks
    .filter((task) => task.status !== 'done' && !selectedBoardIds.has(task.boardTaskId))
    .map((task) => task.id);

  return { upserts, removeIds, selectedCount: selectedTasks.length };
}

export function hasDuplicateBoardTask(
  boardTasks: DailyBoardTask[],
  date: string,
  taskMasterId: string,
): boolean {
  return boardTasks.some((task) => task.date === date && task.taskMasterId === taskMasterId);
}
