import { describe, expect, it } from 'vitest';
import { DailyPlanTask } from './models';
import { markMissedPlan, markPlanDone } from './progressRules';

function planTask(date = '2026-06-24'): DailyPlanTask {
  return {
    id: `plan-${date}`,
    date,
    taskMasterId: 'master-1',
    boardTaskId: 'board-1',
    group: 'must',
    status: 'todo',
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
}

describe('progressRules', () => {
  it('does not count the same completion twice', () => {
    const first = markPlanDone(planTask(), undefined, undefined, '2026-06-24T10:00:00.000Z');
    const second = markPlanDone(
      first.planTask,
      first.progress,
      first.history,
      '2026-06-24T11:00:00.000Z',
    );
    expect(second.progress.totalCompletedCount).toBe(1);
    expect(second.progress.consecutiveCompletedCount).toBe(1);
  });

  it('increases streak when planned tasks are completed on consecutive planned days', () => {
    const first = markPlanDone(planTask('2026-06-23'), undefined, undefined, '2026-06-23T10:00:00.000Z');
    const second = markPlanDone(
      planTask('2026-06-24'),
      first.progress,
      undefined,
      '2026-06-24T10:00:00.000Z',
    );
    expect(second.progress.consecutiveCompletedCount).toBe(2);
  });

  it('does not let unplanned skipped dates break streaks', () => {
    const first = markPlanDone(planTask('2026-06-22'), undefined, undefined, '2026-06-22T10:00:00.000Z');
    const second = markPlanDone(
      planTask('2026-06-24'),
      first.progress,
      undefined,
      '2026-06-24T10:00:00.000Z',
    );
    expect(second.progress.consecutiveCompletedCount).toBe(1);
  });

  it('resets streak when a planned task is missed during rollover', () => {
    const done = markPlanDone(planTask('2026-06-23'), undefined, undefined, '2026-06-23T10:00:00.000Z');
    const missed = markMissedPlan(
      planTask('2026-06-24'),
      done.progress,
      undefined,
      '2026-06-25T00:00:00.000Z',
    );
    expect(missed.progress.consecutiveCompletedCount).toBe(0);
    expect(missed.progress.lastPlannedResult).toBe('notDone');
  });

  it('restarts weekly count when completion moves to another week', () => {
    const first = markPlanDone(planTask('2026-06-28'), undefined, undefined, '2026-06-28T10:00:00.000Z');
    const second = markPlanDone(
      planTask('2026-06-29'),
      first.progress,
      undefined,
      '2026-06-29T10:00:00.000Z',
    );
    expect(second.progress.currentWeekCompletedCount).toBe(1);
  });
});
