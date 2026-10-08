// EXP-D5-7-1 OfficeAce 客户端插件发现/加载清单会话 harness
// 校验：OfficeAce 客户端可发现并加载 huaweicloud-devkit 插件清单
// 适配自 exp-d5-2-1-codex-discovery.mjs，将客户端从 Codex 改为 OfficeAce
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';

const hdkSrc = process.argv[2] || 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src';
const pluginRoot = process.argv[3] || 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core';
const hdkRoot = process.argv[4] || 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk';
const EVID = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\huaweicloud-devkit-test\\results\\OfficeAce\\2026-10-02-188.239.14.150\\Windows\\evidence';

const client = 'OfficeAce';
const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// ① OfficeAce 客户端宿主检测
const officeaceReg = spawnSync('reg', ['query', 'HKCU\\SOFTWARE\\OfficeAce\\OfficeAce', '/v', 'InstallDir'], {
  encoding: 'utf8', windowsHide: true, timeout: 5000,
});
const officeaceHostPresent = officeaceReg.status === 0;
let officeaceInstallDir = null;
if (officeaceHostPresent) {
  const m = /InstallDir\s+REG_SZ\s+(.+)/.exec(officeaceReg.stdout);
  if (m) officeaceInstallDir = m[1].trim();
}
rec('EXP-D5-7-1-client-host', 'OfficeAce 客户端宿主检测', officeaceHostPresent,
    { present: officeaceHostPresent, installDir: officeaceInstallDir },
    { present: true },
    officeaceHostPresent ? `找到 OfficeAce 安装: ${officeaceInstallDir}` : '本机未安装 OfficeAce 客户端');

// ② system-mcp-connectors.json 中 huaweicloud-devkit 注册检测
const systemConnectorsPath = officeaceInstallDir ? join(officeaceInstallDir, 'system-mcp-connectors.json') : null;
let systemConnectorsOk = false;
let systemConnectorEntry = null;
if (systemConnectorsPath && existsSync(systemConnectorsPath)) {
  try {
    const sc = JSON.parse(readFileSync(systemConnectorsPath, 'utf8'));
    const entry = sc.connectors?.find(c => c.key === 'huaweicloud-devkit');
    if (entry) {
      systemConnectorEntry = entry;
      systemConnectorsOk = entry.enabled === true && entry.transport === 'stdio';
    }
  } catch {}
}
rec('EXP-D5-7-1-system-connector', 'system-mcp-connectors.json 注册 huaweicloud-devkit (enabled=true, transport=stdio)', systemConnectorsOk,
    { registered: systemConnectorsOk, key: systemConnectorEntry?.key, enabled: systemConnectorEntry?.enabled, transport: systemConnectorEntry?.transport },
    { registered: true, enabled: true, transport: 'stdio' });

// ③ 物理安装标记 .installed
const pluginInstallDir = officeaceInstallDir ? join(officeaceInstallDir, '.office-claw', 'huaweicloud-plugins') : null;
const installedMarker = pluginInstallDir ? join(pluginInstallDir, '.installed') : null;
const installedOk = installedMarker && existsSync(installedMarker);
let installedTime = null;
if (installedOk) {
  try { installedTime = readFileSync(installedMarker, 'utf8').trim(); } catch {}
}
rec('EXP-D5-7-1-physical-install', '物理安装标记 .installed 存在', Boolean(installedOk),
    { installed: Boolean(installedOk), markerTime: installedTime }, { installed: true });

// ④ 插件清单文件存在性 (hdk 源码侧)
const openclawJson = join(pluginRoot, 'openclaw.plugin.json');
const mcpJson = join(hdkRoot, 'mcp.json');
const openclawOk = existsSync(openclawJson);
const mcpOk = existsSync(mcpJson);
rec('EXP-D5-7-1-manifest-files', '插件清单文件存在（openclaw.plugin.json / mcp.json）', mcpOk && openclawOk,
    { openclawJson: openclawOk, mcpJson: mcpOk }, { openclawJson: true, mcpJson: true });

