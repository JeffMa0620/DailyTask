# こども よてい

儿童任务规划网页应用。页面左侧是 2×2 四象限，右侧是新增任务、常用任务和今日计划。数据保存在浏览器 IndexedDB，不需要后端、账号或付费 API。

## 启动

```bash
npm install
npm run dev
```

## 测试与构建

```bash
npm run test
npm run build
```

## 主要设计

- React + TypeScript + Vite 实现主界面。
- `@dnd-kit` 支持鼠标和触摸拖拽。
- Dexie + IndexedDB 保存常用任务、当天四象限、今日计划、完成历史和进度。
- 今日计划生成规则：火焰象限进入 `must`，小苗象限进入 `growth`，糖果象限进入 `optional`，小汽车象限不自动进入计划。
- 儿童可见界面文案使用平假名、数字和 emoji，避免汉字、中文、英文和片假名。
- 桌面端左侧约 65% 为四象限，右侧约 35% 为操作区；手机和平板使用上下布局。
