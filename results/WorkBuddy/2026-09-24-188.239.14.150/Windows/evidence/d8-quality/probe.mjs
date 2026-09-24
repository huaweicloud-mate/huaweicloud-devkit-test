/**
 * WorkBuddy daily test probe - D8-7 meta skill guides mechanically executable
 * Covers: D8-7 7 meta/general skill guides - load + verify no broken links/hallucination steps
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const pkgRoot = 'C:/Users/Administrator/devkit-test/WorkBuddy/hdk';
const skillsRoot = join(pkgRoot, 'plugins', 'huaweicloud-core', 'skills');
const evDir = 'C:/Users/Administrator/devkit-test/WorkBuddy/huaweicloud-devkit-test/results/WorkBuddy/2026-09-24-188.239.14.150/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,120), expected: String(expected).substring(0,120), passMsg, failMsg });
}

// D8-7: 7 meta/general skill guides
const metaSkills = [
  'huaweicloud-core',
  'huaweicloud-api-and-sdk',
  'huaweicloud-capability-discovery',
  'huaweicloud-cli-and-auth',
  'huaweicloud-safety',
  'huaweicloud-troubleshooting',
  'huawei-getting-started',
];

for (const skillName of metaSkills) {
  const skillPath = join(skillsRoot, skillName, 'SKILL.md');
  const exists = existsSync(skillPath);
  test('D8-7', `${skillName}-exists`, exists, exists, true, `${skillName} SKILL.md exists`, `${skillName} SKILL.md missing`);

  if (exists) {
    const content = readFileSync(skillPath, 'utf8');
    // Check has frontmatter (name + description)
    const hasFrontmatter = content.startsWith('---') && content.includes('name:') && content.includes('description:');
    test('D8-7', `${skillName}-frontmatter`, hasFrontmatter, hasFrontmatter, true, `${skillName} has frontmatter`, `${skillName} missing frontmatter`);

    // Check has actionable steps (## sections or numbered steps)
    const hasSections = /(^|\n)##\s/.test(content) || /(^|\n)\d+\.\s/.test(content);
    test('D8-7', `${skillName}-sections`, hasSections, hasSections, true, `${skillName} has actionable sections`, `${skillName} missing sections`);

    // Check no broken internal links (relative paths that don't exist)
    const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
    let m;
    let brokenLinks = 0;
    while ((m = linkPattern.exec(content)) !== null) {
      const link = m[2];
      if (link.startsWith('http') || link.startsWith('#')) continue;
      // Relative link - check if exists
      const resolved = join(dirname(skillPath), link);
      if (!existsSync(resolved)) brokenLinks++;
    }
    test('D8-7', `${skillName}-no-broken-links`, brokenLinks === 0, brokenLinks, 0, `${skillName} no broken links`, `${skillName} has ${brokenLinks} broken links`);

    // Check no placeholder/hallucination markers
    const hasPlaceholders = /\b(TODO|FIXME|XXX|<your-|<insert|<replace)\b/i.test(content);
    test('D8-7', `${skillName}-no-placeholders`, !hasPlaceholders, hasPlaceholders, false, `${skillName} no placeholders`, `${skillName} has placeholders`);
  }
}

// D8-7: retrieve_skill tool exists and can load skills
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/WorkBuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const retrieveTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_retrieve_skill');
test('D8-7', 'retrieve-skill-registered', Boolean(retrieveTool), Boolean(retrieveTool), true, 'retrieve_skill tool registered', 'retrieve_skill not registered');

// Call retrieve_skill to verify it loads
let retrieveOk = false, retrieveResult = null;
try {
  retrieveResult = await callTool('huaweicloud_retrieve_skill', { skill: 'huaweicloud-core' });
  retrieveOk = Boolean(retrieveResult);
} catch (e) { retrieveResult = String(e); }
test('D8-7', 'retrieve-skill-loads', retrieveOk, typeof retrieveResult, 'object', 'retrieve_skill loads skill', 'retrieve_skill failed to load');

// D8-7: search_docs tool exists
const searchTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_search_docs');
test('D8-7', 'search-docs-registered', Boolean(searchTool), Boolean(searchTool), true, 'search_docs tool registered', 'search_docs not registered');

// D8-7: verify skill dirs are discoverable via listSkillDirs
import { listSkillDirs, findSkillsRoot } from 'file:///C:/Users/Administrator/devkit-test/WorkBuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const skillDirs = listSkillDirs(skillsRoot);
test('D8-7', 'skill-dirs-discovered', skillDirs.length >= 7, skillDirs.length, '>=7', `${skillDirs.length} skills discovered`, `only ${skillDirs.length} skills`);

const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(join(evDir, 'd8-quality', 'stdout.log'), output, 'utf8');
console.log(output);
