// D4-3 recheck: hook_check_command verdict for plaintext-secret-returning API calls
// Case D4-3 (P0): calling an API that returns plaintext/binary secret must be BLOCKED.
// Pipeline under test: classifyTextCommand (safety-policy.mjs) + evaluateCommandRisk (risk-rule-engine.mjs
// against safety/rules/cloud-risk-rules.json).
import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const cases = [
  { name: 'CSMS ShowSecret (returns secret_string/binary)', cmd: 'hcloud csms ShowSecret --secret-name=demo --version-stage=SYSCURRENT' },
  { name: 'secret wording without CSMS verbs', cmd: 'hcloud api call GetSecretValue --secret-string' },
  { name: 'KMS decrypt (secret.bin)', cmd: 'hcloud kms decrypt --cipher-text-file=secret.bin' },
  { name: 'KMS plaintext in arg', cmd: 'hcloud kms create-datakey --key-id=abc --plain-text=supersecret123' },
];
for (const c of cases) {
  let cls = null, risk = null;
  try { cls = classifyTextCommand(c.cmd); } catch (e) { cls = { error: String(e) }; }
  try { risk = evaluateCommandRisk(c.cmd); } catch (e) { risk = { error: String(e) }; }
  console.log('###', c.name, '=>', c.cmd);
  console.log('classify:', JSON.stringify(cls).slice(0, 400));
  console.log('risk:', JSON.stringify(risk).slice(0, 400));
}
