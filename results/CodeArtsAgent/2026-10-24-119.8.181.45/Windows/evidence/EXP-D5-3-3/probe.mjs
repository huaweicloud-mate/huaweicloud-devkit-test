// EXP-D5-3-3: D5-3 客户端矩阵
import { execSync } from "child_process";
try {
  const output = execSync("C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/huaweicloud-devkit status", {encoding: "utf8", timeout: 60000});
  const hasSkills = output.includes("Skills") && output.includes("installed");
  console.log(JSON.stringify({status: hasSkills ? "PASS" : "FAIL", why: `Skills found: ${hasSkills}`, executedAt: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}));
} catch(e) {
  console.log(JSON.stringify({status: "FAIL", why: e.message, executedAt: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}));
}
