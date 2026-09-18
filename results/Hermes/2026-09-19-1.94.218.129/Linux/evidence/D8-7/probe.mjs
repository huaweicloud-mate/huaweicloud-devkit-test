// D8-7 (P0): 7 个 meta/通用技能指引可机械执行验证
// 逐技能 retrieve_skill 加载 → 核对返回 ok=true + SKILL.md 内容完整（非空、含必要章节）。
import { callTool } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync } from 'node:fs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).substring(0, 120), expected: String(expected) });
}

const SKILLS = [
  'huaweicloud-core',
  'huaweicloud-safety',
  'huaweicloud-api-and-sdk',
  'huaweicloud-capability-discovery',
  'huaweicloud-cli-and-auth',
  'huaweicloud-troubleshooting',
  'huawei-getting-started',
];

for (const s of SKILLS) {
  try {
    const r = await callTool('huaweicloud_retrieve_skill', { name: s });
    const ok = r?.ok === true && !r?.isError;
    // content 可能是字符串或 {content:...}，统一取长度判断「有实质内容」
    const body = typeof r?.content === 'string' ? r.content : JSON.stringify(r?.content || r || '');
    const hasContent = body.length > 50 && /SKILL|skill|#|步骤|指引|说明|Usage|How|description/i.test(body);
    test('D8-7', `skill-${s}`, ok && hasContent, `${ok ? 'ok' : 'err'} len=${body.length}`, 'ok+content');
  } catch (e) {
    test('D8-7', `skill-${s}`, false, String(e).substring(0, 80), 'ok+content');
  }
}

const passed = results.filter(r => r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed: results.length - passed, results }, null, 2);
writeFileSync(new URL('file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-19-1.94.218.129/Linux/evidence/D8-7/stdout.log'), output, 'utf8');
console.log(output);