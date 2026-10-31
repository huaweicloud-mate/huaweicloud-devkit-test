import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const rec = { status: 'BLOCKED', why: "FunctionGraph 定时任务需创建函数+触发器(按需计费)；本轮窗口受限未建删。解除条件：允许创建 FG 函数并纳入归零清单", executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D3-S6' };
writeFileSync(__dirname + '/stdout.log', JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec));
process.exit(0);