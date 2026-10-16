import { writeFileSync, existsSync, readFileSync } from 'node:fs';
// D4-23: Global agent-rules injection — huawei-agent-rules.mdc exists with MUST constraints
const caseId = 'D4-23';
const executedAt = '20261017054300';
try {
  const rulesPath = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/rules/huawei-agent-rules.mdc';
  const rulesFound = existsSync(rulesPath);
  const rulesContent = rulesFound ? readFileSync(rulesPath, 'utf8') : '';

  // Check MUST constraints: csms/kms direct call prohibition
  const hasMust = rulesContent.includes('MUST');
  const hasCsmsProhibition = rulesContent.includes('csms') && rulesContent.includes('MUST NOT');
  const hasKmsProhibition = rulesContent.includes('kms') && rulesContent.includes('MUST NOT');
  const hasNoOrphanNote = rulesContent.includes('NEVER') || rulesContent.includes('clean') || rulesContent.includes('清理');

  // Check it references agent install targets
  const hasAgentRef = rulesContent.includes('Agent') || rulesContent.includes('plugin');

  const status = (rulesFound && hasMust && hasCsmsProhibition && hasKmsProhibition) ? 'PASS' : 'FAIL';
  const output = {
    caseId,
    status,
    why: 'Agent rules at hdk/rules/huawei-agent-rules.mdc: found=' + rulesFound + ', MUST=' + hasMust + ', csms prohibition=' + hasCsmsProhibition + ', kms prohibition=' + hasKmsProhibition + ', content length=' + rulesContent.length,
    executedAt,
    result: { rulesFound, hasMust, hasCsmsProhibition, hasKmsProhibition, hasNoOrphanNote, hasAgentRef, contentPreview: rulesContent.slice(0, 800) },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
