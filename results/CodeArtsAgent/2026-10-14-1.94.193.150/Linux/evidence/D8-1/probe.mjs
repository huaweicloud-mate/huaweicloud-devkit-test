// D8-1 文档与能力一致（CodeArtsAgent Linux 每日回归）
// 核对 hdk AGENTS.md 声明的 tool 数量 vs 实际 tools/list 返回数量
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const HDK = '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk';
const SRC = HDK + '/plugins/huaweicloud-core/src';
const ag = readFileSync(HDK + '/AGENTS.md', 'utf8');
const declared = (ag.match(/(\d+)\s*(tools|MCP tool)/gi) || []).filter((m) => /39|40|41|42/.test(m));
console.log('文档声明 tool 数量:');
for (const m of declared) console.log('  ', m);
const TOOLS = (await import(pathToFileURL(SRC + '/tools.mjs').href)).TOOL_DEFINITIONS || await (async () => { const t = await import(pathToFileURL(SRC + '/mcp-server.mjs').href); return t; })();
console.log('实际 tools.mjs 定义数: ' + (Array.isArray(TOOLS) ? TOOLS.length : '需经 tools/list 实测'));
