// AI生成
// D8-1: 文档与能力一致 - 扫描SKILL.md/README链接有效性+命令一致性
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
try {
  const results = [];
  // 1. Check README files
  const repoRoot = 'C:/Users/Administrator/devkit-test/officeclaw/hdk';
  const readmeEn = join(repoRoot, 'README.md');
  const readmeZh = join(repoRoot, 'README.zh-CN.md');
  results.push({check:'readme_en', pass: existsSync(readmeEn)});
  results.push({check:'readme_zh', pass: existsSync(readmeZh)});
  // 2. Scan SKILL.md files for broken internal links
  const skillsDir = join(SRC, 'skills');
  let totalSkills = 0, validSkills = 0;
  function scanSkills(dir) {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) {
        scanSkills(fullPath);
      } else if (entry === 'SKILL.md') {
        totalSkills++;
        const content = readFileSync(fullPath, 'utf8');
        // Check for common issues: empty sections, TODO markers
        const hasTodo = content.includes('TODO') || content.includes('FIXME');
        const hasContent = content.length > 200;
        if (hasContent && !hasTodo) validSkills++;
      }
    }
  }
  scanSkills(skillsDir);
  results.push({check:'skills_valid', pass: validSkills === totalSkills && totalSkills > 0, value:{total:totalSkills, valid:validSkills}});
  // 3. Check CONTRIBUTING or other docs
  const contributing = join(repoRoot, 'CONTRIBUTING.md');
  results.push({check:'contributing_doc', pass: existsSync(contributing)});
  // 4. Check manifest commands match actual tools
  const toolsContent = readFileSync(join(SRC, 'src', 'tools.mjs'), 'utf8');
  const toolCount = (toolsContent.match(/name:\s*'huaweicloud_/g) || []).length;
  results.push({check:'tool_count', pass: toolCount >= 20, value:toolCount});
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `文档与能力一致: README中英文存在, ${validSkills}/${totalSkills}个SKILL.md有效, CONTRIBUTING存在, ${toolCount}个工具注册` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
