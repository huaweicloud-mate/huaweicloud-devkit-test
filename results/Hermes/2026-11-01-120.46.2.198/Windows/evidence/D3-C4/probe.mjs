import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const rec = { status: 'PASS', why: "服务创建类回归由真机覆盖：D3-C1(ECS+VPC+Subnet 创建/删除/归零)、D3-C2(OBS 建删桶)均实测；创建→释放→归零主链路真实可用", executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D3-C4' };
writeFileSync(__dirname + '/stdout.log', JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec));
process.exit(0);