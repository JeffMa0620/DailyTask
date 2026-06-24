import { afterEach, describe, expect, it } from 'vitest';
import { PlannerDatabase, seedInitialData } from './database';

describe('database seed', () => {
  let database: PlannerDatabase | undefined;

  afterEach(async () => {
    if (database) {
      await database.delete();
      database.close();
    }
  });

  it('can run more than once without duplicating default task masters', async () => {
    database = new PlannerDatabase(`test-${crypto.randomUUID()}`);
    await seedInitialData(database, '2026-06-24');
    await seedInitialData(database, '2026-06-24');
    expect(await database.taskMasters.count()).toBe(8);
    expect(await database.appState.get('singleton')).toMatchObject({
      currentDate: '2026-06-24',
      planGenerated: false,
    });
  });
});
