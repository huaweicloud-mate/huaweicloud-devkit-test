// D1-3: doctor健康自检
import { execSync } from "child_process";
try {
  const output = execSync("npx huaweicloud doctor", { encoding: "utf8", timeout: 60000 });
  const hasCheckItems = output.includes("检查") || output.includes("check") || output.includes("health");
  console.log(JSON.stringify({status: hasCheckItems ? "PASS" : "FAIL", why: `doctor output has check items: ${hasCheckItems}`, executedAt: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}));
} catch(e) {
  console.log(JSON.stringify({status: "FAIL", why: `doctor failed: ${e.message}`, executedAt: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}));
}
