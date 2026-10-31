// D1-28 检测语义-有新版本 探针脚本
import { judgeUpdate } from "file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs";

let pass = 0, fail = 0;
const results = [];

// 测试用例: current < latest
const result = judgeUpdate("1.1.1", { latest: "1.1.2" }, null);

if (result.result === "update_available" && result.updateAvailable === true && result.targetVersion === "1.1.2") {
    pass++;
    results.push("PASS  D1-28  检测语义-有新版本  => update_available, targetVersion=1.1.2");
} else {
    fail++;
    results.push("FAIL  D1-28  检测语义-有新版本  => " + JSON.stringify(result));
}

console.log("=== D1-28 探针结果 ===");
for (const line of results) console.log(line);
console.log("TOTAL pass=" + pass + " fail=" + fail);

const output = {
    status: fail > 0 ? "FAIL" : "PASS",
    pass,
    fail,
    results,
    executedAt: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)
};
console.log("=== JSON OUTPUT ===");
console.log(JSON.stringify(output));

process.exit(fail > 0 ? 1 : 0);
