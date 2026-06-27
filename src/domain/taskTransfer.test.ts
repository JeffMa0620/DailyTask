import { describe, expect, it } from 'vitest';
import { TaskMaster } from './models';
import { buildTaskMasterTransferFile, parseTaskMasterTransferFile } from './taskTransfer';

const task: TaskMaster = {
  id: 'task-1',
  name: '漢字ABC',
  icon: '📘',
  frequency: { type: 'weekly', timesPerWeek: 3 },
  createdAt: '2026-06-24T00:00:00.000Z',
  updatedAt: '2026-06-24T00:00:00.000Z',
};

describe('taskTransfer', () => {
  it('exports only common task fields', () => {
    expect(buildTaskMasterTransferFile([task])).toEqual({
      version: 1,
      tasks: [
        {
          name: '漢字ABC',
          icon: '📘',
          frequency: { type: 'weekly', timesPerWeek: 3 },
        },
      ],
    });
  });

  it('parses valid tasks and keeps the last duplicate name', () => {
    const result = parseTaskMasterTransferFile(
      JSON.stringify({
        version: 1,
        tasks: [
          { name: '  たすく  ', icon: '⭐', frequency: { type: 'daily' } },
          { name: 'たすく', icon: '🎵', frequency: { type: 'weekly', timesPerWeek: 2 } },
        ],
      }),
    );

    expect(result.tasks).toEqual([
      { name: 'たすく', icon: '🎵', frequency: { type: 'weekly', timesPerWeek: 2 } },
    ]);
  });

  it('uses safe defaults for weak task fields', () => {
    const result = parseTaskMasterTransferFile(
      JSON.stringify({
        version: 1,
        tasks: [{ name: 'えほん', icon: '', frequency: { type: 'weekly', timesPerWeek: 9 } }],
      }),
    );

    expect(result.tasks).toEqual([{ name: 'えほん', icon: '⭐', frequency: { type: 'free' } }]);
  });

  it('rejects unknown file versions', () => {
    expect(() => parseTaskMasterTransferFile(JSON.stringify({ version: 2, tasks: [] }))).toThrow();
  });
});
