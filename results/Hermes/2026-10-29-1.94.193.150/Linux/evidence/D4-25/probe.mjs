import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const CORE = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: String(detail).slice(0, 600) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}`);
}
function redact(s) {
  return String(s)
    .replace(/(HPUA|AKIA|ASIA|HUAWEI)[A-Za-z0-9]{8,}/g, '$1***')
    .replace(/(password|secret_key|access_key|adminPass|token)\s*[:=]\s*"[^"]*"/gi, '$1="<redacted>"')
    .replace(/(AK|SK)\s*[:=]\s*\S+/g, '$1=<redacted>');
}

// ============ D10-4 安全干预-静态规则层（规则库加载 + 三态判定） ============
console.log('\n=====CASE D10-4=====');
{
  const re = await import(pathToFileURL(SRC + '/risk-rule-engine.mjs').href);
  const catalog = re.loadRiskRules();
  const rules = catalog.rules || [];
  const sev = {};
  for (const r of rules) sev[r.severity] = (sev[r.severity] || 0) + 1;
  console.log('规则库: version=' + catalog.version + ' 规则数=' + rules.length + ' severity=' + JSON.stringify(sev));
  console.log('规则清单:');
  for (const r of rules) console.log(`  - ${r.id} [${r.severity}] stages=${JSON.stringify(r.stages)}`);
  const ruleCountOk = rules.length === 16 && sev.deny === 9 && sev.warn === 7;
  check('规则库完整 16 条(9 deny + 7 warn)', ruleCountOk, JSON.stringify(sev));

  const denyCmd = re.evaluateCommandRisk('cat ~/.config/huaweicloud/credentials.json');
  const allowCmd = re.evaluateCommandRisk('hcloud VPC ListVpcs --cli-region=cn-north-4');
  const delWarn = re.evaluateCommandRisk('hcloud VPC DeleteVpc --vpc_id=00000000-0000-0000-0000-000000000000 --cli-region=cn-north-4');
  const secret = re.evaluateCommandRisk('hcloud csms ShowSecretVersion --secret_name=my-secret');
  console.log('credential-file     -> ' + denyCmd.decision + ' findings=' + denyCmd.findings.length);
  console.log('readonly ListVpcs   -> ' + allowCmd.decision + ' findings=' + allowCmd.findings.length);
  console.log('DeleteVpc(无force)  -> ' + delWarn.decision + ' findings=' + delWarn.findings.length);
  console.log('ShowSecretVersion   -> ' + secret.decision + ' findings=' + secret.findings.length);
  check('高危(凭证文件读取)判 deny', denyCmd.decision === 'deny', denyCmd.decision);
  check('只读 ListVpcs 判 allow', allowCmd.decision === 'allow', allowCmd.decision);
  check('删除操作判 warn/deny(非 allow)', delWarn.decision === 'warn' || delWarn.decision === 'deny', delWarn.decision);
  check('明文 secret 读取判 deny', secret.decision === 'deny', secret.decision);
}
console.log('=====END D10-4=====');

// ============ D4-26 findings 证据脱敏 ============
console.log('\n=====CASE D4-26=====');
{
  const re = await import(pathToFileURL(SRC + '/risk-rule-engine.mjs').href);
  const artifact = {
    path: 'tf/main.tf',
    content: JSON.stringify({
      access_key: 'AKIA1234567890SECRET',
      secret_key: 'SKSECRETVALUE9',
      adminPass: 'MyP@ss12345',
      Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }],
    }),
  };
  const r = re.evaluateArtifacts([artifact]);
  console.log('decision=' + r.decision + ' findings=' + r.findings.length);
  const ev = (r.findings[0] && r.findings[0].evidence) || '';
  console.log('evidence(已脱敏)=' + redact(ev));
  const leaked = /AKIA1234567890SECRET|SKSECRETVALUE9|MyP@ss12345/.test(ev);
  const redacted = /<redacted>/.test(ev);
  check('findings.evidence 触发且脱敏', r.findings.length > 0 && redacted && !leaked, redact(ev));
  check('明文 AK/SK/password 无残留', !leaked, 'leaked=' + leaked);
}
console.log('=====END D4-26=====');

// ============ D4-29 分类断言与原始命令分类入口 ============
console.log('\n=====CASE D4-29=====');
{
  const sp = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
  const cases = [
    ['hcloud VPC ListVpcs --cli-region=cn-north-4', 'allow'],
    ['cat ~/.config/huaweicloud/credentials.json', 'deny'],
    ['hcloud ecs DeleteServers --servers.1.id=x --delete_publicip=true --cli-region=cn-north-4', 'deny/warn'],
  ];
  for (const [cmd, exp] of cases) {
    const r = sp.classifyTextCommand(cmd);
    let assertResult = null;
    try { sp.assertAllowed(r); assertResult = 'allowed'; } catch (e) { assertResult = 'blocked:' + (e.message || '').slice(0, 40); }
    console.log(`cmd="${cmd}" -> decision=${r.decision} risk=${r.risk} assertAllowed=${assertResult}`);
    let ok = false;
    if (exp === 'allow') ok = r.decision === 'allow' && assertResult === 'allowed';
    else if (exp === 'deny') ok = r.decision === 'deny' && assertResult.startsWith('blocked');
    else ok = (r.decision === 'deny' || r.decision === 'warn');
    check('classify+assert: ' + cmd.slice(0, 30), ok, `decision=${r.decision} assert=${assertResult}`);
  }
  // classifyTextCommand 返回结构含 decision/reason
  const s = sp.classifyTextCommand('hcloud VPC ListVpcs');
  check('分类结果含 decision/reason', typeof s.decision === 'string' && typeof s.reason === 'string', JSON.stringify({ d: s.decision, reason: (s.reason || '').slice(0, 40) }));
}
console.log('=====END D4-29=====');

// ============ D4-28 Node 版安全 hook 链路 ============
console.log('\n=====CASE D4-28=====');
{
  const hook = CORE + '/hooks/huaweicloud-safety.mjs';
  const runHook = (payload) => {
    try {
      return execFileSync('node', [hook], { input: JSON.stringify(payload), encoding: 'utf8', timeout: 30000 }).trim();
    } catch (e) {
      return 'ERR:' + (e.stdout || '') + (e.stderr || '');
    }
  };
  const deny1 = runHook({ tool_input: { command: 'cat ~/.config/huaweicloud/credentials.json' } });
  const deny2 = runHook({ tool_input: { command: 'hcloud ecs DeleteServers --servers.1.id=x --cli-region=cn-north-4' } });
  const allow1 = runHook({ tool_input: { command: 'hcloud VPC ListVpcs --cli-region=cn-north-4' } });
  console.log('高危险(凭证文件): ' + deny1.slice(0, 160));
  console.log('高危险(删除): ' + deny2.slice(0, 160));
  console.log('只读: ' + (allow1 === '' ? '(无输出=allow)' : allow1.slice(0, 160)));
  const hasDeny1 = /permissionDecision"\s*:\s*"deny"/.test(deny1);
  const hasDeny2 = /permissionDecision"\s*:\s*"deny"/.test(deny2);
  const allowOk = allow1 === '' || !/permissionDecision"\s*:\s*"deny"/.test(allow1);
  check('hooks.json(.mjs) 提取 commandText 并 deny', hasDeny1, deny1.slice(0, 120));
  check('写操作/删除判 deny', hasDeny2, deny2.slice(0, 120));
  check('非高危无 deny 输出', allowOk, allow1 === '' ? '(empty)' : allow1.slice(0, 120));
}
console.log('=====END D4-28=====');

// ============ D4-25 Python hook 事件遥测分类 ============
console.log('\n=====CASE D4-25=====');
{
  const py = CORE + '/hooks/huaweicloud-safety.py';
  const jsonl = CORE + '/../telemetry/hook-events.jsonl'; // PLUGIN_DIR = parents[2] -> hdk/plugins
  const { mkdirSync, rmSync, readFileSync: rfs } = await import('node:fs');
  try { rmSync(jsonl, { force: true }); } catch {}
  mkdirSync(CORE + '/../telemetry', { recursive: true });
  const classify = (cmd) => {
    const code = `
