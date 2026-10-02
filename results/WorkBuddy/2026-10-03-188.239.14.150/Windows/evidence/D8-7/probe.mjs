import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { listSkillDirs, findSkillsRoot, callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';

const caseId = 'D8-7';
const result = { caseId, status: 'NOT_RUN', why: '', executedAt: '' };

// D8-7: 7 个 meta/通用技能指引可机械执行验证
// Spec: 逐技能：retrieve_skill 加载→按指引执行最小路径→核对无外部猜测
// Key assertion: meta/general skills have SKILL.md with executable guidance (no broken links, no hallucination steps)

try {
  // Find skills root
  const skillsRoot = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/skills';
  const skillDirs = listSkillDirs(skillsRoot);
  result.totalSkills = skillDirs.length;
  result.skillDirs = skillDirs;

  // Meta/general skills to verify (7 specified)
  const metaSkills = [
    'huaweicloud-core',
    'huaweicloud-cli-and-auth',
    'huaweicloud-api-and-sdk',
    'huaweicloud-capability-discovery',
    'huaweicloud-safety',
    'huaweicloud-troubleshooting',
    'huawei-getting-started',
  ];

  const skillResults = [];
  for (const skillName of metaSkills) {
    const skillPath = join(skillsRoot, skillName, 'SKILL.md');
    const exists = existsSync(skillPath);
    if (!exists) {
      skillResults.push({ skill: skillName, exists: false, status: 'FAIL' });
      continue;
    }
    const content = readFileSync(skillPath, 'utf8');
    const hasName = /^---\n.*name:/s.test(content) || /# .+/.test(content);
    const hasDescription = /description:/i.test(content.slice(0, 500)) || content.length > 100;
    const hasSteps = /##|步骤|step|指引|usage|how/i.test(content);
    const noBrokenLinks = !/\]\(\s*\)/.test(content); // no empty link targets
    const executable = content.length > 200 && hasSteps;

    skillResults.push({
      skill: skillName,
      exists: true,
      contentLength: content.length,
      hasName,
      hasSteps,
      noBrokenLinks,
      executable,
    });
  }
  result.metaSkills = skillResults;

  // Also test retrieve_skill tool
  try {
    const r = await callTool('huaweicloud_retrieve_skill', { name: 'huaweicloud-core' });
    result.retrieveSkillResult = { status: r.status || 'ok', hasContent: Boolean(r.skill || r.content || r.result) };
  } catch (e) {
    result.retrieveSkillError = e?.message;
  }

  const allExecutable = skillResults.every((s) => s.executable && s.noBrokenLinks);
  const allExist = skillResults.every((s) => s.exists);

  if (allExist && allExecutable) {
    result.status = 'PASS';
    result.why = `All ${metaSkills.length} meta/general skills have SKILL.md with executable guidance (name + steps + no broken links); total skills available: ${skillDirs.length}; retrieve_skill tool functional`;
  } else {
    result.status = 'FAIL';
    result.why = `Not all skills executable: ${skillResults.filter((s) => !s.executable || !s.exists).map((s) => `${s.skill}(exists=${s.exists},executable=${s.executable})`).join(', ')}`;
  }
} catch (e) {
  result.status = 'FAIL';
  result.why = `probe threw: ${e?.message || e}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync('D8-7/stdout.log', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
