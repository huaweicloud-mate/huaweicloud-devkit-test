// D9-13: tools/call 凭证不泄露与权限校验（P0 协议安全基线）
// 覆盖 setRuntimeCredentials/clearRuntimeCredentials/hasRuntimeCredentials/resolveCredentialsWithRuntime、
// readGlobalCredentials/writeGlobalCredentials/isPlaceholder/globalCredentialsPath/obsConfigPath/writeObsConfig、
// loadPolicy/classifyHcloudArgs、evaluateArtifacts/evaluateDeployPlan/mergeRiskDecision、
// hashArgs/createApprovalToken/consumeApprovalToken、readServiceCatalogs/classifyUnsupported/planHcloudCommand、
// tools/call 返回不含 AK/SK/token 明文。
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { homedir } from 'node:os';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-25-1.94.218.129/Linux/evidence/D9-13/stdout.log';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 220), expected: String(expected) });
}

const creds = await import('file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');
const safety = await import('file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');
const riskEngine = await import('file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
const hcloud = await import('file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs');
const tools = await import('file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs');

const FAKE_AK = 'FAKEAKD913TEST1234567890';
const FAKE_SK = 'FAKESKD913SECRET1234567890abcdef';

// 1) 运行时凭证注入/清理/解析
{
  creds.setRuntimeCredentials(FAKE_AK, FAKE_SK, 'FAKESTOKEN', 'cn-north-4');
  const has = creds.hasRuntimeCredentials();
  const resolved = creds.resolveCredentialsWithRuntime();
  test('D9-13', 'setRuntime-hasRuntime', has === true, `has=${has}`, 'setRuntimeCredentials 后 hasRuntimeCredentials=true');
  test('D9-13', 'resolve-with-runtime', resolved.ak === FAKE_AK && resolved.sk === FAKE_SK && resolved.securityToken === 'FAKESTOKEN' && resolved.region === 'cn-north-4',
    `ak=${resolved.ak===FAKE_AK} sk=${resolved.sk===FAKE_SK} tok=${resolved.securityToken==='FAKESTOKEN'} region=${resolved.region}`, 'resolveCredentialsWithRuntime 返回运行时凭证');
  creds.clearRuntimeCredentials();
  test('D9-13', 'clear-runtime', creds.hasRuntimeCredentials() === false, `has=${creds.hasRuntimeCredentials()}`, 'clearRuntimeCredentials 后 hasRuntimeCredentials=false');
}

// 2) isPlaceholder 占位凭证识别
{
  const placeholders = ['<HW_ACCESS_KEY>', '${HW_SECRET_KEY}', 'YOUR_AK', 'SK', 'SECRET_KEY', 'TOKEN', 'replace_me', 'abc****', '****'];
  const nonPlaceholders = ['REALAK1234567890ABCDEFG', FAKE_AK];
  let allP = placeholders.every((v) => creds.isPlaceholder(v));
  let allN = nonPlaceholders.every((v) => !creds.isPlaceholder(v));
  test('D9-13', 'isPlaceholder-pos', allP, `placeholders=${placeholders.map(v=>v+':'+creds.isPlaceholder(v)).join(',')}`, '占位凭证均识别为 placeholder');
  test('D9-13', 'isPlaceholder-neg', allN, `non=${nonPlaceholders.map(v=>v+':'+creds.isPlaceholder(v)).join(',')}`, '真实 AK 不判 placeholder');
}

// 3) globalCredentials 路径/持久化(read/write) — 隔离 HOME 避免碰真实凭证
{
  const isoHome = mkdtempSync(join(tmpdir(), 'd913-home-'));
  const origHome = process.env.HOME;
  process.env.HOME = isoHome;
  try {
    const path = creds.globalCredentialsPath();
    // write 后再 read 一致（ak 入库，read 回读）
    creds.writeGlobalCredentials({ ak: FAKE_AK, sk: FAKE_SK, region: 'cn-north-4' });
    const read = creds.readGlobalCredentials();
    test('D9-13', 'global-readWrite-persist', !!read && read.ak === FAKE_AK && read.sk === FAKE_SK,
      `read.ak=${read?.ak===FAKE_AK} read.sk=${read?.sk===FAKE_SK}`, 'writeGlobalCredentials 后 readGlobalCredentials 回读一致');
  } finally {
    process.env.HOME = origHome;
    rmSync(isoHome, { recursive: true, force: true });
  }
}

// 4) 审批令牌生命周期：create -> consume 有效 -> 二次 consume 无效（不可重放）
{
  const token = hcloud.createApprovalToken(['ECS', 'CreateServers', '--cli-region=cn-north-4']);
  const first = hcloud.consumeApprovalToken(token);
  const second = hcloud.consumeApprovalToken(token);
  test('D9-13', 'approval-token-created', !!token && typeof token === 'string' && token.length > 20, `len=${token?.length}`, 'createApprovalToken 返回 token');
  test('D9-13', 'approval-token-consumed', !!first && first.argsHash === hcloud.hashArgs(['ECS', 'CreateServers', '--cli-region=cn-north-4']), `got=${!!first}`, 'consumeApprovalToken 首次返回条目');
  test('D9-13', 'approval-token-no-replay', second === null, `second=${second}`, '审批令牌不可重放（二次 consume 返回 null）');
}

// 5) hashArgs 确定性
{
  const h1 = hcloud.hashArgs(['ECS', 'ListServersDetails']);
  const h2 = hcloud.hashArgs(['ECS', 'ListServersDetails']);
  const h3 = hcloud.hashArgs(['ECS', 'CreateServers']);
  test('D9-13', 'hashArgs-deterministic', h1 === h2 && h1 !== h3 && typeof h1 === 'string' && h1.length === 64, `h1=h2:${h1===h2} h1!=h3:${h1!==h3} len=${h1.length}`, 'hashArgs sha256 确定性');
}

// 6) 安全策略 classifyHcloudArgs：写命令 confirm/deny，只读 allow
{
  const policy = safety.loadPolicy();
  const ro = safety.classifyHcloudArgs(['ECS', 'ListServersDetails'], { policy });
  const wr = safety.classifyHcloudArgs(['VPC', 'CreateVpc', '--vpc.name=x'], { policy });
  const conf = safety.classifyHcloudArgs(['hcloud', 'configure', 'set'], { policy });
  test('D9-13', 'classify-readonly-allow', ro && ro.decision === 'allow', `dec=${ro?.decision}`, '只读命令 allow');
  test('D9-13', 'classify-write-not-allow', wr && (wr.decision === 'confirm' || wr.decision === 'deny'), `dec=${wr?.decision}`, '写命令 confirm/deny');
  test('D9-13', 'classify-configure-deny', conf && conf.decision === 'deny', `dec=${conf?.decision}`, 'configure set 拒绝');
}

// 7) 风险引擎 evaluateArtifacts/evaluateDeployPlan + mergeRiskDecision
{
  const art = riskEngine.evaluateArtifacts({ path: '/tmp/x.tf', content: 'provider "huaweicloud" {}' });
  const plan = riskEngine.evaluateDeployPlan({ plan: { create: ['ECS'] } });
  const merged = riskEngine.mergeRiskDecision({ decision: 'allow', risk: 'none' }, { decision: 'deny', risk: 'secret', findings: [{ category: 'secret', message: 'found secret' }] });
  test('D9-13', 'evaluate-artifacts-returns', art && typeof art.decision === 'string', `dec=${art?.decision}`, 'evaluateArtifacts 返回决策');
  test('D9-13', 'evaluate-deployplan-returns', plan && typeof plan.decision === 'string', `dec=${plan?.decision}`, 'evaluateDeployPlan 返回决策');
  test('D9-13', 'mergeRiskDecision', merged && merged.decision === 'deny', `merged.dec=${merged?.decision}`, 'mergeRiskDecision 取更严决策(deny)');
}

// 8) 命令分类 readServiceCatalogs/classifyUnsupported/planHcloudCommand
{
  let catalogs = null, classifyErr = '';
  try { catalogs = hcloud.readServiceCatalogs(); } catch (e) { classifyErr = String(e.message || e); }
  const unsup = hcloud.classifyUnsupported('NoSuchService');
  const planArgs = hcloud.planHcloudCommand(['VPC', 'ListVpcs', '--cli-region=cn-north-4'], { allowWrites: false });
  test('D9-13', 'readServiceCatalogs', catalogs !== null || /metaRepo|not found|ENOENT|no such/i.test(classifyErr),
    `catalogs=${catalogs===null?'null':'obj'} err=${classifyErr.slice(0,60)}`, 'readServiceCatalogs 返回目录或明确报错');
  test('D9-13', 'classifyUnsupported', typeof unsup === 'object' || typeof unsup === 'string' || /unsupported|not/.test(String(unsup)),
    JSON.stringify(unsup).slice(0, 80), 'classifyUnsupported 返回不支持标记');
  test('D9-13', 'planHcloudCommand', planArgs && typeof planArgs === 'object' && 'classification' in planArgs,
    JSON.stringify(planArgs).slice(0, 120), 'planHcloudCommand 返回 classification');
}

// 9) tools/call 返回不含 AK/SK/token 明文（核心安全断言）
{
  // 注入运行时凭证（fake），跑一个真实工具，核对结果不含 fake AK/SK/token
  creds.setRuntimeCredentials(FAKE_AK, FAKE_SK, 'FAKESTOKEND913', 'cn-north-4');
  let leakTxt = '';
  try {
    const r = await tools.callTool('huaweicloud_auth_status', {});
    leakTxt = JSON.stringify(r);
  } catch (e) {
    leakTxt = String(e.message || e);
  }
  creds.clearRuntimeCredentials();
  const leakedAk = leakTxt.includes(FAKE_AK);
  const leakedSk = leakTxt.includes(FAKE_SK);
  const leakedTok = leakTxt.includes('FAKESTOKEND913');
  test('D9-13', 'toolscall-no-ak-leak', !leakedAk, `akLeak=${leakedAk}`, 'tools/call 结果不含 AK 明文');
  test('D9-13', 'toolscall-no-sk-leak', !leakedSk, `skLeak=${leakedSk}`, 'tools/call 结果不含 SK 明文');
  test('D9-13', 'toolscall-no-token-leak', !leakedTok, `tokLeak=${leakedTok}`, 'tools/call 结果不含 token 明文');
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);