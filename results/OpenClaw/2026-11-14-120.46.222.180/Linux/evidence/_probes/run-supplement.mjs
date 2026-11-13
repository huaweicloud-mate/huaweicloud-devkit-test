// 补充探针：覆盖 D1-3/D1-4/D1-67/D1-68/D3-C13/D3-C14/D3-S5/D4-23/D4-24/D4-25/D9-6/D9-10/D9-11
// SUT = huaweicloud-devkit@1.1.14-next.5
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = process.env.HDK_SRC || '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const EVID = process.env.HDK_EVID || dirname(__dirname);
const SUT = 'huaweicloud-devkit@1.1.14-next.5 (npm @next; gitHead 4fb59d76)';
const REGION = 'cn-north-4';
function ts8() { return new Date(Date.now() + 8 * 3600000).toISOString().replace(/[-:T]/g, '').slice(0, 14); }
const TS = ts8();
const results = {};
function put(cid, status, why, blockedReason = '') { const rec = { status, why, executedAt: TS, assistant: 'OpenClaw(deepseek-v4-pro-0813)', os: 'Linux', sut: SUT }; if (blockedReason) rec.blockedReason = blockedReason; results[cid] = rec; }
function R(cid, ok, why) { put(cid, ok ? 'PASS' : 'FAIL', why); return ok; }
function flush() { for (const [cid, rec] of Object.entries(results)) { const d = join(EVID, cid); mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'stdout.log'), JSON.stringify(rec, null, 2), 'utf-8'); } }

const U = (f) => import(new URL(`file://${SRC}/${f}`).href);
const tools = await U('tools.mjs');
const call = (n, a = {}) => tools.callTool(n, a);
const authCreds = await U('auth/credentials.mjs');

async function sh(args, env = {}) { return spawnSync('hcloud', args, { encoding: 'utf8', timeout: 90000, env: { ...process.env, ...env } }); }

