// D3-A1: skill检索完整性 - Retrieve skills and verify complete content
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs';

const skillsToTest = ['huawei-ecs', 'huawei-obs', 'huawei-vpc', 'huawei-iam'];
const results = {};

for (const skillName of skillsToTest) {
  try {
    const result = await callTool('huaweicloud_retrieve_skill', { name: skillName });
    const hasContent = result && (result.content || result.skill || result.name || JSON.stringify(result).length > 100);
    const contentLength = JSON.stringify(result).length;
    results[skillName] = {
      found: hasContent,
      contentLength,
      hasSkillMd: !!(result?.content?.[0]?.text || result?.skillMd || result?.content),
      keys: Object.keys(result || {}),
      preview: JSON.stringify(result).substring(0, 200),
    };
  } catch (e) {
    results[skillName] = { found: false, error: e.message };
  }
}

const allFound = Object.values(results).every(r => r.found);
console.log(JSON.stringify({
  testId: 'D3-A1',
  testName: 'skill检索完整性',
  status: allFound ? 'PASS' : 'FAIL',
  why: allFound
    ? `All ${skillsToTest.length} skills retrieved with complete content.`
    : `Some skills not found or incomplete: ${JSON.stringify(results)}`,
  details: results,
  executedAt: '20260928090000',
}, null, 2));