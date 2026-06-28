import { TaskMaster } from '../domain/models';

export const seedTasks: Array<Pick<TaskMaster, 'name' | 'icon' | 'frequency'>> = [
  { name: 'Kahn', icon: '📱', frequency: { type: 'free' } },
  { name: 'English', icon: '🔤', frequency: { type: 'free' } },
  { name: 'こくごのえほん', icon: '📖', frequency: { type: 'free' } },
  { name: 'すとれっち', icon: '💃', frequency: { type: 'free' } },
  { name: 'えほん', icon: '📚', frequency: { type: 'free' } },
  { name: 'ポケモンかんじどり', icon: '✏️', frequency: { type: 'free' } },
  { name: 'ウクレレ', icon: '🎸', frequency: { type: 'free' } },
  { name: 'くもん', icon: '📝', frequency: { type: 'free' } },
  { name: 'ThinkThink', icon: '🎮', frequency: { type: 'free' } },
  { name: 'しゅくだい', icon: '📘', frequency: { type: 'free' } },
  { name: 'がっこうのじゅんび', icon: '🏫', frequency: { type: 'free' } },
];
