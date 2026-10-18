import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
const tests = ["hcloud CSMS ShowSecretVersion --secret_id=test --version_id=v1","hcloud CSMS DownloadSecret --secret_id=test","hcloud KMS GetSecretValue --key_id=test"];
for (const cmd of tests) { const r = classifyTextCommand(cmd); console.log(cmd, '->', r.decision, r.risk); }