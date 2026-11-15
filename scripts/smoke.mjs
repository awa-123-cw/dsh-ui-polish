#!/usr/bin/env node
// dsh-ui-polish 冒烟测试：不需要浏览器，把浏览器半（lib/client.js）真的执行一遍。
//
// 覆盖：模块契约、token 载荷、样式表结构、颜色来源（不得硬编码）、
//       --dsw-* 引用是否存在于上游 token 白名单、槽位注册、开关与底色档位、
//       撤销路径与 effect 清理。
//
// 用法：node scripts/smoke.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT = path.join(ROOT, 'lib', 'client.js');
const WHITELIST = path.join(ROOT, 'references', 'dsh-tokens.txt');

const failures = [];
const check = (ok, label, detail) => {
  if (ok) {
    console.log(`  ok   ${label}`);
  } else {
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
    failures.push(label);
  }
};

// ── 假 DOM ───────────────────────────────────────────────────────────────────
const head = [];
const bodyAttrs = new Map();
const makeEl = (tag) => ({
  tagName: tag,
  id: '',
  dataset: {},
  textContent: '',
  style: {},
  setAttribute(key, value) { bodyAttrs.set(key, value); },
  removeAttribute(key) { bodyAttrs.delete(key); },
  remove() { const at = head.indexOf(this); if (at >= 0) head.splice(at, 1); },
});
globalThis.document = {
  createElement: makeEl,
  head: { append(el) { head.push(el); } },
  getElementById(id) { return head.find((el) => el.id === id) ?? null; },
  body: {
    setAttribute(key, value) { bodyAttrs.set(key, value); },
    removeAttribute(key) { bodyAttrs.delete(key); },
  },
};

const store = new Map();
const listeners = new Map();
globalThis.window = {
  __ModuleLoader__: { load(def) { globalThis.__def = def; } },
  addEventListener(type, fn) { listeners.set(type, [...(listeners.get(type) ?? []), fn]); },
  removeEventListener(type, fn) {
    listeners.set(type, (listeners.get(type) ?? []).filter((item) => item !== fn));
  },
  localStorage: {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, value); },
  },
};

// ── 假 React ─────────────────────────────────────────────────────────────────
const ReactStub = {
  createElement(type, props, ...children) { return { type, props: props ?? {}, children }; },
  useState(initial) { return [initial, () => {}]; },
  useRef(value) { return { current: value }; },
  useEffect() { return undefined; },
};
const requireStub = (name) => {
  if (name === 'react') return ReactStub;
  throw new Error(`浏览器半 import 了非预期模块：${name}`);
};

console.log('dsh-ui-polish smoke test');

// ── 执行浏览器半 ─────────────────────────────────────────────────────────────
eval(fs.readFileSync(CLIENT, 'utf8'));

const def = globalThis.__def;
check(Boolean(def), '模块通过 __ModuleLoader__.load 注册');
check(def?.id === 'dsh-ui-polish', '模块 id 与包名一致', def?.id);

const clientModule = def.factory(requireStub);
check(
  Array.isArray(clientModule.inject) && ['slots', 'theme', 'locale'].every((k) => clientModule.inject.includes(k)),
  '声明了 slots / theme / locale 依赖',
  JSON.stringify(clientModule.inject),
);

const calls = { tokens: null, tokensDisposed: 0, injected: [], registered: null, effects: 0, locales: [] };
const ctx = {
  theme: {
    overrideTokens(source, tokens) {
      calls.tokens = { source, tokens };
      return () => { calls.tokensDisposed += 1; };
    },
  },
  slots: {
    inject(key, callback) { calls.injected.push(key); callback(); },
    register(registration, component) {
      calls.registered = { registration, component };
      return () => {};
    },
  },
  locale: (() => {
    const dicts = {};
    return {
      register(ns, locale, dict) {
        dicts[locale] = { ...(dicts[locale] ?? {}), ...dict };
        calls.locales.push({ ns, locale, keys: Object.keys(dict) });
        return () => {};
      },
      bind() { return (key) => dicts['zh-CN']?.[key] ?? key; },
    };
  })(),
  effect(fn) { calls.effects += 1; calls.cleanup = fn(); },
};

