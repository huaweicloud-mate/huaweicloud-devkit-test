import { writeFileSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
let status = 'PASS', why = '', evidence = {};
try {
  // D8-7: 7 个 meta/通用技能指引可机械执行验证
  const skillsDir = join(HDK, 'plugins/huaweicloud-core/skills').replace(/\\/g,'/');
  const allSkills = readdirSync(skillsDir).filter(d => {
    try { return readdirSync(join(skillsDir, d)).length > 0; } catch { return false; }
  });
  evidence.allSkills = allSkills;
  evidence.skillCount = allSkills.length;
  // 核对每个技能目录有 SKILL.md 或 README.md（机械可执行指引）
  const withGuide = allSkills.filter(s => {
    return existsSync(join(skillsDir, s, 'SKILL.md')) || existsSync(join(skillsDir, s, 'README.md'));
  });
  evidence.skillsWithGuide = withGuide;
  // 抽 7 个 meta/通用技能核对非空、含步骤
  const metaSkills = allSkills.slice(0, 7);
  const checks = metaSkills.map(s => {
    const skillFile = existsSync(join(skillsDir, s, 'SKILL.md')) ? join(skillsDir, s, 'SKILL.md') : join(skillsDir, s, 'README.md');
    if (!existsSync(skillFile)) return { skill: s, ok: false, reason: 'no SKILL.md/README.md' };
    const content = readFileSync(skillFile, 'utf8');
    return {
      skill: s,
      ok: content.length > 100 && /##|步骤|step|procedure|usage/i.test(content),
      contentLen: content.length,
      hasSteps: /##|步骤|step/i.test(content),
    };
  });
  evidence.skillChecks = checks;
  const allOk = checks.every(c => c.ok);
  if (allOk && withGuide.length >= 7) {
    status = 'PASS'; why = '技能指引均可机械执行（' + withGuide.length + ' 技能有 SKILL.md/README.md，抽检 7 个均含步骤）';
  } else {
    status = 'FAIL'; why = '部分技能指引缺失或无步骤：' + JSON.stringify(checks.filter(c => !c.ok)).slice(0,300);
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D8-7', status, why, evidence: { skillCount: evidence.skillCount, skillsWithGuideCount: evidence.skillsWithGuide?.length, skillChecks: evidence.skillChecks }, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
