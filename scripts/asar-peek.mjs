// 极简 asar 只读解析器：列路径 / 抽取指定文件。
// 用来从 DSH 的 app.asar 里取出上游主题源码（styles/*.css），
// 以便重新生成 references/dsh-tokens.txt 的 token 白名单。
//
// 用法：
//   node scripts/asar-peek.mjs "<asar>" list [子串]                 # 列路径
//   node scripts/asar-peek.mjs "<asar>" extract <outDir> <子串...>   # 抽文件
//
// 例（Windows，DSH 桌面端）：
//   node scripts/asar-peek.mjs "D:\dsh des\resources\app.asar" list "dsh-client-ui-theme/src/styles"
//   node scripts/asar-peek.mjs "D:\dsh des\resources\app.asar" extract .\tmp "dsh-client-ui-theme/src/styles"
import fs from 'node:fs';
import path from 'node:path';

const [asarPath, mode, ...rest] = process.argv.slice(2);
if (!asarPath || !mode) {
  console.error('usage: asar-peek.mjs <asar> list [sub] | extract <outDir> <sub...>');
  process.exit(2);
}

const fd = fs.openSync(asarPath, 'r');
const sizeBuf = Buffer.alloc(8);
fs.readSync(fd, sizeBuf, 0, 8, 0);
const headerPickleSize = sizeBuf.readUInt32LE(4);
const lenBuf = Buffer.alloc(4);
fs.readSync(fd, lenBuf, 0, 4, 12);
const jsonLen = lenBuf.readUInt32LE(0);
const jsonBuf = Buffer.alloc(jsonLen);
fs.readSync(fd, jsonBuf, 0, jsonLen, 16);
const header = JSON.parse(jsonBuf.toString('utf8'));
const dataBase = 8 + headerPickleSize;

const files = []; // {path, offset, size, unpacked}
(function walk(node, prefix) {
  for (const [name, entry] of Object.entries(node.files || {})) {
    const p = prefix ? `${prefix}/${name}` : name;
    if (entry.files) walk(entry, p);
    else {
      files.push({
        path: p,
        offset: entry.offset === undefined ? null : Number(entry.offset),
        size: entry.size ?? 0,
        unpacked: entry.unpacked === true,
        link: entry.link ?? null,
      });
    }
  }
})(header, '');

if (mode === 'list') {
  const sub = rest[0] ? rest[0].toLowerCase() : null;
  const rows = files.filter((f) => !sub || f.path.toLowerCase().includes(sub));
  rows.sort((a, b) => a.path.localeCompare(b.path));
  console.log(`total_files=${files.length} matched=${rows.length} dataBase=${dataBase}`);
  for (const f of rows) console.log(`${String(f.size).padStart(9)}  ${f.path}`);
  fs.closeSync(fd);
  process.exit(0);
}

if (mode === 'extract') {
  const outDir = rest[0];
  const subs = rest.slice(1).map((s) => s.toLowerCase());
  if (!outDir || subs.length === 0) {
    console.error('extract needs <outDir> <substr...>');
    process.exit(2);
  }
  const rows = files.filter(
    (f) => subs.some((s) => f.path.toLowerCase().includes(s)) && f.offset !== null && !f.link,
  );
  let written = 0;
  let bytes = 0;
  for (const f of rows) {
    const dest = path.join(outDir, f.path.replace(/\//g, path.sep));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const buf = Buffer.alloc(f.size);
    if (f.size > 0) fs.readSync(fd, buf, 0, f.size, dataBase + f.offset);
    fs.writeFileSync(dest, buf);
    written += 1;
    bytes += f.size;
  }
  console.log(`extracted ${written} files, ${(bytes / 1048576).toFixed(2)} MiB -> ${outDir}`);
  fs.closeSync(fd);
  process.exit(0);
}

console.error('unknown mode');
process.exit(2);
