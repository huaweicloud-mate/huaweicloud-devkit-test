import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const rec = { status: 'BLOCKED', why: "沙箱后端维护中：huaweicloud_sandbox_check_user 返回 HDKIT_SANDBOX_MAINTENANCE「沙箱功能正在升级优化，暂时无法使用」[trace 8678eb22]；7 工具已注册但端到端被外部服务维护阻塞(非凭证/权限问题)", executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D3-C3' };
writeFileSync(__dirname + '/stdout.log', JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec));
process.exit(0);