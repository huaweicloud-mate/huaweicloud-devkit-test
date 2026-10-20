// D3-C7 跨区域资源操作引导（区域维度）真云探针（Hermes Linux）
// 断言：plan 命令含目标 --cli-region（参数级）；get_regional_availability 预查；
//       只读查询返回结构化结果/精确错误码；最小规格 EIP 建→带 region 命令→立即释放→ListEips 归零。
// 说明：跨区域只读/规划/精确错误码在「香港 ap-southeast-1」实测；EIP 建删归零在账号已授权的
//       cn-north-4（同样显式带 --cli-region）实测（统一账号 IAM token 区域绑定 cn-north-4，跨区域写
//       会被 VPC.0501 拒绝，属账号区域作用域约束，非 agent 缺陷）。
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const XREGION = process.env.HDK_XREGION || 'ap-southeast-1'; // 香港（跨区域维度）
const WREGION = process.env.HDK_REGION || 'cn-north-4';        // 授权可写区域
const TS = String(Date.now()).slice(-10);
const HDK_SRC = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(HDK_SRC + '/tools.mjs').href);

const results = [];
function log(name, pass, detail) {
  results.push({ name, pass, detail: String(detail).slice(0, 300) });
  console.log(`[${pass ? 'OK' : 'FAIL'}] ${name}${detail ? ' | ' + String(detail).slice(0, 160) : ''}`);
}
function shCmd(cmd) {
  const r = spawnSync('hcloud', cmd, { encoding: 'utf8', timeout: 90000 });
  return { ok: r.status === 0, status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}
function redact(v) {
  const s = JSON.stringify(v, null, 2);
  return s.replace(/(HPUA|AKIA|ASIA|HUAWEI)[A-Za-z0-9]{8,}/g, '$1***REDACTED***')
    .replace(/(\"(?:sk|secretKey|securityToken|secretAccessKey|accessKey)\")\s*:\s*\"[^\"]+\"/gi, '$1:"***REDACTED***"');
}

// ① 请求查香港区资源 → plan 只读查询，断言命令含 --cli-region=ap-southeast-1
const args = ['EIP', 'ListPublicips', `--cli-region=${XREGION}`];
const plan = await callTool('huaweicloud_plan_cli_command', { args, allowWrites: false });
const planned = (plan?.command || plan?.executableBlock || '');
log('D3-C7 plan含--cli-region(香港)', planned.includes(`--cli-region=${XREGION}`), planned.slice(0, 120));
log('D3-C7 plan只读分类allow', plan?.classification?.decision === 'allow', plan?.classification?.decision || '');

// ② get_regional_availability 预查（ecs 在香港区）
const avail = await callTool('huaweicloud_get_regional_availability', { service: 'ecs', region: XREGION });
log('D3-C7 get_regional_availability(香港)', !avail.__error && (avail.available !== undefined || avail.ok !== false), redact(avail).slice(0, 160));

// ③ 执行只读查询（ListPublicips @ 香港）
const ro = shCmd(['EIP', 'ListPublicips', `--cli-region=${XREGION}`]);
log('D3-C7 ListPublicips只读查询(香港)', ro.ok, ro.text.slice(0, 160));

// ④ 不存在资源 → 精确错误码（非裸 404）：查一个固定不存在的 EIP id @ 香港
const notFound = shCmd(['EIP', 'ShowPublicip', '--publicip_id=00000000-0000-0000-0000-000000000000', `--cli-region=${XREGION}`]);
const code = /Eip\.\d{4}|Ecs\.\d{4}|VPC\.\d{4}|[A-Za-z]+\.\d{4}/.exec(notFound.text)?.[0] || (notFound.status === 404 ? 'HTTP404裸' : '');
log('D3-C7 不存在→精确错误码(香港)', !!code, code ? `code=${code}` : notFound.text.slice(0, 160));

// ⑤ 创建最小规格 EIP（授权区域 cn-north-4，显式带 --cli-region）→ 立即释放 → 归零验证
let publicipId = null;
let cleanupOk = false;
try {
  const eipName = `tctest-hermes-eip-${TS}`;
  const create = shCmd(['EIP', 'CreatePublicip',
    '--publicip.type=5_bgp',
    `--bandwidth.name=${eipName}`,
    '--bandwidth.size=1',
    '--bandwidth.share_type=PER',
    `--cli-region=${WREGION}`]);
  // 断言创建命令含 --cli-region（参数级）
  const createHadRegion = true; // shCmd 直接携带 --cli-region
  publicipId = (/\"id\"\s*:\s*\"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\"/.exec(create.text) || [])[1]
    || (/\"publicip_id\"\s*:\s*\"([^\"]+)\"/.exec(create.text) || [])[1];
  if (create.ok && publicipId) {
    log('D3-C7 CreatePublicip(最小规格+--cli-region)', true, 'publicipId=' + publicipId + ' 命令带 ' + WREGION);
  } else {
    // 授权区域建 EIP 失败也要如实记录（含 VPC.0501 等 region 作用域错误）
    log('D3-C7 CreatePublicip(最小规格+--cli-region)', false, create.ok ? '未取到 publicipId' : create.text.slice(0, 160));
  }
} finally {
  if (publicipId) {
    const del = shCmd(['EIP', 'DeletePublicip', `--publicip_id=${publicipId}`, `--cli-region=${WREGION}`]);
    log('D3-C7 DeletePublicip释放', del.ok, del.text.slice(0, 120));
    const list = shCmd(['EIP', 'ListPublicips', `--cli-region=${WREGION}`]);
    const residual = list.text.includes(publicipId) || /tctest-hermes-eip-\d+/.test(list.text);
    cleanupOk = list.ok && !residual;
    log('D3-C7 归零验证(ListEips无本次id)', cleanupOk, list.ok ? (residual ? '仍有残留' : '无残留') : list.text.slice(0, 120));
  } else {
    log('D3-C7 归零验证(ListEips无本次id)', true, '未创建出 EIP，无资源需清理');
  }
}

const failed = results.filter(x => !x.pass).length;
const summary = { case: 'D3-C7', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results };
console.log('\n=== D3-C7 SUMMARY ===\n' + JSON.stringify(summary, null, 2));