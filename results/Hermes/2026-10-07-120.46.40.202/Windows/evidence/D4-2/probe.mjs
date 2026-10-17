import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
const tests = ["printenv HW_ACCESS_KEY","printenv HW_SECRET_KEY","echo $HW_ACCESS_KEY","echo $HW_SECRET_KEY","echo ${HW_SECRET_KEY}"];
for (const cmd of tests) { const r = classifyTextCommand(cmd); console.log(cmd, '->', r.decision, r.risk); }