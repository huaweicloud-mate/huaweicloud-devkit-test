// 探针1：枚举 hdk src 关键模块导出（Windows file:// URL）
import { pathToFileURL } from "node:url";
const mods = [
  "update-check.mjs", "auth/auth-sync.mjs", "koocli-version.mjs", "safety-policy.mjs",
  "risk-rule-engine.mjs", "icon-library.mjs", "search-market.mjs", "mcp-config-backup.mjs",
  "hcloud-cli.mjs", "detect-framework.mjs", "account-type.mjs",
];
const base = "C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/";
for (const m of mods) {
  try {
    const mod = await import(pathToFileURL(base + m).href);
    console.log("== " + m + " ==");
    console.log(Object.keys(mod).join(", "));
  } catch (e) {
    console.log("== " + m + " == ERROR: " + e.message.split("\n")[0]);
  }
}
