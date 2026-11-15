# dsh-ui-polish · 界面质感精修

> DeepSeek Harness（DSH）桌面端 Web UI 的**纯展示层**精修插件。
> 把「大厂 AI 客户端那 5 招 / 10 条铁律」落到真实界面上：去边框微分层、暗色字重补偿、
> 双环聚焦、等宽数字、弹性动效、流式水墨（含**思考输出**）。

![license](https://img.shields.io/badge/license-MIT-blue.svg)
![dsh](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4f86f7.svg)
![deps](https://img.shields.io/badge/dependencies-0-brightgreen.svg)

- 不改任何 DSH 打包产物，**不动 `app.asar`**
- 零依赖（浏览器半手写，符合官方 `__ModuleLoader__.load` 契约）
- 一个开关 + 三档底色，关掉即还原官方外观

---

## 安装

### 方式一：让 DSH 自己装（最快）

把仓库地址丢给任意会话：

```
安装一下这个皮肤插件：https://github.com/awa-123-cw/dsh-ui-polish
```

### 方式二：命令行

```bash
# 从仓库根目录
git clone https://github.com/awa-123-cw/dsh-ui-polish.git
dsh plugin --profile <你的profile> add ./dsh-ui-polish
```

`<你的profile>` 通常是 `web` 或 `desktop`（看你启动的是哪个）。

### 方式三：手动装配

1. `git clone` 到任意目录（例如 `D:\dsh-plugins\dsh-ui-polish`）
2. 在该 profile 的 `package.json` 里加依赖：`"dsh-ui-polish": "link:D:/dsh-plugins/dsh-ui-polish"`
3. 把它加进同一个 `package.json` 的 `dsh.profile.bundles` 数组
4. 重启 DSH（或刷新页面）加载浏览器半

装好后：**设置 → 通用 → 界面质感精修**。

---

## 用起来

| 位置 | 作用 |
|---|---|
| 设置 → 通用 →「界面质感精修」开关 | 一键开关整套精修；关掉立刻还原官方外观 |
| 同一行的「底色：深 / 中 / 浅」 | 只影响暗色；默认「中」 |

手动复位（控制台）：

```js
localStorage.removeItem('dsh.ui-polish.enabled');
localStorage.removeItem('dsh.ui-polish.depth');
```

---

## 十条铁律落地情况

| # | 铁律 | 状态 | 做法 |
|---|---|---|---|
| 1 | 去边框，靠 1%~3% 微明度分层，禁纯黑 | ✅ | 暗色三档阶梯（见下表）；边框 6%~20% → 4%~15%；浅色底改暖灰 `#fcfcfa`，全程不用纯黑纯白 |
| 2 | 输入框聚焦不加 outline，加深双环 box-shadow | ✅ | 只在 `input`/`textarea` 上叠「内 1px 实色 + 外 3px 柔光」；宿主自己的环几何（`--dsw-focus-ring-width`、组件自持 1.5px 环、pointer 模态不画环的门控、环画在元素内部的做法）**一律不动**；composer 聚焦由卡片描边染强调色（`:has([contenteditable]:focus)`）；`forced-colors` 下退回真实 outline |
| 3 | 暗色字重降 40，防白字发胖 | ✅（等效） | `label-primary` `#f9fafb` → `#e9ecf1`（真正起效的一招）；正文段落另加 `font-weight:350`，并把 `pre/code/kbd/samp` 显式钉回 400 |
| 4 | 流式打字 90ms blur→清晰、相邻错开 30ms | ⚠️ **段落级**（逐字需改 renderer） | 覆盖**两条流式路径**：助手正文 + 思考输出。**起笔入墨** —— `@starting-style` + `transition`，每个新建的块从 `opacity .35 / blur 2.5px / +3px` 晕开一次；**收笔墨晕** —— 末尾固定 40px 渐隐（最深 93%），排除含 `table`/`pre` 的正文；折叠的思考预览把宿主 48px 横向墨尾延长到 72px |
| 5 | 行内图标 `vertical-align:-0.125em` | ✅ | 只作用于行内上下文：`:where(p,li,a,button,span,label) > svg` |
| 6 | 数字防抖 `tabular-nums` | ✅ | body 全局 + 逐类再声明（宿主 `font:` 简写会重置 `font-variant-numeric`），代码元素显式 `normal` |
| 7 | 丝滑折叠 `grid-template-rows: 0fr→1fr` | ❌ 未做 | 需要折叠组件多一层 wrapper 与状态类，属组件级改造 |
| 8 | 防孤字 `text-wrap:pretty` | ✅ | `p/li/blockquote/figcaption` + 标题 `balance`；`pre/code/td/th` 显式退回 `wrap` |
| 9 | 动效分性格：拖拽过阻尼咬死、点赞欠阻尼微弹 | ✅ | 按下 `scale:.96`（独立 `scale` 属性，与宿主 `transform` 相乘而非覆盖）+ 过阻尼 `cubic-bezier(.2,.9,.1,1)`；松开走 `linear()` 弹簧 |
| 10 | 反馈自熄 | ✅（宿主实现 + 补丁） | 提示条的入场/自熄淡出由宿主两段 animation 负责，本插件**不碰 toast**；只给复制成功对勾补欠阻尼微弹，不动 `transform`、不加 `fill-mode` |

### 底色三档（暗色）

| 档位 | 底 | layer-1 | layer-2 | layer-3 | 侧栏 | 输入卡 |
|---|---|---|---|---|---|---|
| `deep` | `#0b0c0e` | `#131418` | `#181920` | `#1e2027` | `#0e0f12` | `#14151a` |
| `medium`（默认） | `#141519` | `#1a1b21` | `#1f2028` | `#26272f` | `#17181d` | `#1b1c22` |
| `soft` | `#1b1c22` | `#212229` | `#262730` | `#2d2e37` | `#1e1f25` | `#23242b` |

三档都保持「每层 +1.5~2.5% 微明度」的阶梯，换档不改变分层关系；都不碰纯黑纯白。

---

## 为什么「逐字」停在段落级

官方 `AssistantMarkdown.tsx` 里每个文本块是 `<MarkdownText key={i} text={block.text} streaming={streaming}/>`：
块元素由 React 按 key 复用，文本逐 token 原地更新。要让**单个字符**从 `blur(6px)` 到清晰、
相邻字错开 30ms，必须在渲染层把每个字符包成独立元素，而那段 DOM 由官方组件拥有——
插件在外面包 `span` 会破坏 React reconciliation（典型症状：`Failed to execute 'removeChild'`）。

所以本插件给出的是**段落级等价表达**：每个新块入墨一次 + 末尾收笔墨边。
想要真正的逐字，需要 fork / patch `@deepseek-ai/dsh-client-ui-chat` 的 `MarkdownText`。

---

## 设计约束

- **颜色零硬编码品牌色**：所有颜色读 `--dsw-alias-*` / `--dsw-specific-*`，深浅两套都覆盖。
- **不覆盖宿主的动画与环几何**：被宿主自持的东西（toast、focus ring、滚动条）一律绕开。
- **用独立变换属性**：`scale` / `translate`，不用 `transform`，避免整条覆盖宿主定位。
- **无障碍**：`prefers-reduced-motion: reduce` 时全部动效关闭；`forced-colors: active` 时补真实 outline。
- **可整体撤销**：token 层是 `overrideTokens` 的独立 layer，样式表是单个 `style#dsh-ui-polish-style`，
  body 属性 `data-dsh-ui-polish` / `data-dsh-ui-polish-depth` 作为统一开关；多窗口经 `storage` 事件同步。

---

## 兼容性与已知限制

- 在 **DSH 桌面端 0.2.2-rc.3（Windows / Electron）** 上开发与验证。
- 内部选择器对官方 CSS Module 类名用**子串匹配**（`[class*="_card_"]`、`[class*="_copied_"]`、`[class*="_thinkBody_"]`）。
  类名带构建哈希，DSH 升级改名后对应规则**静默失效**（不报错、不影响功能），届时更新 `lib/client.js` 即可。
- 与其它皮肤插件共存时，同批 token 若被更高优先级的皮肤覆盖，视觉以它为准（都是运行时注入）。
- 逐字流式晕染（铁律 4 原版）与折叠 grid 过渡（铁律 7）需要 renderer 层配合，本插件不做。

## 自测

不依赖浏览器、不依赖 DSH 本体，纯 Node 跑一遍浏览器半：

```bash
node scripts/smoke.mjs      # ALL CHECKS PASSED
```

覆盖 41 项：模块契约、token 载荷（light/dark 成对）、样式表结构、颜色来源（token 块外无硬编码色值）、
`var(--dsw-*)` 引用是否存在于 `references/dsh-tokens.txt` 白名单、槽位注册、开关与底色三档、
撤销路径与 effect 清理。CI（`.github/workflows/check.yml`）在每次 push 时跑同一套。

白名单来自 DSH 0.2.2-rc.3 的 `@deepseek-ai/dsh-client-ui-theme/src/styles/*.css`（450 个 token）。
上游升级后重新生成即可：

```bash
# 从 DSH 安装目录的 app.asar 里取 styles/*.css，抽出全部 "--dsw-*:" 声明
```

## 目录结构

```
dsh-ui-polish/
├── package.json           # bundle 声明（patch + client platform）
├── cordis.patch.yml       # 挂载进 Web 组合
├── lib/
│   ├── index.js           # 宿主半（无副作用，纯展示插件）
│   └── client.js          # 浏览器半：token 覆盖 + 样式表 + 设置行
├── locale/{zh,en}.json    # 插件列表里的标题/描述/详情入口
├── docs/DETAIL.md         # 插件详情页文档
├── icon.svg               # 插件图标（自制）
├── references/dsh-tokens.txt
└── scripts/smoke.mjs
```

## License

[MIT](LICENSE) © 2026 awa-123-cw

---

## English

**dsh-ui-polish** is a presentation-only plugin for the DeepSeek Harness desktop Web UI.
It overrides colour tokens through the official `theme.overrideTokens` layer and injects one
runtime stylesheet — no patching of `app.asar`, zero dependencies.

It implements 8 of the 10 "premium UI" rules from a popular Bilibili breakdown
(borderless micro-contrast layering, dark-mode weight compensation, dual-ring focus,
tabular numerals, spring motion, feedback auto-expiry) plus a **paragraph-level** streaming
"wet-ink" effect for both assistant output and reasoning output. Per-character ink would require
forking the official `MarkdownText` renderer, because that DOM is owned by React.

Install with `dsh plugin --profile <profile> add ./dsh-ui-polish`, then open
**Settings → General → UI polish**. Toggle it off to restore the stock look instantly.
