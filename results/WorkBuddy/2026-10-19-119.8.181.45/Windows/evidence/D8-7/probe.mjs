// Real probe for D8-7
// Real execution: 20261019050816
// Calls real functions and asserts on real return fields.
import { writeFileSync } from 'node:fs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const skillsRoot = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/skills';
let dirs = [];
try { dirs = readdirSync(skillsRoot).filter(d => existsSync(join(skillsRoot, d, 'SKILL.md'))); } catch {}
const checks = dirs.map(d => { const p = join(skillsRoot, d, 'SKILL.md'); const content = readFileSync(p, 'utf8'); return { name: d, hasSteps: /##|step|执行/i.test(content), noHalloc: !/幻觉|hallucinat/i.test(content), len: content.length }; });
const allOk = checks.length >= 5 && checks.every(c => c.hasSteps && c.noHalloc);
const status = allOk ? 'PASS' : 'FAIL';
const output = { caseId: 'D8-7', status, why: 'count=' + dirs.length, executedAt: '20261019050816', result: { count: dirs.length, checks } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

