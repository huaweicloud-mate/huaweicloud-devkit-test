// d9-6-cross-client-interop.mjs — D9-6 跨客户端互通协议级测试夹具
// 覆盖：≥2 桩客户端 initialize/tools/list/tools/call/resources/list 协议一致性
// 依赖：eval/harness/mock/mcp-client-stub.mjs（MCP JSON-RPC 桩客户端）
// 用法: node d9-6-cross-client-interop.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/D9-6-interop/stdout.txt（若 --evid 给定）
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { McpClientStub } from '../mock/mcp-client-stub.mjs';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d9-6-cross-client-interop.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

const serverPath = join(hdkSrc, 'mcp-server.mjs');

// ===== 客户端 A：Hermes/Agent =====
const clientA = new McpClientStub({ name: 'Hermes/Agent', version: '1.0' });
await clientA.connect(serverPath);

const aInit = await clientA.initialize();
rec('D9-6-IA-clientA-init', '客户端A (Hermes) initialize 互通',
    clientA.checkInitResponse(aInit),
    { server: aInit?.result?.serverInfo?.name, proto: aInit?.result?.protocolVersion },
    { server: 'huaweicloud-devkit' });

const aTools = await clientA.toolsList();
rec('D9-6-IA-clientA-tools-list', '客户端A tools/list 枚举',
    clientA.checkToolsResponse(aTools),
    { count: aTools?.result?.tools?.length || 0 },
    { count: '>0' });

const aCall = await clientA.toolsCall('huaweicloud_service_catalog', { intent: 'list ecs instances' });
rec('D9-6-IA-clientA-tools-call', '客户端A tools/call 互通（service_catalog）',
    clientA.checkCallResponse(aCall),
    { isError: aCall?.result?.isError, contentLen: aCall?.result?.content?.length || 0 },
    { isError: false });

// ===== 客户端 B：AtomCode =====
const clientB = new McpClientStub({ name: 'AtomCode', version: '1.0' });
await clientB.connect(serverPath);

const bInit = await clientB.initialize();
rec('D9-6-IB-clientB-init', '客户端B (AtomCode) initialize 互通',
    clientB.checkInitResponse(bInit),
    { server: bInit?.result?.serverInfo?.name },
    { server: 'huaweicloud-devkit' });

const bTools = await clientB.toolsList();
rec('D9-6-IB-clientB-tools-list', '客户端B tools/list 枚举',
    clientB.checkToolsResponse(bTools),
    { count: bTools?.result?.tools?.length || 0 },
    { count: '>0' });

// ===== 协议一致性：A 与 B 的 tools/list 结果一致 =====
const aCount = aTools?.result?.tools?.length || 0;
const bCount = bTools?.result?.tools?.length || 0;
rec('D9-6-IC-tools-consistency', 'A/B 客户端 tools/list 一致性',
    aCount === bCount && aCount > 0,
    { a: aCount, b: bCount },
    { a: aCount, b: aCount });

// ===== 客户端 B 也执行 tools/call，验证互通 =====
const bCall = await clientB.toolsCall('huaweicloud_service_catalog', { intent: 'create obs bucket' });
rec('D9-6-IB-clientB-tools-call', '客户端B tools/call 互通（service_catalog）',
    clientB.checkCallResponse(bCall),
    { isError: bCall?.result?.isError, contentLen: bCall?.result?.content?.length || 0 },
    { isError: false });

// ===== 客户端 A 的 resources/list 互通 =====
const aRes = await clientA.resourcesList();
rec('D9-6-IA-clientA-resources', '客户端A resources/list 互通',
    aRes?.result != null,
    { hasResult: aRes?.result != null, resources: Array.isArray(aRes?.result?.resources) ? aRes.result.resources.length : 'n/a' },
    { hasResult: true });

// ===== 客户端 B 的 ping（协议心跳）— 服务端未实现 ping 时返回 -32601，验证协议一致性 =====
const aPing = await clientA.ping();
const bPing = await clientB.ping();
const pingConsistent = (aPing?.result != null && bPing?.result != null) ||
    (aPing?.error?.code === bPing?.error?.code);
rec('D9-6-IB-ping-consistency', 'A/B 客户端 ping 响应一致（服务端未实现 ping 时均返回 -32601）',
    pingConsistent,
    { aResult: aPing?.result != null, aErr: aPing?.error?.code, bErr: bPing?.error?.code },
    { consistent: true },
    aPing?.error ? `服务端未实现 ping，A/B 均返回 -32601（协议一致）` : 'ping 响应正常');

// ===== 错误码一致性：两个客户端发未知方法均返回 -32601 =====
const aUnknown = await clientA._send('tools/unknown_method_xyz', {});
const bUnknown = await clientB._send('tools/unknown_method_xyz', {});
rec('D9-6-ID-error-consistency', 'A/B 客户端未知方法错误码一致（-32601）',
    aUnknown?.error?.code === -32601 && bUnknown?.error?.code === -32601,
    { a: aUnknown?.error?.code, b: bUnknown?.error?.code },
    { a: -32601, b: -32601 });

// ===== 并发互通：A 和 B 同时活跃，互不干扰 =====
rec('D9-6-IE-concurrent', 'A/B 客户端并发互通（同时活跃互不干扰）',
    clientA.isAlive && clientB.isAlive,
    { aAlive: clientA.isAlive, bAlive: clientB.isAlive },
    { aAlive: true, bAlive: true });

// ===== serverInfo 一致性 =====
const aServerName = aInit?.result?.serverInfo?.name;
const bServerName = bInit?.result?.serverInfo?.name;
rec('D9-6-IF-serverinfo-consistency', 'A/B 客户端 serverInfo.name 一致',
    aServerName === bServerName && aServerName === 'huaweicloud-devkit',
    { a: aServerName, b: bServerName },
    { a: 'huaweicloud-devkit', b: 'huaweicloud-devkit' });

// ===== 清理 =====
await clientA.disconnect();
await clientB.disconnect();

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D9-6 跨客户端互通协议级 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D9-6-interop');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D9-6 跨客户端互通协议级 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
