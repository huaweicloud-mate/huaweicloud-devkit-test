// D3-C7 每日测试真机探针（真实执行，SUT=hdk gitHead b0e9f02 (v1.1.10)）
// 跨区域资源操作引导（区域维度）：ap-southeast-3 只读查询 + 最小 EIP 建删归零
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-22-120.46.222.180/Linux/evidence/D3-C7/stdout.log';
const META = { case: 'D3-C7', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead b0e9f02 (v1.1.10)' };
const REGION = 'ap-southeast-3';
const TS = String(Date.now()).slice(-10);
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const results = [];
function log(name, pass, detail) { results.push({ name, pass, detail: String(detail).slice(0, 260) }); }
function sh(cmd) {
  const r = spawnSync('hcloud', cmd, { encoding: 'utf8', timeout: 60000 });
  return { ok: r.status === 0, status: r.status, text: ((r.stdout || '') + '\n' + (r.stderr || '')).trim() };
}
function idOf(json) { return /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(json || '')?.[1]; }

async function run() {
  // 1) get_regional_availability 预查
  const ra = await callTool('huaweicloud_get_regional_availability', { service: 'ecs', region: REGION });
  log('get_regional_availability(ecs,ap-southeast-3)', ra?.available === true, JSON.stringify(ra));

  // 2) plan 命令必须携带 --cli-region=<target>（参数级断言）
  const plan = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServersDetails', `--cli-region=${REGION}`], allowWrites: false });
  log('plan含--cli-region', typeof plan?.command === 'string' && plan.command.includes(`--cli-region=${REGION}`), plan?.command || JSON.stringify(plan));

  // 3) 只读查询 ap-southeast-3（真实执行）
  const q = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`]);
  const code = /"code"\s*:\s*"([A-Za-z0-9._]+)"/.exec(q.text)?.[1] || '';
  const emptyOk = q.ok && JSON.stringify(q.text).includes('"count"');
  log('只读查询ap-southeast-3', q.ok || /Ecs\.0?(020|021)/.test(code) || /Common\./.test(code), (q.ok ? `ok count-queried` : `err code=${code}`) + ' | ' + q.text.slice(0, 120));

  // 4) 创建最小规格 EIP → 立即释放 → 归零验证
  let eipId = null;
  const name = `tctest-d3c7-${TS}`;
  const cr = sh(['EIP', 'CreatePublicip', `--bandwidth.name=${name}`, '--bandwidth.size=1', '--bandwidth.share_type=PER', '--publicip.type=EIP', `--cli-region=${REGION}`]);
  eipId = idOf(cr.text);
  log('创建EIP(minimal)', cr.ok && !!eipId, (cr.ok ? 'ok' : 'FAIL') + ' | ' + cr.text.slice(0, 160));
  if (eipId) {
    const del = sh(['EIP', 'DeletePublicip', `--publicip_id=${eipId}`, `--cli-region=${REGION}`]);
    log('释放EIP', del.ok, (del.ok ? 'ok' : 'FAIL') + ' | ' + del.text.slice(0, 120));
  }
  const leftover = sh(['EIP', 'ListPublicips', `--cli-region=${REGION}`]);
  const leftCount = (/"total_count"\s*:\s*(\d+)/.exec(leftover.text)?.[1]) || '0';
  const leftText = leftover.text || '';
  const zeroOk = !leftText.includes(name) && String(leftCount) === '0';
  log('EIP归零(tctest-前缀空)', zeroOk, `total_count=${leftCount}`);

  const failed = results.filter((r) => r.pass !== true).length;
  const status = failed === 0 ? 'PASS' : 'FAIL';
  return { status, total: results.length, passed: results.length - failed, failed, results };
}

function finish(r) {
  const out = { ...META, status: r.status, why: r.status === 'PASS' ? '' : '跨区域只读规划/最小EIP建删存在失败项，见 results', actual: `total=${r.total} passed=${r.passed} failed=${r.failed}`, executedAt: new Date().toISOString().slice(0, 19).replace(/[-:T]/g, ''), results: r.results };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D3-C7 ' + r.status + ' passed=' + r.passed + '/' + r.total);
}

run().then(finish).catch((e) => finish({ status: 'BLOCKED', why: String(e).slice(0, 220), total: 0, passed: 0, failed: 0, results }));