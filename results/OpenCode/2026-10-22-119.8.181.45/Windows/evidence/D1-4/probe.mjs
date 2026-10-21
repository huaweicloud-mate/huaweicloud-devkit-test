// D1-4 status idempotent
const r = spawnSync('npx', ['huaweicloud-devkit','status'], {encoding:'utf-8',shell:true,timeout:30000});
console.log(r.stdout);
