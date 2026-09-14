// D4-16 命令包裹穿透补充探针：验证 env-dump 规则（词边界 ^|\s）对 shell 包裹的穿透情况
// 用法: node wrap-probe.mjs <huaweicloud-core/src 目录>
import { pathToFileURL } from 'node:url';
const { classifyTextCommand } = await import(pathToFileURL(process.argv[2] + '/safety-policy.mjs').href);
const cases = [
  ['sh-c-env-HWCLOUD', 'sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"'],
  ['sh-c-env-HW', 'sh -c "env | grep HW_ACCESS_KEY"'],
  ['bash-c-printenv', 'bash -c "printenv HUAWEICLOUD_SDK_AK"'],
  ['eval-env', 'eval "env | grep HUAWEICLOUD_ACCESS_KEY"'],
  ['sh-c-secret', 'sh -c "hcloud csms ShowSecretVersion --secret-name x"'],
  ['sh-c-cred-file', 'sh -c "cat ~/.config/huaweicloud/credentials.json"'],
  ['sh-c-delete', 'sh -c "hcloud ecs DeleteServer --force"'],
  ['ctrl-env-naked', 'env | grep HUAWEICLOUD_ACCESS_KEY'],
  ['ctrl-secret-naked', 'hcloud csms ShowSecretVersion --secret-name x'],
];
for (const [tag, cmd] of cases) {
  const r = classifyTextCommand(cmd);
  console.log(`[${tag}] $ ${cmd}`);
  console.log(`   decision=${r.decision} risk=${r.risk} reason=${r.reason}`);
}
console.log('=== DONE ===');