clientModule.apply(ctx);

// ── 样式表 ───────────────────────────────────────────────────────────────────
const styleEl = head.find((el) => el.id === 'dsh-ui-polish-style');
check(Boolean(styleEl), '向 head 注入 style#dsh-ui-polish-style');
const css = styleEl?.textContent ?? '';
check(css.length > 2000, '样式表有内容', `${css.length} 字符`);
check(bodyAttrs.has('data-dsh-ui-polish'), 'body 打上 data-dsh-ui-polish');

const open = (css.match(/\{/g) ?? []).length;
const close = (css.match(/\}/g) ?? []).length;
check(open === close && open > 20, '大括号配平', `${open} 开 / ${close} 闭`);
check(!css.includes('${'), '无未解析的模板占位');
check(!css.includes('`'), '无残留反引号');
check(!/[^{}]\{\s*\}/.test(css), '无空规则块');

const badRules = [];
for (const match of css.matchAll(/(^|\n)([^{}\n]+)\{/g)) {
  const selector = match[2].trim();
  if (!selector || selector.startsWith('@') || /^\d+%$/.test(selector)) continue;
  if (!/[.#\[:a-zA-Z*]/.test(selector)) badRules.push(selector);
}
check(badRules.length === 0, '每条规则都有选择器', badRules.slice(0, 3).join(' | '));

// ── token 载荷 ───────────────────────────────────────────────────────────────
const tokens = calls.tokens?.tokens ?? {};
const names = Object.keys(tokens);
check(names.length >= 15, 'token 覆盖层已填充', `${names.length} 个 token`);
check(calls.tokens?.source === 'dsh-ui-polish', '覆盖层以插件名命名');
const malformed = names.filter((n) => typeof tokens[n]?.light !== 'string' || typeof tokens[n]?.dark !== 'string');
check(malformed.length === 0, '每个 token 都有 light + dark', malformed.slice(0, 3).join(', '));
const dup = names.filter((n) => !/^--dsw-[a-z0-9-]+$/.test(n));
check(dup.length === 0, 'token 名符合 --dsw-* 规则', dup.join(', '));

// ── 颜色来源：除 token 定义块与 mask（黑=不透明通道）外不得硬编码色值 ─────────
const bodyTokenBlocks = [...css.matchAll(/body\[data-dsh-ui-polish\][^{]*\{[^}]*\}/g)].map((m) => m[0]);
// 「浅色 / 暗色默认」两块 —— 只认真正声明了 token 的 body 级规则
// （body[data-dsh-ui-polish]{font-variant-numeric:…} 这类也会命中上面的正则）
const plainBlocks = bodyTokenBlocks.filter((block) =>
  /^body\[data-dsh-ui-polish\](?:\[data-ds-dark-theme\])?\{/.test(block)
  && /--dsw-[a-z0-9-]+\s*:/.test(block));
const cssWithoutTokens = bodyTokenBlocks
  .reduce((acc, block) => acc.replace(block, ''), css)
  .replace(/[^;{}]*mask-image[^;}]*/g, '');
const hexOutside = [...cssWithoutTokens.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);
check(hexOutside.length === 0, 'token 块外不硬编码十六进制色值', hexOutside.slice(0, 5).join(', '));
check(plainBlocks.length === 2, '浅色 / 暗色默认两块 token 齐备', `${plainBlocks.length} / ${bodyTokenBlocks.length}`);
check(bodyTokenBlocks.length >= 4, '底色档位以额外 token 块叠加', `${bodyTokenBlocks.length} 块`);

const cssTokenPairs = [...plainBlocks.join('\n').matchAll(/(--dsw-[a-z0-9-]+)\s*:\s*([^;}]+)/g)]
  .map((m) => [m[1], m[2].trim()]);
const mismatch = cssTokenPairs.filter(([name, value]) => {
  const entry = tokens[name];
  if (!entry) return true;
  return !(entry.light === value || entry.dark === value);
});
check(mismatch.length === 0, 'CSS token 值与 overrideTokens 载荷一致', mismatch.slice(0, 3).map((m) => m[0]).join(', '));
check(
  new Set(cssTokenPairs.map(([name]) => name)).size === names.length,
  '每个被覆盖的 token 也在 CSS 里声明（双保险）',
);

// ── var(--dsw-*) 引用必须存在于上游白名单 ────────────────────────────────────
const whitelist = new Set(
  fs.readFileSync(WHITELIST, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('--dsw-')),
);
check(whitelist.size > 100, '上游 token 白名单已加载', `${whitelist.size} 个`);
// 全量扫描（含 JS 内联样式里的 var(--dsw-*)），不只扫样式表
const source = fs.readFileSync(CLIENT, 'utf8');
const used = new Set([...source.matchAll(/var\((--dsw-[a-z0-9-]+)/g)].map((m) => m[1]));
const unknown = [...used].filter((n) => !whitelist.has(n));
check(unknown.length === 0, `引用的 ${used.size} 个 --dsw-* 均存在于上游`, unknown.join(', '));

// ── 槽位注册 ─────────────────────────────────────────────────────────────────
check(calls.injected.includes('settings.general.item'), '注入「设置 → 通用」行槽位');
check(calls.registered?.registration?.id === 'ui-polish', '注册行 id 为 ui-polish');
check(typeof calls.registered?.component === 'function', '行是 React 组件');
check(calls.locales.length === 2, '登记两份文案字典', calls.locales.map((l) => l.locale).join(', '));

// ── 行渲染：标题 / 描述 / 开关 / 底色三档 ────────────────────────────────────
const tree = calls.registered.component();
const nodes = [];
const texts = [];
(function walk(node) {
  if (node == null) return;
  if (typeof node === 'string' || typeof node === 'number') { texts.push(String(node)); return; }
  if (typeof node !== 'object') return;
  nodes.push(node);
  (node.children ?? []).forEach(walk);
})(tree);
const switchNode = nodes.find((n) => n.props?.role === 'switch');
const radios = nodes.filter((n) => n.props?.role === 'radio');
check(/界面质感精修/.test(texts.join(' ')), '行标题已本地化');
check(Boolean(switchNode), '渲染 role="switch"');
check(switchNode?.props?.['aria-checked'] === true, '开关默认开启');
check(radios.length === 3, '渲染底色三档', `${radios.length} 个`);
check(radios.every((n) => typeof n.props.onClick === 'function'), '三档都可点击');

// 选中「深」档 → 打上档位属性
radios[0].props.onClick();
check(bodyAttrs.get('data-dsh-ui-polish-depth') === 'deep', '切到「深」档写入 data-dsh-ui-polish-depth');

// ── 关闭：三者一起撤销 ───────────────────────────────────────────────────────
switchNode.props.onClick();
check(!head.find((el) => el.id === 'dsh-ui-polish-style'), '关闭后样式表被移除');
check(!bodyAttrs.has('data-dsh-ui-polish'), '关闭后 body 标记被移除');
check(!bodyAttrs.has('data-dsh-ui-polish-depth'), '关闭后档位标记被移除');
check(calls.tokensDisposed >= 1, '关闭后 token 层被撤销');
check(store.get('dsh.ui-polish.enabled') === '0', '关闭后记住选择');

// ── effect 清理 ─────────────────────────────────────────────────────────────
check(calls.effects === 1, '只登记一个 effect');
check(typeof calls.cleanup === 'function', 'effect 返回清理函数');
calls.cleanup();
check(!bodyAttrs.has('data-dsh-ui-polish'), '清理后文档不再被标记');

console.log(failures.length === 0 ? '\nALL CHECKS PASSED' : `\n${failures.length} CHECK(S) FAILED`);
process.exit(failures.length === 0 ? 0 : 1);
