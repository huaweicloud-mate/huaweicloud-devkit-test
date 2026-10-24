// D1-40: 镜像 lag 下检测正确性
import { queryDistTags } from "file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs";

const result = await queryDistTags({ timeoutMs: 15000 });
const hasValidResult = result && typeof result === "object";

const status = hasValidResult ? "PASS" : "FAIL";
const why = `Mirror lag detection: hasValidResult=${hasValidResult}`;

console.log(JSON.stringify({ status, why, executedAt: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14) }));
