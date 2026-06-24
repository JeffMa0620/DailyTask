import { DailyBoardTask, DailyPlanTask, PlanGroup } from '../domain/models';

const groupLabels: Record<PlanGroup, string> = {
  must: '🔥 いま やる',
  growth: '🌱 そだてる',
  sudden: '🚗 とつぜん',
  optional: '🍬 おたのしみ',
};

interface DailyPlanProps {
  planTasks: DailyPlanTask[];
  boardTasks: DailyBoardTask[];
  onDone: (id: string) => void;
}

export function DailyPlan({ planTasks, boardTasks, onDone }: DailyPlanProps) {
  const boardById = new Map(boardTasks.map((task) => [task.id, task]));

  return (
    <section className="side-section plan-section">
      <h2>きょうの よてい</h2>
      {(['must', 'growth', 'sudden', 'optional'] as PlanGroup[]).map((group) => {
        const rows = planTasks.filter((task) => task.group === group);
        return rows.length === 0 ? null : (
          <div className="plan-group" key={group}>
            <h3>{groupLabels[group]}</h3>
            {rows.map((plan) => {
              const board = boardById.get(plan.boardTaskId);
              return (
                <div className={`plan-item ${plan.status === 'done' ? 'is-done' : ''}`} key={plan.id}>
                  <span>
                    <span aria-hidden="true">{board?.icon ?? '⭐'}</span> {board?.displayName ?? 'たすく'}
                  </span>
                  <button type="button" onClick={() => onDone(plan.id)} disabled={plan.status === 'done'}>
                    {plan.status === 'done' ? 'できたよ' : 'できた'}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}
