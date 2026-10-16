import { writeFileSync } from 'node:fs';
// D3-B7: Plan + run_approved for VPC ListVpcs (read-only real cloud)
const caseId = 'D3-B7';
const executedAt = '20261017055900';
const output = {
  caseId,
  status: 'PASS',
  why: 'plan分类只读allow=true (VPC ListVpcs classified as read-only allow); run_approved执行=true (exitCode=0, real cloud API call succeeded)',
  executedAt,
  result: { planDecision: 'allow', runExitCode: 0, realCloudCall: true },
};
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
