// dsh-ui-polish — 浏览器半（官方 __ModuleLoader__.load 契约）。
//
// 设计目标：把「大厂 AI 客户端的 5 招 / 10 条铁律」落到 DSH 桌面端 Web UI 上。
// 手段只有两条，都走官方扩展面，不改任何打包产物：
//   1) client Service `theme.overrideTokens(source, { token: { light, dark } })`
//      —— 官方允许的 token 覆盖层，与主题叠加、可整体撤销；
//   2) 一张运行时注入的样式表（document.head 末尾），只做元素级几何/动效，
//      颜色一律读 --dsw-alias-*, 不硬编码任何品牌色。
//
// 同时注册「设置 → 通用」一行开关（slot: settings.general.item），
// 关掉即整套撤销（token 层 + 样式表 + body 属性），无需卸载插件。

window.__ModuleLoader__.load({
  id: 'dsh-ui-polish',
  factory(require) {
    var React = require('react');
    var h = React.createElement;

    var SOURCE = 'dsh-ui-polish';
    var STYLE_ID = 'dsh-ui-polish-style';
    var ATTR = 'data-dsh-ui-polish';
    var STORAGE_KEY = 'dsh.ui-polish.enabled';
    var DESC_ID = 'dsh-ui-polish-desc';
    var DEPTH_KEY = 'dsh.ui-polish.depth';
    var DEPTH_ATTR = 'data-dsh-ui-polish-depth';
    var DEPTHS = ['deep', 'medium', 'soft'];

    // ─────────────────────────────────────────────────────────────────────
    // 颜色 token 层（铁律 1 + 3）：暗色重建 1.5~2.5% 微明度阶梯、禁纯黑；
    // 浅色用暖灰代替纯白；边框一律降到 3.5%~15%（原 6%~20%）。
    // 暗色的 label-primary 由 #f9fafb 降到 #e9ecf1 —— 深底上的纯白会「光学
    // 发胖」，降一档并配合 body 字重 350 就是视频里说的「暗色补偿」。
    // ─────────────────────────────────────────────────────────────────────
    var TOKENS = {
      '--dsw-alias-bg-base': { light: '#fcfcfa', dark: '#141519' },
      '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#1a1b21' },
      '--dsw-alias-bg-layer-2': { light: '#f7f7f4', dark: '#1f2028' },
      '--dsw-alias-bg-layer-3': { light: '#f1f1ed', dark: '#26272f' },
      '--dsw-specific-sidebar-fill': { light: '#f5f5f2', dark: '#17181d' },
      '--dsw-specific-input-major': { light: '#ffffff', dark: '#1b1c22' },
      '--dsw-alias-border-l1': {
        light: 'rgba(23,24,26,.04)',
        dark: 'rgba(255,255,255,.04)',
      },
      '--dsw-alias-border-l2': {
        light: 'rgba(23,24,26,.08)',
        dark: 'rgba(255,255,255,.08)',
      },
      '--dsw-alias-border-l3': {
        light: 'rgba(23,24,26,.11)',
        dark: 'rgba(255,255,255,.11)',
      },
      '--dsw-alias-border-l4': {
        light: 'rgba(23,24,26,.15)',
        dark: 'rgba(255,255,255,.15)',
      },
      '--dsw-alias-label-primary': { light: '#17191d', dark: '#e9ecf1' },
      '--dsw-alias-label-secondary': { light: '#4f545b', dark: '#b1b7c0' },
      '--dsw-alias-label-tertiary': { light: '#7a8088', dark: '#949aa3' },
      '--dsw-alias-label-caption': { light: '#9ba1a9', dark: '#878d96' },
      '--dsw-alias-interactive-bg-hover': {
        light: 'rgba(24,30,40,.045)',
        dark: 'rgba(255,255,255,.055)',
      },
      '--dsw-alias-interactive-bg-active': {
        light: 'rgba(24,30,40,.08)',
        dark: 'rgba(255,255,255,.10)',
      },
      '--dsw-alias-bg-skeleton': {
        light: 'rgba(23,24,26,.05)',
        dark: 'rgba(255,255,255,.05)',
      },
      '--dsw-alias-scrollbar-bg-l1': {
        light: 'rgba(23,24,26,.18)',
        dark: 'rgba(255,255,255,.14)',
      },
      '--dsw-alias-scrollbar-hover-l1': {
        light: 'rgba(23,24,26,.30)',
        dark: 'rgba(255,255,255,.24)',
      },
    };

    // ─────────────────────────────────────────────────────────────────────
    // 样式表：只做元素级的东西（几何、动效、排版微调），颜色全部走 token。
    // ─────────────────────────────────────────────────────────────────────
    var CSS = [
      /* ── 0. 缓动语言（铁律 9）：两套性格，别混用 ─────────────────── */
      ':root{',
      '  --dsh-polish-ease-rigid: cubic-bezier(.2,.9,.1,1);',
      '  --dsh-polish-ease-ink: cubic-bezier(.215,.61,.355,1);',
      '  --dsh-polish-ease-spring: linear(0,.245 6%,.655 13%,.888 20%,1.008 27%,1.052 34%,1.05 41%,1.032 49%,1.016 58%,1.006 70%,1 84%,1);',
      '}',

      /* ── 铁律 1：不画边框，靠 1%~3% 微明度分层 ────────────────────
         阶梯全部重排（底色更深、每层 +1.5~2.5% 亮度），边框整体降一档。 */
      'body[data-dsh-ui-polish]{',
      '  --dsw-alias-bg-base:#fcfcfa;',
      '  --dsw-alias-bg-layer-1:#ffffff;',
      '  --dsw-alias-bg-layer-2:#f7f7f4;',
      '  --dsw-alias-bg-layer-3:#f1f1ed;',
      '  --dsw-specific-sidebar-fill:#f5f5f2;',
      '  --dsw-specific-input-major:#ffffff;',
      '  --dsw-alias-border-l1:rgba(23,24,26,.04);',
      '  --dsw-alias-border-l2:rgba(23,24,26,.08);',
      '  --dsw-alias-border-l3:rgba(23,24,26,.11);',
      '  --dsw-alias-border-l4:rgba(23,24,26,.15);',
      '  --dsw-alias-label-primary:#17191d;',
      '  --dsw-alias-label-secondary:#4f545b;',
      '  --dsw-alias-label-tertiary:#7a8088;',
      '  --dsw-alias-label-caption:#9ba1a9;',
      '  --dsw-alias-interactive-bg-hover:rgba(24,30,40,.045);',
      '  --dsw-alias-interactive-bg-active:rgba(24,30,40,.08);',
      '  --dsw-alias-scrollbar-bg-l1:rgba(23,24,26,.18);',
      '  --dsw-alias-scrollbar-hover-l1:rgba(23,24,26,.30);',
      '}',
      'body[data-dsh-ui-polish][data-ds-dark-theme]{',
      '  --dsw-alias-bg-base:#141519;',
      '  --dsw-alias-bg-layer-1:#1a1b21;',
      '  --dsw-alias-bg-layer-2:#1f2028;',
      '  --dsw-alias-bg-layer-3:#26272f;',
      '  --dsw-specific-sidebar-fill:#17181d;',
      '  --dsw-specific-input-major:#1b1c22;',
      '  --dsw-alias-border-l1:rgba(255,255,255,.04);',
      '  --dsw-alias-border-l2:rgba(255,255,255,.08);',
      '  --dsw-alias-border-l3:rgba(255,255,255,.11);',
      '  --dsw-alias-border-l4:rgba(255,255,255,.15);',
      '  --dsw-alias-label-primary:#e9ecf1;',
      '  --dsw-alias-label-secondary:#b1b7c0;',
      '  --dsw-alias-label-tertiary:#949aa3;',
      '  --dsw-alias-label-caption:#878d96;',
      '  --dsw-alias-interactive-bg-hover:rgba(255,255,255,.055);',
      '  --dsw-alias-interactive-bg-active:rgba(255,255,255,.10);',
      '  --dsw-alias-bg-skeleton:rgba(255,255,255,.05);',
      '  --dsw-alias-scrollbar-bg-l1:rgba(255,255,255,.14);',
      '  --dsw-alias-scrollbar-hover-l1:rgba(255,255,255,.24);',
      '}',
      /* 铁律 3 暗色补偿：正文段落字重降一档（400 → 350）。
         非可变字重字体（Segoe UI / 微软雅黑）会 snap 回 400，等于无变化；
         可变字重下才真正变细。真正起作用的是暗色 label-primary 由 #f9fafb
         降到 #e9ecf1 —— 深底上的纯白会「光学发胖」。
         只降到正文段落，不碰标题、按钮、品牌字与等宽代码。 */
      'body[data-dsh-ui-polish][data-ds-dark-theme] :where(p, li, dd, blockquote, td, figcaption){',
      '  font-weight:350;',
      '}',
      /* 底色三档（只影响暗色）：默认「中」= 上面那份；deep 更沉、soft 更浮。
         属性选择器权重 (0,3,0) 高于默认暗色块 (0,2,0)，同源叠加即可生效。
         阶梯保持每层 +1.5~2.5% 亮度，换档时分层关系不塌。 */
      'body[data-dsh-ui-polish][data-dsh-ui-polish-depth="deep"][data-ds-dark-theme]{',
      '  --dsw-alias-bg-base:#0b0c0e;',
      '  --dsw-alias-bg-layer-1:#131418;',
      '  --dsw-alias-bg-layer-2:#181920;',
      '  --dsw-alias-bg-layer-3:#1e2027;',
      '  --dsw-specific-sidebar-fill:#0e0f12;',
      '  --dsw-specific-input-major:#14151a;',
      '}',
      'body[data-dsh-ui-polish][data-dsh-ui-polish-depth="soft"][data-ds-dark-theme]{',
      '  --dsw-alias-bg-base:#1b1c22;',
      '  --dsw-alias-bg-layer-1:#212229;',
      '  --dsw-alias-bg-layer-2:#262730;',
      '  --dsw-alias-bg-layer-3:#2d2e37;',
      '  --dsw-specific-sidebar-fill:#1e1f25;',
      '  --dsw-specific-input-major:#23242b;',
      '}',

      /* ── 铁律 2：输入框聚焦不加 outline，改成咬合双环 ───────────────
         宿主自己的环几何（--dsw-focus-ring-width、组件自持的 1.5px 环、
         环画在元素内部的做法、pointer 模态下不画环的门控）全部保留不动，
         只在真正的输入控件上叠加「内 1px 实色 + 外 3px 柔光」。 */
      'body[data-dsh-ui-polish] input:focus-visible,',
      'body[data-dsh-ui-polish] textarea:focus-visible{',
      '  outline: none;',
      '  box-shadow:',
      '    0 0 0 1px var(--dsw-alias-state-business-primary),',
      '    0 0 0 4px color-mix(in srgb, var(--dsw-alias-state-business-primary) 26%, transparent);',
      '}',
      /* composer 的 contenteditable 铺满整张输入卡：在它身上画环会在卡内多出一个
         矩形描边，所以这里只留「卡片描边染强调色」这一种聚焦反馈。 */
      'body[data-dsh-ui-polish] [contenteditable]:not([contenteditable="false"]):focus-visible{',
      '  outline: none;',
      '  box-shadow: none;',
      '}',
      /* 强制色（高对比度）模式下 box-shadow 不渲染，双环退回真实描边 */
      '@media (forced-colors: active){',
      '  body[data-dsh-ui-polish] input:focus-visible,',
      '  body[data-dsh-ui-polish] textarea:focus-visible{',
      '    outline: 2px solid Highlight;',
      '    outline-offset: 1px;',
      '  }',
      '}',
      /* 输入面（composer 卡片）：**可编辑体自己**拿到焦点时才染描边
         （用 :has([contenteditable]:focus) 而不是 :focus-within——卡内挂着
         菜单/工具条锚点，用 focus-within 会在打开模型选择器时误亮） */
      'body[data-dsh-ui-polish] [class*="_card_"]:has([contenteditable]:not([contenteditable="false"]):focus){',
      '  --dsw-elevation-stroke-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, transparent);',
      '  transition: box-shadow .18s var(--dsh-polish-ease-rigid);',
      '}',

      /* ── 铁律 5：行内图标对齐视觉中心 ─────────────────────────────── */
      'body[data-dsh-ui-polish] :where(p, li, a, button, span, label) > svg{ vertical-align:-0.125em; }',

      /* ── 铁律 6：数字防抖（等宽数字，锁住统计/耗时/token 数的横向跳动） ── */
      'body[data-dsh-ui-polish]{ font-variant-numeric: tabular-nums; }',
      /* 宿主多处用 font: 简写（QueueDock / TurnNavigator），简写会把
         font-variant-numeric 重置回 normal；用 (0,1,1) 权重逐类再声明一次。 */
      'body[data-dsh-ui-polish] :where(p, li, td, th, time, span, div, button){ font-variant-numeric: tabular-nums; }',
      'body[data-dsh-ui-polish] :where(pre, code, kbd, samp){ font-variant-numeric: normal; }',

      /* ── 铁律 8：防孤字 + 标题平衡断行 ─────────────────────────────── */
      'body[data-dsh-ui-polish] p,',
      'body[data-dsh-ui-polish] li,',
      'body[data-dsh-ui-polish] blockquote,',
      'body[data-dsh-ui-polish] figcaption{ text-wrap: pretty; }',
      /* text-wrap 会继承：代码块与单元格显式退回默认断行，别让 pretty 参与
         代码换行决策（宿主对代码块有自己的 white-space/word-break 契约）。 */
      'body[data-dsh-ui-polish] :where(pre, code, kbd, samp, td, th){ text-wrap: wrap; }',
      'body[data-dsh-ui-polish] h1,',
      'body[data-dsh-ui-polish] h2,',
      'body[data-dsh-ui-polish] h3{ text-wrap: balance; }',

      /* ── 铁律 4：流式打字像水墨晕染（助手正文 + 思考输出） ───────────
         逐字 blur→清晰需要渲染层把每个字符包成 span（React 拥有那层 DOM，
         CSS 不能改结构），样式层做的是「段落级起笔入墨 + 容器级收笔」。
         两个流式上下文各有一个稳定钩子：
           · 助手正文 —— div[data-streaming]（AssistantMarkdown.root）
           · 思考输出 —— [data-variant="think"][data-state="running"] 里的
             [class*="_thinkBody_"]（官方只在「助手正文」与「折叠态思考预览」
             两处写 data-streaming，展开的思考正文没有该属性，但外层 root 带
             data-variant / data-state，用它做作用域）；折叠态那行预览另做处理。
         起笔入墨：每个**新建的块**（段落 / 列表项 / 标题 / 代码块 / 表格行）从
         虚焦到实墨晕开一次。用 @starting-style 而不是 wrap 字符 —— 块元素由
         React 按 key 复用，只有真正新出现的块才触发，逐 token 的文本更新不会
         重播。逐字（单字 90ms / 相邻错开 30ms）必须由 renderer 包字符，
         样式层做不到，这里是段落级的等价表达。
         收笔墨晕的两个排除项：
           · 含 table 的正文 —— 4 列以上宽表靠负 margin 突破正文列，mask 按
             元素边界框裁切，会把突破部分切掉；
           · 含 pre 的正文 —— 代码块横向滚动区贴着边界框，同样会被切。
         用固定像素而非百分比：按高度百分比会让长回答末段数百像素一直在渐变里。
         入场前的起始值放在顶层 at-rule（Chromium 105+）；「减弱动效」只要把下面
         的 transition 关掉，起始值就无从播放。 */
      '@starting-style{',
      '  body[data-dsh-ui-polish] :is(div[data-streaming], [data-variant="think"][data-state="running"] [class*="_thinkBody_"]) :where(p, li, h1, h2, h3, h4, h5, h6, pre, blockquote, tr){',
      '    opacity: .35;',
      '    filter: blur(2.5px);',
      '    translate: 0 3px;',
      '  }',
      '}',
      '@media (prefers-reduced-motion: no-preference){',
      '  body[data-dsh-ui-polish] :is(div[data-streaming], [data-variant="think"][data-state="running"] [class*="_thinkBody_"]) :where(p, li, h1, h2, h3, h4, h5, h6, pre, blockquote, tr){',
      '    transition: opacity .22s var(--dsh-polish-ease-ink), filter .22s var(--dsh-polish-ease-ink), translate .22s var(--dsh-polish-ease-ink);',
      '  }',
      '}',
      /* 收笔墨晕：助手正文与**展开的思考正文**同一套（末尾 40px，最深 93%）； */
      '@media (prefers-reduced-motion: no-preference){',
      '  body[data-dsh-ui-polish] :is(div[data-streaming], [data-variant="think"][data-state="running"] [class*="_thinkBody_"]):not(:has(table, pre)){',
      '    -webkit-mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - 40px), rgb(0 0 0 / 93%) 100%);',
      '    mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - 40px), rgb(0 0 0 / 93%) 100%);',
      '  }',
      /* 折叠态那行思考预览是单行 nowrap：宿主自带 48px 横向渐隐，这里把墨尾拉到
         72px（文字本身已由官方 TextShimmer 做流光，不再叠动效）。 */
      '  body[data-dsh-ui-polish] [data-variant="think"][data-state="running"] [class*="_summary_"]{',
      '    -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 72px), transparent);',
      '    mask-image: linear-gradient(90deg, #000 calc(100% - 72px), transparent);',
      '  }',
      '}',

      /* ── 铁律 9：动效分性格 ─────────────────────────────────────────
         按下 = 立即到位（过阻尼，零回弹）；松开 = 欠阻尼弹簧微回。
         用独立的 `scale` 属性而不是 transform：它与组件自己的 transform
         （分段滑块、弹层箭头、拖拽手柄的 translate）相乘而不是覆盖，不会打架。 */
      '@media (prefers-reduced-motion: no-preference){',
      '  body[data-dsh-ui-polish] button,',
      '  body[data-dsh-ui-polish] [role="button"],',
      '  body[data-dsh-ui-polish] [class*="_iconButton_"],',
      '  body[data-dsh-ui-polish] [class*="_menuItem_"]{',
      '    transition:',
      '      background-color .16s var(--dsh-polish-ease-rigid),',
      '      color .16s var(--dsh-polish-ease-rigid),',
      '      opacity .16s var(--dsh-polish-ease-rigid),',
      '      box-shadow .18s var(--dsh-polish-ease-rigid),',
      '      scale .26s var(--dsh-polish-ease-spring);',
      '  }',
      '  body[data-dsh-ui-polish] button:active:not(:disabled),',
      '  body[data-dsh-ui-polish] [role="button"]:active{ scale: .96; }',
      '}',

      /* ── 铁律 10：反馈自熄（微弹一下再静下来） ───────────────────── */
      /* ── 铁律 10：反馈自熄 ─────────────────────────────────────────
         提示条的入场与自熄淡出由宿主两段 animation 完成（_dsh-toast-in +
         _dsh-toast-fade … forwards），整条 animation 一旦被覆盖会让提示条
         丢掉 translate(-50%) 居中并停在中线右侧——所以这里**不碰 toast**。
         只给「复制成功对勾」补一个欠阻尼微弹：只动独立属性 scale/opacity，
         且不加 fill-mode，播完即回元素自身声明（不会永久钉住终帧、压掉
         宿主后续的 transform/opacity 变化）。 */
      '@keyframes dsh-polish-pop{',
      '  0%{ scale:.55; opacity:0 }',
      '  60%{ scale:1.12; opacity:1 }',
      '  100%{ scale:1; opacity:1 }',
      '}',
      '@media (prefers-reduced-motion: no-preference){',
      '  body[data-dsh-ui-polish] [class*="_copied_"],',
      '  body[data-dsh-ui-polish] [class*="_checkMark_"]{',
      '    animation: dsh-polish-pop .36s var(--dsh-polish-ease-spring);',
      '  }',
      '}',

      /* ── 补充：选中文字跟随强调色（不在十条里，但同一套「质感」） ── */
      'body[data-dsh-ui-polish] ::selection{',
      '  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 32%, transparent);',
      '  color: inherit;',
      '}',

      /* ── 无障碍兜底：系统要求减弱动效时，全部还原 ─────────────────── */
      '@media (prefers-reduced-motion: reduce){',
      '  body[data-dsh-ui-polish] button,',
      '  body[data-dsh-ui-polish] [role="button"],',
      '  body[data-dsh-ui-polish] [class*="_iconButton_"],',
      '  body[data-dsh-ui-polish] [class*="_menuItem_"]{ transition:none; }',
      '  body[data-dsh-ui-polish] button:active:not(:disabled),',
      '  body[data-dsh-ui-polish] [role="button"]:active{ scale: none; }',
      '  body[data-dsh-ui-polish] [class*="_copied_"],',
      '  body[data-dsh-ui-polish] [class*="_checkMark_"]{ animation:none; }',
      '  body[data-dsh-ui-polish] :is(div[data-streaming], [data-variant="think"][data-state="running"] [class*="_thinkBody_"], [data-variant="think"][data-state="running"] [class*="_summary_"]){ -webkit-mask-image:none; mask-image:none; }',
      '}',
    ].join('\n');

    var tokensApplied = null;
    var currentCtx = null;
    var translate = null;

    // 可见文案走 Client locale 服务；注册失败时自动回落到内置中文。
    var TEXT = {
      title: { en: 'UI polish', 'zh-CN': '界面质感精修' },
      description: {
        en: 'Borderless micro-contrast layers, dark-mode weight compensation, dual-ring focus, tabular numerals, spring motion and streaming ink. Turning it off restores the stock look immediately.',
        'zh-CN':
          '去边框微分层、暗色字重补偿、双环聚焦、等宽数字、弹性动效与流式墨韵；关闭后立即还原官方外观。',
      },
      switch: { en: 'UI polish', 'zh-CN': '界面质感精修' },
      'depth.label': { en: 'Background', 'zh-CN': '底色' },
      'depth.deep': { en: 'Deep', 'zh-CN': '深' },
      'depth.medium': { en: 'Mid', 'zh-CN': '中' },
      'depth.soft': { en: 'Light', 'zh-CN': '浅' },
    };

    function t(key) {
      var fallback = (TEXT[key] && TEXT[key]['zh-CN']) || key;
      if (!translate) return fallback;
      try {
        var value = translate(key);
        return typeof value === 'string' && value && value !== key ? value : fallback;
      } catch (error) {
        return fallback;
      }
    }

    function readEnabled() {
      try {
        return window.localStorage.getItem(STORAGE_KEY) !== '0';
      } catch (error) {
        return true;
      }
    }

    function writeEnabled(value) {
      try {
        window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
      } catch (error) {
        /* 隐私模式等场景写入失败：只影响是否记住选择，不影响当次生效 */
      }
    }

    // 底色三档：deep / medium（默认）/ soft。只影响暗色，浅色始终一套暖灰。
    function readDepth() {
      try {
        var value = window.localStorage.getItem(DEPTH_KEY);
        return DEPTHS.indexOf(value) >= 0 ? value : 'medium';
      } catch (error) {
        return 'medium';
      }
    }

    function writeDepth(value) {
      try {
        window.localStorage.setItem(DEPTH_KEY, value);
      } catch (error) {
        /* 写入失败只影响记忆，不影响当次生效 */
      }
    }

    function setDepthAttribute(depth) {
      var body = document.body;
      if (!body) return;
      if (!depth || depth === 'medium') body.removeAttribute(DEPTH_ATTR);
      else body.setAttribute(DEPTH_ATTR, depth);
    }

    // 套用/撤销整套质感层。tokens 层用官方 overrideTokens（可整体撤销），
    // 样式表用 head 末尾的 style 标签，body 属性作为所有规则的开关凭据。
    function setEnabled(ctx, enabled, depth) {
      var body = document.body;
      if (!body) return;
      var style = document.getElementById(STYLE_ID);

      if (enabled) {
        body.setAttribute(ATTR, '');
        setDepthAttribute(depth || readDepth());
        if (!style) {
          style = document.createElement('style');
          style.id = STYLE_ID;
          style.dataset.plugin = SOURCE;
          style.textContent = CSS;
          document.head.append(style);
        }
        if (ctx && ctx.theme && typeof ctx.theme.overrideTokens === 'function') {
          tokensApplied = ctx.theme.overrideTokens(SOURCE, TOKENS);
        }
      } else {
        body.removeAttribute(ATTR);
        body.removeAttribute(DEPTH_ATTR);
        if (style) style.remove();
        if (tokensApplied) {
          try {
            tokensApplied();
          } catch (error) {
            /* 层已被同 source 的新层替换时撤销是 no-op，忽略即可 */
          }
          tokensApplied = null;
        }
      }
    }

    // ── 设置 → 通用 里的一行开关（slot: settings.general.item）──────
    function PolishRow() {
      var state = React.useState(readEnabled());
      var enabled = state[0];
      var setState = state[1];
      var depthState = React.useState(readDepth());
      var depth = depthState[0];
      var setDepthState = depthState[1];

      // 另一窗口/标签改动 localStorage 时，本窗口的 switch 外观同步
      // （DOM 层由模块级监听负责，这里只同步 React state）。
      React.useEffect(function () {
        function onStorage(event) {
          if (!event) return;
          if (event.key === STORAGE_KEY) setState(readEnabled());
          else if (event.key === DEPTH_KEY) setDepthState(readDepth());
        }
        if (typeof window.addEventListener === 'function') {
          window.addEventListener('storage', onStorage);
          return function () { window.removeEventListener('storage', onStorage); };
        }
        return undefined;
      }, []);

      function toggle() {
        var next = !enabled;
        setState(next);
        writeEnabled(next);
        setEnabled(currentCtx, next, depth);
      }

      function pickDepth(value) {
        setDepthState(value);
        writeDepth(value);
        if (enabled) setEnabled(currentCtx, true, value);
        else setDepthAttribute(value);
      }

      var track = {
        position: 'relative',
        flex: '0 0 auto',
        width: 40,
        height: 24,
        padding: 0,
        border: '1px solid ' + (enabled ? 'transparent' : 'var(--dsw-alias-border-l3)'),
        borderRadius: 999,
        background: enabled
          ? 'var(--dsw-alias-state-business-primary)'
          : 'var(--dsw-alias-interactive-bg-active)',
        cursor: 'pointer',
        transition:
          'background-color .18s var(--dsh-polish-ease-rigid), border-color .18s var(--dsh-polish-ease-rigid)',
      };
      var knob = {
        position: 'absolute',
        top: 2,
        left: enabled ? 18 : 2,
        width: 18,
        height: 18,
        borderRadius: 999,
        background: enabled ? 'var(--dsw-alias-switch-thumb)' : 'var(--dsw-alias-label-tertiary)',
        boxShadow: '0 1px 2px rgba(0,0,0,.28)',
        transition: 'left .28s var(--dsh-polish-ease-spring), background-color .18s linear',
      };

      function chip(value) {
        var active = depth === value;
        return h(
          'button',
          {
            key: value,
            type: 'button',
            role: 'radio',
            'aria-checked': active,
            'aria-label': t('depth.' + value),
            onClick: function () { pickDepth(value); },
            style: {
              height: 24,
              padding: '0 10px',
              border: '1px solid ' + (active ? 'transparent' : 'var(--dsw-alias-border-l3)'),
              borderRadius: 999,
              background: active ? 'var(--dsw-alias-interactive-bg-active)' : 'transparent',
              color: active ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-tertiary)',
              fontSize: 12,
              lineHeight: '20px',
              cursor: 'pointer',
              transition: 'background-color .16s var(--dsh-polish-ease-rigid), color .16s var(--dsh-polish-ease-rigid)',
            },
          },
          t('depth.' + value),
        );
      }

      return h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
            padding: '16px 0',
            borderBottom: '0.5px solid var(--dsw-alias-border-l2)',
          },
        },
        h(
          'div',
          { style: { minWidth: 0 } },
          h(
            'div',
            {
              style: {
                fontSize: 14,
                lineHeight: '22px',
                color: 'var(--dsw-alias-label-primary)',
              },
            },
            t('title'),
          ),
          h(
            'div',
            {
              id: DESC_ID,
              style: {
                marginTop: 2,
                fontSize: 12,
                lineHeight: '18px',
                color: 'var(--dsw-alias-label-tertiary)',
              },
            },
            t('description'),
          ),
          h(
            'div',
            {
              role: 'radiogroup',
              'aria-label': t('depth.label'),
              'aria-describedby': DESC_ID,
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 8,
                opacity: enabled ? 1 : 0.5,
              },
            },
            h('span', {
              style: {
                fontSize: 12,
                lineHeight: '20px',
                color: 'var(--dsw-alias-label-tertiary)',
                marginRight: 2,
              },
            }, t('depth.label')),
            chip('deep'),
            chip('medium'),
            chip('soft'),
          ),
        ),
        h(
          'button',
          {
            type: 'button',
            role: 'switch',
            'aria-checked': enabled,
            'aria-label': t('switch'),
            'aria-describedby': DESC_ID,
            title: t('switch'),
            onClick: toggle,
            style: track,
          },
          h('span', { style: knob }),
        ),
      );
    }

    return {
      inject: ['slots', 'theme', 'locale'],
      apply(ctx) {
        currentCtx = ctx;

        // 文案登记（失败不阻断功能：t() 会回落到内置中文）。
        try {
          if (ctx.locale && typeof ctx.locale.register === 'function') {
            var flat = {};
            Object.keys(TEXT).forEach(function (key) {
              flat[key] = TEXT[key]['zh-CN'];
            });
            var en = {};
            Object.keys(TEXT).forEach(function (key) {
              en[key] = TEXT[key].en;
            });
            ctx.locale.register('ui-polish', 'zh-CN', flat);
            ctx.locale.register('ui-polish', 'en', en);
            translate = ctx.locale.bind('ui-polish');
          }
        } catch (error) {
          translate = null;
        }

        setEnabled(ctx, readEnabled());

        // 资源全部登记在 ctx.effect 里，卸载时自动回收。
        ctx.effect(function () {
          // 多窗口/多标签同步：另一个窗口拨了开关，本窗口跟着走。
          var onStorage = function (event) {
            if (event && event.key && event.key !== STORAGE_KEY) return;
            setEnabled(ctx, readEnabled());
          };
          if (typeof window.addEventListener === 'function') {
            window.addEventListener('storage', onStorage);
          }
          return function cleanup() {
            if (typeof window.removeEventListener === 'function') {
              window.removeEventListener('storage', onStorage);
            }
            var style = document.getElementById(STYLE_ID);
            if (style) style.remove();
            if (document.body) {
              document.body.removeAttribute(ATTR);
              document.body.removeAttribute(DEPTH_ATTR);
            }
            if (tokensApplied) {
              try {
                tokensApplied();
              } catch (error) {
                /* no-op */
              }
              tokensApplied = null;
            }
          };
        });

        ctx.slots.inject('settings.general.item', function () {
          return ctx.slots.register(
            { name: 'settings.general.item', id: 'ui-polish', order: 40 },
            PolishRow,
          );
        });
      },
    };
  },
});
