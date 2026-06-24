import { TaskMaster } from '../domain/models';

export const seedTasks: Array<Pick<TaskMaster, 'name' | 'icon' | 'frequency'>> = [
  { name: 'かんあぷり', icon: '📱', frequency: { type: 'weekly', timesPerWeek: 3 } },
  { name: 'えいごれんしゅう', icon: '🔤', frequency: { type: 'daily' } },
  { name: 'こくごれんしゅう', icon: '📖', frequency: { type: 'weekly', timesPerWeek: 3 } },
  { name: 'すとれっち', icon: '💃', frequency: { type: 'weekly', timesPerWeek: 3 } },
  { name: 'おえかき', icon: '🎨', frequency: { type: 'free' } },
  { name: 'えほん', icon: '📚', frequency: { type: 'daily' } },
  { name: 'かんじ', icon: '✏️', frequency: { type: 'weekly', timesPerWeek: 3 } },
  { name: 'うくれれ', icon: '🎸', frequency: { type: 'weekly', timesPerWeek: 2 } },
];
