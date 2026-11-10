import { spawnSync } from 'node:child_process';
const r1=spawnSync('huaweicloud-devkit',['status'],{encoding:'utf-8',shell:true});
const r2=spawnSync('huaweicloud-devkit',['install','--target','opencode'],{encoding:'utf-8',shell:true});
console.log(r1.stdout===r2.stdout, r2.status);
