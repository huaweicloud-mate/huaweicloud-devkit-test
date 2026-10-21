// D1-3 doctor health check
const { spawnSync } = require('child_process');
const r = spawnSync('npx', ['huaweicloud-devkit','doctor'], {encoding:'utf-8',shell:true,timeout:30000});
console.log(r.stdout || r.stderr);