// ⑤ 清单解析
let pluginMeta = {};
let mcpServers = {};
let parsePluginOk = false, parseMcpOk = false;
if (openclawOk) {
  try {
    pluginMeta = JSON.parse(readFileSync(openclawJson, 'utf8'));
    parsePluginOk = pluginMeta?.family === 'bundle-plugin' && pluginMeta?.name === 'huaweicloud-devkit';
  } catch {}
}
if (mcpOk) {
  try {
    mcpServers = JSON.parse(readFileSync(mcpJson, 'utf8'));
    parseMcpOk = mcpServers?.mcpServers?.['huaweicloud-devkit'] != null;
  } catch {}
}
rec('EXP-D5-7-1-plugin-format', '插件 manifest family=bundle-plugin + name=huaweicloud-devkit', parsePluginOk,
    { family: pluginMeta?.family, name: pluginMeta?.name, version: pluginMeta?.version },
    { family: 'bundle-plugin', name: 'huaweicloud-devkit' });
rec('EXP-D5-7-1-mcp-server-registered', 'MCP server 注册（huaweicloud-devkit）', parseMcpOk,
    { registered: parseMcpOk, command: mcpServers?.mcpServers?.['huaweicloud-devkit']?.command },
    { registered: true });

// ⑥ OfficeAce .mcp.json 合并检测 (OfficeAce 运行时合并 system connectors 到 .mcp.json)
const officeaceMcpJson = officeaceInstallDir ? join(officeaceInstallDir, '.mcp.json') : null;
let officeaceMcpHasDevkit = false;
if (officeaceMcpJson && existsSync(officeaceMcpJson)) {
  try {
    const om = JSON.parse(readFileSync(officeaceMcpJson, 'utf8'));
    officeaceMcpHasDevkit = om?.mcpServers?.['huaweicloud-devkit'] != null;
  } catch {}
}
// Note: OfficeAce may load system connectors dynamically rather than merging into .mcp.json
// The system-mcp-connectors.json registration is the authoritative discovery path
rec('EXP-D5-7-1-discovery-path', 'OfficeAce 发现1发现路径（system-mcp-connectors.json 或 .mcp.json）', systemConnectorsOk || officeaceMcpHasDevkit,
    { systemConnectors: systemConnectorsOk, mcpJsonMerge: officeaceMcpHasDevkit },
    { systemConnectors: true },
    systemConnectorsOk ? '通过 system-mcp-connectors.json 发现（权威路径）' : (officeaceMcpHasDevkit ? '通过 .mcp.json 合并发现' : '未发现'));

const pass = results.filter(r => r.ok).length;
const fail = results.filter(r => !r.ok).length;
const verdict = fail === 0 ? 'PASS' : 'FAIL';
console.log(`\n=== EXP-D5-7-1 OfficeAce 插件发现/加载清单会话 harness ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${verdict}`);

// 证据落盘
const now = new Date();
const ts = now.getFullYear().toString() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0') + String(now.getSeconds()).padStart(2,'0');

const stdoutLines = [
  `time=${now.toISOString()}`,
  `case=EXP-D5-7-1`,
  `type=D5客户端矩阵`,
  `object=${client}`,
  `source=D5-7`,
  `result=${verdict}`,
  '--- fixture 内部断言 ---',
];
for (const r of results) {
  stdoutLines.push(`${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
}

const outDir = join(EVID, 'EXP-D5-7-1');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'stdout.log'), JSON.stringify({
  status: verdict,
  caseId: 'EXP-D5-7-1',
  why: verdict === 'PASS' ? `OfficeAce 客户端发现并加载 huaweicloud-devkit 插件清单: ${pass} 项断言全通过` : `${fail} 项断言失败`,
  executedAt: ts,
}, null, 2), 'utf8');
writeFileSync(join(outDir, 'stdout.txt'), stdoutLines.join('\n'), 'utf8');

process.exit(fail > 0 ? 1 : 0);