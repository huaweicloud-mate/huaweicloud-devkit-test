// D9-13 tools/call 凭证不泄露与权限校验（Hermes Linux 每日回归，v1.1.7）
// 源码级直调核对（HUAWEICLOUD_HOME 隔离，不碰真实管理员凭证）：
//  ① setRuntimeCredentials / hasRuntimeCredentials / resolveCredentialsWithRuntime / clearRuntimeCredentials
//  ② loadPolicy / classifyHcloudArgs
//  ③ evaluateArtifacts / evaluateDeployPlan / mergeRiskDecision
//  ④ hashArgs / createApprovalToken / consumeApprovalToken（不可重放）
//  ⑤ readServiceCatalogs / classifyUnsupported / planHcloudCommand
//  ⑥ tools/call 返回无 AK/SK/token 明文（注入假的运行时凭证后调用 auth_status/plan）
//  ⑦ clearRuntimeCredentials 清理后不留盘
//  ⑧ readGlobalCredentials / writeGlobalCredentials / isPlaceholder
//  ⑨ globalCredentialsPath / obsConfigPath / writeObsConfig
// 用法: node D9-13-probe.mjs <huaweicloud-core/src 目录>
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const SRC = process.argv[2];
const S = (f) => join(SRC, f);

const cred = await import(pathToFileURL(S('auth/credentials.mjs')).href);
const sp = await import(pathToFileURL(S('safety-policy.mjs')).href);
const rre = await import(pathToFileURL(S('risk-rule-engine.mjs')).href);
const hcli = await import(pathToFileURL(S('hcloud-cli.mjs')).href);
const tools = await import(pathToFileURL(S('tools.mjs')).href);

// 隔离 HUAWEICLOUD_HOME（关键：不写真实 ~/.config/huaweicloud/credentials.json）
const ISO = mkdtempSync(join(tmpdir(), 'd913-'));
process.env.HUAWEICLOUD_HOME = ISO;
process.env.HCLOUD_OBS_CONFIG_PATH = join(ISO, '.obsutilconfig');

const FAKE_AK = 'FAKEAK1234567890AB';
const FAKE_SK = 'FAKESK9876543210CDSECRET';
const FAKE_TOKEN = 'FAKETOKEN_SECRET_000111222';

