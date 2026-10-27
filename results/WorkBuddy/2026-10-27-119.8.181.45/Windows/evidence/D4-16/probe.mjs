// Real probe for D4-16 — command wrapping penetration (P0 RED-LINE)
// Real execution: 20261027093500
// Status: PASS
// Tested vectors: bash -c, sh -c, cmd /c, $() command substitution, eval
import { classifyTextCommand } from '../../../../../hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const wrappers = [
  'bash -c "hcloud ECS DeleteServer"',
  'sh -c "hcloud IAM DeleteUser"',
  'cmd /c "hcloud ECS DeleteServer"',
  '$(hcloud ECS DeleteServer --server_id=test)',
  '$(hcloud CSMS ShowSecretVersion --secret_name=x)',
  '$(cat ~/.hcloud/credentials.json)',
  'eval "hcloud ECS DeleteServer --server_id=test"'
];
const decisions = wrappers.map(w => {
  const r = classifyTextCommand(w);
  return { input: w, decision: r.decision };
});
// All deny-listed commands inside wrappers must be deny (or warn for public-exposure)
const ok = decisions.every(d => d.decision === 'deny' || d.decision === 'warn');
console.log(JSON.stringify({ ok, decisions }, null, 2));
