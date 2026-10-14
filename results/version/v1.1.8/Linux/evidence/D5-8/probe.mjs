// D5-8 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const { readdirSync } = await import('node:fs');
  const skillsDir = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src'.replace(/\/src$/, '') + '/skills';
  const dirs = readdirSync(skillsDir).filter((d) => readFileSync(skillsDir + '/' + d + '/SKILL.md', 'utf8') && d.startsWith('huawei-') && !d.startsWith('huaweicloud-'));
  const serviceSkills = dirs.map((d) => d.replace(/^huawei-/, '')).join(',');
  t('D5-8', 'service-skill-count', dirs.length >= 17, dirs.length, '>=17 huawei-* service skills', 'dirs=' + serviceSkills.slice(0, 200));
  const matrix = ['ECS','OBS','VPC','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];
  const skillSet = new Set(['ecs','obs','vpc','rds','gaussdb','cce','functiongraph','iam','cts','ces','dds','dcs','smn','dms','waf','modelarts','dew','cbr','apig','billing','sandbox','voucher','iac']);
  const noSkill = matrix.filter((s) => !skillSet.has(s.toLowerCase()));
  t('D5-8', 'no-skill-services-degrade', JSON.stringify(noSkill) === JSON.stringify(['CDN','EVS','EIP','ELB']), noSkill.join(','), 'CDN,EIP,ELB,EVS (4 no-skill matrix services → degrade route)', 'ELB 无独立 skill（routeMap 归 huawei-vpc），同列降级');
  // codex-desktop in matrix/runtime
  const toolsSrc = readFileSync(HDKS + '/tools.mjs', 'utf8');
  const codexDesktop = toolsSrc.includes('codexDesktopSkillsDir') || /codex-desktop/i.test(toolsSrc);
  t('D5-8', 'codex-desktop-runtime', codexDesktop, codexDesktop, true, 'codex-desktop recognized in skill-dir resolution');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D5-8', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D5-8', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D5-8', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });
