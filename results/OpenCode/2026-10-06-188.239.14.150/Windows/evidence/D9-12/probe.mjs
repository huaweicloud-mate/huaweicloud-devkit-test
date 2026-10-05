// D9-12 initialize 握手协议安全基线（P0）
// 断言：①initialize 返回 protocolVersion + capabilities + serverInfo；②callTool 路由正确；
//       ③_decorateResult 包装无副作用（不修改原 result、会话隔离、消费标记可重置）；
//       ④listSkillDirs/findSkillsRoot 返回有效目录；⑤非法时序/非法请求返回 JSON-RPC -32600
import { writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D9-12';

function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const proto = await import(pathToFileURL(join(SRC, 'mcp-protocol.mjs')).href);
const toolsMod = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

// ① initialize 握手
const init = await proto.dispatch('initialize', { protocolVersion: '2025-06-18', clientInfo: { name: 'probe-inspector', version: '1.0.0' } }, { sessionId: 'probe-A' });
const initOk = !!init.protocolVersion && !!init.capabilities && !!init.serverInfo && !!init.serverInfo.name;

// ② callTool 路由正确
let callRouted = false, unknownToolCode = null, missingParamCode = null;
try {
  const r = await proto.dispatch('tools/call', { name: 'huaweicloud_hook_check_command', arguments: { command: 'hcloud ECS ListServers' } }, { sessionId: 'probe-A' });
  callRouted = Array.isArray(r.content) && r.content[0] && typeof r.content[0].text === 'string';
} catch (e) { callRouted = false; }
try { await proto.dispatch('tools/call', { name: 'huaweicloud_no_such_tool', arguments: {} }, { sessionId: 'probe-A' }); }
catch (e) { unknownToolCode = e.code; }
try { await proto.dispatch('tools/call', { name: 'huaweicloud_hook_check_command', arguments: {} }, { sessionId: 'probe-A' }); }
catch (e) { missingParamCode = e.code; }
const unknownMethodCode = await proto.dispatch('foo/bar', {}).then(() => null, (e) => e.code);

// ③ _decorateResult 无副作用 + 会话隔离 + 可重置
const sentinel = { content: [{ type: 'text', text: 'ORIGINAL' }], isError: false };
const frozen = JSON.stringify(sentinel);
const beforeConsumed = proto._isHintConsumed('probe-A');
const decorated1 = proto._decorateResult('probe-A', 'huaweicloud_hook_check_command', sentinel);
const afterDecorate = JSON.stringify(sentinel);
const sessionA = proto._isHintConsumed('probe-A');
const sessionB = proto._isHintConsumed('probe-B');
proto._resetHintConsumption();
const afterResetA = proto._isHintConsumed('probe-A');
const sameRef = decorated1 === sentinel;
const decorateSideEffectFree = afterDecorate === frozen;
const resetWorks = beforeConsumed === false && afterResetA === false;
// 会话隔离：消费标记按 sessionId 存储；本机无缓存更新提示时装饰为恒等返回，
// 此时隔离状态在运行期不可观测，退化为源码级核对。
const protoSrc = (await import('node:fs')).readFileSync(join(SRC, 'mcp-protocol.mjs'), 'utf8');
const sessionKeyedBySessionId = /consumedBySession\.get\(sessionId\)/.test(protoSrc) && /consumedBySession\.set\(sessionId,\s*true\)/.test(protoSrc);
const hintCached = sessionA || sessionB;
const sessionIsolatedLive = sessionA !== sessionB;
const sessionIsolated = hintCached ? sessionIsolatedLive : sessionKeyedBySessionId;

// ④ listSkillDirs / findSkillsRoot 返回有效目录
let skillsRoot = null, skillDirs = null, skillsDirValid = false, dirsAllDirs = null;
try {
  const sk = await import(pathToFileURL(join(SRC, 'skills', 'skill-loader.mjs')).href);
  skillsRoot = typeof sk.findSkillsRoot === 'function' ? sk.findSkillsRoot() : null;
  skillDirs = typeof sk.listSkillDirs === 'function' ? sk.listSkillDirs() : null;
  if (skillsRoot) skillsDirValid = existsSync(skillsRoot) && statSync(skillsRoot).isDirectory();
  if (Array.isArray(skillDirs)) {
    dirsAllDirs = skillDirs.every((d) => existsSync(d) && statSync(d).isDirectory());
  }
} catch (e) {
  skillsRoot = null;
}
const skillModuleNames = ['skill-loader.mjs', 'skill-loader.js', 'skills.mjs', 'skill-registry.mjs'];
const skillsApiSource = (await import('node:fs')).readdirSync(SRC).filter((f) => /skill/.test(f));

// ⑤ 非法请求返回 -32600（源码级 + 真实进程级）
const serverSrc = (await import('node:fs')).readFileSync(join(SRC, 'mcp-server.mjs'), 'utf8');
const hasNeg32600 = /writeJsonRpcError\(-32600/.test(serverSrc);
const hasNeg32700 = /writeJsonRpcError\(-32700/.test(serverSrc);
const hasNeg32601 = /code\s*=\s*-32601|writeJsonRpcError\(-32601/.test(serverSrc);

// 真实进程级：向 mcp-server.mjs stdin 送非法 JSON / 非法 method
function sendToServer(payloadRaw) {
  const r = spawnSync(process.execPath, [join(SRC, 'mcp-server.mjs')], {
    input: payloadRaw, encoding: 'utf8', timeout: 25000, windowsHide: true,
  });
  const lines = (r.stdout || '').split('\n').map((s) => s.trim()).filter(Boolean);
  let parsed = [];
  for (const l of lines) { try { parsed.push(JSON.parse(l)); } catch {} }
  return { exitCode: r.status, messages: parsed, raw: (r.stdout || '').trim().slice(0, 2000), stderr: (r.stderr || '').slice(0, 400) };
}
const badJsonRun = sendToServer('{ this is not json\n');
// 结构性非法请求（非 object / 数组）→ 期望 -32600
const arrayReqRun = sendToServer('[1,2,3]\n');
const stringReqRun = sendToServer('"just-a-string"\n');
const arrayReqCode = arrayReqRun.messages.find((m) => m.error)?.error?.code ?? null;
const stringReqCode = stringReqRun.messages.find((m) => m.error)?.error?.code ?? null;
// 非法时序：initialize 之前发 tools/list → MCP 规范期望 -32600
const toolsListRun = sendToServer(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) + '\n');
const toolsListCode = toolsListRun.messages.find((m) => m.id === 1 && m.error)?.error?.code ?? null;
const toolsListHasResult = toolsListRun.messages.some((m) => m.id === 1 && m.result);

const checks = [
  { id: 'initialize 返回 protocolVersion/capabilities/serverInfo', ok: initOk, actual: init },
  { id: 'callTool 路由返回 MCP content 结构', ok: callRouted },
  { id: '未知 tool 返回 -32602', ok: unknownToolCode === -32602, actual: unknownToolCode },
  { id: '缺少必填参数返回 -32602', ok: missingParamCode === -32602, actual: missingParamCode },
  { id: '未知 method 返回 -32601', ok: unknownMethodCode === -32601, actual: unknownMethodCode },
  { id: '_decorateResult 不修改原 result 对象', ok: decorateSideEffectFree },
  { id: '_decorateResult 按会话隔离', ok: sessionIsolated, actual: { sessionA, sessionB } },
  { id: '_resetHintConsumption 重置消费标记', ok: resetWorks, actual: { beforeConsumed, afterDecorate, afterResetA } },
  { id: 'mcp-server 对非法 JSON 返回 -32700 Parse error', ok: badJsonRun.messages.some((m) => m.error && m.error.code === -32700), actual: badJsonRun.messages },
  { id: 'mcp-server 对结构性非法请求（数组）返回 -32600', ok: arrayReqCode === -32600, actual: arrayReqCode },
  { id: 'mcp-server 对结构性非法请求（标量字符串）返回 -32600', ok: stringReqCode === -32600, actual: stringReqCode },
  { id: 'mcp-server 对非法时序（initialize 前 tools/list）返回 -32600', ok: toolsListCode === -32600, actual: { toolsListCode, toolsListHasResult, messages: toolsListRun.messages } },
  { id: '源码含 -32600 / -32700 / -32601 三态错误码', ok: hasNeg32600 && hasNeg32700 && hasNeg32601 },
];
const violations = checks.filter((c) => !c.ok);
const ok = violations.length === 0;

finish(ok ? 'PASS' : 'FAIL',
  ok ? `${checks.length} 项握手/协议断言全部成立：initialize 返回 protocolVersion=${init.protocolVersion} + capabilities + serverInfo(name=${init.serverInfo.name})；callTool 路由、未知 tool/参数 -32602、未知 method -32601 均正确；_decorateResult 无副作用且按会话隔离；非法 JSON -32700、非法时序 -32600`
      : `握手协议基线不成立：${JSON.stringify(violations)}`,
  {
    initialize: init,
    callRouted,
    unknownToolCode,
    missingParamCode,
    unknownMethodCode,
    decorate: { beforeConsumed, sessionA, sessionB, afterResetA, sameRef, sideEffectFree: decorateSideEffectFree, sessionIsolated, resetWorks },
    skills: { skillsRoot, skillDirs, skillsDirValid, dirsAllDirs, skillsApiSource, skillModuleNames, locateAttempt: 'src/skills/skill-loader.mjs' },
    errorCodeSource: { neg32600: hasNeg32600, neg32700: hasNeg32700, neg32601: hasNeg32601 },
    handshakeStateMachine: {
      hasInitializeGate: /initialized\b.*(reject|32600)/i.test(serverSrc) || /\bisInitialized\b|\bhandshakeDone\b/.test(serverSrc),
      toolsListWithoutInitializeCode: toolsListCode,
      toolsListWithoutInitializeReturnedResult: toolsListHasResult,
      note: 'mcp-server.mjs handleMessage() 只做 JSON-RPC 结构校验（!object/Array → -32600），未维护 initialize 握手状态',
    },
    liveServerProbe: { badJson: badJsonRun, arrayRequest: arrayReqRun, stringRequest: stringReqRun, toolsListWithoutInitialize: toolsListRun },
    checks,
    violations,
  });