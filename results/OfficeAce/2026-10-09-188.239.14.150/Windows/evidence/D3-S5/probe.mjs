// D3-S5: 复合意图分层路由 — verify service_catalog handles multi-intent queries with layered routing
import { loadMcpProtocol } from '../_helper.mjs';
const { dispatch } = await loadMcpProtocol();

// Test 1: Compound intent (ECS + VPC)
let result1, error1;
try {
  result1 = await dispatch('tools/call', {
    name: 'huaweicloud_service_catalog',
    arguments: { intent: 'ECS create server and VPC create subnet' }
  });
} catch (e) {
  error1 = e;
}

const hasContent1 = result1?.content?.length > 0;
let parsed1 = null;
if (hasContent1) {
  try { parsed1 = JSON.parse(result1.content[0].text); } catch {}
}

// Verify compound routing: should recommend both ECS and VPC skills
const skills1 = parsed1?.recommendedSkills || [];
const services1 = parsed1?.recommendedServices || [];
const hasEcsSkill = skills1.some(s => /ecs/i.test(s));
const hasVpcSkill = skills1.some(s => /vpc/i.test(s));
const hasEcsService = services1.some(s => /ECS/i.test(s));
const hasVpcService = services1.some(s => /VPC/i.test(s));

// Test 2: Another compound intent (OBS + RDS)
let result2, error2;
try {
  result2 = await dispatch('tools/call', {
    name: 'huaweicloud_service_catalog',
    arguments: { intent: 'OBS bucket and RDS MySQL database' }
  });
} catch (e) {
  error2 = e;
}

const hasContent2 = result2?.content?.length > 0;
let parsed2 = null;
if (hasContent2) {
  try { parsed2 = JSON.parse(result2.content[0].text); } catch {}
}

const skills2 = parsed2?.recommendedSkills || [];
const services2 = parsed2?.recommendedServices || [];
const hasObsSkill = skills2.some(s => /obs/i.test(s));
const hasRdsSkill = skills2.some(s => /rds/i.test(s));

// Test 3: Single intent (CCE only) for contrast
let result3, error3;
try {
  result3 = await dispatch('tools/call', {
    name: 'huaweicloud_service_catalog',
    arguments: { intent: 'CCE Kubernetes cluster' }
  });
} catch (e) {
  error3 = e;
}

const hasContent3 = result3?.content?.length > 0;
let parsed3 = null;
if (hasContent3) {
  try { parsed3 = JSON.parse(result3.content[0].text); } catch {}
}

const skills3 = parsed3?.recommendedSkills || [];
const hasCceSkill = skills3.some(s => /cce/i.test(s));
const hasEcsSkillInCce = skills3.some(s => /ecs/i.test(s)); // should NOT have ECS

const compoundEcsVpc = hasEcsSkill && hasVpcSkill;
const compoundObsRds = hasObsSkill && hasRdsSkill;
const singleCce = hasCceSkill && !hasEcsSkillInCce;

const ok = compoundEcsVpc && compoundObsRds && singleCce;

console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D3-S5',
  why: ok
    ? `Compound intent routing verified: ECS+VPC→both skills, OBS+RDS→both skills, CCE only→cce skill only.`
    : `compoundEcsVpc=${compoundEcsVpc}, compoundObsRds=${compoundObsRds}, singleCce=${singleCce}`,
  executedAt: '20261001103000',
  test1: { intent: 'ECS+VPC', skills: skills1, services: services1, hasEcsSkill, hasVpcSkill },
  test2: { intent: 'OBS+RDS', skills: skills2, hasObsSkill, hasRdsSkill },
  test3: { intent: 'CCE only', skills: skills3, hasCceSkill, hasEcsSkillInCce },
}, null, 2));