import json, importlib.util, sys
spec = importlib.util.spec_from_file_location('safety', '${py}')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.record_cli_event(${JSON.stringify(cmd)})
`;
    execFileSync('python3', ['-c', code], { encoding: 'utf8', timeout: 30000 });
  };
  const readAll = () => {
    try { return rfs(jsonl, 'utf8').trim().split('\n').filter(Boolean); } catch { return []; }
  };
  classify('hcloud ecs ListServersDetails --cli-region=cn-north-4');
  classify('hcloud vpc CreateVpc --vpc.name=t --vpc.cidr=10.0.0.0/24');
  classify('hcloud help');
  const nBefore = readAll().length;
  classify('npm install huaweicloud-devkit'); // 非 hcloud：record_cli_event 提前 return，不落事件
  const lines = readAll();
  console.log('hook-events.jsonl 路径: ' + jsonl + ' 共 ' + lines.length + ' 条(第4条 npm 视为未落)');
  lines.forEach((l, i) => console.log('  [' + i + '] ' + JSON.stringify(JSON.parse(l)).slice(0, 180)));
  const parse = (l) => { try { return JSON.parse(l); } catch { return {}; } };
  const readLine = parse(lines[0] || 'null');
  const writeLine = parse(lines[1] || 'null');
  const invokeLine = parse(lines[2] || 'null');
  const readKey = readLine.key === 'cli:read';
  const writeKey = writeLine.key === 'cli:write';
  const invokeKey = invokeLine.key === 'cli:invoke';
  const hasValCap = !!(writeLine.value !== undefined && writeLine.capability !== undefined);
  const nonHcloudNoEvent = lines.length === nBefore; // npm 不产生新事件
  check('只读→cli:read', readKey, (readLine.key || ''));
  check('写→cli:write', writeKey, (writeLine.key || '(实际 ' + writeLine.key + ')'));
  check('其他 hcloud→cli:invoke', invokeKey, (invokeLine.key || ''));
  check('事件含 key/value/capability', hasValCap, JSON.stringify(writeLine).slice(0, 160));
  check('非 hcloud 命令不误判(提前 return 不落事件)', nonHcloudNoEvent, '前=' + nBefore + ' 后=' + lines.length);
}
console.log('=====END D4-25=====');

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));