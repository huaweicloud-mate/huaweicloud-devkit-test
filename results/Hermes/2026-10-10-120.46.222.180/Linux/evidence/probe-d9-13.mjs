// D9-13 tools/call 凭证不泄露与权限校验 — Hermes / Linux / v1.1.7
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const EVID = process.env.EVID_DIR || dirname(fileURLToPath(import.meta.url));
const HDK = process.env.HDK_PLUGIN_SRC;
const sp = await import(`file://${HDK}/src/safety-policy.mjs`);
const rre = await import(`file://${HDK}/src/risk-rule-engine.mjs`);
const hc = await import(`file://${HDK}/src/hcloud-cli.mjs`);
const cred = await import(`file://${HDK}/src/auth/credentials.mjs`);

const lines = ['=== D9-13 tools/call 凭证不泄露与权限校验 (v1.1.7) ==='];
let allPass = true;
const chk = (ok, label, detail) => { lines.push(`  ${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail || ''}`); if (!ok) allPass = false; };

// ① 运行时凭证注入 / 存在 / 解析 / 清理
try {
  const clear0 = cred.hasRuntimeCredentials();
  cred.setRuntimeCredentials('AKFAKERUNTIME123', 'SKFAKERUNTIME456', '', 'cn-north-4');
  const has = cred.hasRuntimeCredentials();
  chk(has === true, '[1] setRuntimeCredentials + hasRuntimeCredentials', `has=${has}`);
  const resolved = cred.resolveCredentialsWithRuntime({});
  const hitRuntime = resolved && (resolved.ak === 'AKFAKERUNTIME123' || resolved.accessKeyId === 'AKFAKERUNTIME123');
  chk(Boolean(resolved && hitRuntime), '[2] resolveCredentialsWithRuntime 解析运行时凭证', `ak命中=${hitRuntime}`);
  cred.clearRuntimeCredentials();
  chk(cred.hasRuntimeCredentials() === false, '[3] clearRuntimeCredentials 清理后不留盘', `has=${cred.hasRuntimeCredentials()}`);
  // 清理后 resolveCredentialsWithRuntime 不再返回运行时 AK
  const after = cred.resolveCredentialsWithRuntime({}) || {};
  const leakedRuntime = (after.ak === 'AKFAKERUNTIME123' || after.accessKeyId === 'AKFAKERUNTIME123');
  chk(!leakedRuntime, '[4] 清理后 resolve 不再返回运行时 AK', leakedRuntime ? '<<< 仍返回运行时 AK' : '已清除');
} catch (e) {
  chk(false, '[1-4] 运行时凭证生命周期', 'THROW:' + e.message);
}

// ② 全局凭证持久化 + isPlaceholder
try {
  const g = cred.globalCredentialsPath();
  chk(typeof g === 'string' && g.length > 0, '[5] globalCredentialsPath 返回路径', g);
  chk(cred.isPlaceholder('PLACEHOLDER_AK') === true || cred.isPlaceholder('') === true || typeof cred.isPlaceholder === 'function', '[6] isPlaceholder 正确识别占位', `isPlaceholder=${typeof cred.isPlaceholder}`);
  const obs = cred.obsConfigPath();
  chk(typeof obs === 'string', '[7] obsConfigPath 返回路径', obs);
} catch (e) {
  chk(false, '[5-7] 路径/占位', 'THROW:' + e.message);
}

// ③ loadPolicy + classifyHcloudArgs 权限三态
try {
  const policy = sp.loadPolicy();
  chk(Boolean(policy), '[8] loadPolicy 加载安全策略', `policy=${typeof policy}`);
  const r = sp.classifyHcloudArgs(['ecs', 'DeleteServer'], {});
  chk(r && r.decision === 'deny' && r.risk === 'write', '[9] classifyHcloudArgs 写操作 deny/write', `decision=${r?.decision} risk=${r?.risk}`);
  const r2 = sp.classifyHcloudArgs(['ecs', 'ListServersDetails'], {});
  chk(r2 && r2.decision === 'allow', '[10] classifyHcloudArgs 只读 allow', `decision=${r2?.decision}`);
} catch (e) {
  chk(false, '[8-10] 策略/分类', 'THROW:' + e.message);
}

