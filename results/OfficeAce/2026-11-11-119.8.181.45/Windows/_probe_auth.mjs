// 探针2：auth 相关模块导出
import { pathToFileURL } from "node:url";
const mods = [
  "auth/credentials.mjs", "auth/reconcile.mjs", "auth/credential-validator.mjs",
  "auth/service.mjs", "auth/project-id.mjs", "auth/guidance.mjs",
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
