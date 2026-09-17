import { callTool } from './plugins/huaweicloud-core/src/tools.mjs';

const results = [];
const skillNames = ['huaweicloud-getting-started', 'huaweicloud-core', 'huaweicloud-safety', 'huaweicloud-cli-and-auth', 'huaweicloud-capability-discovery', 'huaweicloud-api-and-sdk', 'huaweicloud-troubleshooting'];
for (const skill of skillNames) {
  try {
    const r = await callTool('huaweicloud_retrieve_skill', { name: skill });
    const contentStr = JSON.stringify(r);
    const hasContent = contentStr.length > 100;
    results.push({ skill, hasContent, contentLen: contentStr.length, ok: r?.ok !== false, preview: contentStr.substring(0, 150) });
  } catch(e) {
    results.push({ skill, error: e.message });
  }
}
console.log(JSON.stringify(results, null, 2));
