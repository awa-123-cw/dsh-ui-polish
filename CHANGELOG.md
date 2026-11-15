# Changelog

本项目的所有重要变更都记在这里。版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [1.2.1] — 2026-11-15

### 新增
- **流式水墨晕染覆盖思考（reasoning）输出**：
  - 展开态思考正文用 `[data-variant="think"][data-state="running"]` + `[class*="_thinkBody_"]` 做作用域
    （官方只在「助手正文」与「折叠态思考预览」两处写 `data-streaming`，展开的思考体没有该属性）；
  - 折叠态那行思考预览把宿主的 48px 横向墨尾延长到 72px（文字本身由官方 `TextShimmer` 流光，不叠动效）。

## [1.2.0] — 2026-11-15

### 新增
- **底色三档**：深 / 中 / 浅（默认「中」），设置行内切换，只影响暗色；三档都维持「每层 +1.5~2.5% 微明度」的阶梯。
- **起笔入墨**：`@starting-style` + `transition`，每个新建的块从 `opacity .35 / blur 2.5px / +3px` 晕开一次。

### 变更
- 暗色默认底色由 `#0b0c0e` 提亮为 `#141519`（原值保留在「深」档）。

## [1.1.0] — 2026-11-15

### 修复（来自评审）
- 不再覆盖宿主的 toast `animation`（原写法会丢掉 `translate(-50%)` 居中与自熄淡出）。
- 收笔墨晕跳过含 `table` / `pre` 的正文（mask 按边界框裁切会切掉宽表突破与代码横滚）。
- 思考卡聚焦判定由 `:focus-within` 改为 `:has([contenteditable]:focus)`（避免打开模型选择器时误亮）。
- `font-variant-numeric` 逐类再声明（宿主 `font:` 简写会重置它）。
- 按下反馈改用独立 `scale` 属性（不覆盖宿主 `transform`）。
- 暗色 `label-caption` / `label-tertiary` 提亮到 WCAG AA。

## [1.0.0] — 2026-11-15

### 新增
- 首个版本：颜色 token 覆盖层（`theme.overrideTokens`）+ 运行时样式表 + 「设置 → 通用」开关。
- 落地「大厂 AI 客户端 10 条 UI 铁律」中的 1 / 2 / 3 / 5 / 6 / 8 / 9 / 10 条，第 4 条做到段落级，第 7 条未做。
