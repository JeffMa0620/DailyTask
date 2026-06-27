import { TaskFrequency, TaskMaster } from './models';

export interface TaskMasterTransfer {
  name: string;
  icon: string;
  frequency: TaskFrequency;
}

export interface TaskMasterTransferFile {
  version: 1;
  tasks: TaskMasterTransfer[];
}

function normalizeFrequency(value: unknown): TaskFrequency {
  if (!value || typeof value !== 'object') return { type: 'free' };
  const frequency = value as Partial<TaskFrequency>;
  if (frequency.type === 'daily') return { type: 'daily' };
  if (frequency.type === 'free') return { type: 'free' };
  if (frequency.type === 'weekly') {
    const timesPerWeek = Number((frequency as { timesPerWeek?: unknown }).timesPerWeek);
    if (Number.isInteger(timesPerWeek) && timesPerWeek >= 1 && timesPerWeek <= 7) {
      return { type: 'weekly', timesPerWeek };
    }
  }
  return { type: 'free' };
}

export function buildTaskMasterTransferFile(tasks: TaskMaster[]): TaskMasterTransferFile {
  return {
    version: 1,
    tasks: tasks.map((task) => ({
      name: task.name,
      icon: task.icon,
      frequency: task.frequency,
    })),
  };
}

export function parseTaskMasterTransferFile(text: string): TaskMasterTransferFile {
  const parsed = JSON.parse(text) as { version?: unknown; tasks?: unknown };
  if (parsed.version !== 1 || !Array.isArray(parsed.tasks)) {
    throw new Error('invalid task transfer file');
  }

  const byName = new Map<string, TaskMasterTransfer>();
  for (const item of parsed.tasks) {
    if (!item || typeof item !== 'object') continue;
    const source = item as { name?: unknown; icon?: unknown; frequency?: unknown };
    const name = typeof source.name === 'string' ? source.name.trim() : '';
    if (!name || name.length > 28) continue;
    byName.set(name, {
      name,
      icon: typeof source.icon === 'string' && source.icon.trim() ? source.icon.trim().slice(0, 4) : '⭐',
      frequency: normalizeFrequency(source.frequency),
    });
  }

  return {
    version: 1,
    tasks: Array.from(byName.values()),
  };
}
