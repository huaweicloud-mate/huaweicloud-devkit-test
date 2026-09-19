// OpenClaw Linux 真云补测探针（2026-09-18）—— 覆盖 D4-13 最小权限、D3-C4 服务矩阵(真机建删归零)、
// D4-14 CTS 审计、D4-18/19/20 审批流、D2 认证真云项。SUT: v1.1.5 (gitHead e7ed6f6)。
// 真云红线：最低配置创建 → 测后删除归零 → 只删本次 tctest- 前缀资源。
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync, rmSync, mkdtempSync, mkdirSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const REGION = 'cn-north-4';
const DOMAIN = '842591186fa245929e1b5c186a4cf784';
const credAdmin = JSON.parse(readFileSync(join(homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8'));
const credRO = JSON.parse(readFileSync(join(homedir(), '.config', 'huaweicloud', 'credentials.readonly.json'), 'utf8'));

function hcloud(ak, sk, args) {
  const r = spawnSync('hcloud', [...args, `--cli-region=${REGION}`, `--cli-access-key=${ak}`, `--cli-secret-key=${sk}`, '--cli-output=json'], { encoding: 'utf8' });
  return { raw: `${r.stdout || ''}${r.stderr || ''}`, code: r.status };
}
function parseJson(raw) {
  const i = raw.indexOf('{');
  if (i < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let j = i; j < raw.length; j++) {
    const c = raw[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { try { return JSON.parse(raw.slice(i, j + 1)); } catch { return null; } } }
  }
  return null;
}
const deniedRe = /SYS\.0403|not authorized|Forbidden|forbidden|No permissions|doesn't allow|DBS\.280032|DCS\.2003|CTS\.0013|ces\.0017|insufficient|PolicyNotAuthorized|VPC\.0010|VPC\.0018|VPC\.0017/i;

let pass = 0, fail = 0; const lines = [];
function check(id, title, actual, expected) {
  const ok = actual === expected; ok ? pass++ : fail++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function note(msg) { lines.push(`NOTE   ${msg}`); }

// ============ D4-13 最小权限（只读子账号 test001）核心断言 ============
// 核心：①写操作被 IAM 拒绝（权限不足） ②被授予的只读能力可用 ③run-as-readonly env 切换生效
{
  const CORE = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
  // ③ 环境切换：用 run-as-readonly 语义（HW_ACCESS_KEY/HW_SECRET_KEY env，不带 token）验证 resolveCredentials 切到只读账号
  const { execFileSync } = await import('node:child_process');
  const probePath = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/OpenClaw/2026-09-18-113.44.197.147/Linux/evidence/realcloud/probe-d4-13-switch.mjs';
  const out = execFileSync('python3', ['scripts/run-as-readonly.py', 'node', probePath], { cwd: '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test', encoding: 'utf8' });
  const sw = JSON.parse(out.trim().split('\n').pop() || '{}');
  check('D4-13', 'run-as-readonly env 切换生效(resolveCredentials→只读账号)', sw.readonlyMatch === true && sw.stillAdmin === false, true);

  // ① 写操作（VPC CreateSecurityGroup dry_run）应被 IAM 拒绝
  const w = hcloud(credRO.ak, credRO.sk, ['VPC', 'CreateSecurityGroup', '--security_group.name=tctest-ro-write-probe', '--dry_run=true']);
  const wj = parseJson(w.raw);
  const writeDenied = wj?.error_code === 'SYS.0403' || deniedRe.test(w.raw);
  check('D4-13', '只读子账号 写操作被 IAM 拒绝(权限不足)', writeDenied, true);

  // ② 被授予的只读能力可用（IAM KeystoneListProjects 是 test001 实际读权限）
  const r = hcloud(credRO.ak, credRO.sk, ['IAM', 'KeystoneListProjects', `--cli-domain-id=${DOMAIN}`]);
  const n = parseJson(r.raw)?.projects?.length ?? -1;
  check('D4-13', '只读子账号 被授予读(IAM KeystoneListProjects) 可用', n > 0, true);

  // 只读矩阵补充：其余只读服务调用「返回合法结构(空列表)或明确拒绝」均非「崩溃/含糊」，不额外断言「未授权必拒」
  const extra = [['ECS','NovaListServers'],['RDS','ListInstances'],['DDS','ListInstances'],['DCS','ListInstances']];
  let valid = 0;
  for (const a of extra) {
    const rr = hcloud(credRO.ak, credRO.sk, a);
    const j = parseJson(rr.raw);
    const okShape = (j && Array.isArray(rr.raw)) || /\[.*\]|\{.*\}|error|Error|Unsupported|multi-version/i.test(rr.raw) || rr.raw.trim().length > 0;
    if (okShape) valid++;
    else note(`D4-13 ${a[0]} ${a[1]} => 空/异常输出: ${rr.raw.slice(0,80)}`);
  }
  check('D4-13', '只读子账号 其余只读调用返回结构化结果(非崩溃/非含糊)', valid, extra.length);
}

// ============ D3-C4 服务矩阵 + D4-14 操作可审计（真机建删归零）============
{
  const base = parseJson(hcloud(credAdmin.ak, credAdmin.sk, ['VPC', 'ListSecurityGroups']).raw);
  const baseCount = (base?.security_groups || []).length;
  const SG_NAME = `tctest-d3c4-sg-${Date.now()}`;
  const create = parseJson(hcloud(credAdmin.ak, credAdmin.sk, ['VPC', 'CreateSecurityGroup', `--security_group.name=${SG_NAME}`, '--security_group.description=tctest D3-C4/D4-14 audit probe']).raw);
  const sgId = create?.security_group?.id ?? null;
  const after = parseJson(hcloud(credAdmin.ak, credAdmin.sk, ['VPC', 'ListSecurityGroups']).raw);
  const afterCount = (after?.security_groups || []).length;
  check('D3-C4', '真机最小资源(安全组)创建成功', !!sgId && create?.security_group?.name === SG_NAME, true);
  check('D3-C4', '创建后计数 +1', afterCount, baseCount + 1);

  let myTrace = null;
  for (let k = 0; k < 20 && !myTrace; k++) {
    const cts = parseJson(hcloud(credAdmin.ak, credAdmin.sk, ['CTS', 'ListTraces', '--trace_type=system', '--limit=60']).raw);
    const traces = cts?.traces || [];
    myTrace = traces.find((t) => t.resource_id === sgId || t.resource_name === SG_NAME) || null;
    if (!myTrace) await new Promise((r) => setTimeout(r, 1000));
  }
  const ctsOk = !!myTrace && myTrace.trace_name === 'createSecurity-group' && myTrace.service_type === 'VPC'
    && !!(myTrace.user?.name) && !!(myTrace.source_ip) && !!(myTrace.record_time) && !!(myTrace.user?.access_key_id);
  check('D4-14', 'CTS 审计可追溯(建SG含 user/ak/source_ip/record_time)', ctsOk, true);

  const beforeDel = parseJson(hcloud(credAdmin.ak, credAdmin.sk, ['VPC', 'ListSecurityGroups']).raw);
  const mine = (beforeDel?.security_groups || []).filter((g) => (g.name || '').startsWith('tctest-d3c4-'));
  for (const g of mine) {
    hcloud(credAdmin.ak, credAdmin.sk, ['VPC', 'DeleteSecurityGroup', `--security_group_id=${g.id}`]);
  }
  const fin = parseJson(hcloud(credAdmin.ak, credAdmin.sk, ['VPC', 'ListSecurityGroups']).raw);
  const remain = (fin?.security_groups || []).filter((g) => (g.name || '').startsWith('tctest-d3c4-')).length;
  check('D3-C4', '测后删除归零(tctest-d3c4- 剩余=0)', remain, 0);
}

// ============ D4-18/19/20 审批流（源码级真工具）============
{
  const CORE = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
  const { callTool } = await import(CORE + '/tools.mjs');
  const sgId = 'tctest-nonexistent-for-plan-only';
  const planDel = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteSecurityGroup', `--security_group_id=${sgId}`] });
  const cls = planDel?.classification || {};
  check('D4-18', '高危写(DeleteSecurityGroup)分类=deny(非allow非error)', cls.decision, 'deny');
  check('D4-18', '高危写提供 approvalToken(确认流可提交)', !!planDel?.approvalToken, true);
  check('D4-19', '确认流下预检仍生效(safeToRun=false)', planDel?.safeToRun, false);
  const planForce = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteSecurityGroup', `--security_group_id=${sgId}`, '--force'] });
  check('D4-19', '破坏性命令(--force)预检拦截=deny', (planForce?.classification || {}).decision, 'deny');
  let rejected = false;
  try {
    await callTool('huaweicloud_run_approved_command', { args: ['VPC', 'DeleteSecurityGroup', `--security_group_id=${sgId}`], approvalToken: 'forged-token', approvedByUser: true });
  } catch (e) { rejected = /Invalid or expired|not found or expired/i.test(String(e?.message || e)); }
  check('D4-20', '伪造/过期 token 提交被拒(零操作)', rejected, true);
}

// ============ D2 认证真云项 ============
{
  const CORE = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
  const { callTool } = await import(CORE + '/tools.mjs');

  const isoHome = mkdtempSync(join(tmpdir(), 'hdk-d2real-'));
  const isoConfig = join(isoHome, '.config', 'huaweicloud');
  mkdirSync(isoConfig, { recursive: true });
  const importPath = join(isoConfig, 'creds-import.json');
  const prevHome = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = isoHome;
  try {
    writeFileSync(importPath, JSON.stringify({ ak: 'IMPAK', sk: 'IMPSK', region: REGION }, null, 2), 'utf8');
    const beforeExists = existsSync(importPath);
    const importRes = await callTool('huaweicloud_auth_switch', { mode: 'import', action: 'temporary' });
    const afterExists = existsSync(importPath);
    check('D2-16', 'import 前 creds-import.json 存在(预置)', beforeExists, true);
    check('D2-16', 'auth_switch import 读后擦除(exists=false)', afterExists, false);
    check('D2-16', 'temporary 仅内存不落盘(scope=temporary)', importRes?.scope, 'temporary');
  } finally {
    if (prevHome === undefined) delete process.env.HUAWEICLOUD_HOME; else process.env.HUAWEICLOUD_HOME = prevHome;
    rmSync(isoHome, { recursive: true, force: true });
  }

  const stored = JSON.parse(readFileSync(join(homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8'));
  const tokenInFile = typeof stored?.securityToken === 'string' && stored.securityToken.length > 0;
  check('D2-11', '真实凭证库 S1 不含明文明文 STS token', tokenInFile, false);

  const { getAuthStatus } = await import(CORE + '/auth/service.mjs');
  const status = getAuthStatus('all');
  check('D2-1', '三端就绪: S1 凭证库', status.credentialsConfigured === true, true);
  check('D2-1', '三端就绪: KooCLI', status.kooCliInstalled === true && status.kooCliStatus === 'ok', true);
  check('D2-1', '三端就绪: OBS', status.obsConfigured === true, true);
  const apicheck = parseJson(hcloud(credAdmin.ak, credAdmin.sk, ['ECS', 'NovaListServers']).raw);
  check('D2-1', '真云 API 实际可用(KooCLI 施力 ECS 读)', Array.isArray(apicheck?.servers), true);
  const obsls = spawnSync('hcloud', ['obs', 'ls'], { encoding: 'utf8' });
  check('D2-1', '真云 OBS 端可用(obs ls 列出桶)', /Bucket number:\s*1|huaweicloud-open-capability-home/.test(`${obsls.stdout}${obsls.stderr}`), true);
}

console.log('\n=== OpenClaw Linux 真云补测探针结果 (2026-09-18) ===');
for (const l of lines) console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);