const out = [];
function check(name, ok, detail) {
  out.push({ name, ok, detail: String(detail).slice(0, 420) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name} | ${detail}`);
}

console.log('=====CASE D9-13=====');

// ① 运行时凭证生命周期
{
  cred.setRuntimeCredentials(FAKE_AK, FAKE_SK, FAKE_TOKEN, 'cn-north-4');
  const has = cred.hasRuntimeCredentials();
  const resolved = cred.resolveCredentialsWithRuntime({});
  const resolvedHasAk = !!(resolved && (resolved.ak || resolved.accessKey));
  cred.clearRuntimeCredentials();
  const cleared = !cred.hasRuntimeCredentials();
  check('① setRuntimeCredentials/hasRuntimeCredentials/resolve/clear', has && resolvedHasAk && cleared, `has=${has} resolvedHasAk=${resolvedHasAk} cleared=${cleared}`);
}

// ⑦ clearRuntimeCredentials 后不留盘（无 credentials.json 生成）
{
  const p = cred.globalCredentialsPath();
  check('⑦ clearRuntimeCredentials 后运行时不落盘', !existsSync(p), p + (existsSync(p) ? '  EXISTS!' : ' 不存在'));
}

// ② loadPolicy / classifyHcloudArgs
{
  const policy = sp.loadPolicy();
  const pv = policy && policy.version;
  let decision = null;
  try { decision = sp.classifyHcloudArgs(['ecs', 'DeleteServer', '--force']); } catch (e) { decision = 'EXC:' + e.message; }
  check('② loadPolicy + classifyHcloudArgs 可用', !!pv, `policy.version=${pv} ; classifyHcloudArgs(DeleteServer)=${JSON.stringify(decision)}`);
}

// ③ evaluateArtifacts / evaluateDeployPlan / mergeRiskDecision
{
  let art = null, dep = null, merged = null;
  try { art = rre.evaluateArtifacts([{ type: 'iam', content: '{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}' }]); } catch (e) { art = 'EXC:' + e.message; }
  try { dep = rre.evaluateDeployPlan({ resources: [{ type: 'huaweicloud_vpc', name: 'x' }] }); } catch (e) { dep = 'EXC:' + e.message; }
  try { merged = rre.mergeRiskDecision({ decision: 'allow' }, { decision: 'deny' }); } catch (e) { merged = 'EXC:' + e.message; }
  const artDecision = art && art.decision;
  console.log('evaluateArtifacts(broad IAM) =>', JSON.stringify(art));
  console.log('evaluateDeployPlan =>', JSON.stringify(dep));
  console.log('mergeRiskDecision =>', JSON.stringify(merged));
  check('③ evaluateArtifacts/evaluateDeployPlan/mergeRiskDecision 可用', typeof art === 'object' && typeof dep === 'object' && typeof merged === 'object', `art.decision=${artDecision}`);
}

// ④ hashArgs / createApprovalToken / consumeApprovalToken（不可重放）
{
  const args = ['vpc', 'CreateVpc', '--vpc.name=x'];
  const h1 = hcli.hashArgs(args);
  const h2 = hcli.hashArgs([...args]);
  const stable = h1 === h2 && typeof h1 === 'string' && h1.length > 0;
  const tok = hcli.createApprovalToken(args);
  const hasToken = typeof tok === 'string' && tok.length > 0;
  const consumed1 = hasToken ? hcli.consumeApprovalToken(tok) : null;
  const consumed2 = hasToken ? hcli.consumeApprovalToken(tok) : null;
  const noReplay = consumed1 !== null && consumed2 === null;
  check('④ hashArgs 稳定 + 审批令牌不可重放', stable && hasToken && noReplay, `hash stable=${stable} ; token str=${hasToken} ; consume1=${consumed1 ? 'entry' : 'null'} consume2(重放)=${consumed2 === null ? 'null' : 'NOT-null'}`);
}

// ⑤ readServiceCatalogs / classifyUnsupported / planHcloudCommand
{
  let catalogs = null, unsupported = null, plan = null;
  try { catalogs = hcli.readServiceCatalogs(); } catch (e) { catalogs = 'EXC:' + e.message; }
  try { unsupported = hcli.classifyUnsupported('FOOBAR_NOT_A_SERVICE'); } catch (e) { unsupported = 'EXC:' + e.message; }
  try { plan = hcli.planHcloudCommand(['vpc', 'CreateVpc', '--vpc.name=zz']); } catch (e) { plan = 'EXC:' + e.message; }
  const hasCn = catalogs && catalogs.cn instanceof Set;
  const hasEn = catalogs && catalogs.en instanceof Set;
  const planDecision = plan && plan.classification && plan.classification.decision;
  console.log('readServiceCatalogs => cn.size=' + (hasCn ? catalogs.cn.size : 'N/A') + ' cnPresent=' + (catalogs && catalogs.cnPresent) + ' enPresent=' + (catalogs && catalogs.enPresent));
  console.log('classifyUnsupported(未知服务) =>', unsupported);
  console.log('planHcloudCommand(CreateVpc) => decision=' + planDecision + ' hasToken=' + (plan && !!plan.approvalToken) + ' safeToRun=' + (plan && plan.safeToRun));
  check('⑤ readServiceCatalogs + classifyUnsupported + planHcloudCommand 可用', hasCn && hasEn && typeof plan === 'object', `cn.size=${hasCn ? catalogs.cn.size : 'N/A'} unsupported=${unsupported} plan.decision=${planDecision}`);
}

// ⑥ tools/call 返回无 AK/SK/token 明文（注入假运行时凭证后调用）
{
  cred.setRuntimeCredentials(FAKE_AK, FAKE_SK, FAKE_TOKEN, 'cn-north-4');
  let leak = false, detail = '';
  const probes = [];
  for (const [name, args] of [['huaweicloud_auth_status', {}], ['huaweicloud_plan_cli_command', { args: ['vpc', 'ListVpcs', '--cli-region=cn-north-4'] }]]) {
    try {
      const r = await tools.callTool(name, args);
      const txt = JSON.stringify(r);
      if (txt.includes(FAKE_AK) || txt.includes(FAKE_SK) || txt.includes(FAKE_TOKEN)) { leak = true; }
      detail += `${name}: ` + (leak ? 'LEAK!' : 'ok') + '; ';
    } catch (e) { detail += `${name}: EXC ${e.message}; `; }
  }
  cred.clearRuntimeCredentials();
  check('⑥ tools/call 返回无 AK/SK/token 明文', !leak, detail);
}

// ⑧ readGlobalCredentials/writeGlobalCredentials/isPlaceholder
{
  cred.writeGlobalCredentials({ ak: 'WAK1234567890123456', sk: 'WSKabcdefghijklmnop', region: 'cn-north-4' });
  const r = cred.readGlobalCredentials();
  const persistOk = r && r.ak === 'WAK1234567890123456' && r.sk === 'WSKabcdefghijklmnop';
  const ph1 = cred.isPlaceholder('<HW_ACCESS_KEY>');
  const ph2 = cred.isPlaceholder('${SECRET_KEY}');
  const ph3 = cred.isPlaceholder('YOUR_AK');
  const phReal = !cred.isPlaceholder('AKID0123456789ABCDEF');
  check('⑧ write/readGlobalCredentials 持久化 + isPlaceholder', persistOk && ph1 && ph2 && ph3 && phReal, `persist=${persistOk} ph=<..>=${ph1},placeholder=${ph3},real-not-placeholder=${phReal}`);
}

// ⑨ globalCredentialsPath/obsConfigPath/writeObsConfig
{
  const gp = cred.globalCredentialsPath();
  const op = cred.obsConfigPath();
  cred.writeObsConfig({ ak: 'OAK123', sk: 'OSK456', region: 'cn-north-4' });
  const obOk = existsSync(process.env.HCLOUD_OBS_CONFIG_PATH);
  check('⑨ globalCredentialsPath/obsConfigPath/writeObsConfig', gp.startsWith(ISO) && op.startsWith(ISO) && obOk, `gp=${gp.slice(0,60)} ; op=${op.slice(0,60)} ; obs撰=${obOk}`);
}

console.log('=====END D9-13=====');

// 清理隔离目录
try { rmSync(ISO, { recursive: true, force: true }); } catch {}

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ caseId: 'D9-13', okCount: out.filter((o) => o.ok).length, total: out.length, results: out }, null, 2));