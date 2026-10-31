// D1-27 检测语义-已是最新 探针脚本
import { judgeUpdate } from "file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs";

let pass = 0, fail = 0;
const results = [];

// 测试用例: current == latest
const result = judgeUpdate("1.1.2", { latest: "1.1.2" }, null);

if (result.result === "up_to_date" && result.updateAvailable === false) {
    pass++;
    results.push("PASS  D1-27  检测语义-已是最新  => result=up_to_date, updateAvailable=false");
} else {
    fail++;
    results.push("FAIL  D1-27  检测语义-已是最新  => " + JSON.stringify(result));
}

console.log("=== D1-27 探针结果 ===");
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
