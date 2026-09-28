// D9-13: tools/call 凭证不泄露与权限校验探针
// 检查 tools/call 返回不含 AK/SK 明文
// 检查权限校验 deny/warn/allow 三态
import { spawn } from 'node:child_process';

const SERVER = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src\\mcp-server.mjs';
const RISK_ENGINE = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src\\risk-rule-engine.mjs';
const findings = [];
let status = 'PASS';
let why = '';

function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pending.set(o.id, r));
  }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  return { child, send, kill: () => child.kill() };
}

// AK/SK 明文检测正则
const AK_PATTERN = /AK[A-Z0-9]{16,20}/;
const SK_PATTERN = /sk-[a-zA-Z0-9]{20,}/;
const ACCESS_KEY_PATTERN = /access[_-]?key[_-]?id\s*[:=]\s*["']?[A-Z0-9]{16,}/i;
const SECRET_KEY_PATTERN = /secret[_-]?access[_-]?key\s*[:=]\s*["']?[a-zA-Z0-9]{20,}/i;

function containsCredential(text) {
  const s = String(text || '');
  return AK_PATTERN.test(s) || SK_PATTERN.test(s) || ACCESS_KEY_PATTERN.test(s) || SECRET_KEY_PATTERN.test(s);
}

async function main() {
  // ===== Part 1: MCP tools/call 凭证不泄露 =====
  const srv = makeServer(SERVER);

  // initialize 握手
  await srv.send({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-13-probe', version: '1' } }
  });
  srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  // 获取工具列表
  const tl = await srv.send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const tools = tl?.result?.tools || [];
  findings.push(`tools/list 返回 ${tools.length} 工具`);

  // 查找可能返回凭证信息的工具并调用
  const credTools = tools.filter(t =>
    /profile|config|credential|auth|show/i.test(t.name)
  );
  findings.push(`可能涉及凭证的工具: ${credTools.map(t => t.name).join(', ') || '无'}`);

  let credLeakDetected = false;
  let testedTools = 0;

  for (const tool of credTools.slice(0, 5)) {
    try {
      const callResult = await srv.send({
        jsonrpc: '2.0', id: 100 + testedTools,
        method: 'tools/call',
        params: { name: tool.name, arguments: {} }
      });
      testedTools++;
      const resultStr = JSON.stringify(callResult);
      if (containsCredential(resultStr)) {
        findings.push(`FAIL: ${tool.name} 响应中检测到 AK/SK 明文`);
        credLeakDetected = true;
      } else {
        findings.push(`PASS: ${tool.name} 响应中未检测到 AK/SK 明文`);
      }
    } catch (e) {
      findings.push(`INFO: ${tool.name} 调用异常: ${e.message}`);
    }
  }

  if (credLeakDetected) {
    status = 'FAIL';
    why = 'tools/call 响应中检测到 AK/SK 明文泄露';
  } else {
    findings.push(`凭证不泄露检查: ${testedTools} 个工具调用均未泄露 AK/SK 明文`);
  }

  srv.kill();

  // ===== Part 2: 权限校验 deny/warn/allow 三态 =====
  const riskMod = await import('file:///' + RISK_ENGINE.replace(/\\/g, '/'));
  findings.push('导入 risk-rule-engine.mjs: OK');

  // deny 测试: cat 凭证文件
  const denyResult = riskMod.evaluateCommandRisk('cat ~/.hcloud/credentials');
  findings.push(`deny测试(cat ~/.hcloud/credentials): decision=${denyResult.decision}, rules=${denyResult.findings.map(f => f.ruleId).join(',')}`);
  if (denyResult.decision !== 'deny') {
    status = 'FAIL';
    why = `凭证文件读取未返回 deny: ${denyResult.decision}`;
  } else {
    findings.push('PASS: cat 凭证文件正确返回 deny');
  }

  // deny 测试: env dump
  const envDenyResult = riskMod.evaluateCommandRisk('env | grep HUAWEICLOUD');
  findings.push(`deny测试(env|grep HUAWEICLOUD): decision=${envDenyResult.decision}, rules=${envDenyResult.findings.map(f => f.ruleId).join(',')}`);
  if (envDenyResult.decision !== 'deny') {
    status = 'FAIL';
    why = `环境变量dump未返回 deny: ${envDenyResult.decision}`;
  } else {
    findings.push('PASS: env dump 正确返回 deny');
  }

  // deny 测试: 删资源 --force
  const delDenyResult = riskMod.evaluateCommandRisk('hcloud ECS DeleteServers --force');
  findings.push(`deny测试(DeleteServers --force): decision=${delDenyResult.decision}, rules=${delDenyResult.findings.map(f => f.ruleId).join(',')}`);
  if (delDenyResult.decision !== 'deny') {
    status = 'FAIL';
    why = `强制删除未返回 deny: ${delDenyResult.decision}`;
  } else {
    findings.push('PASS: 强制删除正确返回 deny');
  }

  // warn 测试: hcloud STS GetCallerIdentity
  const warnResult = riskMod.evaluateCommandRisk('hcloud STS GetCallerIdentity');
  findings.push(`warn测试(STS GetCallerIdentity): decision=${warnResult.decision}, rules=${warnResult.findings.map(f => f.ruleId).join(',')}`);
  if (warnResult.decision !== 'warn') {
    findings.push(`WARN: STS GetCallerIdentity 返回 ${warnResult.decision} (期望 warn)`);
  } else {
    findings.push('PASS: STS 临时凭证正确返回 warn');
  }

  // warn 测试: hcloud ECS DeleteServers (不带 force)
  const warnResult2 = riskMod.evaluateCommandRisk('hcloud ECS DeleteServers');
  findings.push(`warn测试(DeleteServers 无force): decision=${warnResult2.decision}, rules=${warnResult2.findings.map(f => f.ruleId).join(',')}`);
  if (warnResult2.decision === 'warn' || warnResult2.decision === 'deny') {
    findings.push(`PASS: DeleteServers 返回 ${warnResult2.decision} (warn或deny均可接受)`);
  } else {
    findings.push(`INFO: DeleteServers 返回 ${warnResult2.decision}`);
  }

  // allow 测试: 只读命令
  const allowResult = riskMod.evaluateCommandRisk('hcloud ECS ListServers');
  findings.push(`allow测试(ListServers): decision=${allowResult.decision}, findings=${allowResult.findings.length}`);
  if (allowResult.decision !== 'allow') {
    status = 'FAIL';
    why = `只读命令未返回 allow: ${allowResult.decision}`;
  } else {
    findings.push('PASS: 只读命令正确返回 allow');
  }

  // allow 测试: 另一个只读命令
  const allowResult2 = riskMod.evaluateCommandRisk('hcloud VPC ListVpcs');
  findings.push(`allow测试(ListVpcs): decision=${allowResult2.decision}`);
  if (allowResult2.decision !== 'allow') {
    findings.push(`WARN: ListVpcs 返回 ${allowResult2.decision} (期望 allow)`);
  } else {
    findings.push('PASS: ListVpcs 正确返回 allow');
  }

  // 汇总三态
  const hasDeny = denyResult.decision === 'deny';
  const hasWarn = warnResult.decision === 'warn';
  const hasAllow = allowResult.decision === 'allow';
  findings.push(`三态汇总: deny=${hasDeny}, warn=${hasWarn}, allow=${hasAllow}`);
  if (!hasDeny || !hasWarn || !hasAllow) {
    if (status === 'PASS') {
      status = 'FAIL';
      why = `权限校验三态不完整: deny=${hasDeny}, warn=${hasWarn}, allow=${hasAllow}`;
    }
  } else {
    findings.push('PASS: deny/warn/allow 三态全部验证通过');
  }

  if (status === 'PASS') {
    why = `tools/call 凭证不泄露检查通过(${testedTools}个工具)，权限校验 deny/warn/allow 三态完整`;
  }

  return { status, why, findings };
}

const result = await main();
const now = new Date();
const ts = now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0') +
  String(now.getSeconds()).padStart(2, '0');

console.log(JSON.stringify({ status: result.status, why: result.why, executedAt: ts, findings: result.findings }, null, 2));