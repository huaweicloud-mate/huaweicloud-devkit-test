import { execSync } from 'node:child_process';
const o1 = execSync('npx --yes huaweicloud-devkit status --target hermes', { encoding:'utf8', timeout:120000, shell:true }).toString();
const o2 = execSync('npx --yes huaweicloud-devkit status --target hermes', { encoding:'utf8', timeout:120000, shell:true }).toString();
console.log(o1 === o2 ? 'idempotent' : 'diff'); process.exit(0);