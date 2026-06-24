# DailyTask 项目说明

本文档记录当前仓库的项目事实、实现约定和后续开发注意事项，供 Codex/其他开发者继续维护时参考。

## 项目概览

- 项目名称：`kids-task-planner` / DailyTask。
- 类型：面向儿童的任务规划网页应用。
- 当前实现：纯前端 React 应用，无后端、无账号、无云同步。
- 主要目标：帮助儿童先把任务放入四象限分类，再通过星星单独选择“今天要做”的任务，避免把象限里的所有任务误解为当天必须全部完成。
- 本地数据：使用 Dexie + IndexedDB 保存在浏览器内，刷新页面后数据不丢失。
- 主要入口：
  - `src/main.tsx`
  - `src/pages/MainPage.tsx`

## 技术栈

- React 19
- TypeScript
- Vite 6
- `@dnd-kit/core`：鼠标和触摸拖拽
- Dexie：IndexedDB 数据访问
- date-fns：日期处理
- Vitest + jsdom + fake-indexeddb：规则和数据库测试
- 普通 CSS：`src/styles/app.css`

## 常用命令

```bash
npm install
npm run dev
npm run test
npm run build
```

本地开发地址通常是：

```text
http://127.0.0.1:5173/
```

如果需要指定地址和端口：

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

## 目录结构与职责

- `src/pages/MainPage.tsx`
  - 主页面容器。
  - 负责组合四象限、右侧操作区、弹窗、toast 和拖拽上下文。
  - 使用 `DndContext`、`PointerSensor`、`TouchSensor`。

- `src/hooks/useDailyState.ts`
  - 应用状态和 IndexedDB 操作集中地。
  - 负责初始化 seed 数据、换日处理、增删改任务、拖入象限、星星切换、生成计划、打卡、重置。
  - 页面若数据库加载失败，会返回 `error`，避免一直停在 `よみこみちゅう`。

- `src/domain/`
  - 纯业务规则和类型，尽量不要放 React/UI 逻辑。
  - `models.ts`：核心类型和四象限配置。
  - `planRules.ts`：今日计划生成与 upsert 规则。
  - `progressRules.ts`：打卡、完成次数、连续完成、本周完成次数。
  - `rotationRules.ts`：轮换建议。
  - `dayRollover.ts`：换日时处理未完成计划。
  - `validation.ts`：儿童可见输入校验。

- `src/db/`
  - `database.ts`：Dexie schema、数据库版本迁移、初始数据 seed。
  - `seedData.ts`：首次启动的 8 个常用任务。

- `src/components/`
  - UI 组件。
  - `QuadrantBoard.tsx` / `Quadrant.tsx`：四象限。
  - `TaskCard.tsx`：可拖拽任务卡。
  - `CommonTaskList.tsx`：常用任务区。
  - `NewTaskForm.tsx`：新增任务表单。
  - `DailyPlan.tsx`：今日计划显示。
  - `TaskEditModal.tsx` / `FrequencyEditor.tsx`：任务编辑和频率设置。
  - `ParentSettings.tsx`：家长设置。
  - `ConfirmModal.tsx` / `NoticeModal.tsx` / `Toast.tsx`：提示与确认。

- `src/styles/app.css`
  - 全局样式、响应式布局、四象限颜色、任务卡便签样式、弹窗样式。

- `src/**/*.test.ts`
  - Vitest 测试文件。

## 核心业务规则

### 四象限只负责分类

四个象限：

- `importantUrgent` -> `🔥 いま やる`
- `importantNotUrgent` -> `🌱 そだてる`
- `notImportantUrgent` -> `🚗 とつぜん`
- `notImportantNotUrgent` -> `🍬 おたのしみ`

任务可以在四个象限之间自由拖动。

不要根据象限自动把任务加入今日计划。

### “今天要做”由星星决定

`DailyBoardTask` 有字段：

```ts
selectedForToday: boolean;
```

含义：

- `false`：任务只在象限中分类，不进入今日计划。
- `true`：任务会进入今日计划。

新创建的当天象限任务副本必须默认：

```ts
selectedForToday: false
```

任务在象限之间移动时，必须保留 `selectedForToday` 状态。

同一个常用任务同一天只能有一个象限副本。

### 今日计划生成

点击 `よていを きめる` 时：

- 只处理 `selectedForToday === true` 的当天象限任务。
- 四个象限都允许进入今日计划。
- 不限制今天可选择多少任务。
- 不根据数量弹窗警告。
- 如果没有选择任何任务，显示提示：`きょう やることを えらんでね`。

计划分组：

```ts
type PlanGroup = 'must' | 'growth' | 'sudden' | 'optional';
```

对应关系：

- `importantUrgent` -> `must`
- `importantNotUrgent` -> `growth`
- `notImportantUrgent` -> `sudden`
- `notImportantNotUrgent` -> `optional`

重新生成计划必须使用 upsert 或等效逻辑：

- 新点亮的任务加入计划。
- 取消星星且未完成的任务可从计划移除。
- 已经 `done` 的计划不能丢失完成状态。
- 同一 `boardTaskId` 不能重复创建计划记录。
- 不能因为重新生成计划重复增加完成次数。

相关实现：

- `src/domain/planRules.ts`
  - `buildDailyPlan`
  - `toggleSelectedForToday`
  - `upsertDailyPlan`
  - `hasDuplicateBoardTask`
