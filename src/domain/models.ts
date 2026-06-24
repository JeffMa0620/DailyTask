export type TaskFrequency =
  | { type: 'daily' }
  | { type: 'weekly'; timesPerWeek: number }
  | { type: 'free' };

export interface TaskMaster {
  id: string;
  name: string;
  icon: string;
  frequency: TaskFrequency;
  createdAt: string;
  updatedAt: string;
}

export type QuadrantType =
  | 'importantUrgent'
  | 'importantNotUrgent'
  | 'notImportantUrgent'
  | 'notImportantNotUrgent';

export interface DailyBoardTask {
  id: string;
  date: string;
  taskMasterId: string;
  displayName: string;
  icon: string;
  quadrant: QuadrantType;
  selectedForToday: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PlanGroup = 'must' | 'growth' | 'sudden' | 'optional';
export type PlanStatus = 'todo' | 'done';

export interface DailyPlanTask {
  id: string;
  date: string;
  taskMasterId: string;
  boardTaskId: string;
  group: PlanGroup;
  status: PlanStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskProgress {
  taskMasterId: string;
  totalCompletedCount: number;
  consecutiveCompletedCount: number;
  currentWeekCompletedCount: number;
  lastCompletedDate?: string;
  lastPlannedResult?: 'done' | 'notDone';
  updatedAt: string;
}

export interface CompletionHistory {
  id: string;
  taskMasterId: string;
  date: string;
  planned: boolean;
  completed: boolean;
  completedAt?: string;
}

export interface AppState {
  id: 'singleton';
  currentDate: string;
  planGenerated: boolean;
}

export interface QuadrantConfig {
  type: QuadrantType;
  title: string;
  icon: string;
  watermark: string;
  className: string;
}

export const QUADRANTS: QuadrantConfig[] = [
  {
    type: 'importantUrgent',
    title: 'いま やる',
    icon: '🔥',
    watermark: '🔥',
    className: 'quadrant-fire',
  },
  {
    type: 'importantNotUrgent',
    title: 'そだてる',
    icon: '🌱',
    watermark: '🌼',
    className: 'quadrant-sprout',
  },
  {
    type: 'notImportantUrgent',
    title: 'とつぜん',
    icon: '🚗',
    watermark: '🚗',
    className: 'quadrant-car',
  },
  {
    type: 'notImportantNotUrgent',
    title: 'おたのしみ',
    icon: '🍬',
    watermark: '🍬',
    className: 'quadrant-candy',
  },
];
