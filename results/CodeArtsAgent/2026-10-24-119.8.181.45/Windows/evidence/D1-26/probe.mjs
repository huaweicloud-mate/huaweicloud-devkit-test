// D1-26: 升级提醒工具注册与协议暴露
import { execSync } from "child_process";
try {
  const output = execSync("npx huaweicloud tools list", { encoding: "utf8", timeout: 60000 });
  const hasCheckUpdate = output.includes("check_update") || output.includes("huaweicloud_check_update");
  const hasUpgrade = output.includes("upgrade") || output.includes("huaweicloud_upgrade");
  console.log(JSON.stringify({status: hasCheckUpdate && hasUpgrade ? "PASS" : "FAIL", why: `hasCheckUpdate=${hasCheckUpdate} hasUpgrade=${hasUpgrade}`, executedAt: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}));
} catch(e) {
  console.log(JSON.stringify({status: "FAIL", why: `tools list failed: ${e.message}`, executedAt: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}));
}