- `src/hooks/useDailyState.ts`
  - `toggleBoardTaskSelected`
  - `generatePlan`

### 打卡和进度

点击计划中的 `できた`：

- 更新 `DailyPlanTask.status` 为 `done`。
- 写入/更新 `CompletionHistory`。
- 更新 `TaskProgress`：
  - `totalCompletedCount`
  - `consecutiveCompletedCount`
  - `currentWeekCompletedCount`
  - `lastCompletedDate`
  - `lastPlannedResult`

同一天重复点击不能重复增加完成次数。

### 轮换建议

频率类型：

```ts
type TaskFrequency =
  | { type: 'daily' }
  | { type: 'weekly'; timesPerWeek: number }
  | { type: 'free' };
```

轮换建议只在这些时机检查：

- 用户把任务从 `☆` 切换成 `★`。
- 点击 `よていを きめる` 准备加入计划时。

不要对所有象限任务常驻检查。

如果用户在轮换提示中选择换一个，应把该任务恢复为 `☆`。

### 换日规则

启动/刷新时会检查 `AppState.currentDate` 和本地今日日期。

日期变化时：

- 处理昨天已计划但未完成的任务，写入未完成历史并影响连续完成记录。
- 清空昨日今日计划。
- 清空昨日当天象限任务副本。
- 不自动把昨天点亮的任务延续到今天。
- 保留常用任务、频率、历史和进度。

相关实现：

- `src/domain/dayRollover.ts`
- `src/hooks/useDailyState.ts`

## IndexedDB / Dexie 注意事项

数据库名：

```ts
kids-task-planner
```

主要表：

- `taskMasters`
- `dailyBoardTasks`
- `dailyPlanTasks`
- `taskProgress`
- `completionHistory`
- `appState`

当前数据库版本迁移：

- v1：初始表。
- v2：为 `taskMasters` 增加 `createdAt` 索引，并为旧 `DailyBoardTask` 补 `selectedForToday=false`。
- v3：清理开发阶段可能重复生成的未引用 seed 任务，并使用稳定 seed id。

重要注意：

- 如果代码中使用 `orderBy('字段名')`，该字段必须在 Dexie schema 中建立索引，否则页面会卡在加载或进入错误状态。
- 不要随意删除 IndexedDB 数据来掩盖迁移问题，应优先写版本迁移。
- seed 默认任务应避免重复插入。

## 初始常用任务

首次启动会创建 8 个常用任务：

- `かんあぷり` 📱
- `えいごれんしゅう` 🔤
- `こくごれんしゅう` 📖
- `すとれっち` 💃
- `おえかき` 🎨
- `えほん` 📚
- `かんじ` ✏️
- `うくれれ` 🎸

seed id 使用稳定格式：

```ts
seed-${name}
```

## UI 与文案约定

- 儿童可见文字应使用平假名、数字和 emoji。
- 避免儿童界面出现汉字、中文、英文和片假名。
- UI 风格应保持柔和、明亮、儿童友好，不要做成商业后台风格。
- 桌面端布局：
  - 左侧约 65%：2x2 四象限。
  - 右侧约 35%：新增任务、常用任务、生成计划按钮、今日计划。
- 手机和平板使用上下布局。
- 四象限任务卡应保留星星按钮：
  - `☆` / `きょう やる`
  - `★` / `きょう やるよ`
- 家长设置通过右上角齿轮长按进入。

## 测试重点

当前测试覆盖：

- 同一常用任务同一天不能重复加入象限。
- 新象限任务默认 `selectedForToday=false`。
- 星星可以切换选择状态。
- 只有 `selectedForToday=true` 的任务进入今日计划。
- 四个象限都允许进入今日计划。
- 每个象限加入计划数量不受限制。
- 未选择任务时不生成空计划。
- 重新生成计划保留已完成状态。
- 同一任务不会重复生成计划记录。
- 取消星星后可移除未完成计划。
- 打卡不会重复增加完成次数。
- 连续完成、本周完成次数和错过计划的处理。
- 轮换建议。
- 换日。
- Dexie seed 可重复执行且不重复插入。

修改核心规则后必须运行：

```bash
npm run test
npm run build
```

## GitHub

远程仓库：

```text
https://github.com/JeffMa0620/DailyTask.git
```

当前主分支：

```text
main
```

## 开发注意事项

- 不要把 `node_modules/`、`dist/` 提交进仓库。
- `dist/` 是构建产物，通常不需要手工维护。
- 业务规则优先放在 `src/domain/`，React 组件只负责展示和交互。
- IndexedDB 结构变化要通过 Dexie version migration 处理。
- 不要用“删除用户浏览器数据”作为修复方案，除非用户明确要求。
- 如果页面一直显示 `よみこみちゅう`，优先检查浏览器控制台 Dexie 错误和 `useDailyState.reload()`。
- 修改儿童可见文案时，要检查是否误引入汉字、中文、英文或片假名。

## 文件删除限制

遵守用户给出的删除规则：

- 禁止批量删除文件或目录。
- 不要使用：
  - `del /s`
  - `rd /s`
  - `rmdir /s`
  - `Remove-Item -Recurse`
  - `rm -rf`
- 需要删除文件时，只能一次删除一个明确路径的文件。
- 正确示例：

```powershell
Remove-Item "C:\path\to\file.txt"
```

- 如果需要批量删除文件，应停止操作，并请求用户手动删除。
