#!/usr/bin/env node
// 从抽取出来的上游主题样式目录，重新生成 references/dsh-tokens.txt。
//
// DSH 升级后用法（两步）：
//   1) 抽样式：node scripts/asar-peek.mjs "<asar>" extract ./tmp "dsh-client-ui-theme/src/styles"
//   2) 生白名单：node scripts/gen-token-whitelist.mjs ./tmp/dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/src/styles
//
// 白名单的作用：scripts/smoke.mjs 校验插件样式里每个 var(--dsw-*) 引用的名字
// 确实存在于上游 token 表，避免写错变量名（写错的 var() 不会报错，只会静默失效）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'references', 'dsh-tokens.txt');

const dir = process.argv[2];
if (!dir) {
  console.error('用法：node scripts/gen-token-whitelist.mjs <上游 styles 目录>');
  process.exit(2);
}
if (!fs.existsSync(dir)) {
  console.error(`目录不存在：${dir}`);
  process.exit(2);
}

const names = new Set();
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.css'));
if (files.length === 0) {
  console.error(`目录里没有 .css：${dir}`);
  process.exit(2);
}
for (const file of files) {
  const text = fs.readFileSync(path.join(dir, file), 'utf8');
  for (const match of text.matchAll(/(--dsw-[a-z0-9-]+)\s*:/g)) names.add(match[1]);
}

const sorted = [...names].sort();
const header = [
  '# DeepSeek Harness 主题 token 白名单（--dsw-*）',
  `# 来源：${files.length} 个上游样式文件（${files.sort().join(', ')}）`,
  '# 用途：scripts/smoke.mjs 校验插件样式里 var(--dsw-*) 引用的名字确实存在于上游。',
  `# 生成时间：${new Date().toISOString()}  共 ${sorted.length} 个`,
  '',
];
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${[...header, ...sorted].join('\n')}\n`, 'utf8');
console.log(`写入 ${path.relative(ROOT, OUT)}：${sorted.length} 个 token（来自 ${files.length} 个样式文件）`);
