# DailyTask

儿童任务规划网页应用。页面左侧是 2x2 四象限，右侧是新增任务、常用任务和今日计划。数据保存在浏览器 IndexedDB，不需要后端、账号或付费 API。

## 启动

```bash
npm install
npm run dev
```

默认本地地址：

```text
http://127.0.0.1:5173/DailyTask/
```

GitHub Pages 地址：

```text
https://jeffma0620.github.io/DailyTask/
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
- 四象限只负责分类；点亮任务卡上的星星后，任务才会进入今日计划。
- 今日计划按来源象限分组：`must`、`growth`、`sudden`、`optional`。
- 系统固定文案尽量使用平假名、数字和 emoji；任务名允许平假名、片假名、汉字、英文、数字和 emoji。
- 家长设置支持常用任务 JSON 导入导出，便于批量调整任务。
- 常用任务区支持 `↑` / `↓` 大按钮滚动，方便平板桌面版浏览器操作。
- 桌面端左侧约 65% 为四象限，右侧约 35% 为操作区；手机和平板使用上下布局。
