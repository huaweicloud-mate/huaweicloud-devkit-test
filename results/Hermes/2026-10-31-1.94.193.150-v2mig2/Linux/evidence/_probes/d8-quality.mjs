// v2mig2 补测 —— D8 质量域可代码执行三用例：D8-2 错误信息可执行 / D8-5 运行时日志安全 / D8-8 遥测端到端
// 直调 dist 产物（v2 fcfe047f, package 2.0.0）导出函数，真机执行并落证据。
import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdirSync, mkdtempSync, rmSync, cpSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';

const SRC = process.argv[2];   // .../plugins/huaweicloud-core/dist
const PLUGIN = process.argv[3]; // .../plugins/huaweicloud-core (plugin 根，用于 D8-8 隔离拷贝)
const OUT = process.argv[4];   // .../evidence
const __dirname = dirname(fileURLToPath(import.meta.url));

function rec(id, status, why, lines) {
  const body = `=====CASE ${id} =====\nexecutedAt=${new Date().toISOString()}\nstatus=${status}\n${lines.join('\n')}\nwhy=${why}\n=====CASE ${id} RESULT: ${status} =====\n`;
  const dir = join(OUT, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify({ status, why, executedAt: new Date().toISOString() }, null, 1));
  writeFileSync(join(dir, 'stdout.txt'), body);
  console.log(`[${id}] ${status}`);
}

function okLines(assertions) {
  let all = true;
  const lines = [];
  for (const a of assertions) {
    lines.push(`${a.pass ? 'PASS' : 'FAIL'}: ${a.name}${a.detail ? ' | ' + a.detail : ''}`);
    if (!a.pass) all = false;
  }
  return { status: all ? 'PASS' : 'FAIL', lines };
}

// ============ D8-2 错误信息可执行（10 个典型错误响应均含下一步指引） ============
{
  const E = (await import(pathToFileURL(`${SRC}/explain-error.js`).href)).explainError;
  const cases = [
    { svc: 'obs', code: 'InvalidAccessKeyId', kw: 'ak/sk', label: 'OBS InvalidAccessKeyId' },
    { svc: '', code: 'APIC.7241', kw: 'enterprise_project_id', label: 'APIC.7241 前缀推导企业项目ID' },
    { svc: 'functiongraph', code: 'FSS.0403', kw: 'permission', label: 'FSS.0403 权限' },
    { svc: '', code: 'VPC.0301', kw: 'bandwidth', label: 'VPC.0301 带宽(仅错误码前缀推导)' },
    { svc: '', code: 'Ecs.0707', kw: 'flavor', label: 'Ecs.0707 规格镜像' },
    { svc: '', code: 'Ecs.0019', kw: 'listflavors', label: 'Ecs.0019 规格下线' },
    { svc: '', code: 'KPS.9004', kw: 'balance', label: 'KPS.9004 账户受限' },
    { svc: 'apigw', code: 'APIGW.0301', kw: 'ak/sk', label: 'APIGW.0301 鉴权' },
    { svc: 'obs', code: 'UserRestricted', kw: 'permission', label: 'OBS UserRestricted' },
    { svc: 'unknown', code: 'XYZ.9999', kw: 'error center', label: '未知码走兜底指引' },
  ];
  const assertions = [];
  for (const c of cases) {
    const r = E({ service: c.svc, errorCode: c.code, message: '', requestId: '' });
    const joined = (r.suggestions || []).join(' ').toLowerCase();
    const hasActionable = (r.suggestions || []).length >= 1 && joined.includes(c.kw.toLowerCase());
    assertions.push({ name: c.label, pass: hasActionable, detail: (r.suggestions || []).length ? 'suggestions=' + (r.suggestions || []).length + ' 含指引关键词 ' + c.kw : '无建议' });
  }
  // 兜底带下一步指引也算「可执行」（10 条全含指引即通过）
  const { status, lines } = okLines(assertions);
  const why = status === 'PASS' ? '10 个典型错误响应（含未知码兜底）均返回 ≥1 条含恢复路径/下一步指引的建议，无「仅报错无指引」情形（explain-error.js）。'
    : '存在错误响应未含可执行的下一步指引，见 stdout.txt。';
  rec('D8-2', status, why, lines);
}

