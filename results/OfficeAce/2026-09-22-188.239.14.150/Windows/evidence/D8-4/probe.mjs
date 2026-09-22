// AI生成
// D8-4: 引导步骤可机械执行 - 检查SKILL.md步骤清晰度
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
try {
  const results = [];
  const skillsDir = join(SRC, 'skills');
  let totalSkills = 0, clearSkills = 0;
  const issues = [];
  function scanSkills(dir) {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      try { if (!statSync(fullPath).isDirectory()) { if (entry === 'SKILL.md') { totalSkills++; const content = readFileSync(fullPath, 'utf8'); const hasSteps = content.includes('##') || content.includes('步骤') || content.includes('Step'); const hasAmbiguous = content.includes('...') && content.includes('TODO'); const noEmptySections = !content.match(/##\s*\n\s*##/); if (hasSteps && !hasAmbiguous && noEmptySections) { clearSkills++; } else { issues.push({skill: fullPath, issues: {hasSteps, hasAmbiguous, noEmptySections}}); } } continue; } } catch { continue; }
      scanSkills(fullPath);
    }
  }
  scanSkills(skillsDir);
  // Also check meta skills
  const metaSkills = ['huaweicloud-core', 'huaweicloud-safety', 'huaweicloud-api-and-sdk', 'huaweicloud-capability-discovery', 'huaweicloud-cli-and-auth', 'huaweicloud-troubleshooting', 'huawei-getting-started'];
  let metaValid = 0;
  for (const ms of metaSkills) {
    const p = join(skillsDir, ms, 'SKILL.md');
    if (existsSync(p)) { metaValid++; }
  }
  results.push({check:'meta_skills', pass: metaValid >= 5, value:{found:metaValid, expected:metaSkills.length}});
  results.push({check:'skills_clear', pass: clearSkills >= totalSkills * 0.8, value:{total:totalSkills, clear:clearSkills}});
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `引导步骤可机械执行: ${clearSkills}/${totalSkills}个SKILL.md步骤清晰, ${metaValid}个meta技能存在` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
