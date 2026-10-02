// D8-1 文档与能力漂移核对（AGENTS.md 声明 tools 数 vs 实现 tools.mjs TOOL_DEFINITIONS）
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const HDK = process.argv[2] || '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk';
const ag = readFileSync(join(HDK, 'AGENTS.md'), 'utf8');
console.log('AGENTS.md:27 =>', (ag.split('\n')[26] || '').trim());
console.log('AGENTS.md:45 =>', (ag.split('\n')[44] || '').trim());
const declared = [...ag.matchAll(/(\d+)\s*(?:MCP\s*)?tools?/gi)].map(m => +m[1]);
console.log('AGENTS.md 声明的 tools 数:', JSON.stringify(declared));
const toolsSrc = readFileSync(join(HDK, 'plugins', 'huaweicloud-core', 'src', 'tools.mjs'), 'utf8');
const actual = [...toolsSrc.matchAll(/name:\s*'huaweicloud_[a-z0-9_]+'/gi)].length;
console.log('tools.mjs TOOL_DEFINITIONS 实现 tools 数:', actual);
console.log('结论:', declared.includes(actual) ? 'PASS(文档与实现一致)' : `FAIL(漂移: 文档声明 ${JSON.stringify(declared)} vs 实现 ${actual})`);
