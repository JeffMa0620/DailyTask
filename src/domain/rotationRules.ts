import { TaskFrequency, TaskProgress } from './models';

export type RotationSuggestion =
  | { type: 'dailyStreak'; message: string }
  | { type: 'weeklyGoal'; message: string }
  | undefined;

export function getRotationSuggestion(
  frequency: TaskFrequency,
  progress: TaskProgress | undefined,
): RotationSuggestion {
  if (!progress) return undefined;
  if (frequency.type === 'daily' && progress.consecutiveCompletedCount >= 4) {
    return { type: 'dailyStreak', message: 'よく つづいたね。ほかのことも えらぶ?' };
  }
  if (
    frequency.type === 'weekly' &&
    progress.currentWeekCompletedCount >= frequency.timesPerWeek
  ) {
    return { type: 'weeklyGoal', message: `こんしゅう ${frequency.timesPerWeek}かい できたよ` };
  }
  return undefined;
}
