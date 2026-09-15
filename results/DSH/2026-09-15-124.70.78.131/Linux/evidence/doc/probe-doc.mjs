// DSH/Linux daily probe — document vs capability drift (v1.1.4 stable)
import { readFileSync } from 'node:fs';
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { TOOL_DEFINITIONS } = await import(CORE + '/tools.mjs');
const N = TOOL_DEFINITIONS.length;
const AGENTS = '/home/testbot2/multica_workspaces/vector-8988c3df7bc9/task-34920f805c79/workdir/hdk/AGENTS.md';
const txt = readFileSync(AGENTS, 'utf8');
const claims39 = [];
for (const [i, line] of txt.split('\n').entries()) {
  if (/\b39\b/.test(line) && /tool|MCP/i.test(line)) claims39.push({ line: i + 1, text: line.trim() });
}
const docMatches = claims39.length > 0;
console.log('=== DOC DRIFT PROBE RESULTS (v1.1.4 stable) ===');
console.log(`TOOL_DEFINITIONS.length = ${N}`);
console.log(`AGENTS.md "39 tool" claims = ${claims39.length}`);
for (const c of claims39) console.log(`  :${c.line}  ${c.text.slice(0, 120)}`);
console.log(`drift = ${N !== 39}`);
console.log(`D8-1 => ${docMatches && N !== 39 ? 'FAIL (doc 39 vs impl 40)' : 'PASS'}`);