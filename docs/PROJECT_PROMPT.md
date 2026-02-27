# 项目提示词（Oddity Co）

用于后续让 AI 快速进入项目上下文，避免破坏现有多文件架构。

## 全局上下文提示词

你正在维护一个纯前端游戏项目“奇物公司（Oddity Co）”。

核心玩法：
1. 材料组合创建奇物
2. 奇物通过照料从 1 阶段成长到 5 阶段
3. 图鉴收集 + 配方情报 + 公司订单 + 研究商店
4. 重复怪物自动共鸣吸收（不无限堆叠）
5. 存在突变/异常状态事件（影响成长）
6. Canvas 绘制可视化宠物形态 + WebAudio 音效
7. 移动端采用单屏面板切换，不用页面滚动

必须遵守：
- 不要把逻辑重新塞回单个 HTML。
- 优先在 `src/data` 增量改数据，在 `src/game` 改玩法逻辑，在 `src/render` 改表现。
- 保持移动端和桌面端都可用。
- 不破坏存档字段兼容（`oddity_company_v2`）。

## 关键模块分工

- 配方与图鉴路径：`src/data/recipes.js`
- 状态事件定义：`src/data/effects.js`
- 订单模板：`src/data/orders.js`
- 商店道具：`src/data/shop.js`
- 重复怪物处理：`src/game/crafting.js`
- 成长与状态结算：`src/game/simulation.js`
- 订单连击奖励：`src/game/orders.js`
- 商店效果结算：`src/game/economy.js`
- UI 渲染与移动端面板：`src/render/dom.js`
- 动画绘制：`src/render/petPainter.js`
- 音效：`src/render/sound.js`

## 提示词模板

### 1) 新增配方与物种

请为“奇物公司”新增 3 条配方和至少 8 个新物种，并满足：
- 在 `src/data/recipes.js` 扩展
- 每条配方包含普通/罕见/怪异概率分布
- 至少 1 个隐藏产物
- 给每个物种补齐 shape、palette、eyeBase、hornOptions、tailOptions、patternOptions
- 新增物种要可被图鉴路径函数识别

### 2) 调整成长平衡

请调整成长系统，让前 2 阶段更快，后 2 阶段更需要精细照料：
- 修改 `src/game/simulation.js` 的衰减和成长公式
- 保留 5 阶段结构和现有照料动作
- 不新增全局依赖

### 3) 扩展订单系统

请扩展公司订单系统，并满足：
- 优先改 `src/data/orders.js` 与 `src/game/orders.js`
- 每条订单有明确进度计算方式
- 奖励必须包含研究点，可选材料奖励
- 避免生成“创建即完成”的订单
- 兼容连击奖励逻辑

### 4) 扩展商店道具

请新增 3 个商店道具并接入效果：
- 在 `src/data/shop.js` 定义道具
- 在 `src/game/economy.js` 实现结算
- 避免纯正收益，包含合理代价或场景限制

### 5) 扩展异常状态

请扩展突变/异常状态系统，并满足：
- 在 `src/data/effects.js` 定义状态，在 `src/game/simulation.js` 结算
- 每个状态说明触发条件、持续刻数、收益/惩罚
- 负向状态可被至少一种照料动作抑制

### 6) 视觉与音效增强

请增强表现层并满足：
- 动画只改 `src/render/petPainter.js` 和必要样式
- 音效只改 `src/render/sound.js` 与调用处
- 移动端保持单屏体验，不增加页面滚动

### 7) 修复问题

你将收到 bug 描述，请：
- 先定位到具体模块（data/game/render）
- 只改必要文件
- 提供复现条件、根因、修复点
- 不做与 bug 无关的重构

## 输出格式建议

每次改动后输出：
1. 改动摘要
2. 修改文件列表
3. 风险点与回归建议
4. 若涉及平衡，给出参数前后对比
