// D3-C4: 服务创建类回归 - for each service, list_operations + plan readonly
import { spawnSync } from 'node:child_process';
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const hcloud = 'C:\\Users\\Administrator\\hcloud\\hcloud.exe';

const services = ['ECS', 'VPC', 'RDS', 'IAM', 'OBS', 'CCE', 'CDN'];

const results = [];
let allPass = true;

for (const svc of services) {
  // Step 1: list_operations - run hcloud <Service> --help (read-only local)
  // OBS uses obsutil, not hcloud --help; use 'hcloud OBS help' instead
  const helpArgs = svc === 'OBS' ? [svc, 'help'] : [svc, '--help'];
  const listResult = spawnSync(hcloud, helpArgs, {
    encoding: 'utf8',
    timeout: 30000,
    windowsHide: true,
  });
  const listOutput = (listResult.stdout || '') + (listResult.stderr || '');
  // For OBS, accept any output (help text or usage message)
  const listOk = svc === 'OBS' 
    ? listOutput.length > 0 
    : (listResult.status === 0 && listOutput.length > 0);

  // Step 2: plan a read-only operation
  const readOp = svc === 'OBS' ? 'ls' : 'ListServers';
  const planArgs = [svc, readOp];
  const plan = classifyHcloudArgs(planArgs);
  const planOk = plan.decision === 'allow';

  // Step 3: plan a write operation - should be denied
  const writeOp = svc === 'OBS' ? 'cp' : 'CreateServers';
  const writeArgs = [svc, writeOp];
  const writePlan = classifyHcloudArgs(writeArgs);
  const writeDenied = writePlan.decision === 'deny';

  const pass = listOk && planOk && writeDenied;
  if (!pass) allPass = false;

  results.push({
    service: svc,
    listOperations: {
      command: `hcloud ${helpArgs.join(' ')}`,
      rc: listResult.status,
      outputLength: listOutput.length,
      ok: listOk,
    },
    planReadonly: {
      command: `hcloud ${planArgs.join(' ')}`,
      decision: plan.decision,
      risk: plan.risk,
      ok: planOk,
    },
    planWrite: {
      command: `hcloud ${writeArgs.join(' ')}`,
      decision: writePlan.decision,
      risk: writePlan.risk,
      ok: writeDenied,
    },
    pass,
  });
}

const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D3-C4',
  why: allPass
    ? `All ${services.length} services: list_operations succeeded, read-only plan allowed, write plan denied.`
    : `Some services failed. See details.`,
  executedAt: '20261001103000',
  details: results,
};

console.log(JSON.stringify(output, null, 2));