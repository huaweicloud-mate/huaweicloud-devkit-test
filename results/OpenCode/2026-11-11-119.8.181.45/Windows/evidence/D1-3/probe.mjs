import { spawnSync } from 'node:child_process';
const r = spawnSync('huaweicloud-devkit',['doctor'],{encoding:'utf-8',shell:true});
console.log(r.status, (r.stdout||'').slice(0,300));
