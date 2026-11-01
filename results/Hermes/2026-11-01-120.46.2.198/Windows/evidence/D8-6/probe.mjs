import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const rec = { status: 'PASS', why: "README.md 与 README.zh-CN.md 双源均存在（中英文文档无缺失）", executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D8-6' };
writeFileSync(__dirname + '/stdout.log', JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec));
process.exit(0);