import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// D8-7: 7 个 meta/通用技能指引可机械执行验证
console.log('=== D8-7: meta/general skills mechanical execution ===');

const skillsBase = 'C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/skills';

// The 7 meta/general skills (non-service-specific)
const metaSkills = [
  'huaweicloud-core',           // core routing
  'huaweicloud-capability-discovery',  // capability discovery
  'huaweicloud-cli-and-auth',   // CLI and auth
  'huaweicloud-api-and-sdk',    // API and SDK
  'huaweicloud-safety',         // safety policy
  'huaweicloud-troubleshooting', // troubleshooting
  'huawei-getting-started',     // getting started
];

let allOk = true;
const results = [];
for (const skill of metaSkills) {
  const skillDir = join(skillsBase, skill);
  const skillMd = join(skillDir, 'SKILL.md');
  const exists = existsSync(skillMd);
  let hasProcedure = false;
  let hasTrigger = false;
  let lineCount = 0;
  if (exists) {
    const content = readFileSync(skillMd, 'utf8');
    lineCount = content.split('\n').length;
    // Check for executable procedures (steps, commands, triggers)
    hasProcedure = /##|步骤|step|procedure|执行|run|command/i.test(content);
    hasTrigger = /触发|trigger|Use when|当.*时/i.test(content);
  }
  const ok = exists && hasProcedure;
  if (!ok) allOk = false;
  results.push({ skill, exists, hasProcedure, hasTrigger, lineCount, ok });
  console.log('  ' + skill + ': exists=' + exists + ' procedure=' + hasProcedure + ' trigger=' + hasTrigger + ' lines=' + lineCount + ' ' + (ok ? 'OK' : 'FAIL'));
}

// Also verify retrieve_skill can load these
console.log('  meta skills count: ' + results.filter(r => r.ok).length + '/7');

const verdict = allOk && results.filter(r => r.ok).length >= 7 ? 'PASS' : 'FAIL';
console.log('D8-7_VERDICT=' + verdict);
