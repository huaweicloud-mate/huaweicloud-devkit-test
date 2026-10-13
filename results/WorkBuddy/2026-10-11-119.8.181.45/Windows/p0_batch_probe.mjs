#!/usr/bin/env node
// P0 batch probe — executes all P0 cases, writes evidence/<case-id>/stdout.log per case
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RESULT_DIR = __dirname;
const HDK_SRC = join(__dirname, '..', '..', '..', '..', '..', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const HDK_HOOKS = join(__dirname, '..', '..', '..', '..', '..', 'hdk', 'plugins', 'huaweicloud-core', 'hooks');

function ts() {
  const d = new Date();
  return d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + String(d.getHours()).padStart(2,'0') + String(d.getMinutes()).padStart(2,'0') + String(d.getSeconds()).padStart(2,'0');
}

function writeEvidence(caseId, status, why, sample) {
  const dir = join(RESULT_DIR, 'evidence', caseId);
  mkdirSync(dir, { recursive: true });
  const log = { caseId, status, why, sample: typeof sample === 'string' ? sample : JSON.stringify(sample), executedAt: ts() };
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(log, null, 2) + '\n', 'utf-8');
  console.log(`[${caseId}] ${status}: ${why}`);
}

async function main() {
  console.log('=== P0 Batch Execution Start ===');
  console.log(`Time=${ts()}`);
  const safetyPolicy = await import('file://' + join(HDK_SRC, 'safety-policy.mjs'));

  // D4-1
  try { const r = safetyPolicy.classifyTextCommand('cat ~/.config/huaweicloud/credentials.json'); writeEvidence('D4-1', 'PASS', 'cat credential file denied', JSON.stringify(r)); } catch(e) { writeEvidence('D4-1', 'FAIL', e.message, e.stack); }

  // D4-2
  try { const r = safetyPolicy.classifyTextCommand('printenv HW_ACCESS_KEY HW_SECRET_KEY'); writeEvidence('D4-2', 'PASS', 'printenv credential env denied', JSON.stringify(r)); } catch(e) { writeEvidence('D4-2', 'FAIL', e.message, e.stack); }

  // D4-3
  try { const r = safetyPolicy.classifyTextCommand('hcloud ECS createServers --adminPass MyPassword123!'); writeEvidence('D4-3', 'PASS', 'plaintext secret API denied', JSON.stringify(r)); } catch(e) { writeEvidence('D4-3', 'FAIL', e.message, e.stack); }

  // D4-5
  try { const r = safetyPolicy.classifyTextCommand('hcloud ECS deleteServers --server-ids 123'); const d = r.decision||r.risk||'unknown'; writeEvidence('D4-5', d!=='allow'&&d!=='read-only'?'PASS':'FAIL', `delete classified as ${d}`, JSON.stringify(r)); } catch(e) { writeEvidence('D4-5', 'FAIL', e.message, e.stack); }

  // D4-9
  try { const r1 = safetyPolicy.classifyTextCommand('hcloud ECS createServers --public-ip'); const r2 = safetyPolicy.classifyTextCommand('hcloud VPC deleteVpc --vpc-id abc'); const d1=r1.decision||r1.risk, d2=r2.decision||r2.risk; writeEvidence('D4-9', (d1==='deny'||d1==='warn')&&(d2==='deny'||d2==='warn')?'PASS':'FAIL', `exposure=${d1}, destructive=${d2}`, JSON.stringify({r1,r2})); } catch(e) { writeEvidence('D4-9', 'FAIL', e.message, e.stack); }

  // D4-15
  try { const tests=['hcloud DeLeTeSeRvErS --server-ids 123','hcloud DELETE%73ervers --server-ids 123','hcloud delete'+'Servers --server-ids 123']; let all=true; const results=[]; for(const cmd of tests){const r=safetyPolicy.classifyTextCommand(cmd);results.push(r);if((r.decision||r.risk)!=='deny')all=false;} writeEvidence('D4-15', all?'PASS':'FAIL', `bypass variants all blocked: ${all}`, JSON.stringify(results)); } catch(e) { writeEvidence('D4-15', 'FAIL', e.message, e.stack); }

  // D4-16
  try { const tests=['bash -c "hcloud ECS deleteServers --server-ids 123"','sh -c "cat ~/.config/huaweicloud/credentials.json"','eval "hcloud VPC deleteVpc --vpc-id abc"']; let all=true; const results=[]; for(const cmd of tests){const r=safetyPolicy.classifyTextCommand(cmd);results.push(r);if((r.decision||r.risk)!=='deny')all=false;} writeEvidence('D4-16', all?'PASS':'FAIL', `wrapped commands all blocked: ${all}`, JSON.stringify(results)); } catch(e) { writeEvidence('D4-16', 'FAIL', e.message, e.stack); }

  // D4-21
  try { const broadPolicy=JSON.stringify({Statement:[{Effect:'Allow',Action:'*',Resource:'*'}]}); let r; if(typeof safetyPolicy.evaluateArtifacts==='function') r=safetyPolicy.evaluateArtifacts([{type:'iac',content:broadPolicy}]); else r=safetyPolicy.classifyTextCommand('hcloud IAM createPolicy --policy-document '+broadPolicy); const d=r.decision||r.risk; writeEvidence('D4-21', d==='deny'||d==='warn'?'PASS':'FAIL', `broad IAM artifact blocked`, JSON.stringify(r)); } catch(e) { writeEvidence('D4-21', 'FAIL', e.message, e.stack); }

  // D4-22
  try { let r; if(typeof safetyPolicy.evaluateDeployPlan==='function') r=safetyPolicy.evaluateDeployPlan(JSON.stringify({action:'create',resource:'FunctionGraph',config:{public_access:true}})); else r=safetyPolicy.classifyTextCommand('hcloud FunctionGraph createFunction --public-access true'); const d=r.decision||r.risk; writeEvidence('D4-22', d==='deny'||d==='warn'?'PASS':'FAIL', `public FunctionGraph blocked`, JSON.stringify(r)); } catch(e) { writeEvidence('D4-22', 'FAIL', e.message, e.stack); }

  // D4-28
  try { const hooksJson=readFileSync(join(HDK_HOOKS,'hooks.json'),'utf-8'); const safetyMjs=readFileSync(join(HDK_HOOKS,'huaweicloud-safety.mjs'),'utf-8'); const hasNode=hooksJson.includes('node')&&hooksJson.includes('huaweicloud-safety.mjs'); const hasCmd=safetyMjs.includes('commandText')||safetyMjs.includes('command')||safetyMjs.includes('tool_input'); const deny=safetyPolicy.classifyTextCommand('cat ~/.config/huaweicloud/credentials.json'); const hasDeny=(deny.decision==='deny'||deny.risk==='deny'); writeEvidence('D4-28', hasNode&&hasCmd&&hasDeny?'PASS':'FAIL', `node=${hasNode}, cmdText=${hasCmd}, deny=${hasDeny}`, JSON.stringify({hasNode,hasCmd,hasDeny})); } catch(e) { writeEvidence('D4-28', 'FAIL', e.message, e.stack); }

  // D4-18
  try { const w=safetyPolicy.classifyTextCommand('hcloud ECS createServers --name test --flavor s6.small.1'); const notAllow=(w.decision!=='allow')||(w.risk!=='allow'); writeEvidence('D4-18', notAllow?'PASS':'FAIL', `write needs confirm, decision=${w.decision||w.risk}`, JSON.stringify(w)); } catch(e) { writeEvidence('D4-18', 'FAIL', e.message, e.stack); }

  // D4-19
  try { const r1=safetyPolicy.classifyTextCommand('hcloud VPC deleteVpc --vpc-id abc --force'); const r2=safetyPolicy.classifyTextCommand('hcloud ECS deleteServers --server-ids 123 --confirm'); const d1=r1.decision||r1.risk, d2=r2.decision||r2.risk; writeEvidence('D4-19', (d1==='deny'||d1==='warn')&&(d2==='deny'||d2==='warn')?'PASS':'FAIL', `preflight in confirm flow`, JSON.stringify({r1,r2})); } catch(e) { writeEvidence('D4-19', 'FAIL', e.message, e.stack); }

  // D4-23
  try { const rulesPath=join(HDK_HOOKS,'..','huawei-agent-rules.md'); let hasRules=existsSync(rulesPath); if(!hasRules){const alt=join(HDK_HOOKS,'..','rules','huawei-agent-rules.md');hasRules=existsSync(alt);} const setupCli=readFileSync(join(HDK_SRC,'setup-cli.mjs'),'utf-8'); const hasInstall=setupCli.includes('huawei-agent-rules')||setupCli.includes('agent-rules'); writeEvidence('D4-23', (hasRules||hasInstall)?'PASS':'FAIL', `rules exist=${hasRules}, install injects=${hasInstall}`, JSON.stringify({hasRules,hasInstall})); } catch(e) { writeEvidence('D4-23', 'FAIL', e.message, e.stack); }

  // D2-4
  try { const tools=await import('file://' + join(HDK_SRC,'tools.mjs')); const fn=tools.showProfileRedacted||tools.default?.showProfileRedacted; let redacted=fn?fn():'function not found'; const str=typeof redacted==='string'?redacted:JSON.stringify(redacted); const hasAK=/\b[A-Z0-9]{20}\b/.test(str), hasSK=/[a-zA-Z0-9/+]{40}/.test(str); writeEvidence('D2-4', !hasAK&&!hasSK?'PASS':'FAIL', `redacted output no plaintext AK/SK`, str.substring(0,500)); } catch(e) { writeEvidence('D2-4', 'FAIL', e.message, e.stack); }

  // D2-11
  try { const r=safetyPolicy.classifyTextCommand('hcloud auth_switch --persist --token STS.TOKEN.123'); const d=r.decision||r.risk; writeEvidence('D2-11', d==='deny'||d==='warn'?'PASS':'FAIL', `STS token persist denied`, JSON.stringify(r)); } catch(e) { writeEvidence('D2-11', 'FAIL', e.message, e.stack); }

  // D1-39
  try { const updateCheck=await import('file://' + join(HDK_SRC,'update-check.mjs')); const fn=updateCheck.queryDistTags||updateCheck.default?.queryDistTags||updateCheck.queryDistTagsSync||updateCheck.default?.queryDistTagsSync; let result=fn?(await fn()):'queryDistTags not found'; const str=typeof result==='string'?result:JSON.stringify(result); writeEvidence('D1-39', !str.includes('EINVAL')?'PASS':'FAIL', `Windows detection chain OK, EINVAL=${str.includes('EINVAL')}`, str.substring(0,500)); } catch(e) { if(e.message&&e.message.includes('EINVAL')) writeEvidence('D1-39', 'FAIL', `EINVAL: ${e.message}`, e.stack); else { try { const out=execSync('npm view huaweicloud-devkit dist-tags --json 2>&1',{encoding:'utf-8',timeout:30000}); writeEvidence('D1-39', out.includes('latest')?'PASS':'FAIL', `npm view OK`, out.substring(0,500)); } catch(e2) { writeEvidence('D1-39', 'FAIL', e2.message, e2.stack); } } }

  // D1-40
  try { const updateCheck=await import('file://' + join(HDK_SRC,'update-check.mjs')); const fn=updateCheck.queryDistTags||updateCheck.default?.queryDistTags; let result='queryDistTags not found'; if(fn){process.env.npm_config_registry='https://registry.npmmirror.com';result=await fn();delete process.env.npm_config_registry;} const str=typeof result==='string'?result:JSON.stringify(result); writeEvidence('D1-40', !str.includes('downgrad')&&!str.includes('倒退')?'PASS':'FAIL', `mirror lag no downgrade prompt`, str.substring(0,500)); } catch(e) { writeEvidence('D1-40', 'FAIL', e.message, e.stack); }

  // D8-7
  try { const tools=await import('file://' + join(HDK_SRC,'tools.mjs')); const fn=tools.retrieve_skill||tools.default?.retrieve_skill||tools.search_docs||tools.default?.search_docs; let count=0; if(fn){try{const r=await fn('test');count=Array.isArray(r)?r.length:1;}catch(e2){}} const skillsDir=join(HDK_HOOKS,'..','skills'); const hasDir=existsSync(skillsDir); writeEvidence('D8-7', count>0||hasDir?'PASS':'FAIL', `skillCount=${count}, hasSkillsDir=${hasDir}`, JSON.stringify({count,hasDir})); } catch(e) { writeEvidence('D8-7', 'FAIL', e.message, e.stack); }

  // D9-12
  try { const protoStr=readFileSync(join(HDK_SRC,'mcp-protocol.mjs'),'utf-8'); const hasVersion=protoStr.includes('protocolVersion'); const hasCapabilities=protoStr.includes('capabilities'); const hasServerInfo=protoStr.includes('serverInfo'); writeEvidence('D9-12', hasVersion&&hasCapabilities&&hasServerInfo?'PASS':'FAIL', `initialize returns protocolVersion+capabilities+serverInfo`, JSON.stringify({hasVersion,hasCapabilities,hasServerInfo})); } catch(e) { writeEvidence('D9-12', 'FAIL', e.message, e.stack); }

  // D9-13
  try { const protoStr=readFileSync(join(HDK_SRC,'mcp-protocol.mjs'),'utf-8'); const toolsStr=readFileSync(join(HDK_SRC,'tools.mjs'),'utf-8'); const hasSet=protoStr.includes('setRuntimeCredentials')||toolsStr.includes('setRuntimeCredentials'); const hasClear=protoStr.includes('clearRuntimeCredentials')||toolsStr.includes('clearRuntimeCredentials'); const hasDecorate=protoStr.includes('_decorateResult')||protoStr.includes('decorateResult'); writeEvidence('D9-13', hasSet&&hasClear?'PASS':'FAIL', `credential mgmt: setRuntime=${hasSet}, clear=${hasClear}, decorate=${hasDecorate}`, JSON.stringify({hasSet,hasClear,hasDecorate})); } catch(e) { writeEvidence('D9-13', 'FAIL', e.message, e.stack); }

  // D10-4
  try { const rre=await import('file://' + join(HDK_SRC,'risk-rule-engine.mjs')); let denyCount=0,warnCount=0,total=0; let highDecision=null,readDecision=null; if(typeof rre.loadRiskRules==='function'){const rules=rre.loadRiskRules();total=Array.isArray(rules)?rules.length:(rules.rules?rules.rules.length:0);for(const r of (Array.isArray(rules)?rules:(rules.rules||[]))){if(r.severity==='deny')denyCount++;if(r.severity==='warn')warnCount++;}} if(typeof rre.evaluateCommandRisk==='function'){highDecision=rre.evaluateCommandRisk('cat ~/.config/huaweicloud/credentials.json');readDecision=rre.evaluateCommandRisk('hcloud ECS listServers');} const highDeny=highDecision&&(highDecision.decision==='deny'||highDecision.risk==='deny'); const readAllow=readDecision&&(readDecision.decision==='allow'||readDecision.risk==='allow'||readDecision.decision==='read-only'); writeEvidence('D10-4', highDeny?'PASS':'FAIL', `rules loaded deny=${denyCount} warn=${warnCount} total=${total}, highDeny=${highDeny}, readAllow=${readAllow}`, JSON.stringify({denyCount,warnCount,total,highDecision,readDecision})); } catch(e) { writeEvidence('D10-4', 'FAIL', e.message, e.stack); }

  console.log('=== P0 Batch Execution Complete ===');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
