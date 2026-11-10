const fs = require("fs");
const p = "C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit/package.json";
const pkg = JSON.parse(fs.readFileSync(p, "utf-8"));
console.log("name:", pkg.name, "version:", pkg.version);
console.log("bin:", JSON.stringify(pkg.bin));
console.log("files:", JSON.stringify(pkg.files));
