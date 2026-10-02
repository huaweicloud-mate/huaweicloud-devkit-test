// D4-26 findings 证据脱敏 聚焦探针 — Hermes/Linux/2026-10-01 v1.1.8-next.1 (ffd7b474)
const HDK = process.env.HDK_PLUGIN_SRC || '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
import { writeFileSync } from 'node:fs';
const re = await import(`file://${HDK}/src/risk-rule-engine.mjs`);

const cases = [
  'hcloud csms ShowSecretVersion --secret-name x --ak AK123456789 sk=SKsecret123',
  'hcloud ecs CreateServer --password MyP@ss --token abc123',
];
let allRedacted = true;
const dets = [];
for (const cmd of cases) {
  const r = re.evaluateCommandRisk(cmd);
  const findings = r?.findings || [];
  const evidences = findings.map(f => f.evidence || '').join(' | ');
  const leak = /AK123456789|SKsecret123|MyP@ss|abc123/.test(evidences);
  if (leak) allRedacted = false;
  dets.push(`cmd="${cmd.slice(0, 55)}" findings=${findings.length} leak=${leak}`);
}

const status = allRedacted ? 'PASS' : 'FAIL';
const why = allRedacted ? '' : 'risk-rule-engine.mjs:19-25 redactEvidence 未覆盖 --ak 空格分隔 + 小写 sk=，findings.evidence 泄密';
const obj = { status, why: why || undefined, executedAt: new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14) };
writeFileSync(new URL(`file://${process.cwd()}/D4-26/stdout.log`), JSON.stringify(obj, null, 2), 'utf8');
console.log('D4-26 => ' + status + '\n' + dets.join('\n'));