import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
let out = '';
try { out = execSync('npx --yes huaweicloud-devkit doctor --target hermes', { encoding:'utf8', timeout:120000, shell:true }).toString(); } catch(e) { out = (e.stdout||'') + (e.stderr||''); }
const m = out.match(/Results:\s*([^\n]+)/);
const hasFail = out.includes('[FAIL]');
const hasFix = out.includes('install');
const status = (m && hasFix) ? 'PASS' : 'FAIL';
const rec = { status, why: 'doctor: ' + (m ? m[1].trim() : '无 Results 行') + '; 失败如实报告=' + hasFail + '; 修复指引=' + hasFix, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D1-3' };
writeFileSync(__dirname + '/stdout.log', JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec));
process.exit(0);
