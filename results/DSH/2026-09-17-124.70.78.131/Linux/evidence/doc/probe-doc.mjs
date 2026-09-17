// DSH/Linux daily probe — document vs capability drift (D8-1 / D8-6) v1.1.4 stable
import { readFileSync, existsSync } from 'node:fs';
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { TOOL_DEFINITIONS } = await import(CORE + '/tools.mjs');
const N = TOOL_DEFINITIONS.length;
const AGENTS = '/home/testbot2/devkit-test/DSH/hdk/AGENTS.md';
const README_EN = '/home/testbot2/devkit-test/DSH/hdk/README.md';
const README_ZH = '/home/testbot2/devkit-test/DSH/hdk/README.zh-CN.md';
const results = [];
function check(id, name, pass, actual) { results.push({ id, name, pass: !!pass, actual: typeof actual === 'string' ? actual : JSON.stringify(actual) }); }

const txt = readFileSync(AGENTS, 'utf8');
const claims39 = [];
for (const [i, line] of txt.split('\n').entries()) {
  if (/\b39\b/.test(line) && /tool|MCP/i.test(line)) claims39.push({ line: i + 1, text: line.trim() });
}
const docMatches = claims39.length > 0;
check('D8-1', 'AGENTS.md claims "39" tools (drift source)', docMatches, `claims=${claims39.length}`);
check('D8-1', 'impl tool count 40 (TOOL_DEFINITIONS.length)', N === 40, `N=${N}`);
check('D8-1', 'doc(39) vs impl(40) 一致', N === 39, `N=${N}`);

// ---- D8-6 中英文文档一致 ----
const enExists = existsSync(README_EN), zhExists = existsSync(README_ZH);
check('D8-6', 'README.md 存在', enExists, enExists);
check('D8-6', 'README.zh-CN.md 存在', zhExists, zhExists);
let keyMarkers = [];
if (enExists && zhExists) {
  const en = readFileSync(README_EN, 'utf8'), zh = readFileSync(README_ZH, 'utf8');
  for (const m of ['huaweicloud-devkit', 'npm install -g', 'auth init', 'doctor']) {
    const e = en.includes(m), z = zh.includes(m);
    if (e !== z) keyMarkers.push(`${m}(en=${e},zh=${z})`);
    else check('D8-6', `关键命令/标识 "${m}" 双语一致`, true, `en=${e} zh=${z}`);
  }
  check('D8-6', '关键命令/标识无单边缺失', keyMarkers.length === 0, keyMarkers.join('; ') || 'none');
}

const failed = results.filter(r => !r.pass);
console.log('=== DOC DRIFT PROBE RESULTS (v1.1.4 stable) ===');
console.log(`TOOL_DEFINITIONS.length = ${N}`);
console.log(`AGENTS.md "39 tool" claims = ${claims39.length}`);
for (const c of claims39) console.log(`  :${c.line}  ${c.text.slice(0, 120)}`);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
console.log(`D8-1 => ${N !== 39 ? 'FAIL (doc 39 vs impl 40)' : 'PASS'}`);