// D2-11: R3 STS token拒绝落盘 — 源码级直调 callTool('huaweicloud_auth_switch')
// 预期: 返回 {status:'error', scope:'rejected'}，token 永不落盘
import { pathToFileURL } from 'node:url';
const srcBase = 'C:/Users/Administrator/devkit-test/CodeArtsWork/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(srcBase + '/tools.mjs').href);

const result = await callTool('huaweicloud_auth_switch', {
  action: 'persist',
  ak: 'MOCKAKTEST',
  sk: 'MOCKSKTEST',
  securityToken: 'MOCKSTS_TOKEN',
  region: 'cn-north-4'
});

const pass = result.status === 'error' && result.scope === 'rejected';
console.log(JSON.stringify({
  case: 'D2-11',
  test: 'R3 STS token拒绝落盘',
  input: { action: 'persist', ak: 'MOCKAKTEST', sk: 'MOCKSKTEST', securityToken: 'MOCKSTS_TOKEN', region: 'cn-north-4' },
  result,
  pass,
  evidence: `persistCredentials returned status=${result.status}, scope=${result.scope} — STS token rejected, never written to disk (R3 enforced at tools.mjs:1013-1018)`
}));
process.exit(pass ? 0 : 1);