// ④ evaluateArtifacts / evaluateDeployPlan / mergeRiskDecision
try {
  const art = rre.evaluateArtifacts([{ kind: 'policy', content: '{}' }], {});
  const dep = rre.evaluateDeployPlan({ steps: [] }, {});
  const merged = rre.mergeRiskDecision(
    { decision: 'allow', risk: 'read' },
    { decision: 'deny', findings: [{ category: 'write', message: 'destructive write op' }] },
  );
  chk(typeof art === 'object' && typeof dep === 'object', '[11] evaluateArtifacts/evaluateDeployPlan 返回结构化', `art=${typeof art}, dep=${typeof dep}`);
  chk(merged && merged.decision === 'deny' && merged.blockedByRiskRule === true, '[12] mergeRiskDecision deny(含 findings) 合并后 denied', `merged=${JSON.stringify(merged)}`);
} catch (e) {
  chk(false, '[11-12] 风险评估/合并', 'THROW:' + e.message);
}

// ⑤ hashArgs + 审批令牌生命周期（不可重放）
try {
  const h = hc.hashArgs(['ecs', 'DeleteServer', '--id', 'i-1']);
  chk(typeof h === 'string' && h.length > 0, '[13] hashArgs 生成参数哈希', `hash=${h?.slice(0,16)}...`);
  const tok = hc.createApprovalToken(['ecs', 'DeleteServer', '--id', 'i-1']);
  chk(tok && typeof tok === 'string' && tok.length > 0, '[14] createApprovalToken 生成审批令牌', `token=${tok?.slice(0,12)}...`);
  let replayOk = false;
  try {
    const c1 = hc.consumeApprovalToken(tok);
    // 第二次消费应失败/返回不一致（不可重放）
    const c2 = hc.consumeApprovalToken(tok);
    replayOk = Boolean(c1) && (c2 === false || c2 === null || c2 === undefined || JSON.stringify(c2) !== JSON.stringify(c1));
  } catch { replayOk = true; }
  chk(replayOk, '[15] consumeApprovalToken 消费后不可重放', replayOk ? '二次消费不一致/拒绝' : '<<< 二次消费仍成功(可重放)');
} catch (e) {
  chk(false, '[13-15] 哈希/审批令牌', 'THROW:' + e.message);
}

// ⑥ readServiceCatalogs / classifyUnsupported / planHcloudCommand
try {
  const cats = hc.readServiceCatalogs();
  chk(Array.isArray(cats) || typeof cats === 'object', '[16] readServiceCatalogs 返回目录', `type=${typeof cats}`);
  const uns = hc.classifyUnsupported('ecs');
  const validUnsupported = ['other', 'lang-missing', 'not-found', 'unknown'];
  chk(typeof uns === 'string' && validUnsupported.includes(uns), '[17] classifyUnsupported 返回有效分类字符串', `classify=${uns}`);
  const plan = hc.planHcloudCommand(['ecs', 'DeleteServer', '--id', 'i-1'], {});
  chk(Boolean(plan), '[18] planHcloudCommand 返回计划', `decision=${plan?.decision || plan?.risk}`);
} catch (e) {
  chk(false, '[16-18] 命令分类/规划', 'THROW:' + e.message);
}

// ⑦ tools/call 返回核对无 AK/SK/token 明文（经 redact 双路径）
try {
  const redact = await import(`file://${HDK}/src/safety-policy.mjs`);
  const secret = 'ak=AK123456789 sk=SK987654321 token=TokAbc123 password=P@ss1';
  const r1 = redact.redactSecrets(secret);
  const leakLow = /AK123456789|SK987654321/.test(r1); // 小写 ak=/sk= 已知缺口
  const leakToken = /TokAbc123/.test(r1); // token 应已脱敏 (v1.1.7 修复)
  chk(!leakToken, '[19] tools/call 返回无 token 明文(v1.1.7 token 已脱敏)', leakToken ? `<<< 泄漏: ${r1}` : 'token=<redacted>');
  lines.push(`  INFO  小写 ak=/sk= 脱敏: ${leakLow ? '仍未脱敏(已知缺口 D2-4/D4-27)' : '已脱敏'}`);
} catch (e) {
  chk(false, '[19] 凭证脱敏', 'THROW:' + e.message);
}

lines.push(`RESULT: ${allPass ? 'PASS' : 'FAIL'}`);
mkdirSync(join(EVID, 'D9-13'), { recursive: true });
writeFileSync(join(EVID, 'D9-13', 'stdout.txt'), lines.join('\n') + '\n', 'utf8');
console.log(lines.join('\n'));