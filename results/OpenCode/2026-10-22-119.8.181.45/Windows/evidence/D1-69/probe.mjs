// D1-69 CLI help
const r = spawnSync('npx', ['huaweicloud-devkit','--help'], {encoding:'utf-8',shell:true,timeout:30000});
console.log(r.stdout);
