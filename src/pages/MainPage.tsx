import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import { CommonTaskList } from '../components/CommonTaskList';
import { ConfirmModal } from '../components/ConfirmModal';
import { DailyPlan } from '../components/DailyPlan';
import { NewTaskForm } from '../components/NewTaskForm';
import { NoticeModal } from '../components/NoticeModal';
import { ParentSettings } from '../components/ParentSettings';
import { QuadrantBoard } from '../components/QuadrantBoard';
import { TaskEditModal } from '../components/TaskEditModal';
import { Toast } from '../components/Toast';
import { useDailyState } from '../hooks/useDailyState';
import { useLongPress } from '../hooks/useLongPress';
import { QuadrantType, TaskMaster } from '../domain/models';
import { getRotationSuggestion } from '../domain/rotationRules';

type ConfirmState =
  | { type: 'deleteMaster'; task: TaskMaster }
  | { type: 'resetToday' }
  | { type: 'resetAll' }
  | { type: 'rotation'; boardTaskId: string; message: string; afterConfirm?: 'generate' };

export function MainPage() {
  const state = useDailyState();
  const [editingTask, setEditingTask] = useState<TaskMaster>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>();
  const [notice, setNotice] = useState<string>();
  const [toast, setToast] = useState<string>();
  const longPress = useLongPress(() => setSettingsOpen(true));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const addedTaskIds = useMemo(
    () => new Set(state.boardTasks.map((task) => task.taskMasterId)),
    [state.boardTasks],
  );

  async function handleDragEnd(event: DragEndEvent) {
    const overId = String(event.over?.id ?? '');
    const activeId = String(event.active.id);
    if (!overId.startsWith('quadrant:')) return;
    const quadrant = overId.replace('quadrant:', '') as QuadrantType;

    if (activeId.startsWith('master:')) {
      const ok = await state.addBoardTask(activeId.replace('master:', ''), quadrant);
      setToast(ok ? 'はいったよ' : 'もう はいってるよ');
    }
    if (activeId.startsWith('board:')) {
      await state.moveBoardTask(activeId.replace('board:', ''), quadrant);
      setToast('うごいたよ');
    }
  }

  async function generatePlan() {
    const suggestedTask = state.boardTasks
      .filter((task) => task.selectedForToday)
      .map((task) => {
        const master = state.taskMasters.find((item) => item.id === task.taskMasterId);
        const progress = state.progress.find((item) => item.taskMasterId === task.taskMasterId);
        const suggestion = master ? getRotationSuggestion(master.frequency, progress)?.message : undefined;
        return suggestion ? { task, suggestion } : undefined;
      })
      .find(Boolean);
    if (suggestedTask) {
      setConfirm({
        type: 'rotation',
        boardTaskId: suggestedTask.task.id,
        message: suggestedTask.suggestion,
        afterConfirm: 'generate',
      });
      return;
    }
    const ok = await state.generatePlan();
    if (ok) setToast('よていが できたよ');
    else setNotice('きょう やることを えらんでね');
  }

  async function markDone(id: string) {
    await state.markDone(id);
    setToast('できたね');
  }

  async function runConfirm() {
    if (!confirm) return;
    if (confirm.type === 'deleteMaster') {
      await state.deleteTaskMaster(confirm.task.id, true);
      setToast('けしたよ');
    }
    if (confirm.type === 'resetToday') {
      await state.resetToday();
      setSettingsOpen(false);
      setToast('きょうを けしたよ');
    }
    if (confirm.type === 'resetAll') {
      await state.resetAllData();
      setSettingsOpen(false);
      setToast('ぜんぶ もどしたよ');
    }
    if (confirm.type === 'rotation') {
      if (confirm.afterConfirm === 'generate') {
        const ok = await state.generatePlan();
        if (ok) setToast('よていが できたよ');
        else setNotice('きょう やることを えらんでね');
      } else {
        setToast('このまま いくよ');
      }
    }
    setConfirm(undefined);
  }

  async function cancelConfirm() {
    if (confirm?.type === 'rotation') {
      await state.toggleBoardTaskSelected(confirm.boardTaskId);
      setToast('ほかを えらんでね');
    }
    setConfirm(undefined);
  }

  if (state.loading) {
    return <div className="loading-screen">よみこみちゅう</div>;
  }

  if (state.error) {
    return (
      <div className="loading-screen">
        <div className="load-error">
          <p>{state.error}</p>
          <button type="button" onClick={() => void state.reload()}>
            もういちど
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="app-shell">
        <QuadrantBoard
          tasks={state.boardTasks}
          onDeleteTask={state.deleteBoardTask}
          onToggleSelected={async (id) => {
            const result = await state.toggleBoardTaskSelected(id);
            if (result?.suggestion) {
              setConfirm({ type: 'rotation', boardTaskId: id, message: result.suggestion });
            } else if (result) {
              setToast(result.selected ? 'きょう やるよ' : 'きょうは やめるよ');
            }
          }}
        />
        <aside className="side-panel">
          <button className="settings-button" type="button" aria-label="おとなの せってい" {...longPress}>
            ⚙
          </button>
          <NewTaskForm onAdd={state.addTaskMaster} />
          <CommonTaskList
            tasks={state.taskMasters}
            addedTaskIds={addedTaskIds}
            progress={state.progress}
            onEdit={setEditingTask}
            onDelete={(task) => setConfirm({ type: 'deleteMaster', task })}
          />
          <button className="primary-button" type="button" onClick={generatePlan}>
            よていを きめる
          </button>
          <DailyPlan planTasks={state.planTasks} boardTasks={state.boardTasks} onDone={markDone} />
        </aside>
      </div>
      <Toast message={toast} />
      {editingTask ? (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(undefined)}
          onSave={async (changes) => {
            await state.updateTaskMaster(editingTask.id, changes);
            setEditingTask(undefined);
            setToast('なおしたよ');
          }}
        />
      ) : null}
      {settingsOpen ? (
        <ParentSettings
          onClose={() => setSettingsOpen(false)}
          onResetToday={() => setConfirm({ type: 'resetToday' })}
          onResetAll={() => setConfirm({ type: 'resetAll' })}
        />
      ) : null}
      {confirm ? (
        <ConfirmModal
          title={confirm.type === 'deleteMaster' ? 'けす?' : 'ほんとうに?'}
          message={
            confirm.type === 'deleteMaster'
              ? 'きょうの ぶんも けす?'
              : confirm.type === 'rotation'
                ? confirm.message
                : 'もとには もどせません'
          }
          confirmLabel={
            confirm.type === 'resetAll' ? 'ぜんぶ けす' : confirm.type === 'rotation' ? 'このまま' : 'けす'
          }
          cancelLabel={confirm.type === 'rotation' ? 'ほかを えらぶ' : 'やめる'}
          onConfirm={runConfirm}
          onCancel={cancelConfirm}
        />
      ) : null}
      {notice ? <NoticeModal message={notice} onClose={() => setNotice(undefined)} /> : null}
    </DndContext>
  );
}
