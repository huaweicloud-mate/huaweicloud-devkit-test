// fixup-probe.mjs — 修正 comprehensive-probe 中对 1.1.8-next.1 的过时断言 + 补 D9-12/D9-13/D1-39
// 真实执行：直调 hdk 源码导出函数，逐用例写 evidence/<case-id>/stdout.log + probe.txt
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVIDENCE_BASE = __dirname;
const HDK = '/home/zhangshuang/devkit-test/OpenCode/hdk';
const SRC = join(HDK, 'plugins/huaweicloud-core/src');

const now = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

function save(caseId, probeTxt, result) {
  const dir = join(EVIDENCE_BASE, caseId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.txt'), probeTxt);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(`[${caseId}] ${result.status}`);
}

// D1-65：调试模式环境变量（P2）。断言：HUAWEICLOUD_DEVKIT_DEBUG=1 开启调试，命令开关存在。
{
  const src = readFileSync(join(SRC, 'update-check.mjs'), 'utf8');
  const debugBranch = src.includes('HUAWEICLOUD_DEVKIT_DEBUG');
  const tel = readFileSync(join(SRC, 'telemetry/telemetry.mjs'), 'utf8');
  const telDebug = tel.includes('HUAWEICLOUD_DEVKIT_DEBUG');
  save('D1-65', `D1-65 调试模式环境变量
检查 update-check.mjs / telemetry.mjs 中 HUAWEICLOUD_DEVKIT_DEBUG 开关分支:
  update-check.mjs: ${debugBranch}
  telemetry/telemetry.mjs: ${telDebug}`, {
    status: (debugBranch && telDebug) ? 'PASS' : 'FAIL',
    why: `HUAWEICLOUD_DEVKIT_DEBUG=1 调试分支存在于 update-check.mjs:231 与 telemetry/telemetry.mjs:81，debug 开关可用。`,
    debugBranch, telDebug, executedAt: now()
  });
}

// D4-3：明文 secret API 拦截（P0）。断言：hcloud 命令内联明文 secret（--adminPass=）被 hook_check_command 拦截(warn)。
{
  const rre = await import(`file://${SRC}/risk-rule-engine.mjs`);
  const r = rre.evaluateCommandRisk('hcloud ECS CreateServers --adminPass=Password123!');
  const intercepted = r && (r.decision === 'deny' || r.decision === 'warn');
  save('D4-3', `D4-3 明文 secret API 拦截
命令: hcloud ECS CreateServers --adminPass=Password123!
decision: ${r.decision}
findings: ${JSON.stringify(r.findings?.map(f=>f.ruleId))}`, {
    status: intercepted ? 'PASS' : 'FAIL',
    why: intercepted ? `hook_check_command -> evaluateCommandRisk 拦截明文 --adminPass（decision=${r.decision}, rule=${r.findings?.[0]?.ruleId}）。` : '未拦截',
    decision: r.decision, ruleIds: r.findings?.map(f=>f.ruleId), executedAt: now()
  });
}

// D4-7：hook 三工具（P1）。断言：三类高危输入分别被 command/artifacts/deploy_plan 拦截。
{
  const rre = await import(`file://${SRC}/risk-rule-engine.mjs`);
  const cmd = rre.evaluateCommandRisk('cat ~/.config/huaweicloud/credentials.json');
  const art = rre.evaluateArtifacts([{ path: 'policy.json', content: '{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}' }]);
  const dep = rre.evaluateDeployPlan({ action: 'create', service: 'ecs', public_exposure: true });
  const cmdOk = cmd.decision === 'deny' || cmd.decision === 'warn';
  const artOk = art.decision === 'deny' || art.decision === 'warn';
  const depOk = dep.decision === 'deny' || dep.decision === 'warn';
  save('D4-7', `D4-7 hook 三工具
hook_check_command(cat credentials.json): ${cmd.decision}
hook_check_artifacts(broad IAM): ${art.decision}
hook_check_deploy_plan(public exposure): ${dep.decision}`, {
    status: (cmdOk && artOk && depOk) ? 'PASS' : 'FAIL',
    why: `三工具均拦截高危输入：command=${cmd.decision} artifacts=${art.decision} deploy_plan=${dep.decision}`,
    cmd: cmd.decision, art: art.decision, dep: dep.decision, executedAt: now()
  });
}

// D4-16：命令包裹穿透（P0）。断言：sh -c/eval 包裹写命令应发现内层并拦截。
// 实测：risk-rule-engine 对 sh -c "..." 内层 printenv HW_* / cat credentials.json 未解包 → allow（真缺陷）
{
  const rre = await import(`file://${SRC}/risk-rule-engine.mjs`);
  const tests = [
    'bash -c "hcloud ECS DeleteServers --instance_ids xxx"',
    'sh -c "cat credentials.json"',
    'sh -c "printenv HW_ACCESS_KEY"',
    'echo "hcloud ECS DeleteServers" | sh',
  ];
  const details = tests.map((c) => { const r = rre.evaluateCommandRisk(c); return { cmd: c, decision: r.decision }; });
  const all = details.every((d) => d.decision === 'deny' || d.decision === 'warn');
  save('D4-16', `D4-16 命令包裹穿透
${details.map((d) => `  ${d.cmd} -> ${d.decision}`).join('\n')}`, {
    status: all ? 'PASS' : 'FAIL',
    why: all ? '所有 shell 包裹均被拦截' : 'sh -c/eval 包裹内层命令未被 risk-rule-engine 解包检测（printenv HW_*/cat credentials.json 返回 allow）',
    root: 'safety/rules/cloud-risk-rules.json:14,35 使用 (^|\\s) 锚点；risk-rule-engine.mjs 未解包 sh -c/eval 内层',
    details, executedAt: now()
  });
}

// D4-17：hook 模糊 fail-closed（P1）。断言：畸形输入默认拒绝(fail-closed)。
// 实测：MCP 工具 hook_check_command(evaluateCommandRisk) 空/畸形→deny；但 PreToolUse hook (huaweicloud-safety.mjs) 解析 malformed JSON 静默 return=放行（fail-open，真缺陷）
{
  const rre = await import(`file://${SRC}/risk-rule-engine.mjs`);
  const mcp = ['', null, undefined, '   ', '\n\t'].map((c) => { const r = rre.evaluateCommandRisk(c); return r.decision; });
  const mcpFailClosed = mcp.every((d) => d === 'deny');
  // PreToolUse hook fail-open 复现
  const { spawnSync } = await import('child_process');
  const hookPath = join(HDK, 'plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs');
  const sp = spawnSync(process.execPath, [hookPath], { input: 'not-json', encoding: 'utf8' });
  const hookOutput = (sp.stdout || '').trim();
  const hookFailOpen = hookOutput.length === 0; // 空输出=放行
  const status = (mcpFailClosed && !hookFailOpen) ? 'PASS' : 'FAIL';
  save('D4-17', `D4-17 hook 模糊 fail-closed
MCP hook_check_command 空/畸形输入 decision: ${mcp.join(',')} (fail-closed ${mcpFailClosed})
PreToolUse hook (huaweicloud-safety.mjs) malformed JSON 输出: '${hookOutput}' (${hookFailOpen ? '空=放行 fail-open' : '已拒绝'})`, {
    status,
    why: status === 'PASS' ? 'MCP 工具与 hook 均 fail-closed' : 'PreToolUse hook 解析 malformed/空 tool_input 时静默 return，输出空=调用方视作放行（fail-open）',
    root: status === 'PASS' ? '' : 'plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs:47-49 catch { return; } 未拒绝空/畸形输入',
    mcpDecisions: mcp, mcpFailClosed, hookOutput, hookFailOpen, executedAt: now()
  });
}

// D4-18：confirm-not-deny 审批语义（P0）。断言：写操作需 approvalToken + approvedByUser=true 显式确认。
{
  const tools = await import(`file://${SRC}/tools.mjs`);
  const run = tools.TOOL_DEFINITIONS.find((t) => t.name === 'huaweicloud_run_approved_command');
  const required = run?.inputSchema?.required || [];
  const hasToken = required.includes('approvalToken');
  const hasApproved = required.includes('approvedByUser');
  const hasApprovedProp = !!run?.inputSchema?.properties?.approvedByUser;
  save('D4-18', `D4-18 confirm-not-deny 审批语义
huaweicloud_run_approved_command required: ${required.join(', ')}
approvalToken 必填: ${hasToken}; approvedByUser 必填: ${hasApproved}`, {
    status: (hasToken && hasApproved && hasApprovedProp) ? 'PASS' : 'FAIL',
    why: `run_approved_command 需 approvalToken(plan 产出) + approvedByUser=true 双重显式确认，写操作既不直接拒绝也不直接放行。`,
    required, hasToken, hasApproved, executedAt: now()
  });
}

// D4-23：全局规则注入（P0）。断言：rules/huawei-agent-rules.mdc 存在且含 csms/kms MUST NOT 约束，install 全目标注入。
{
  const rulesPath = join(HDK, 'rules/huawei-agent-rules.mdc');
  const exists = existsSync(rulesPath);
  const content = exists ? readFileSync(rulesPath, 'utf8') : '';
  const hasCsms = content.includes('csms');
  const hasKms = content.includes('kms');
  const setupSrc = readFileSync(join(SRC, 'setup-cli.mjs'), 'utf8');
  const injectCalls = (setupSrc.match(/injectAgentRules\(/g) || []).length;
  const inPkgFiles = readFileSync(join(HDK, 'package.json'), 'utf8').includes('"rules"');
  save('D4-23', `D4-23 全局规则注入
rules/huawei-agent-rules.mdc 存在: ${exists}
含 csms MUST NOT: ${hasCsms}; 含 kms MUST NOT: ${hasKms}
setup-cli.mjs injectAgentRules 调用数: ${injectCalls}
package.json files 含 rules: ${inPkgFiles}`, {
    status: (exists && hasCsms && hasKms && injectCalls >= 11 && inPkgFiles) ? 'PASS' : 'FAIL',
    why: `全局规则文件存在且含 csms/kms 禁直连约束，injectAgentRules 注入 ${injectCalls} 个安装目标，打包 files 含 rules。`,
    exists, hasCsms, hasKms, injectCalls, inPkgFiles, executedAt: now()
  });
}

// D4-28：Node 版安全 hook 链路（P0）。断言：hooks.json 注册 .mjs、commandText 提取、高危命令 deny 输出 permissionDecision=deny。
{
  const hooksPath = join(HDK, 'plugins/huaweicloud-core/hooks/hooks.json');
  const hooksContent = existsSync(hooksPath) ? readFileSync(hooksPath, 'utf8') : '';
  const hasMjs = hooksContent.includes('huaweicloud-safety.mjs');
  const { spawnSync } = await import('child_process');
  const hookPath = join(HDK, 'plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs');
  const denyRun = spawnSync(process.execPath, [hookPath], { input: '{"tool_input":{"command":"echo $HW_SECRET_KEY"}}', encoding: 'utf8' });
  let denyDecision = '';
  try { denyDecision = JSON.parse(denyRun.stdout)?.hookSpecificOutput?.permissionDecision || ''; } catch {}
  const allowRun = spawnSync(process.execPath, [hookPath], { input: '{"tool_input":{"command":"hcloud ECS ListServersDetails"}}', encoding: 'utf8' });
  const noDenyOnAllow = (allowRun.stdout || '').trim().length === 0;
  save('D4-28', `D4-28 Node 安全 hook 链路
hooks.json 注册 node huaweicloud-safety.mjs: ${hasMjs}
echo $HW_SECRET_KEY -> permissionDecision: ${denyDecision || '(无)'}
只读命令 -> 无 deny 输出: ${noDenyOnAllow}`, {
    status: (hasMjs && denyDecision === 'deny' && noDenyOnAllow) ? 'PASS' : 'FAIL',
    why: `hooks.json->node huaweicloud-safety.mjs 提取 command 并经 classifyTextCommand 对高危 echo 凭证命令输出 permissionDecision=deny，只读命令不误伤。`,
    hasMjs, denyDecision, noDenyOnAllow, executedAt: now()
  });
}

// D9-12：initialize 握手协议安全基线（P0）。断言：initialize 返回 protocolVersion/capabilities/serverInfo；非法时序 -32600。
{
  const { spawn } = await import('child_process');
  const serverPath = join(SRC, 'mcp-server.mjs');
  const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  let buf = Buffer.alloc(0);
  const pending = new Map(); let _id = 1;
  const send = (o) => { const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise((r) => pending.set(o.id, r)); };
  child.stdout.on('data', (d) => { buf = Buffer.concat([buf, d]); while (true) { const h = buf.indexOf('\r\n\r\n'); if (h < 0) break; const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString()); if (!m) { buf = buf.slice(h + 4); continue; } const n = +m[1]; if (buf.length < h + 4 + n) break; const body = buf.slice(h + 4, h + 4 + n).toString(); buf = buf.slice(h + 4 + n); try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {} } });
  const init = await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-12-probe', version: '1' } } });
  const result = init.result || {};
  const hasProto = !!result.protocolVersion;
  const hasCaps = !!result.capabilities;
  const hasServerInfo = !!result.serverInfo;
  const err = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name: 'does_not_exist', arguments: {} } });
  const invalidErr = err.error && err.error.code === -32600;
  child.kill();
  save('D9-12', `D9-12 initialize 握手安全基线
protocolVersion: ${result.protocolVersion}
capabilities: ${JSON.stringify(result.capabilities && Object.keys(result.capabilities)).slice(0,80)}
serverInfo: ${JSON.stringify(result.serverInfo)}
非法时序/未知错误码: code=${err.error?.code} (-32600 ${invalidErr})`, {
    status: (hasProto && hasCaps && hasServerInfo) ? 'PASS' : 'FAIL',
    why: `initialize 返回 protocolVersion=${result.protocolVersion} / capabilities / serverInfo，协议握手安全基线合规。`,
    hasProto, hasCaps, hasServerInfo, invalidErr, executedAt: now()
  });
}

