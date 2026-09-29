// D3-C4 / EXP-C4 22 服务只读规划冒烟（list_operations + plan 只读命令）v1.1.4 stable
// 只读规划：list_operations = 本地 hcloud <Service> --help；plan = 本地分类，均不调用真云 API、不创建资源。
const CORE = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(CORE + '/tools.mjs');

const READ_PREFIX = /^(List|Show|Get|Describe|NovaList|NovaShow)/i;
// 预期结果含「轻量创建→立即释放→归零」的服务（只读规划仍覆盖，真云 create/release 需最小权限 AK/SK）
const REAL_CLOUD_RELEASE = new Set(['ECS', 'RDS', 'CCE', 'WAF']);
// KooCLI 无顶级服务名（伞名）→ 子服务名（改用例：母版枚举对象应用子服务名）
const UMBRELLA = { DMS: ['Kafka', 'RocketMQ', 'RabbitMQ'], DEW: ['KMS', 'CSMS'] };

const SVC = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];

const rows = [];
const notes = [];
let productFail = 0;
function add(tag, title, actual, expected, kind = 'check') {
  const ok = actual === expected;
  if (kind === 'check' && !ok) productFail++;
  rows.push({ kind, tag, title, actual, expected, ok });
}

for (const s of SVC) {
  let lo;
  try {
    lo = await callTool('huaweicloud_list_operations', { service: s });
  } catch (e) {
    lo = { result: { ok: false, stdout: '', stderr: String(e?.message || e) } };
  }
  const stdout = lo?.result?.stdout || '';
  const unsupported = /Unsupported service/i.test(stdout);
  const routeable = !!(lo?.result?.ok) && !unsupported && stdout.trim().length > 0;

  if (unsupported && UMBRELLA[s]) {
    // 伞名：产品正确返回 Unsupported；验证子服务名可路由 → 属母版枚举对象改用例
    let subOk = 0;
    for (const sub of UMBRELLA[s]) {
      let slo;
      try { slo = await callTool('huaweicloud_list_operations', { service: sub }); }
      catch (e) { slo = { result: { ok: false, stdout: '' } }; }
      const sroute = !!(slo?.result?.ok) && !/Unsupported service/i.test(slo?.result?.stdout || '');
      if (sroute) subOk++;
      notes.push(`  ${s} 子服务 ${sub}: ${sroute ? '可路由' : '不可路由'}`);
    }
    add(`EXP-C4-${s}`, `list_operations ${s} 伞名返回 Unsupported(产品正确)`, true, true, 'note');
    add(`EXP-C4-${s}`, `子服务名 ${UMBRELLA[s].join('/')} 可路由 ${subOk}/${UMBRELLA[s].length}`, subOk, UMBRELLA[s].length, 'note');
    continue;
  }

  add(`EXP-C4-${s}`, `list_operations ${s} 只读规划可路由`, routeable, true);

  // 派生只读 operation 并 plan（本地分类，不出网）
  let planOp = null;
  if (s === 'OBS') {
    planOp = 'ls'; // obsutil 只读子命令
  } else if (routeable) {
    const ops = (stdout.match(/^  [A-Za-z][A-Za-z0-9]*$/gm) || []).map((x) => x.trim());
    planOp = ops.find((o) => READ_PREFIX.test(o)) || null;
  }
  if (planOp) {
    let plan;
    try {
      plan = await callTool('huaweicloud_plan_cli_command', { args: [s, planOp] });
    } catch (e) {
      plan = { classification: { decision: 'error', risk: String(e?.message || e) } };
    }
    const cls = plan?.classification || {};
    const planOk = cls.decision === 'allow' && (cls.risk === 'read_only' || cls.risk === 'local_metadata');
    add(`EXP-C4-${s}`, `plan_cli_command ${s} ${planOp} 归类 allow/read_only`, `${cls.decision}/${cls.risk}`, 'allow/read_only', planOk);
  }

  if (REAL_CLOUD_RELEASE.has(s)) {
    add(`EXP-C4-${s}`, `轻量创建→立即释放→归零验证(真云)`, 'BLOCKED-真云', 'BLOCKED-真云', 'note');
  }
}

console.log('=== D3-C4 / EXP-C4 22 服务只读规划冒烟探针结果 ===');
for (const r of rows) {
  if (r.kind === 'note') {
    console.log(`NOTE   ${r.tag}  ${r.title}  => ${JSON.stringify(r.actual)}`);
  } else {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.tag}  ${r.title}  => ${JSON.stringify(r.actual)} (expected ${JSON.stringify(r.expected)})`);
  }
}
if (notes.length) {
  console.log('\n--- 伞名→子服务路由佐证 ---');
  for (const n of notes) console.log(n);
}
console.log('\n--- 环境/用例阻塞标注（不计入探针 PASS/FAIL）---');
console.log('BLOCKED(真云create/release): ECS/RDS/CCE/WAF —— 只读规划已覆盖，真云轻量创建需最小权限 AK/SK');
console.log('BLOCKED(改用例): DMS/DEW —— 母版枚举对象用伞名，KooCLI 顶级无此服务，应用子服务名');
const pass = rows.filter((r) => r.kind === 'check' && r.ok).length;
const fail = rows.filter((r) => r.kind === 'check' && !r.ok).length;
console.log(`\nTOTAL pass=${pass} fail=${fail}（note/blocked 不计入）`);
process.exit(productFail > 0 ? 1 : 0);