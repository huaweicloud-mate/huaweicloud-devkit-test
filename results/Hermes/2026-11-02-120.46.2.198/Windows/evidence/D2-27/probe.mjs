import { execSync } from 'node:child_process';
const o = execSync('hcloud version', { encoding:'utf8', timeout:60000, shell:true }).toString();
console.log(o); process.exit(0);