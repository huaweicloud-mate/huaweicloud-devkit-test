const fs = require("fs");
const p = "C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs";
const s = fs.readFileSync(p, "utf-8");
const names = [...s.matchAll(/name:\s*'([a-z_]+)'/g)].map(m => m[1]);
console.log("unique names:", new Set(names).size);
console.log([...new Set(names)].join(","));
try {
  const pkg = JSON.parse(fs.readFileSync("C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit/package.json", "utf-8"));
  console.log("global pkg:", pkg.name, pkg.version);
} catch (e) { console.log("pkg err:", e.message); }
