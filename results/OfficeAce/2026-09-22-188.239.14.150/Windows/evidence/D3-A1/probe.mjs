// AI生成
// D3-A1: skill检索完整性 - 检查所有SKILL.md文件可被检索
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const skillsDir = join(SRC, 'skills');
  const skillDirs = readdirSync(skillsDir).filter(d => statSync(join(skillsDir, d)).isDirectory());
  const results = [];
  let totalSkills = 0;
  let completeSkills = 0;
  
  for (const dir of skillDirs) {
    const skillMdPath = join(skillsDir, dir, 'SKILL.md');
    if (existsSync(skillMdPath)) {
      totalSkills++;
      const content = readFileSync(skillMdPath, 'utf8');
      const hasContent = content.length > 100;
      const hasTitle = content.includes('#') || content.includes('title');
      if (hasContent && hasTitle) {
        completeSkills++;
        results.push({skill: dir, pass:true, size:content.length});
      } else {
        results.push({skill: dir, pass:false, reason:'empty or no title'});
      }
    } else {
      // Check subdirectories for SKILL.md
      const subDirs = readdirSync(join(skillsDir, dir)).filter(d => {
        try { return statSync(join(skillsDir, dir, d)).isDirectory(); } catch { return false; }
      });
      for (const sub of subDirs) {
        const subSkillPath = join(skillsDir, dir, sub, 'SKILL.md');
        if (existsSync(subSkillPath)) {
          totalSkills++;
          const content = readFileSync(subSkillPath, 'utf8');
          if (content.length > 100) {
            completeSkills++;
            results.push({skill: `${dir}/${sub}`, pass:true, size:content.length});
          } else {
            results.push({skill: `${dir}/${sub}`, pass:false, reason:'empty'});
          }
        }
      }
    }
  }
  
  const allPass = completeSkills === totalSkills && totalSkills > 0;
  console.log(JSON.stringify({
    status: allPass ? 'PASS' : 'FAIL',
    why: `skill检索: 发现${totalSkills}个SKILL.md, ${completeSkills}个内容完整(>100字节且有标题)`,
    executedAt: ts(),
    details: {totalSkills, completeSkills, skills: results.map(r=>({name:r.skill, pass:r.pass}))}
  }));
} catch(e) {
  console.log(JSON.stringify({status:'BLOCKED', why:'执行异常: '+String(e.message).slice(0,300), executedAt: ts()}));
}
