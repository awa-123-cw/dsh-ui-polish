# 界面质感精修（dsh-ui-polish）

## 它是什么

DSH 桌面端 Web UI 的**展示层精修包**。它不新增面板、不接管任何交互，只调整
「看起来贵还是廉价」的那一层：颜色阶梯、边框粗细、聚焦环、数字宽度、动效曲线、
流式输出的收笔质感。

依据的标准来自「扒了大厂 AI 客户端源码，质感全靠这 5 招」里那 10 条铁律
（去边框微分层 / 输入框双环 / 暗色字重补偿 / 流式晕染 / 行内图标对齐 /
数字防抖 / 丝滑折叠 / 防孤字 / 动效性格 / 反馈自熄）。

## 它做了什么

1. **颜色 token 覆盖**（官方 `theme.overrideTokens`，独立 layer，可整体撤销）
   - 暗色：默认「中」档底 `#141519`，三层抬升面 `#1a1b21` → `#1f2028` → `#26272f`（可在设置里切「深 / 中 / 浅」三档），
     靠 1.5%~2.5% 的微明度差分层，全程不用纯黑纯白。
   - 边框：原先 6%~20% 的白色描边降到 3.5%~15%，让「分层」承担结构，边框退回发丝级。
   - 文字：`label-primary` `#f9fafb` → `#e9ecf1`（深底上的纯白会光学发胖），
     次级/三级文字同步重排，保持原有层级关系。
   - 浅色：底色改用暖灰 `#fcfcfa`，避免白得像塑料。
2. **样式表**（`style#dsh-ui-polish-style`，注入在 head 末尾，随开关增删）
   - 双环聚焦只加在 `input` / `textarea` 上；宿主的环几何、pointer 模态不画环的门控、
     组件把环画在元素内部的做法全部保持原样。`forced-colors` 下退回真实 outline。
   - composer 只在可编辑体**自己**拿到焦点时染卡片描边（`:has([contenteditable]:focus)`，
     不用 `:focus-within` —— 卡内挂着菜单锚点，focus-within 会在打开模型选择器时误亮）。
   - `tabular-nums` 逐类再声明（宿主 `font:` 简省会重置它），代码元素显式 `normal`。
   - `text-wrap:pretty` 只给段落级元素，`pre/code/td/th` 显式退回 `wrap`；`balance` 只给 h1-h3。
   - 行内图标对齐只作用于 `:where(p,li,a,button,span,label) > svg`。
   - 弹性动效：按下 `scale:.96`（独立属性，与宿主 `transform` 相乘而非覆盖），松开走
     `linear()` 弹簧；`prefers-reduced-motion: reduce` 时全部关闭。
   - 流式水墨：覆盖**助手正文**（`div[data-streaming]`）与**思考输出**
     （`[data-variant="think"][data-state="running"] [class*="_thinkBody_"]`）两条路径。
     **起笔入墨** —— `@starting-style` + `transition`，每个新建的块从
     `opacity .35 / blur 2.5px` 晕开一次（块由 React 按 key 复用，逐 token 文本更新不重播）；
     **收笔墨晕** —— 末尾固定 40px 渐隐（最深 93%），**排除含 table/pre 的正文**
     （mask 按边界框裁切，会切掉 4 列以上宽表的突破与代码横滚）；折叠态那行思考预览
     把宿主的 48px 横向墨尾拉到 72px。
   - 反馈自熄：不碰 toast（宿主两段动画含自熄淡出，覆盖会让提示条丢居中）；只给复制
     成功对勾补欠阻尼微弹，且不动 `transform`、不加 `fill-mode`。
3. **设置 → 通用**里的一行（`slot: settings.general.item`，id `ui-polish`）：开关 + 底色三档
   「深 / 中 / 浅」，关闭即撤销 token 层 + 样式表 + body 属性。

## 怎么用

- 安装并重启 DSH 桌面端（client half 需要重载页面）。
- 开关位置：**设置 → 通用 → 界面质感精修**。
- 手动复位：浏览器里 `localStorage.removeItem('dsh.ui-polish.enabled')` 后刷新。

## 边界与限制

- **不改结构**：所有规则都是 CSS 层面的覆盖，不移动、不替换官方组件。
- **铁律 4 只做到段落级**：逐字 blur→清晰（单字 90ms、相邻错开 30ms）需要渲染层把每个字符包成独立元素（或逐字挂动画），
  而那段 DOM 由 React 拥有；强行包裹会破坏 reconciliation，因此本插件只做
  「正在写出的那一段整体带轻微墨晕」。
- **铁律 7 未实现**：`grid-template-rows:0fr→1fr` 需要折叠组件本身多一层 wrapper
  与状态类，属组件级改造，不在展示层做投机性覆盖。
- **类名依赖**：内部选择器用子串匹配官方 CSS Module 类名（`_card_`、`_copied_`、
  `_toast_` 等）。DSH 升级可能改哈希；改名后对应规则静默失效，不影响功能。
- **与其它皮肤共存**：若别的皮肤插件用更高优先级覆盖同批 token，以它为准。
