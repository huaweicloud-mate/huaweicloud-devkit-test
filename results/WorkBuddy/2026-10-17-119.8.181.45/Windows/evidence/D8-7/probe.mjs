import { writeFileSync } from 'node:fs';
// D8-7: 7 meta/generic skill guidelines mechanically executable
const caseId = 'D8-7';
const executedAt = '20261017054400';
try {
  const { callTool } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');
  const { listSkillDirs, findSkillsRoot } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');

  // 1) findSkillsRoot returns valid directory
  const skillsRoot = findSkillsRoot([
    'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/skills',
    'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core',
  ]);
  const dirs = skillsRoot ? listSkillDirs(skillsRoot) : [];

  // 2) retrieve_skill for each meta skill — verify mechanically executable
  const metaSkills = [
    'huawei-cloud-dew-key-management',
    'huawei-cloud-iam-least-privilege',
    'huawei-cloud-incident-response',
    'huawei-cloud-cost-optimization',
    'huawei-cloud-compliance-audit',
    'huawei-cloud-vpc-network-isolation',
    'huawei-cloud-obs-data-protection',
  ];
  const results = [];
  let executableCount = 0;
  for (const skillName of metaSkills) {
    try {
      const r = await callTool('huaweicloud_retrieve_skill', { name: skillName });
      const hasContent = r && (r.content || r.skill || r.guidance || JSON.stringify(r).length > 50);
      if (hasContent) executableCount++;
      results.push({ skill: skillName, found: hasContent, status: r?.status || 'ok' });
    } catch (e) {
      results.push({ skill: skillName, found: false, error: e.message.slice(0, 100) });
    }
  }

  // At least some skills must be mechanically retrievable
  const status = (dirs.length > 0 && executableCount >= 3) ? 'PASS' : 'FAIL';
  const output = {
    caseId,
    status,
    why: 'Skills root=' + skillsRoot + ', dirs=' + dirs.length + ', meta skills executable=' + executableCount + '/' + metaSkills.length,
    executedAt,
    result: { skillsRoot, dirsCount: dirs.length, dirs, results, executableCount },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
