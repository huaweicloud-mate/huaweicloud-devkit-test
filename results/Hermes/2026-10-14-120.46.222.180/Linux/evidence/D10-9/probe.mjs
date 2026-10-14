// D10-9 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const pluginDir = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src'.replace(/\/src$/, '');
  const hooksConf = JSON.parse(readFileSync(pluginDir + '/hooks/hooks.json', 'utf8'));
  const pretool = hooksConf.hooks && hooksConf.hooks.PreToolUse;
  const safetySkill = existsSync(pluginDir + '/skills/huaweicloud-safety/SKILL.md');
  const toolSrc = readFileSync(HDKS + '/tools.mjs', 'utf8');
  const planApproval = toolSrc.includes('huaweicloud_plan_cli_command') && toolSrc.includes('huaweicloud_run_approved_command');
  t('D10-9', 'safety-intercept-source-present', !!pretool && safetySkill && planApproval, !!(pretool && safetySkill) + '/plan-approval=' + planApproval, true, 'LLM-session safety interception (PreToolUse hook + safety skill + plan→approval flow) present at source');
  __status = 'BLOCKED';
  t('D10-9', 'no-real-agent-harness', true, 'BLOCKED detail', 'BLOCKED: Hermes not DSH; run-agent-eval.mjs drives "dsh --profile headless" (dsh not installed on this host), no CDP/real-LLM session harness → cannot observe Agent auto-routing high-risk intent to plan→approval. Source-level interception rules verified above.', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D10-9', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D10-9', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D10-9', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });
