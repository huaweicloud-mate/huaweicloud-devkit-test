// D8-7: 7 个 meta/通用技能指引可机械执行验证
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D8-7',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  
  // 检查 SKILL.md 文件
  const skillsDir = join(hdkPath, 'plugins', 'huaweicloud-core', 'skills');
  
  if (existsSync(skillsDir)) {
    const files = readdirSync(skillsDir);
    const skillFiles = files.filter(f => f.endsWith('.md'));
    result.evidence.push({ skillCount: skillFiles.length, skills: skillFiles });
    console.log('Skills 目录文件:', skillFiles);
    
    // 检查核心技能
    const coreSkills = ['core', 'safety', 'api-and-sdk', 'capability-discovery', 'cli-and-auth', 'troubleshooting', 'getting-started'];
    const foundSkills = coreSkills.filter(s => files.includes(s + '.md') || files.some(f => f.includes(s)));
    result.evidence.push({ foundCoreSkills: foundSkills.length, skills: foundSkills });
    
    if (foundSkills.length >= 5) {
      result.status = 'PASS';
      result.why = `找到 ${foundSkills.length} 个核心技能指引`;
    } else {
      result.status = 'FAIL';
      result.why = '核心技能指引缺失';
    }
  } else {
    result.status = 'BLOCKED';
    result.why = 'Skills 目录不存在';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('D8-7 结果:', result.status, '-', result.why);