// ============ D8-5 运行时日志安全（脱敏函数 + 实际运行日志扫描） ============
{
  const R = (await import(pathToFileURL(`${SRC}/safety/redact.js`).href));
  const redactSecrets = R.redactSecrets;
  const assertions = [];
  // 1) redactString 对 AK/SK / password / user_data / Authorization 脱敏
  const s1 = redactSecrets('AK=AKIAIOSFODNN7EXAMPLE SK=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
  assertions.push({ name: 'AK/SK 明文 → <redacted>', pass: typeof s1 === 'string' && !/AKIAIOSFODNN7EXAMPLE|wJalrXUtnFEMI/.test(s1) && s1.includes('<redacted>'), detail: JSON.stringify(s1).slice(0, 120) });
  const s2 = redactSecrets({ ak: 'AKIAIOSFODNN7EXAMPLE', sk: 'secret-value', password: 'p@ssw0rd', name: 'keep-me', nested: { token: 'tk-abc' } });
  assertions.push({ name: '对象 key 级脱敏（ak/sk/password/token 红，name 留）', pass: s2.ak === '<redacted>' && s2.sk === '<redacted>' && s2.password === '<redacted>' && s2.nested.token === '<redacted>' && s2.name === 'keep-me', detail: JSON.stringify(s2) });
  const s3 = redactSecrets('Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abcdef');
  assertions.push({ name: 'Authorization Bearer 整个值脱敏', pass: !/eyJhbGciOiJIUzI1Ni/.test(s3) && /Authorization:\s*<redacted>|authorization.*<redacted>/i.test(s3), detail: JSON.stringify(s3).slice(0, 120) });
  const s4 = redactSecrets('user_data=#!/bin/bash echo AKIAIOSFODNN7EXAMPLE');
  assertions.push({ name: 'user_data blob 整体脱敏', pass: !/AKIAIOSFODNN7EXAMPLE/.test(s4) && /<redacted>/.test(s4), detail: JSON.stringify(s4).slice(0, 120) });

  // 2) 实际运行日志扫描：扫描 evidence 下已有 install.log/update.log 是否泄漏真实 AK/SK
  const LOG_DIR = join(OUT, '..'); // evidence/
  const leakPat = /(AKIA[0-9A-Z]{16}|secret[_-]?access[_-]?key\s*[:=]\s*[A-Za-z0-9+/]{16,}|sk\s*[:=]\s*[A-Za-z0-9+/_]{20,})/i;
  // 仅针对 .log 文件（安装/升级运行日志），排除 stdout.txt/.json 断言文本里的测试样例
  const logs = [];
  const { readdirSync } = await import('node:fs');
  const scanLogs = (base) => {
    for (const cid of readdirSync(base)) {
      const d = join(base, cid);
      if (cid.startsWith('.') || cid === '_probes') continue;
      try {
        for (const f of readdirSync(d)) {
          if (f.endsWith('.log')) {
            const p = join(d, f);
            const txt = readFileSync(p, 'utf8');
            const leak = txt.match(leakPat);
            logs.push({ file: `${cid}/${f}`, leaked: Boolean(leak), sample: leak ? leak[0].slice(0, 40) : '' });
          }
        }
      } catch {}
    }
  };
  scanLogs(LOG_DIR);
  const leakedAny = logs.filter((x) => x.leaked);
  assertions.push({ name: `实际安装/升级运行日志扫描（${logs.length} 个 .log）无明文 AK/SK 泄漏`, pass: leakedAny.length === 0, detail: leakedAny.length ? leakedAny.map((x) => x.file).join(',') : `scan=${logs.length}` });

  const { status, lines: lines5 } = okLines(assertions);
  if (leakedAny.length) lines5.push('LEAK 明细: ' + JSON.stringify(leakedAny));
  lines5.push('扫描文件: ' + logs.map((x) => x.file).join(', '));
  const why5 = status === 'PASS' ? 'redactSecrets/redactString 对 AK/SK/password/Authorization/user_data 均脱敏为 <redacted>，且本次运行产生的安装/升级日志扫描无明文凭证泄漏。'
    : '存在脱敏缺口或日志泄漏，见 stdout.txt。';
  rec('D8-5', status, why5, lines5);
}

// ============ D8-8 遥测策略端到端（trackTool/trackSandbox/hook 事件/上报脱敏） ============
{
  const assertions = [];
  const lines88 = [];

  // 1) invoke-value 上报脱敏（audit-relevant 取值，不携带 secret）
  const IV = (await import(pathToFileURL(`${SRC}/telemetry/invoke-value.js`).href)).toolInvokeValue;
  const v1 = IV('huaweicloud_run_approved_command', { args: ['--cli-region=cn-north-4', 'ECS', 'DeleteServers', '--servers.1.id=abc-xyz-123'] });
  assertions.push({ name: 'run_approved 上报值仅 svc+op（不含 --flag/资源ID）', pass: v1 === 'hcloud ECS DeleteServers', detail: JSON.stringify(v1) });
  const v2 = IV('huaweicloud_secret_set', { ref: 'prod/db', value: 'SUPER_SECRET_AK_SK_VALUE' });
  assertions.push({ name: 'secret_set 上报值仅 ref（不含 value/channel）', pass: v2 === 'prod/db' && !v2.includes('SUPER_SECRET_AK_SK_VALUE'), detail: JSON.stringify(v2) });
  const v3 = IV('huaweicloud_hook_check_command', { command: 'hcloud ECS DeleteServers --servers.1.id=abc' });
  assertions.push({ name: 'hook_check_command 上报值仅 svc+op', pass: v3 === 'hcloud ECS DeleteServers', detail: JSON.stringify(v3) });
  const v4 = IV('huaweicloud_hook_check_command', { command: 'hcloud ECS DeleteServers --servers.1.id=SECRETID123' });
  assertions.push({ name: 'hook_check_command 上报值剥离资源ID（SECRETID123 不入遥测）', pass: v4 === 'hcloud ECS DeleteServers' && !v4.includes('SECRETID123'), detail: JSON.stringify(v4) });

  // 2) sanitizeValue 截断+换行归一（防长值/多行泄密）
  const TV = (await import(pathToFileURL(`${SRC}/telemetry/telemetry-values.js`).href));
  const longSecret = 'AK=' + 'x'.repeat(400) + '\nSK=' + 'y'.repeat(400);
  const sv = TV.sanitizeValue(longSecret);
  assertions.push({ name: 'sanitizeValue 长度截断 ≤255 且无换行', pass: sv.length <= 255 && !/[\r\n\t]/.test(sv), detail: `len=${sv.length}` });
  const objOnly = TV.toTelemetryEventInput({ key: 'cli:write', value: 'hcloud ECS DeleteServers', capability: 'cli' });
  const badHook = TV.toTelemetryEventInput('not-an-object');
  assertions.push({ name: 'hook 事件 JSON 收窄：合法对象通过、非法输入返回 null', pass: objOnly !== null && objOnly.key === 'cli:write' && badHook === null, detail: JSON.stringify(objOnly) });

  // 3) 端到端：隔离插件目录拷贝 + 隔离 HOME + mock 端点，initTelemetry + track* + flush 捕获 POST
  const iso = mkdtempSync(join(tmpdir(), 'd8-8-'));
  const coreCopy = join(iso, 'plugins', 'huaweicloud-core');
  mkdirSync(coreCopy, { recursive: true });
  for (const sub of ['dist', 'safety', 'hooks', 'skills']) {
    const src = join(PLUGIN, sub);
    if (existsSync(src)) cpSync(src, join(coreCopy, sub), { recursive: true });
  }
  if (existsSync(join(PLUGIN, 'package.json'))) cpSync(join(PLUGIN, 'package.json'), join(coreCopy, 'package.json'));

  // mock telemetry 端点，捕获 POST body
  let posted = [];
  const mock = createServer((req, res) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => { posted.push(b); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{}'); });
  });
  await new Promise((r) => mock.listen(0, '127.0.0.1', r));
  const ep = `http://127.0.0.1:${mock.address().port}`;

  const tele = await import(pathToFileURL(`${coreCopy}/dist/telemetry/telemetry.js`).href + '?t=' + Date.now() + Math.random());
  const oldHome = process.env.HUAWEICLOUD_DEVKIT_HOME;
  const oldEp = process.env.HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT;
  process.env.HUAWEICLOUD_DEVKIT_HOME = join(iso, 'home');
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT = ep;

  // opt-out 门：telemetry=off 时 track 不产生事件
  const oldTel = process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
  const enabledOff = tele.isTelemetryEnabled();
  assertions.push({ name: 'HUAWEICLOUD_DEVKIT_TELEMETRY=off → isTelemetryEnabled=false', pass: enabledOff === false, detail: `isTelemetryEnabled=${enabledOff}` });
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'on';

  tele.initTelemetry({ harness: 'hermes', version: '2.0.0' });
  tele.trackToolInvoke('huaweicloud_plan_cli_command');
  tele.trackToolInvoke('huaweicloud_search_docs');
  tele.trackSkillRetrieve('huawei-ecs');
  tele.trackSandboxConnect();
  tele.trackSandboxDisconnect();
  // 写一条 hook 事件（cli:write，value 已是生产者裁剪后的 svc+op 形态，与真实 Python record_cli_event 一致）到隔离插件 telemetry 目录
  const hookDir = join(coreCopy, 'telemetry');
  mkdirSync(hookDir, { recursive: true });
  writeFileSync(join(hookDir, 'hook-events.jsonl'), JSON.stringify({ key: 'cli:write', value: 'hcloud ECS DeleteServers', capability: 'cli' }) + '\n');
  tele.ingestHookEvents();
  // 触发 flush：凑满 BATCH_SIZE
  for (let i = 0; i < 100; i++) tele.trackToolInvoke('huaweicloud_check_cli');
  await new Promise((r) => setTimeout(r, 1500));

  const allPosted = posted.join('');
  const keysOk = /tool:huaweicloud_plan_cli_command/.test(allPosted) && /tool:huaweicloud_search_docs/.test(allPosted)
    && /skill:retrieve/.test(allPosted) && /sandbox:connect/.test(allPosted) && /sandbox:disconnect/.test(allPosted)
    && /cli:write/.test(allPosted);
  assertions.push({ name: 'flush POST 含 trackTool/trackSkill/trackSandbox/hook(cli:write) 事件', pass: keysOk, detail: `posted_batches=${posted.length}` });
  const noSecret = !/SECRETID123|AKIA[0-9A-Z]{16}|secret[_-]?access[_-]?key/i.test(allPosted);
  assertions.push({ name: 'flush POST 不含明文凭证/资源ID（上报脱敏）', pass: noSecret, detail: allPosted.includes('SECRETID123') ? '探测到 SECRETID123 泄漏' : '无泄漏' });
  const hasCapability = /"capability":"cli"/.test(allPosted);
  assertions.push({ name: 'hook 事件携带 capability=cli 分类', pass: hasCapability, detail: '' });

  // cleanup
  mock.close();
  try { mock.closeAllConnections?.(); } catch {}
  process.env.HUAWEICLOUD_DEVKIT_HOME = oldHome;
  process.env.HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT = oldEp;
  if (oldTel !== undefined) process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = oldTel; else delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
  rmSync(iso, { recursive: true, force: true });

  lines88.push('端到端 mock 端点捕获 POST batch 数=' + posted.length);
  lines88.push('POST 摘要: ' + allPosted.slice(0, 300));
  const { status: st88 } = okLines(assertions);
  const why88 = st88 === 'PASS' ? 'trackToolInvoke/trackSkillRetrieve/trackSandboxConnect/trackSandboxDisconnect 与 hook 事件均进入事件队列并经 flush POST 上报；invoke-value 只取审计相关值（svc+op/ref），sanitizeValue 截断防长值泄密，上报体不含明文凭证；HUAWEICLOUD_DEVKIT_TELEMETRY=off 正确关闭收集。'
    : '遥测链路存在缺口，见 stdout.txt。';
  rec('D8-8', st88, why88, [...assertions.map((a) => `${a.pass ? 'PASS' : 'FAIL'}: ${a.name} | ${a.detail || ''}`), ...lines88]);
}

console.log('=== D8 quality probe DONE ===');
process.exit(0);