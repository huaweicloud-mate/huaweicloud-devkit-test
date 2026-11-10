// D1-4: update 通道机制源码级验证
import { pathToFileURL } from "node:url";
const base = "C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/";
const uc = await import(pathToFileURL(base + "update-check.mjs").href);
console.log("--- getUpdateDistTags ---");
const tags = await uc.getUpdateDistTags();
console.log(JSON.stringify(tags));
console.log("--- getCachedUpdateInfo ---");
console.log(JSON.stringify(uc.getCachedUpdateInfo()));
console.log("--- judgeUpdate (1.1.9 -> 1.1.13) ---");
console.log(JSON.stringify(uc.judgeUpdate("1.1.9", tags)));
console.log("--- determineTarget ---");
const rt = uc.determineTarget ? uc.determineTarget(tags) : "n/a";
console.log(JSON.stringify(rt));
