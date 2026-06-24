import { describe, expect, it } from 'vitest';
import { TaskProgress } from './models';
import { getRotationSuggestion } from './rotationRules';

const progress: TaskProgress = {
  taskMasterId: 'master-1',
  totalCompletedCount: 4,
  consecutiveCompletedCount: 4,
  currentWeekCompletedCount: 3,
  lastCompletedDate: '2026-06-24',
  updatedAt: '2026-06-24T00:00:00.000Z',
};

describe('rotationRules', () => {
  it('suggests rotation for daily tasks after a streak', () => {
    expect(getRotationSuggestion({ type: 'daily' }, progress)?.type).toBe('dailyStreak');
  });

  it('suggests rotation for weekly tasks after the goal is reached', () => {
    expect(getRotationSuggestion({ type: 'weekly', timesPerWeek: 3 }, progress)?.type).toBe('weeklyGoal');
  });

  it('does not suggest rotation for free tasks', () => {
    expect(getRotationSuggestion({ type: 'free' }, progress)).toBeUndefined();
  });
});
