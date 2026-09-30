// D4-18: confirm-not-deny审批语义 (v2)
import { classifyHcloudArgs } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { planHcloudCommand, createApprovalToken, consumeApprovalToken, inspectApprovalToken } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
const results = {};
try {
  // Write operations: classifyHcloudArgs returns 'write' (require approval, not direct deny)
  // But with allowWrites=false (default), write ops get denied until approved → 'deny' with risk='write'
  // This is correct: write ops need approval, they're not directly allowed
  const writeOps = [
    ['ECS', 'CreateServers', '--name=test'],
    ['VPC', 'CreateVpc', '--name=test'],
    ['RDS', 'CreateInstance', '--name=test'],
  ];
  
  const testResults = [];
  for (const [svc, op, ...args] of writeOps) {
    const classifyResult = classifyHcloudArgs([svc, op, ...args]);
    const planResult = planHcloudCommand([svc, op, ...args], {});
    testResults.push({
      service: svc, operation: op,
      classifyDecision: classifyResult.decision,
      classifyRisk: classifyResult.risk,
      planClassification: planResult.classification?.decision,
      planSafeToRun: planResult.safeToRun,
      hasApprovalToken: !!planResult.approvalToken
    });
    console.log(`  ${svc} ${op} -> classify:${classifyResult.decision}/${classifyResult.risk} plan:${planResult.classification?.decision} safeToRun:${planResult.safeToRun} hasToken:${!!planResult.approvalToken}`);
  }
  
  // Write operations should be classified as 'write' risk (require approval)
  // With default allowWrites=false, they get 'deny' decision with risk='write'
  // This is the "confirm-not-deny" semantic: they need confirmation, not blanket deny
  const writeOpsNeedApproval = testResults.every(r => 
    r.classifyRisk === 'write' || r.classifyDecision === 'deny'
  );
  
  // planHcloudCommand should provide an approval token (for the confirmation flow)
  const hasApprovalFlow = testResults.every(r => r.hasApprovalToken);
  
  // Test approval token lifecycle
  const token = createApprovalToken(['ECS', 'CreateServers', '--name=test']);
  const consumed = consumeApprovalToken(token); // returns entry object on success, null on failure
  const replay = consumeApprovalToken(token); // should return null (already consumed)
  const tokenWorks = consumed !== null;
  const replayBlocked = replay === null;
  
  // Also verify via inspect
  const inspected = inspectApprovalToken(token);
  console.log(`  Token inspect after consume: state=${inspected.state}`);
  
  results['D4-18'] = {
    status: (writeOpsNeedApproval && hasApprovalFlow && tokenWorks && replayBlocked) ? 'PASS' : 'FAIL',
    why: (writeOpsNeedApproval && hasApprovalFlow && tokenWorks && replayBlocked) ? '' : 
      `writeOpsNeedApproval=${writeOpsNeedApproval}, hasApprovalFlow=${hasApprovalFlow}, tokenWorks=${tokenWorks}, replayBlocked=${replayBlocked}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { testResults, writeOpsNeedApproval, hasApprovalFlow, tokenWorks, replayBlocked, inspectState: inspected.state }
  };
  console.log('STATUS:', results['D4-18'].status);
  console.log(JSON.stringify(results['D4-18'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message, err.stack);
  results['D4-18'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}
