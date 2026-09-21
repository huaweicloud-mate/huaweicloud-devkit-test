import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

function probe(fn, label, ...args) {
  let out;
  try { out = fn(...args); } catch (e) { out = 'THROW:'+e.message; }
  console.log(label, '=>', JSON.stringify(out));
}
// D9-2 invalid-params / abnormal input (fail-open check)
probe(evaluateCommandRisk, 'evaluateCommandRisk(null)', null);
probe(evaluateCommandRisk, 'evaluateCommandRisk(123)', 123);
probe(evaluateCommandRisk, 'evaluateCommandRisk("")', '');
probe(evaluateArtifacts, 'evaluateArtifacts(null)', null);
probe(evaluateArtifacts, 'evaluateArtifacts("not-array")', 'not-array');
probe(evaluateDeployPlan, 'evaluateDeployPlan(null)', null);
probe(evaluateDeployPlan, 'evaluateDeployPlan(42)', 42);
