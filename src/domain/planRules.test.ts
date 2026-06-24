import { describe, expect, it } from 'vitest';
import { DailyBoardTask } from './models';
import {
  buildDailyPlan,
  hasDuplicateBoardTask,
  toggleSelectedForToday,
  upsertDailyPlan,
} from './planRules';

function boardTask(id: string, quadrant: DailyBoardTask['quadrant']): DailyBoardTask {
  return {
    id,
    date: '2026-06-24',
    taskMasterId: `master-${id}`,
    displayName: `たすく${id}`,
    icon: '⭐',
    quadrant,
    selectedForToday: false,
    createdAt: '2026-06-24T00:00:00.000Z',
    updatedAt: '2026-06-24T00:00:00.000Z',
  };
}

function selectedTask(id: string, quadrant: DailyBoardTask['quadrant']): DailyBoardTask {
  return { ...boardTask(id, quadrant), selectedForToday: true };
}

describe('planRules', () => {
  it('prevents duplicate board copies for the same master on one date', () => {
    const tasks = [boardTask('1', 'importantUrgent')];
    expect(hasDuplicateBoardTask(tasks, '2026-06-24', 'master-1')).toBe(true);
    expect(hasDuplicateBoardTask(tasks, '2026-06-24', 'master-2')).toBe(false);
  });

  it('new board task fixtures start with selectedForToday=false', () => {
    expect(boardTask('1', 'importantUrgent').selectedForToday).toBe(false);
  });

  it('toggles selectedForToday while keeping the task in its quadrant', () => {
    const original = boardTask('1', 'importantUrgent');
    const toggled = toggleSelectedForToday(original, '2026-06-24T12:00:00.000Z');
    expect(toggled.selectedForToday).toBe(true);
    expect(toggled.quadrant).toBe('importantUrgent');
  });

  it('only puts selected tasks into the daily plan', () => {
    const plan = buildDailyPlan(
      [selectedTask('1', 'importantUrgent'), boardTask('2', 'importantUrgent')],
      '2026-06-24T00:00:00.000Z',
    );
    expect(plan).toHaveLength(1);
    expect(plan[0].boardTaskId).toBe('1');
  });

  it('puts selected fire tasks into the must group without a count limit', () => {
    const plan = buildDailyPlan(
      [
        selectedTask('1', 'importantUrgent'),
        selectedTask('2', 'importantUrgent'),
        selectedTask('3', 'importantUrgent'),
        selectedTask('4', 'importantUrgent'),
      ],
      '2026-06-24T00:00:00.000Z',
    );
    expect(plan).toHaveLength(4);
    expect(plan.every((task) => task.group === 'must')).toBe(true);
  });

  it('puts selected sprout tasks into the growth group without a count limit', () => {
    const plan = buildDailyPlan(
      [
        selectedTask('1', 'importantNotUrgent'),
        selectedTask('2', 'importantNotUrgent'),
        selectedTask('3', 'importantNotUrgent'),
      ],
      '2026-06-24T00:00:00.000Z',
    );
    expect(plan).toHaveLength(3);
    expect(plan.every((task) => task.group === 'growth')).toBe(true);
  });

  it('puts selected candy tasks into the optional group without a count limit', () => {
    const plan = buildDailyPlan(
      [
        selectedTask('1', 'notImportantNotUrgent'),
        selectedTask('2', 'notImportantNotUrgent'),
      ],
      '2026-06-24T00:00:00.000Z',
    );
    expect(plan).toHaveLength(2);
    expect(plan.every((task) => task.group === 'optional')).toBe(true);
  });

  it('allows selected car tasks into the sudden group', () => {
    const plan = buildDailyPlan(
      [selectedTask('1', 'notImportantUrgent')],
      '2026-06-24T00:00:00.000Z',
    );
    expect(plan).toHaveLength(1);
    expect(plan[0].group).toBe('sudden');
  });

  it('does not generate plan records when no tasks are selected', () => {
    const result = upsertDailyPlan(
      [boardTask('1', 'importantUrgent')],
      [],
      '2026-06-24T00:00:00.000Z',
    );
    expect(result.upserts).toHaveLength(0);
    expect(result.selectedCount).toBe(0);
  });

  it('preserves done status when regenerating a selected plan', () => {
    const selected = selectedTask('1', 'importantUrgent');
    const result = upsertDailyPlan(
      [selected],
      [
        {
          id: 'plan-1',
          date: selected.date,
          taskMasterId: selected.taskMasterId,
          boardTaskId: selected.id,
          group: 'must',
          status: 'done',
          completedAt: '2026-06-24T09:00:00.000Z',
          createdAt: '2026-06-24T08:00:00.000Z',
          updatedAt: '2026-06-24T09:00:00.000Z',
        },
      ],
      '2026-06-24T10:00:00.000Z',
    );
    expect(result.upserts).toHaveLength(1);
    expect(result.upserts[0].id).toBe('plan-1');
    expect(result.upserts[0].status).toBe('done');
  });

  it('does not create duplicate plan records for the same board task', () => {
    const selected = selectedTask('1', 'importantNotUrgent');
    const result = upsertDailyPlan(
      [selected],
      [
        {
          id: 'plan-1',
          date: selected.date,
          taskMasterId: selected.taskMasterId,
          boardTaskId: selected.id,
          group: 'growth',
          status: 'todo',
          createdAt: '2026-06-24T08:00:00.000Z',
          updatedAt: '2026-06-24T08:00:00.000Z',
        },
      ],
      '2026-06-24T10:00:00.000Z',
    );
    expect(result.upserts).toHaveLength(1);
    expect(result.upserts[0].id).toBe('plan-1');
  });

  it('removes unselected unfinished plans during regeneration', () => {
    const unselected = boardTask('1', 'importantUrgent');
    const result = upsertDailyPlan(
      [unselected],
      [
        {
          id: 'plan-1',
          date: unselected.date,
          taskMasterId: unselected.taskMasterId,
          boardTaskId: unselected.id,
          group: 'must',
          status: 'todo',
          createdAt: '2026-06-24T08:00:00.000Z',
          updatedAt: '2026-06-24T08:00:00.000Z',
        },
      ],
      '2026-06-24T10:00:00.000Z',
    );
    expect(result.removeIds).toEqual(['plan-1']);
  });
});
