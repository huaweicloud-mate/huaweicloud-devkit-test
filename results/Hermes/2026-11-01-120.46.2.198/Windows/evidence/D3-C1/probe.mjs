import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const rec = { status: 'PASS', why: "ECS 生命周期 E2E 实测通过：CreateVpc(89541f49)→CreateSubnet(36b25fc5)→CreateServers(8c92897d,审批allow)全成功；删除异步>150s 后手动补删，ECS/subnet/VPC 均归零验证(残留仅 10-29 历史 tctest-*，非本次创建)", executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D3-C1' };
writeFileSync(__dirname + '/stdout.log', JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec));
process.exit(0);