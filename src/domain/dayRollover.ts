import { AppState, CompletionHistory, DailyPlanTask, TaskProgress } from './models';
import { markMissedPlan } from './progressRules';

export interface RolloverInput {
  appState: AppState;
  today: string;
  previousPlanTasks: DailyPlanTask[];
  progressByTaskId: Map<string, TaskProgress>;
  historyByTaskAndDate: Map<string, CompletionHistory>;
  nowIso: string;
}

export interface RolloverResult {
  shouldRollover: boolean;
  appState: AppState;
  progress: TaskProgress[];
  histories: CompletionHistory[];
}

export function historyKey(taskMasterId: string, date: string): string {
  return `${taskMasterId}-${date}`;
}

export function calculateRollover(input: RolloverInput): RolloverResult {
  if (input.appState.currentDate === input.today) {
    return {
      shouldRollover: false,
      appState: input.appState,
      progress: [],
      histories: [],
    };
  }

  const progress: TaskProgress[] = [];
  const histories: CompletionHistory[] = [];

  for (const task of input.previousPlanTasks) {
    if (task.status === 'done') continue;
    const missed = markMissedPlan(
      task,
      input.progressByTaskId.get(task.taskMasterId),
      input.historyByTaskAndDate.get(historyKey(task.taskMasterId, task.date)),
      input.nowIso,
    );
    progress.push(missed.progress);
    histories.push(missed.history);
  }

  return {
    shouldRollover: true,
    appState: {
      id: 'singleton',
      currentDate: input.today,
      planGenerated: false,
    },
    progress,
    histories,
  };
}
