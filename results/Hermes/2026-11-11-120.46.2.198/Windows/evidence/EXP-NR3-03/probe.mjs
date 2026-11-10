// EXP-NR3-03 NR3 终端矩阵探针
import { spawnSync } from 'node:child_process';
const r = spawnSync('npm.cmd', ['view','huaweicloud-devkit','version'], { encoding:'utf8', timeout:30000 });
console.log('error', r.error?.code, 'status', r.status);