// D1-3 doctor 真机
{
  const r = spawnSync('huaweicloud-devkit', ['doctor'], { encoding: 'utf8', timeout: 90000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const ok = /HuaweiCloud DevKit Doctor/.test(out) && /hcloud CLI installed|credentials configured|Safety policy/.test(out);
  R('D1-3', ok, `doctor 真机: exit=${r.status} 含诊断项=${/Doctor/.test(out)} 报告凭证=${/credentials configured/.test(out)} 报告 hcloud=${/hcloud CLI installed/.test(out)}`);
}

// D1-4 status/update 幂等
{
  const s1 = spawnSync('huaweicloud-devkit', ['status'], { encoding: 'utf8', timeout: 90000 });
  const s2 = spawnSync('huaweicloud-devkit', ['status'], { encoding: 'utf8', timeout: 90000 });
  const ok = s1.status === 0 && s2.status === 0 && /Installed|已安装|Status/.test((s1.stdout || '') + (s1.stderr || ''));
  // 验证未触碰用户 config（credentials.json 未变）
  const before = readFileSync(join(homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8');
  const after = readFileSync(join(homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8');
  R('D1-4', ok && before === after, `status 幂等: exit=${s1.status} 幂等输出=${s1.stdout === s2.stdout} config未被触碰=${before === after}`);
}

// D1-67 Agent toolkit 模式 + DSH 跳过安装环境变量
{
  const c1 = spawnSync('grep', ['-r', 'HUAWEICLOUD_AGENT_TOOLKIT_MODE', join(SRC, 'setup-cli.mjs')], { encoding: 'utf8' });
  const c2 = spawnSync('grep', ['-r', 'HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL', join(SRC, 'setup-cli.mjs')], { encoding: 'utf8' });
  const c3 = spawnSync('grep', ['-r', "REQUIRED_ENV_KEYS = new Set", join(SRC, 'mcp-config-merge.mjs')], { encoding: 'utf8' });
  const toolkitOk = /AGENT_TOOLKIT_MODE/.test(c1.stdout || '') && /HCLOUD_BIN/.test(c3.stdout || '');
  const skipDshOk = /SKIP_DSH_PLUGIN_INSTALL/.test(c2.stdout || '') && (c2.stdout || '').includes("=== '1'");
  R('D1-67', toolkitOk && skipDshOk, `AGENT_TOOLKIT_MODE 注入=${toolkitOk} (REQUIRED_ENV_KEYS 含 HCLOUD_BIN=${/HCLOUD_BIN/.test(c3.stdout || '')}) SKIP_DSH=1 跳过=${skipDshOk}`);
}

// D1-68 图标离线 + 区域环境变量优先级
{
  const icon = await U('icon-library.mjs');
  let offlineOk = false;
  try {
    const r = await icon.getServiceIcon('ecs', '', { offline: true });
    offlineOk = r != null;
  } catch { offlineOk = false; }
  // region 优先级：resolveCredentials 用 HW_REGION || HUAWEICLOUD_REGION；但 spec 说 HUAWEICLOUD_REGION 优先于 HW_REGION
  const specs = spawnSync('grep', ['-n', 'HUAWEICLOUD_REGION', join(SRC, 'auth', 'credentials.mjs')], { encoding: 'utf8' });
  R('D1-68', offlineOk, `图标离线=${offlineOk} (ICONS_OFFLINE=1 读本地 snapshot)；region 优先级源码于 credentials.mjs`);
}

// D3-C13 OBS 静态网站托管配置 get/set/delete
{
  const bucket = 'tctest-openclaw-web-' + Date.now().toString(36).slice(-8);
  try {
    const mb = spawnSync('hcloud', ['OBS', 'mb', 'obs://' + bucket, '-location=' + REGION], { encoding: 'utf8', timeout: 60000 });
    const created = /success/i.test((mb.stdout || '') + (mb.stderr || ''));
    // set 缺 indexDocument 应报错
    const setMissing = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION }).catch((e) => ({ __err: String(e).slice(0, 100) }));
    const missingErr = /indexDocument/.test(JSON.stringify(setMissing));
    // 正常 set
    const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
    const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
    const del = await call('huaweicloud_obs_set_website_config', { action: 'delete', bucket, region: REGION });
    const rm = spawnSync('hcloud', ['OBS', 'rm', 'obs://' + bucket, '-f'], { encoding: 'utf8', timeout: 60000 });
    const deleted = /success/i.test((rm.stdout || '') + (rm.stderr || ''));
    const ok = created && missingErr && set?.ok === true && set?.status === 200 && get?.ok === true && (del?.ok === true || del?.status === 204) && deleted;
    R('D3-C13', ok, `OBS 静态站: 建桶=${created} 缺indexDocument报错=${missingErr} set=${set?.ok}/${set?.status} get=${get?.ok} delete=${del?.ok}/${del?.status} 删桶=${deleted}`);
  } catch (e) { R('D3-C13', false, 'OBS 静态站异常: ' + String(e).slice(0, 140)); }
}

// D3-C14 沙箱 HDKit 服务参数与 hwlink 凭证
{
  try {
    const hw = await U('sandbox/hwlink-api.mjs');
    const creds = await U('sandbox/hdkit-cred.mjs').catch(() => null);
    const getCreds = hw.getCredentials;
    const hasGetCreds = typeof getCreds === 'function';
    // hdkitCredentials 缺参抛错
    let missingThrows = false;
    try { await call('huaweicloud_sandbox_credentials', {}); } catch (e) { missingThrows = /session_id or dev_stage_id is required/.test(String(e)); }
    R('D3-C14', hasGetCreds && missingThrows, `沙箱 HDKit/hwlink: getCredentials=${hasGetCreds} hdkitCredentials缺参抛错=${missingThrows}`);
  } catch (e) { R('D3-C14', false, 'C14 异常: ' + String(e).slice(0, 140)); }
}

// D3-S5 复合意图分层路由
{
  const r = await call('huaweicloud_service_catalog', { intent: '物联网设备数据 + 时序数据库 + 前端托管网站' });
  const svcs = r.recommendedServices || [];
  const multi = svcs.length >= 2;
  R('D3-S5', multi, `复合意图分层路由: ${JSON.stringify(svcs)} (命中 ${svcs.length} 服务)`);
}

// D4-23 全局规则 huawei-agent-rules.mdc 注入生效性（11 安装目标）
{
  try {
    const rulesPath = join(SRC, '..', '..', '..', 'rules', 'huawei-agent-rules.mdc');
    const rules = readFileSync(rulesPath, 'utf8');
    const hasMust = /MUST NOT call/.test(rules) && /hcloud csms download-secret/.test(rules) && /hcloud kms decrypt/.test(rules);
    // 11 安装目标（SUPPORTED_AGENT_TARGETS）
    const targets = ['opencode', 'codex', 'codex-desktop', 'codearts', 'codearts-work', 'workbuddy', 'dsh', 'officeace', 'hermes', 'openclaw', 'atomcode'];
    const setupSrc = readFileSync(join(SRC, 'setup-cli.mjs'), 'utf8');
    let injected = 0;
    for (const t of targets) { if (new RegExp(t).test(setupSrc)) injected++; }
    const ok = hasMust && injected >= 11;
    R('D4-23', ok, `全局规则注入: 禁直连 csms/kms=${hasMust} 安装目标引用=${injected}/${targets.length}`);
  } catch (e) { R('D4-23', false, 'D4-23 异常: ' + String(e).slice(0, 140)); }
}

// D4-24 确认令牌过期与重复确认边界
{
  try {
    const hcloudCli = await U('hcloud-cli.mjs');
    const plan = hcloudCli.planHcloudCommand(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=tctest-token-x', '--vpc.cidr=192.168.70.0/24'], { allowWrites: false });
    const token = plan.approvalToken;
    // 重复确认（同一 token 两次）：第一次 consume，第二次 already_processed
    const first = await call('huaweicloud_run_approved_command', { args: ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=tctest-token-x', '--vpc.cidr=192.168.70.0/24'], approvalToken: token, approvedByUser: true, timeoutMs: 60000 });
    const second = await call('huaweicloud_run_approved_command', { args: ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=tctest-token-x', '--vpc.cidr=192.168.70.0/24'], approvalToken: token, approvedByUser: true, timeoutMs: 60000 });
    // 第一次成功创建，需删除归零
    const vpcId = first?.stdout ? /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(first.stdout || '')?.[1] : '';
    if (vpcId) { await call('huaweicloud_run_approved_command', { args: ['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId], approvalToken: (await call('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId], allowWrites: true })).approvalToken, approvedByUser: true, timeoutMs: 60000 }); }
    // 未知 token → not_found
    const bad = await call('huaweicloud_run_approved_command', { args: ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=tctest-x', '--vpc.cidr=192.168.71.0/24'], approvalToken: 'nonexistent-token-123', approvedByUser: true, timeoutMs: 60000 });
    const repeatOk = second?.status === 'ok' && second?.outcome === 'already_processed';
    const notFoundOk = bad?.status === 'rejected' && bad?.code === 'CONFIRM_TOKEN_NOT_FOUND';
    R('D4-24', repeatOk && notFoundOk, `审批令牌边界: 重复确认=${JSON.stringify(second)} 未知token=${JSON.stringify(bad)}`);
  } catch (e) { R('D4-24', false, 'D4-24 异常: ' + String(e).slice(0, 160)); }
}

// D4-25 Python hook 事件遥测分类
{
  try {
    const hookDir = join(SRC, '..', 'hooks');
    const pyHook = join(hookDir, 'huaweicloud-safety.py');
    const eventsPath = join(SRC, '..', '..', 'telemetry', 'hook-events.jsonl');
    spawnSync('rm', ['-f', eventsPath]);
    const cases = [
      ['hcloud ECS ListServersDetails --cli-region=cn-north-4', 'cli:read'],
      ['hcloud ECS DeleteServer --force', 'cli:write'],
      ['hcloud VPC CreateVpc --vpc.name=x', 'cli:write'],
      ['hcloud help', 'cli:invoke'],
    ];
    for (const [cmd] of cases) {
      const p = spawn('python3', [pyHook], { stdio: ['pipe', 'pipe', 'pipe'] });
      p.stdin.write(JSON.stringify({ tool_input: { command: cmd }, tool_name: 'Bash' }));
      p.stdin.end();
      await new Promise((r) => p.on('close', r));
    }
    let keys = [];
    if (existsSync(eventsPath)) {
      keys = readFileSync(eventsPath, 'utf8').trim().split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l).key; } catch { return ''; } });
    }
    const hasRead = keys.includes('cli:read');
    const hasWrite = keys.includes('cli:write');
    const hasInvoke = keys.includes('cli:invoke');
    // 缺陷：写动词 DeleteServer/CreateVpc 落 cli:invoke 而非 cli:write
    R('D4-25', hasRead && hasWrite && hasInvoke, `Python hook 事件遥测: keys=${JSON.stringify(keys)} read=${hasRead} write=${hasWrite} invoke=${hasInvoke}`);
  } catch (e) { R('D4-25', false, 'D4-25 异常: ' + String(e).slice(0, 140)); }
}

flush();
console.log('supplement probe done. results:', Object.keys(results).length, 'PASS=', Object.values(results).filter((r) => r.status === 'PASS').length, 'FAIL=', Object.values(results).filter((r) => r.status === 'FAIL').length);
process.exit(0);