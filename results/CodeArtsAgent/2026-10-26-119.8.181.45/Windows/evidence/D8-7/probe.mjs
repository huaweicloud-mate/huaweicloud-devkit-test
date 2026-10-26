import { callTool } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

function log(caseId, status, data = {}) {
  results[caseId] = {
    caseId,
    status,
    executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
    ...data
  };
}

async function main() {
  const skills = [
    'huaweicloud-core',
    'huaweicloud-safety',
    'huaweicloud-api-and-sdk',
    'huaweicloud-capability-discovery',
    'huaweicloud-cli-and-auth',
    'huaweicloud-troubleshooting',
    'huawei-getting-started'
  ];
  
  let passCount = 0;
  let failCount = 0;
  const details = {};
  
  for (const skillName of skills) {
    try {
      const result = await callTool('huaweicloud_retrieve_skill', { name: skillName });
      if (result && result.content) {
        passCount++;
        details[skillName] = 'PASS';
      } else {
        failCount++;
        details[skillName] = 'FAIL: no content';
      }
    } catch (err) {
      failCount++;
      details[skillName] = 'ERROR: ' + err.message;
    }
  }
  
  if (passCount === skills.length) {
    log('D8-7', 'PASS', { skillsLoaded: passCount, totalSkills: skills.length, details });
  } else {
    log('D8-7', 'FAIL', { skillsLoaded: passCount, totalSkills: skills.length, details });
  }
  
  const outputPath = join(__dirname, 'stdout.log');
  writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
}

main().catch(err => {
  results['D8-7'] = { caseId: 'D8-7', status: 'FAIL', error: err.message };
  const outputPath = join(__dirname, 'stdout.log');
  writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
});
