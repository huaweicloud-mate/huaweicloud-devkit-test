// D3-A1: skill检索完整性 - verify all skill directories have valid SKILL.md files
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const skillsRoot = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/skills';

const expectedSkills = [
  'huawei-ecs', 'huawei-obs', 'huawei-vpc', 'huawei-rds', 'huawei-iam',
  'huawei-cce', 'huawei-dew', 'huawei-cbr', 'huawei-voucher', 'huawei-sandbox',
  'huawei-apig', 'huawei-billing', 'huawei-cloud-eye', 'huawei-cts',
  'huawei-dds-dcs', 'huawei-deployment', 'huawei-functiongraph', 'huawei-gaussdb',
  'huawei-getting-started', 'huawei-iac', 'huawei-modelarts', 'huawei-smn-dms',
  'huawei-waf-aad', 'huaweicloud-api-and-sdk', 'huaweicloud-capability-discovery',
  'huaweicloud-cli-and-auth', 'huaweicloud-core', 'huaweicloud-safety',
  'huaweicloud-troubleshooting',
];

const results = [];
let allPass = true;

for (const skillName of expectedSkills) {
  const skillDir = join(skillsRoot, skillName);
  const skillMdPath = join(skillDir, 'SKILL.md');
  const dirExists = existsSync(skillDir);
  const mdExists = dirExists && existsSync(skillMdPath);
  let mdSize = 0;
  let hasFrontmatter = false;
  let hasNameField = false;
  let hasDescriptionField = false;
  let hasContent = false;
  
  if (mdExists) {
    const content = readFileSync(skillMdPath, 'utf8');
    mdSize = content.length;
    // YAML front matter: ---\nname: ...\ndescription: ...
    hasFrontmatter = /^---/.test(content);
    hasNameField = /^name:\s*\S+/m.test(content);
    hasDescriptionField = /^description:\s*\S+/m.test(content);
    hasContent = mdSize > 100;
  }
  
  const pass = dirExists && mdExists && hasFrontmatter && hasNameField && hasDescriptionField && hasContent;
  if (!pass) allPass = false;
  results.push({
    skill: skillName,
    dirExists,
    mdExists,
    mdSize,
    hasFrontmatter,
    hasNameField,
    hasDescriptionField,
    hasContent,
    pass,
  });
}

const actualDirs = readdirSync(skillsRoot, { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(skillsRoot, d.name, 'SKILL.md')))
  .map(d => d.name);
const unexpected = actualDirs.filter(d => !expectedSkills.includes(d));
const missing = expectedSkills.filter(d => !actualDirs.includes(d));

if (missing.length > 0) {
  allPass = false;
}

const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D3-A1',
  why: allPass
    ? `All ${expectedSkills.length} expected skills found with valid SKILL.md (YAML frontmatter with name+description, content >100 bytes). ${actualDirs.length} total skill dirs.`
    : `Issues: missing=${missing.length}, unexpected=${unexpected.length}. See details.`,
  executedAt: '20260930103000',
  totalSkillsFound: actualDirs.length,
  expectedCount: expectedSkills.length,
  unexpectedDirs: unexpected,
  missingSkills: missing,
  details: results,
};

console.log(JSON.stringify(output, null, 2));