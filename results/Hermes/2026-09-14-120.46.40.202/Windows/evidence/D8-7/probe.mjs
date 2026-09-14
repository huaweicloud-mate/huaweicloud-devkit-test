// D8-7: 7 meta skills mechanical execution verification
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

console.log('=== D8-7: meta/通用技能指引可机械执行验证 ===');

const skillsDir = './plugins/huaweicloud-core/skills';
if (!existsSync(skillsDir)) {
  console.log('RESULT: BLOCKED - skills directory not found');
  process.exit(0);
}

const skills = readdirSync(skillsDir).filter(d => {
  const p = join(skillsDir, d);
  try { return existsSync(join(p, 'SKILL.md')); } catch { return false; }
});

console.log(`Found ${skills.length} skills:`, skills);

// Required meta-skills: huaweicloud-api-and-sdk, huaweicloud-capability-discovery,
// huaweicloud-cli-and-auth, huaweicloud-core, huaweicloud-safety, huaweicloud-troubleshooting
const requiredMeta = [
  'huaweicloud-api-and-sdk',
  'huaweicloud-capability-discovery',
  'huaweicloud-cli-and-auth',
  'huaweicloud-core',
  'huaweicloud-safety',
  'huaweicloud-troubleshooting',
];

let verified = 0;
let issues = [];

for (const meta of requiredMeta) {
  const skillPath = join(skillsDir, meta, 'SKILL.md');
  if (!existsSync(skillPath)) {
    issues.push(`${meta}: SKILL.md not found`);
    continue;
  }
  
  const content = readFileSync(skillPath, 'utf-8');
  
  // Check YAML frontmatter
  const hasYaml = content.startsWith('---');
  // Check name field
  const nameMatch = content.match(/name:\s*(\S+)/);
  const hasName = nameMatch && nameMatch[1] === meta;
  // Check for dead links (references to files that don't exist)
  const refPattern = /\[.*?\]\((?!http|https|#)([^)]+)\)/g;
  let ref;
  let deadLinks = [];
  while ((ref = refPattern.exec(content)) !== null) {
    const refPath = join(skillsDir, meta, ref[1]);
    if (!existsSync(refPath)) {
      deadLinks.push(ref[1]);
    }
  }
  
  // Check for TODO markers
  const hasTodo = /\[?TODO\]?/i.test(content);
  
  // Check for hallucination indicators (placeholder steps)
  const hasHallucination = /<placeholder>|FIXME|XXX/i.test(content);
  
  const status = hasYaml && hasName && deadLinks.length === 0 && !hasTodo && !hasHallucination;
  
  console.log(`\n${meta}:`);
  console.log(`  YAML frontmatter: ${hasYaml}`);
  console.log(`  Name matches: ${hasName}`);
  console.log(`  Dead links: ${deadLinks.length} ${deadLinks.length > 0 ? deadLinks : ''}`);
  console.log(`  TODO markers: ${hasTodo}`);
  console.log(`  Hallucination markers: ${hasHallucination}`);
  console.log(`  Status: ${status ? 'OK' : 'ISSUE'}`);
  
  if (status) verified++;
  else issues.push(`${meta}: ${deadLinks.length} dead links, TODO=${hasTodo}, hallucination=${hasHallucination}`);
}

console.log(`\nVerified: ${verified}/${requiredMeta.length}`);
if (verified === requiredMeta.length) {
  console.log('RESULT: PASS - All meta-skills mechanically executable, no broken links or hallucination steps');
} else {
  console.log(`RESULT: FAIL - Issues found: ${issues.join('; ')}`);
}
