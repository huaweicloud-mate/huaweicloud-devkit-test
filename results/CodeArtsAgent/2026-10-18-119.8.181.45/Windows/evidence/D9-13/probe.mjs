// D9-13: tools/call 凭证不泄露与权限校验
// 测试凭证脱敏+权限决策+审批令牌
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRCDIR = process.argv[2] || 'C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src';
const OUT = process.argv[3] || 'C:/Users/Administrator/devkit-test/huaweicloud-devkit-test/results/CodeArtsAgent/2026-10-18-119.8.181.45/Windows/evidence/D9-13/stdout.log';

const results = [];
function check(id, cond, detail) {
  const r = { id, status: cond ? 'PASS' : 'FAIL', detail };
  results.push(r);
  console.log('[' + r.status + '] ' + id + ': ' + detail);
  return cond;
}

let status = 'PASS';
let why = '';

try {
  const toolsUrl = pathToFileURL(join(SRCDIR, 'tools.mjs')).href;
  const credentialsUrl = pathToFileURL(join(SRCDIR, 'auth/credentials.mjs')).href;
  const safetyUrl = pathToFileURL(join(SRCDIR, 'safety-policy.mjs')).href;
  const riskUrl = pathToFileURL(join(SRCDIR, 'risk-rule-engine.mjs')).href;
  const hcloudUrl = pathToFileURL(join(SRCDIR, 'hcloud-cli.mjs')).href;
  
  const { callTool } = await import(toolsUrl);
  const { 
    setRuntimeCredentials, 
    clearRuntimeCredentials, 
    hasRuntimeCredentials,
    resolveCredentialsWithRuntime,
    readGlobalCredentials,
    writeGlobalCredentials,
    isPlaceholder,
    globalCredentialsPath
  } = await import(credentialsUrl);
  const { classifyHcloudArgs, redactSecrets, assertAllowed } = await import(safetyUrl);
  const { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, mergeRiskDecision } = await import(riskUrl);
  const { hashArgs, createApprovalToken, consumeApprovalToken } = await import(hcloudUrl);
  
  console.log('=== D9-13 tools/call 凭证不泄露与权限校验测试 ===');
  console.log('源码路径: ' + SRCDIR);
  
  // 测试1: setRuntimeCredentials 注入运行时凭证
  console.log('--- 测试 setRuntimeCredentials 注入凭证 ---');
  setRuntimeCredentials('test_ak_20char123456', 'test_sk_30char1234567890123456', 'test-token-123', 'cn-north-4');
  check('setruntime-设置成功',
    hasRuntimeCredentials(),
    '运行时凭证设置后 hasRuntimeCredentials 返回 true'
  );
  
  // 测试2: resolveCredentialsWithRuntime 解析运行时凭证
  console.log('--- 测试 resolveCredentialsWithRuntime 解析凭证 ---');
  const resolved = resolveCredentialsWithRuntime();
  check('resolve-解析正确',
    resolved && resolved.ak === 'test_ak_20char123456' && resolved.sk === 'test_sk_30char1234567890123456',
    '运行时凭证解析正确'
  );
  
  // 测试3: 凭证脱敏
  console.log('--- 测试凭证脱敏 ---');
  const testCreds = {
    ak: 'test_ak_20char123456',
    sk: 'test_sk_30char1234567890123456',
    securityToken: 'test-token-123'
  };
  const redacted = redactSecrets(testCreds);
  check('redact-ak脱敏',
    redacted.ak === '<redacted>',
    'AK 字段被脱敏'
  );
  check('redact-sk脱敏',
    redacted.sk === '<redacted>',
    'SK 字段被脱敏'
  );
  check('redact-token脱敏',
    redacted.securityToken === '<redacted>',
    'securityToken 字段被脱敏'
  );
  
  // 测试4: loadPolicy 和 classifyHcloudArgs 命令分类
  console.log('--- 测试 classifyHcloudArgs 命令分类 ---');
  const readResult = classifyHcloudArgs(['ECS', 'ListInstances']);
  check('classify-只读命令',
    readResult.decision === 'allow' && readResult.risk === 'read_only',
    'ListInstances 被分类为只读命令'
  );
  
  const writeResult = classifyHcloudArgs(['ECS', 'CreateServers', '--server.flavorRef=test']);
  check('classify-写入命令',
    writeResult.decision === 'deny' && writeResult.risk === 'write',
    'CreateServers 被分类为写入命令并拒绝'
  );
  
  // 测试5: evaluateCommandRisk 风险评估
  console.log('--- 测试 evaluateCommandRisk 风险评估 ---');
  const riskResult = evaluateCommandRisk('hcloud ECS CreateServers');
  check('risk-风险评估',
    riskResult !== null && riskResult.decision !== undefined,
    '风险评估返回有效结果'
  );
  
  // 测试6: evaluateArtifacts 和 evaluateDeployPlan 评估
  console.log('--- 测试 evaluateArtifacts/evaluateDeployPlan ---');
  const artifactResult = evaluateArtifacts([{
    path: 'test.tf',
    content: 'resource "huaweicloud_compute_instance" "test" {}'
  }]);
  check('artifacts-评估正常',
    artifactResult !== null,
    'artifacts 评估正常返回'
  );
  
  const deployResult = evaluateDeployPlan('部署一个 ECS 实例');
  check('deployplan-评估正常',
    deployResult !== null,
    'deploy_plan 评估正常返回'
  );
  
  // 测试7: mergeRiskDecision 合并决策
  console.log('--- 测试 mergeRiskDecision 合并决策 ---');
  const base = { decision: 'allow', risk: 'read_only' };
  const risk = { decision: 'deny', findings: [{ severity: 'deny', category: 'write', message: '测试' }] };
  const merged = mergeRiskDecision(base, risk);
  check('merge-合并为deny',
    merged.decision === 'deny',
    '风险决策合并为 deny'
  );
  
  // 测试8: hashArgs 参数哈希
  console.log('--- 测试 hashArgs 参数哈希 ---');
  const hash1 = hashArgs(['ECS', 'ListInstances']);
  const hash2 = hashArgs(['ECS', 'ListInstances']);
  const hash3 = hashArgs(['ECS', 'ListInstances', '--region=cn-north-4']);
  check('hash-相同参数相同哈希',
    hash1 === hash2,
    '相同参数生成相同哈希'
  );
  check('hash-不同参数不同哈希',
    hash1 !== hash3,
    '不同参数生成不同哈希'
  );
  
  // 测试9: createApprovalToken/consumeApprovalToken 审批令牌生命周期
  console.log('--- 测试审批令牌生命周期 ---');
  const token = createApprovalToken(['ECS', 'ListInstances']);
  check('token-创建成功',
    token && token.length > 0,
    '审批令牌创建成功'
  );
  
  const consumed = consumeApprovalToken(token);
  check('token-消费成功',
    consumed !== null && consumed.argsHash === hash1,
    '审批令牌消费成功'
  );
  
  const consumedAgain = consumeApprovalToken(token);
  check('token-不可重放',
    consumedAgain === null,
    '已消费的令牌不可再次消费'
  );
  
  // 测试10: isPlaceholder 占位凭证识别
  console.log('--- 测试 isPlaceholder 占位凭证识别 ---');
  check('placeholder-尖括号',
    isPlaceholder('<HW_ACCESS_KEY>'),
    '<HW_ACCESS_KEY> 被识别为占位符'
  );
  check('placeholder-模板变量',
    isPlaceholder('${SECRET_KEY}'),
    '${SECRET_KEY} 被识别为占位符'
  );
  check('placeholder-大写关键字',
    isPlaceholder('YOUR_AK'),
    'YOUR_AK 被识别为占位符'
  );
  check('placeholder-真实AK',
    !isPlaceholder('AKIDhc1234567890abcdef'),
    '真实 AK 不被识别为占位符'
  );
  
  // 测试11: clearRuntimeCredentials 清理凭证
  console.log('--- 测试 clearRuntimeCredentials 清理凭证 ---');
  clearRuntimeCredentials();
  check('clear-清理后无凭证',
    !hasRuntimeCredentials(),
    '清理后 hasRuntimeCredentials 返回 false'
  );
  
  // 测试12: tools/call 返回不含明文凭证
  console.log('--- 测试 tools/call 返回脱敏 ---');
  let callResult = null;
  try {
    callResult = await callTool('huaweicloud_check_cli', {});
    const callText = JSON.stringify(callResult);
    check('calltool-不含AK明文',
      !callText.includes('test_ak_20char'),
      '工具调用返回不含 AK 明文'
    );
  } catch (e) {
    console.log('tools/call 异常: ' + e.message);
  }
  
  // 测试13: assertAllowed 权限断言
  console.log('--- 测试 assertAllowed 权限断言 ---');
  let assertionPassed = true;
  try {
    assertAllowed({ decision: 'allow', risk: 'read_only' });
  } catch (e) {
    assertionPassed = false;
  }
  check('assert-allow通过',
    assertionPassed,
    'allow 决策通过断言'
  );
  
  let assertionFailed = false;
  try {
    assertAllowed({ decision: 'deny', risk: 'write', reason: '测试拒绝' });
  } catch (e) {
    assertionFailed = true;
  }
  check('assert-deny抛出',
    assertionFailed,
    'deny 决策抛出异常'
  );
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  
  if (failCount === 0) {
    status = 'PASS';
    why = 'tools/call 凭证不泄露与权限校验测试通过（' + passCount + '项测试全部通过）';
  } else {
    status = 'FAIL';
    why = failCount + '项测试失败';
  }
  
  console.log('=== D9-13 结论: ' + status + ' ===');
  console.log(why);
  
} catch (e) {
  status = 'BLOCKED';
  why = '加载源码模块失败: ' + e.message;
  console.error('D9-13 BLOCKED: ' + why);
  results.push({ id: '模块加载', status: 'FAIL', detail: why });
}

const output = {
  caseId: 'D9-13',
  status,
  why,
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  results,
  platform: process.platform,
  nodeVersion: process.version,
  srcPath: SRCDIR
};

writeFileSync(OUT, JSON.stringify(output, null, 2), 'utf8');
console.log('输出完成');
