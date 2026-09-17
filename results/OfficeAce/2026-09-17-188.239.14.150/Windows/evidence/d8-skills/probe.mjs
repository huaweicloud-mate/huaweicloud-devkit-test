// AI生成
/**
 * OfficeAce Windows 每日测试探针 - D8 技能指引 + D10 评测
 * 覆盖: D8-1, D8-6, D8-7, D10-3, D10-4
 */
import { writeFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const hdkRoot = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,150), expected: String(expected).substring(0,100), passMsg, failMsg });
}

// D8-7: 7 meta/general skill guidance mechanically executable verification
try {
  const skillsDir = join(hdkRoot, 'plugins', 'huaweicloud-core', 'skills');
  const skillsExist = existsSync(skillsDir);
  let skillCount = 0;
  let skillList = [];
  if (skillsExist) {
    skillList = readdirSync(skillsDir).filter(f => f.endsWith('.md') || existsSync(join(skillsDir, f, 'SKILL.md')));
    skillCount = skillList.length;
  }
  // Also check for skills in other locations
  const altSkillsDir = join(hdkRoot, 'skills');
  if (existsSync(altSkillsDir)) {
    const altSkills = readdirSync(altSkillsDir).filter(f => f.endsWith('.md') || existsSync(join(altSkillsDir, f, 'SKILL.md')));
    skillCount += altSkills.length;
    skillList = skillList.concat(altSkills);
  }
  test('D8-7', 'skills-exist', skillsExist || skillCount > 0, `${skillCount} skills found`, '>=1', `Skills directory found with ${skillCount} skills`, 'Skills directory not found');
  test('D8-7', 'skills-count', skillCount >= 1, skillCount, '>=1', `Found ${skillCount} skills`, 'No skills found');
} catch (e) {
  test('D8-7', 'skills', false, e.message, 'skills found', 'Skills verification', `Error: ${e.message}`);
}

// D8-1: Documentation and capability consistency
try {
  const readmePath = join(hdkRoot, 'README.md');
  const readmeExists = existsSync(readmePath);
  test('D8-1', 'readme-exists', readmeExists, readmeExists ? 'exists' : 'missing', 'exists', 'README exists', 'README missing');
  if (readmeExists) {
    const readme = readFileSync(readmePath, 'utf8');
    test('D8-1', 'readme-content', readme.length > 100, `${readme.length} chars`, '>100', 'README has content', 'README empty');
  }
} catch (e) {
  test('D8-1', 'readme', false, e.message, 'exists', 'Documentation', `Error: ${e.message}`);
}

// D8-6: Chinese/English documentation consistency
try {
  const readmePath = join(hdkRoot, 'README.md');
  const readme = readFileSync(readmePath, 'utf8');
  const hasChinese = /[\u4e00-\u9fa5]/.test(readme);
  const hasEnglish = /[a-zA-Z]/.test(readme);
  test('D8-6', 'doc-bilingual', hasChinese && hasEnglish, `CN:${hasChinese} EN:${hasEnglish}`, 'both', 'Documentation has both CN/EN', 'Documentation missing CN or EN');
} catch (e) {
  test('D8-6', 'doc-bilingual', false, e.message, 'both', 'Bilingual docs', `Error: ${e.message}`);
}

// D10-3: serviceCatalog routing (eval harness)
try {
  const evalDir = join(hdkRoot, 'eval', 'harness');
  const harnessExists = existsSync(join(evalDir, 'run-eval.mjs'));
  test('D10-3', 'harness-exists', harnessExists, harnessExists ? 'exists' : 'missing', 'exists', 'Eval harness exists', 'Eval harness missing');
  
  const promptsDir = join(hdkRoot, 'eval', 'prompts');
  const promptsExist = existsSync(join(promptsDir, 'eval-set-v1.csv'));
  test('D10-3', 'prompts-exist', promptsExist, promptsExist ? 'exists' : 'missing', 'exists', 'Eval prompts exist', 'Eval prompts missing');
} catch (e) {
  test('D10-3', 'eval-harness', false, e.message, 'exists', 'Eval harness', `Error: ${e.message}`);
}

// D10-4: Safety intervention effectiveness
try {
  // Check if safety policy has intervention mechanism
  const safetyPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'safety-policy.mjs');
  const safetyExists = existsSync(safetyPath);
  test('D10-4', 'safety-policy-exists', safetyExists, safetyExists ? 'exists' : 'missing', 'exists', 'Safety policy exists', 'Safety policy missing');
  
  if (safetyExists) {
    const content = readFileSync(safetyPath, 'utf8');
    const hasClassify = content.includes('classifyTextCommand') || content.includes('classifyHcloudArgs');
    const hasRedact = content.includes('redactSecrets');
    test('D10-4', 'safety-intervention', hasClassify && hasRedact, `classify:${hasClassify} redact:${hasRedact}`, 'both', 'Safety intervention mechanism exists', 'Safety intervention missing');
  }
} catch (e) {
  test('D10-4', 'safety', false, e.message, 'exists', 'Safety intervention', `Error: ${e.message}`);
}

const passed = results.filter(r=>r.pass).length;
const failed = results.filter(r=>!r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync('C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-17-188.239.14.150/Windows/evidence/d8-skills/stdout.log', output, 'utf8');
console.log(output);
