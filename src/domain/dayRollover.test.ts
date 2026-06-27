import { describe, expect, it } from 'vitest';
import { DailyPlanTask } from './models';
import { calculateRollover } from './dayRollover';

function planTask(status: DailyPlanTask['status']): DailyPlanTask {
  return {
    id: `plan-${status}`,
    date: '2026-06-23',
    taskMasterId: `master-${status}`,
    boardTaskId: `board-${status}`,
    displayName: `たすく-${status}`,
    icon: '⭐',
    group: 'must',
    status,
    createdAt: '2026-06-23T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z',
  };
}

describe('dayRollover', () => {
  it('keeps state unchanged when the date did not change', () => {
    const result = calculateRollover({
      appState: { id: 'singleton', currentDate: '2026-06-24', planGenerated: true },
      today: '2026-06-24',
      previousPlanTasks: [planTask('todo')],
      progressByTaskId: new Map(),
      historyByTaskAndDate: new Map(),
      nowIso: '2026-06-24T00:00:00.000Z',
    });
    expect(result.shouldRollover).toBe(false);
  });

  it('creates missed histories only for unfinished planned tasks', () => {
    const result = calculateRollover({
      appState: { id: 'singleton', currentDate: '2026-06-23', planGenerated: true },
      today: '2026-06-24',
      previousPlanTasks: [planTask('todo'), planTask('done')],
      progressByTaskId: new Map(),
      historyByTaskAndDate: new Map(),
      nowIso: '2026-06-24T00:00:00.000Z',
    });
    expect(result.shouldRollover).toBe(true);
    expect(result.appState.currentDate).toBe('2026-06-24');
    expect(result.appState.planGenerated).toBe(false);
    expect(result.histories).toHaveLength(1);
    expect(result.histories[0].completed).toBe(false);
  });
});
