// D1-39: Windows 升级检测链可用性
import { queryDistTagsSync } from "file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs";

let hasEINVAL = false;
let tagsReturned = false;

try {
  const result = queryDistTagsSync({ timeoutMs: 15000 });
  tagsReturned = result && typeof result === "object";
} catch (e) {
  hasEINVAL = e.message?.includes("EINVAL") || e.code === "EINVAL";
}

const status = !hasEINVAL && tagsReturned ? "PASS" : "FAIL";
const why = `Windows detection: hasEINVAL=${hasEINVAL} tagsReturned=${tagsReturned}`;

console.log(JSON.stringify({ status, why, executedAt: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14) }));
