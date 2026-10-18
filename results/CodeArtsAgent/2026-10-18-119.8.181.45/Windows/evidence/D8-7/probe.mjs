// D8-7: 7 meta/通用技能指引可机械执行验证
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const HDK_ROOT = 'C:/Users/Administrator/devkit-test/hdk';
const SKILLS_DIR = join(HDK_ROOT, 'plugins/huaweicloud-core/skills');

const META_SKILLS = [
  'huaweicloud-core',
  'huaweicloud-safety',
  'huaweicloud-api-and-sdk',
  'huaweicloud-capability-discovery',
  'huaweicloud-cli-and-auth',
  'huaweicloud-troubleshooting',
  'huawei-getting-started'
];

const results = [];

let skillFilesExist = 0;
let skillFilesWithFrontmatter = 0;
let skillFilesWithCommands = 0;
let skillFilesWithoutTodo = 0;

for (const skillName of META_SKILLS) {
  const skillPath = join(SKILLS_DIR, skillName, 'SKILL.md');
  
  if (existsSync(skillPath)) {
    skillFilesExist++;
    
    try {
      const fileContent = readFileSync(skillPath, 'utf8');
      
      const hasFrontmatter = fileContent.startsWith('---') && fileContent.includes('name:');
      const hasDescription = fileContent.includes('description:');
      
      if (hasFrontmatter && hasDescription) {
        skillFilesWithFrontmatter++;
      }
      
      const hasCommands = /hclouds+|npms+|npxs+|nodes+|python|pips+|scripts?/|.mjs|.py|.sh|huaweicloud_/i.test(fileContent);|npms+|npxs+|nodes+|python|pips+|scripts?/|.mjs|.py|.sh|huaweicloud_/i.test(fileContent);
      
      if (hasCommands) {
        skillFilesWithCommands++;
      }
      
      const hasTodo = /<TODO>|TBD|待补充|PLACEHOLDER|not implemented/i.test(fileContent);
      
      if (!hasTodo) {
        skillFilesWithoutTodo++;
      }
      
      results.push({
        test: '技能 ' + skillName + ' 验证',
        passed: hasFrontmatter && hasCommands && !hasTodo,
        skillName: skillName,
        checks: { hasFrontmatter, hasDescription, hasCommands, hasTodo, contentLength: fileContent.length }
      });
    } catch (e) {
      results.push({ test: '技能 ' + skillName + ' 读取', passed: false, skillName, error: e.message });
    }
  } else {
    results.push({ test: '技能 ' + skillName + ' 存在', passed: false, skillName, error: 'SKILL.md not found' });
  }
}

results.push({
  test: '所有 meta 技能文件存在',
  passed: skillFilesExist === META_SKILLS.length,
  expected: META_SKILLS.length,
  actual: skillFilesExist
});

results.push({
  test: '所有 meta 技能含完整 frontmatter',
  passed: skillFilesWithFrontmatter === META_SKILLS.length,
  expected: META_SKILLS.length,
  actual: skillFilesWithFrontmatter
});

results.push({
  test: '所有 meta 技能含可执行命令',
  passed: skillFilesWithCommands === META_SKILLS.length,
  expected: META_SKILLS.length,
  actual: skillFilesWithCommands
});

results.push({
  test: '所有 meta 技能无占位符/断链',
  passed: skillFilesWithoutTodo === META_SKILLS.length,
  expected: META_SKILLS.length,
  actual: skillFilesWithoutTodo
});

for (const skillName of META_SKILLS) {
  const skillPath = join(SKILLS_DIR, skillName, 'SKILL.md');
  
  if (existsSync(skillPath)) {
    try {
      const fileContent = readFileSync(skillPath, 'utf8');
      
      const hasSections = /##s+/.test(fileContent);
      const hasCodeBlocks = /```/.test(fileContent);
      const hasExamples = /example|示例|示例：/i.test(fileContent);
      
      results.push({
        test: '技能 ' + skillName + ' 结构清晰',
        passed: hasSections && hasCodeBlocks,
        skillName,
        checks: { hasSections, hasCodeBlocks, hasExamples, lineCount: fileContent.split('
').length }
      });
    } catch (e) {
      results.push({ test: '技能 ' + skillName + ' 结构验证', passed: false, error: e.message });
    }
  }
}

const allPassed = results.every(r => r.passed);
console.log(JSON.stringify({
  status: allPassed ? 'PASS' : 'FAIL',
  caseId: 'D8-7',
  title: '7 meta/通用技能指引可机械执行验证',
  timestamp: new Date().toISOString(),
  summary: { totalTests: results.length, passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length },
  results
}, null, 2));
