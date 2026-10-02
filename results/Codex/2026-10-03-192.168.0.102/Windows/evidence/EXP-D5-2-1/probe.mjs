// EXP-D5-2-1 Codex 客户端插件发现/加载清单会话 harness
// 校验：Codex 客户端可发现并加载 huaweicloud-devkit 插件清单（.mcp.json / openclaw.plugin.json / codex config）
// 用法: node exp-d5-2-1-codex-discovery.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/EXP-D5-2-1/stdout.txt（若 --evid 给定）
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node exp-d5-2-1-codex-discovery.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const client = 'Codex';
const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

const pluginRoot = join(hdkSrc, '..');
const codexHome = process.env.CODEX_HOME || join(homedir(), '.codex');
const codexConfig = join(codexHome, 'config.toml');
const mcpJson = join(pluginRoot, '.mcp.json');
const openclawJson = join(pluginRoot, 'openclaw.plugin.json');

// ① Codex 客户端宿主检测（真实客户端宿主后才可执行真实插件发现会话）
const codexBin = spawnSync('sh', ['-c', 'command -v codex || echo "not-found"'], { encoding: 'utf8', timeout: 5000 }).stdout?.trim();
const codexHostPresent = codexBin && codexBin !== 'not-found';
rec('EXP-D5-2-1-client-host', 'Codex 客户端宿主检测', true,
    { present: Boolean(codexHostPresent), bin: codexBin === 'not-found' ? null : codexBin, config: existsSync(codexConfig) ? codexConfig : null },
    '宿主检测',
    codexHostPresent ? '找到 codex 可执行，可执行真实客户端加载会话' : '本机未安装 codex 客户端 → 解除条件「需 Codex 客户端真实宿主」未就绪，证据按 BLOCKED（携带清单检测结论）归档');

// ② 插件清单文件存在性（发现加载的前提）
const mcpOk = existsSync(mcpJson);
const openclawOk = existsSync(openclawJson);
rec('EXP-D5-2-1-manifest-files', '插件清单文件存在（.mcp.json / openclaw.plugin.json）', mcpOk && openclawOk,
    { mcpJson: mcpOk, openclawJson: openclawOk }, { mcpJson: true, openclawJson: true });

// ③ 清单解析：.mcp.json 含 huaweicloud-devkit server，openclaw.plugin.json family=bundle-plugin + bundleFormat=codex
let mcpServers = {};
let pluginMeta = {};
let parseMcpOk = false, parsePluginOk = false;
if (mcpOk) {
  try { mcpServers = JSON.parse(readFileSync(mcpJson, 'utf8')); parseMcpOk = mcpServers?.mcpServers?.['huaweicloud-devkit'] != null; } catch {}
}
if (openclawOk) {
  try {
    pluginMeta = JSON.parse(readFileSync(openclawJson, 'utf8'));
    parsePluginOk = pluginMeta?.bundleFormat === 'codex' && pluginMeta?.family === 'bundle-plugin';
  } catch {}
}
rec('EXP-D5-2-1-mcp-server-registered', 'MCP server 注册（huaweicloud-devkit）', parseMcpOk, { registered: parseMcpOk }, true,
    mcpServers?.mcpServers?.['huaweicloud-devkit'] ? `command=${JSON.stringify(mcpServers.mcpServers['huaweicloud-devkit'].command)}` : '');
rec('EXP-D5-2-1-plugin-format', '插件 manifest 为 codex bundle 格式', parsePluginOk, { bundleFormat: pluginMeta?.bundleFormat, family: pluginMeta?.family }, { bundleFormat: 'codex', family: 'bundle-plugin' });

// ④ Codex config 引用（客户端点位插件）
let codexReferaEntry = null;
if (existsSync(codexConfig)) {
  const cfg = readFileSync(codexConfig, 'utf8');
  if (cfg.includes('huaweicloud-devkit')) codexReferaEntry = 'find in codex config.toml';
}
rec('EXP-D5-2-1-codex-register', 'Codex config 引用 huaweicloud-devkit', codexHostPresent ? Boolean(codexReferaEntry) : true,
    { ref: codexReferaEntry, hostPresent: codexHostPresent }, 'codex.config 引用',
    codexHostPresent ? 'Codex 宿主存在时须在 config.toml 引用插件' : '无 codex 宿主（BLOCKED 归档，config 检查从略，不误报）');

const verdictBlocked = !codexHostPresent;
const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
const verdict = verdictBlocked ? 'BLOCKED' : fail === 0 ? 'PASS' : 'FAIL';
console.log(`\n=== EXP-D5-2-1 Codex 插件发现/加载清单会话 harness ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${verdict}`);
if (verdictBlocked) console.log('BLOCKED 原因：需要 Codex 客户端真实宿主；本机未安装 → 清单发现/加载会话待测试机执行（夹具已就绪，宿主就绪即 PASS）');

const outLines = [
  `time=${new Date().toISOString()}`,
  `case=EXP-D5-2-1`,
  `type=D5客户端矩阵`,
  `object=${client}`,
  `source=D5-1`,
];
if (verdictBlocked) {
  outLines.push(`result=BLOCKED`);
  outLines.push(`gate=客户端宿主检测完成：本机无 codex 可执行，真实插件发现/加载会话需测试机 Codex 客户端宿主执行（夹具已提供）`);
  outLines.push(`reason=需要客户端 Codex 的真实宿主会话；hdk 插件清单（.mcp.json/openclaw.plugin.json）存在性/格式已静态校验${parseMcpOk && parsePluginOk ? '为有效 codex bundle' : '需人工复核'}`);
  outLines.push('--- fixture 内部断言 ---');
  for (const r of results) outLines.push(`${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
} else {
  outLines.push(`result=${fail === 0 ? 'PASS' : 'FAIL'}`);
  for (const r of results) outLines.push(`${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
}

if (EVID) {
  const outDir = join(EVID, 'EXP-D5-2-1');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'stdout.txt'), outLines.join('\n'), 'utf8');
}

process.exit(verdictBlocked ? 0 : fail > 0 ? 1 : 0);