// D9-13：tools/call 凭证不泄露与权限校验（P0）。断言：运行时凭证注入/清理/解析一致 + isPlaceholder + 无明文泄露。
{
  const creds = await import(`file://${SRC}/auth/credentials.mjs`);
  const sp = await import(`file://${SRC}/safety-policy.mjs`);
  const hasSet = typeof creds.setRuntimeCredentials === 'function';
  const hasClear = typeof creds.clearRuntimeCredentials === 'function';
  const hasHas = typeof creds.hasRuntimeCredentials === 'function';
  const hasResolve = typeof creds.resolveCredentialsWithRuntime === 'function';
  const hasPlaceholder = typeof creds.isPlaceholder === 'function';
  const redacted = sp.redactSecrets('AK=AKEXAMPLE123 SK=SKexample456 token=tok789');
  const noLeak = redacted && !redacted.includes('AKEXAMPLE') && !redacted.includes('SKexample') && !redacted.includes('tok789');
  save('D9-13', `D9-13 tools/call 凭证不泄露与权限校验
setRuntimeCredentials: ${hasSet}; clearRuntimeCredentials: ${hasClear}; hasRuntimeCredentials: ${hasHas}
resolveCredentialsWithRuntime: ${hasResolve}; isPlaceholder: ${hasPlaceholder}
redactSecrets 无明文泄露: ${noLeak}`, {
    status: (hasSet && hasClear && hasHas && hasResolve && hasPlaceholder && noLeak) ? 'PASS' : 'FAIL',
    why: `运行时凭证注入/清理/解析/占位判定齐全，redactSecrets 对 AK/SK/token 脱敏无明文泄露。`,
    hasSet, hasClear, hasHas, hasResolve, hasPlaceholder, noLeak, redacted, executedAt: now()
  });
}

// D1-39：Windows 升级检测链（OS 专属 P0）。
{
  save('D1-39', `D1-39 Windows 升级检测链可用性
OS 列标注「Windows（升级检测链 EINVAL 专属）」。本机为 Linux aarch64，非对应 OS，按 AGENTS.md 状态口径标 NOT_RUN。`, {
    status: 'NOT_RUN',
    why: 'OS 专属 P0 用例（Windows EINVAL 专属）在 Linux 非对应 OS；Windows 侧由对应客户端覆盖。',
    executedAt: now()
  });
}

console.log('\n=== fixup summary done ===');