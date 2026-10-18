// probe_d3s7.mjs — D3-S7 场景-跨服务交付(Web应用+RDS)并归零
// 结论：环境阻塞（BLOCKED）。需「建 RDS 实例 → 沙箱/ECS 部署 Web → 连接串注入 → 全量归零」的
// 跨服务编排 harness + RDS 实例配额；每日单服务真云探针不含 RDS 编排，且本账户当前处于受限状态
// （OBS/ECS/FunctionGraph 写操作均被云端拒绝），RDS 实例亦无法创建。
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const EVID = process.env.EVID_DIR;
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const rec = (o) => { const d = join(EVID, 'D3-S7'); mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'stdout.log'), JSON.stringify({ ...o, executedAt: now14(), probe: 'probe_d3s7.mjs' }, null, 2), 'utf8'); console.log(o.status, 'D3-S7', o.actual); };
rec({
  status: 'BLOCKED', caseId: 'D3-S7', title: '场景-跨服务交付(Web应用+RDS)并归零',
  expected: '多服务编排(先建库后部署)+连接串注入+测后归零',
  actual: 'BLOCKED：跨服务复合编排（RDS 实例创建 + 沙箱/ECS 部署 Web + 连接串注入 + 全量归零）无对应 harness，且账户当前受限',
  blockedReason: '【补环境】缺跨服务编排 harness（RDS+沙箱串联）与 RDS 最低规格实例配额；实测本账户写操作受限（OBS CreateBucket 403 UserRestricted、ECS CreateServers Ecs.0067 insufficient balance、FunctionGraph FSS.0403 user restricted），RDS 实例同样无法创建。解除条件：提供跨服务编排 harness + 账户恢复余额/解除受限 + RDS 实例配额。',
});
