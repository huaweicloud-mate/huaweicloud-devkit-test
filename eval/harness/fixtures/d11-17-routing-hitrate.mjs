// D11-17 中文口语意图路由命中率（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：命中率 >= 85%（>=17/20；依据 issue #852 实测基线 21.4%，目标提升至 85%）
//   且无一条返回空路由。
// 意图集真源：eval/prompts/ux-routing-intents.csv（20 条中文口语需求 + 人工标注期望服务）
// 命中定义（本夹具显式登记，避免口径漂移）：service_catalog 返回体全文出现期望服务标识
//   （如 ecs/obs/vpc，不区分大小写），或出现该服务的中文名（云服务器/对象存储/虚拟私有云…）。
//
// 做法：逐条调 huaweicloud_service_catalog（离线工具，无需真云）→ 统计命中率与空路由数。
// 口径：需求验收（UX-R16 中文口语路由）。实现前预期 FAIL。
// 用法: node d11-17-routing-hitrate.mjs <hdk src> [--evid <dir>]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { blocked, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-17';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-17-routing-hitrate.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

// 意图集：相对本夹具文件定位（<repo>/eval/harness/fixtures/ → ../../prompts/），
// 不依赖 hdkSrc 的目录深度（本地 SUT 与 CI 的 node_modules 路径深度不同）。
const CSV = fileURLToPath(new URL('../../prompts/ux-routing-intents.csv', import.meta.url));
let rows = [];
try {
  const text = readFileSync(CSV, 'utf8').replace(/^\uFEFF/, '');
  rows = text.split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
    const c = line.split(',');
    return { query: c[0], service: (c[1] || '').trim(), note: c[2] || '' };
  });
} catch (e) {
  blocked(CASE_ID, `无法读取意图集 ${CSV}：${String(e.message).slice(0, 100)}`, evid);
}
if (rows.length === 0) blocked(CASE_ID, '意图集为空，无法计算命中率', evid);

const ZH_NAME = {
  ecs: '云服务器', obs: '对象存储', vpc: '虚拟私有云', evs: '云硬盘', eip: '弹性公网',
  ims: '镜像', iam: '身份', rds: '数据库', elb: '负载均衡', bss: '费用',
  cdn: '加速', cce: '容器', dms: '消息', functiongraph: '函数', ces: '监控', dns: '域名', hss: '安全',
};

const iso = isolateHome('d11-17');
const { callTool } = await importHdk(hdkSrc, 'tools.mjs');

const misses = [];
let empty = 0;
for (const { query, service } of rows) {
  let r = null;
  try {
    r = await callTool('huaweicloud_service_catalog', { query });
  } catch (e) {
    r = { error: String(e?.message).slice(0, 80) };
  }
  const blob = JSON.stringify(r ?? {});
  const values = Object.values(r ?? {});
  const isEmpty = values.length === 0 || values.every((v) => (Array.isArray(v) ? v.length === 0 : !v));
  if (isEmpty) empty += 1;
  const zh = ZH_NAME[service] ?? '';
  const hit = new RegExp(service, 'i').test(blob) || (zh && blob.includes(zh));
  if (!hit) misses.push(`${query}→${service}`);
}

const total = rows.length;
const hits = total - misses.length;
const rate = hits / total;
console.log(`[INFO] 意图集 ${total} 条，命中 ${hits}，未命中 ${misses.length}，空路由 ${empty}`);

rec('D11-17-hitrate', `中文口语路由命中率 >= 85%（${hits}/${total} = ${(rate * 100).toFixed(1)}%）`,
  rate >= 0.85, { 命中: `${hits}/${total}`, 命中率: `${(rate * 100).toFixed(1)}%`, 未命中: misses.slice(0, 8) },
  '>= 85%（>=17/20）', '依据 issue #852 实测基线 21.4%，本用例目标 85%');
rec('D11-17-no-empty-route', '无一条返回空路由',
  empty === 0, { 空路由条数: empty }, 0);

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R16）；FAIL = 路由未达 85%（含基线 21.4%），非 harness 问题');
