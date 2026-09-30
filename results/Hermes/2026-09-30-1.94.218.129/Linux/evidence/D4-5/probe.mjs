// D4-5 写操作误判检测（Change* 前缀）
import { classifyHcloudArgs } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
for (const op of ["ChangeServerOsWithoutCloudInit","ChangeVpc","ChangeInstanceConfiguration"]) {
  const r = classifyHcloudArgs(["ECS", op, "--x", "t"]);
  console.log("D4-5", op, "->", r.decision, r.risk, "| isWrite=", r.isWrite);
}
console.log("FAIL(check): Change* 落 unknown_read（writeOperationPrefixes 缺 Change）");
