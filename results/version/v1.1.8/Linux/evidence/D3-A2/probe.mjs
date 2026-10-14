// D3-A2 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const { callTool, TOOL_DEFINITIONS } = await import('file://' + HDKS + '/tools.mjs');
  const cases = [
    ['帮我创建一个云服务器', 'ECS'],
    ['查询我的对象存储桶', 'OBS'],
    ['创建虚拟私有云 VPC', 'VPC'],
    ['部署一个静态网站', 'Sandbox'],
    ['帮我领取代金券', 'Incentive Voucher'],
    ['审计操作日志', 'CTS'],
    ['查询数据库实例状态', 'RDS'],
    ['创建一个 Redis 缓存实例', 'DCS'],
    ['给生产服务器配置备份策略', 'CBR'],
    ['把应用日志推送到云监控', 'CES'],
    ['配置负载均衡', 'ELB'],
    ['密钥管理加密', 'KMS'],
    ['部署一个函数处理图片', 'FunctionGraph'],
    ['开设一个 Kubernetes 集群', 'CCE'],
    ['审计账号用户权限', 'IAM'],
  ];
  let hit = 0;
  const misses = [];
  for (const [intent, expect] of cases) {
    const r = await callTool('huaweicloud_service_catalog', { intent });
    const svcs = Array.isArray(r && r.recommendedServices) ? r.recommendedServices : [];
    const ok = svcs.includes(expect) || (expect === 'Sandbox' && (svcs.includes('Sandbox') || svcs.includes('DevStation')));
    if (ok) hit += 1; else misses.push(intent + '->' + svcs.join('+'));
  }
  t('D3-A2', 'route-hit', hit >= 12, hit + '/' + cases.length, '>=12/15', misses.join('; '));
  const r = await callTool('huaweicloud_service_catalog', { intent: '查一下云主机' });
  t('D3-A2', 'result-structure', Array.isArray(r && r.recommendedSkills) && Array.isArray(r && r.recommendedServices), JSON.stringify((r && r.recommendedServices) || []), 'skills+services arrays', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D3-A2', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D3-A2', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D3-A2', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });
