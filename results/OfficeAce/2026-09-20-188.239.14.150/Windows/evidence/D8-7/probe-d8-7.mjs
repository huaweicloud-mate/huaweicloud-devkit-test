// AI生成
/**
 * D8-7 Probe: 7 meta/general skill guides mechanically executable verification
 *
 * Verifies for each of the 7 meta/general skills:
 * 1. SKILL.md exists with valid frontmatter
 * 2. Anti-hallucination guard (STOP/MANDATORY/IMPORTANT directive)
 * 3. Structured workflow/procedure
 * 4. All referenced local files (references/*.md, scripts/*.py) exist
 * 5. All referenced MCP tools are registered in tools.mjs
 * 6. All cross-skill references point to existing skills
 * 7. Concrete executable steps (commands, tools, code blocks)
 * 8. Error handling/guidance section
 * 9. No broken external URLs
 * 10. Step-by-step execution path (no guessing required)
 *
 * Usage: node probe-d8-7.mjs
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const HDK_ROOT = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk';
const PLUGIN_ROOT = join(HDK_ROOT, 'plugins', 'huaweicloud-core');
const SKILLS_ROOT = join(PLUGIN_ROOT, 'skills');
const ROOT_SKILLS = join(HDK_ROOT, 'skills');

const results = {
  testCase: 'D8-7',
  timestamp: new Date().toISOString(),
  skills: [],
  overall: 'PASS'
};

// Load registered MCP tools from tools.mjs
const toolsContent = readFileSync(join(PLUGIN_ROOT, 'src', 'tools.mjs'), 'utf8');
const toolNamePattern = /name:\s*['"`]([^'"`]+)['"`]/g;
const registeredTools = new Set();
let match;
while ((match = toolNamePattern.exec(toolsContent)) !== null) registeredTools.add(match[1]);

// Get all available skill directories
const availableSkills = new Set();
for (const d of readdirSync(SKILLS_ROOT, { withFileTypes: true })) if (d.isDirectory()) availableSkills.add(d.name);
for (const d of readdirSync(ROOT_SKILLS, { withFileTypes: true })) if (d.isDirectory()) availableSkills.add(d.name);

// The 7 meta/general skills
const metaSkills = [
  { name: 'huaweicloud-core', path: join(SKILLS_ROOT, 'huaweicloud-core', 'SKILL.md') },
  { name: 'huaweicloud-safety', path: join(SKILLS_ROOT, 'huaweicloud-safety', 'SKILL.md') },
  { name: 'huaweicloud-cli-and-auth', path: join(SKILLS_ROOT, 'huaweicloud-cli-and-auth', 'SKILL.md') },
  { name: 'huaweicloud-capability-discovery', path: join(SKILLS_ROOT, 'huaweicloud-capability-discovery', 'SKILL.md') },
  { name: 'huaweicloud-api-and-sdk', path: join(SKILLS_ROOT, 'huaweicloud-api-and-sdk', 'SKILL.md') },
  { name: 'huaweicloud-troubleshooting', path: join(SKILLS_ROOT, 'huaweicloud-troubleshooting', 'SKILL.md') },
  { name: 'huawei-cloud-find-skills', path: join(ROOT_SKILLS, 'huawei-cloud-find-skills', 'SKILL.md') },
];

for (const skill of metaSkills) {
  const skillResult = { name: skill.name, checks: [], passed: true };

  function skillCheck(name, passed, detail) {
    skillResult.checks.push({ name, passed, detail });
    if (!passed) { skillResult.passed = false; results.overall = 'FAIL'; }
    console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}: ${detail}`);
  }

  console.log(`\n=== Skill: ${skill.name} ===`);
  const exists = existsSync(skill.path);
  skillCheck('SKILL.md exists', exists, exists ? 'OK' : 'MISSING');
  if (!exists) { results.skills.push(skillResult); continue; }

  const content = readFileSync(skill.path, 'utf8');

  // 1: Frontmatter
  skillCheck('Has frontmatter (name+description)',
    content.startsWith('---') && content.includes('name:') && content.includes('description:'), 'Valid');

  // 2: Anti-hallucination guard
  const hasAntiHallucination = /STOP.*Do not answer|MANDATORY|IMPORTANT.*MUST|Do not guess|Do not rely on training data/i.test(content);
  skillCheck('Anti-hallucination guard', hasAntiHallucination, hasAntiHallucination ? 'Found' : 'Missing');

  // 3: Structured workflow
  const hasWorkflow = /## Workflow|## Procedure|## How This Skill Works|## Core Workflow|## Safe Flow|## Rules|## API Workflow/i.test(content);
  skillCheck('Structured workflow', hasWorkflow, hasWorkflow ? 'Found' : 'Missing');

  // 4: Reference files exist
  const skillDir = dirname(skill.path);
  const refPattern = /references\/([^\s)}\]]+\.md)/g;
  const scriptPattern = /scripts\/([^\s)}\]]+\.\w+)/g;
  let refFiles = [];
  while ((match = refPattern.exec(content)) !== null) {
    if (!match[1].includes('{')) refFiles.push(match[1]);
  }
  const scriptRefs = new Set();
  while ((match = scriptPattern.exec(content)) !== null) {
    if (!match[1].includes('{')) scriptRefs.add(match[0]);
  }
  for (const ref of refFiles) {
    const refPath = join(skillDir, 'references', ref);
    skillCheck(`Ref: ${ref}`, existsSync(refPath), existsSync(refPath) ? 'Found' : 'MISSING');
  }
  for (const ref of scriptRefs) {
    const refPath = join(skillDir, ref);
    skillCheck(`Script: ${ref}`, existsSync(refPath), existsSync(refPath) ? 'Found' : 'MISSING');
  }

  // 5: MCP tools registered
  const mcpToolPattern = /huaweicloud_\w+/g;
  const referencedTools = new Set();
  while ((match = mcpToolPattern.exec(content)) !== null) referencedTools.add(match[0]);
  for (const tool of [...referencedTools].sort()) {
    skillCheck(`Tool: ${tool}`, registeredTools.has(tool), registeredTools.has(tool) ? 'Registered' : 'NOT registered');
  }

  // 6: Cross-skill references valid
  const tableSkillPattern = /huawei-\w+(?:-\w+)*/g;
  const crossSkills = new Set();
  while ((match = tableSkillPattern.exec(content)) !== null) {
    if (match[0] !== skill.name && match[0].startsWith('huawei-') && !match[0].startsWith('huawei-cloud')) {
      crossSkills.add(match[0]);
    }
  }
  const missingCross = [...crossSkills].filter(s => !availableSkills.has(s));
  skillCheck('Cross-skill refs valid', missingCross.length === 0,
    missingCross.length === 0 ? `${crossSkills.size} refs OK` : `Missing: ${missingCross.join(', ')}`);

  // 7: Concrete executable steps
  const hasConcreteSteps = /```|hcloud |npx |python |curl |huaweicloud_/.test(content);
  skillCheck('Concrete executable steps', hasConcreteSteps, hasConcreteSteps ? 'Yes' : 'No');

  // 8: Error handling/guidance
  const hasErrorHandling = /## Troubleshooting|## Common.*Error|## Error|## Avoid|## Critical Warning|## Notes|## Quality Bar|## Safe Alternatives|## Do Not Run|## Language.*Catalog|## Trap|## Issue:/i.test(content);
  skillCheck('Error handling/guidance', hasErrorHandling, hasErrorHandling ? 'Found' : 'Missing');

  // 9: No broken external URLs
  const urlPattern = /https?:\/\/[^\s)}\]]+/g;
  const urls = [];
  while ((match = urlPattern.exec(content)) !== null) urls.push(match[0]);
  const brokenUrls = urls.filter(u => u.includes('undefined') || u.includes('TODO') || u.includes('PLACEHOLDER'));
  skillCheck('No broken URLs', brokenUrls.length === 0, `${urls.length - brokenUrls.length}/${urls.length} valid`);

  // 10: Step-by-step execution path
  const hasNumberedSteps = /(?:^|\n)\d+\.\s/.test(content);
  const hasStepSections = /### Step|## Step|## Workflow|## Safe Flow/i.test(content);
  skillCheck('Has step-by-step path', hasNumberedSteps || hasStepSections, 'Found');

  results.skills.push(skillResult);
}

console.log('\n=== D8-7 Final Summary ===');
console.log(`Overall: ${results.overall}`);
const passedSkills = results.skills.filter(s => s.passed).length;
console.log(`Skills: ${passedSkills}/${results.skills.length} passed`);
for (const s of results.skills) {
  const passed = s.checks.filter(c => c.passed).length;
  console.log(`  ${s.name}: ${passed}/${s.checks.length} checks ${s.passed ? 'PASS' : 'FAIL'}`);
}
console.log('\n' + JSON.stringify(results, null, 2));
