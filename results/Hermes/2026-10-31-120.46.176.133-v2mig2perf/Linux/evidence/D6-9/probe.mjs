// D6-9 缓存清理三入口 —— invalidateUpdateCache / clearIconCache / clearMarketCache
// 断言: ①预热三类缓存 ②分别调三个清理函数 ③核对内存态清空 ④重复清理幂等
//       ⑤清理后再查询触发重新拉取
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist';
const load = (rel) => import(pathToFileURL(join(SRC, rel)).href);

const out = {
  caseId: 'D6-9',
  title: '缓存清理三入口 (清空 + 幂等 + 清理后再查询触发重新拉取)',
  threshold: '三入口各自清空对应缓存且幂等; 清理后再查询触发重新拉取',
  env: { HDK_SRC: SRC, node: process.version },
  startedAt: new Date().toISOString(),
  entries: {},
};

// ---------- 入口 1: update-cache ----------
{
  const e = { name: 'invalidateUpdateCache (update-check/update-cache.ts:19)', pass: false };
  try {
    delete process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE;
    const m = await load('update-check.js');
    let queries = 0;
    const doQuery = async () => { queries += 1; return { latest: '2.0.0', next: '2.0.1-next.0' }; };
    e.prewarmQueriesBefore = queries;
    await m.getCachedUpdateInfo('1.0.0', { doQuery });
    e.afterPrewarm = queries;                       // 期望 1 (拉取)
    await m.getCachedUpdateInfo('1.0.0', { doQuery });
    e.afterSecondRead = queries;                    // 期望仍 1 (命中缓存)
    e.cacheHit = e.afterSecondRead === 1;
    m.invalidateUpdateCache();
    await m.getCachedUpdateInfo('1.0.0', { doQuery });
    e.afterClearRefetch = queries;                  // 期望 2 (清理后重新拉取)
    e.refetchAfterClear = e.afterClearRefetch === 2;
    let idem = true;
    try { m.invalidateUpdateCache(); m.invalidateUpdateCache(); } catch (err) { idem = false; e.idemErr = String(err); }
    await m.getCachedUpdateInfo('1.0.0', { doQuery });
    e.afterIdemRefetch = queries;                   // 期望 3 (重复清理仍幂等且可再拉取)
    e.idempotent = idem && e.afterIdemRefetch === 3;
    e.pass = e.cacheHit && e.refetchAfterClear && e.idempotent;
    e.detail = `预热后查询次数=${e.afterPrewarm}, 二次读命中(仍=${e.afterSecondRead}), 清理后=${e.afterClearRefetch}, 重复清理后=${e.afterIdemRefetch}`;
  } catch (err) { e.detail = `异常: ${err}`; }
  out.entries.update = e;
}

// ---------- 入口 2: icon-library ----------
{
  const e = { name: 'clearIconCache (icon-library.ts:66)', pass: false };
  try {
    delete process.env.HUAWEICLOUD_ICONS_OFFLINE;
    const m = await load('icon-library.js');
    let fetches = 0;
    const MANIFEST = {
      generated_at: '2026-10-31T00:00:00Z',
      icons: [{
        id: 'ecs', name: 'Elastic Cloud Server', category: '计算', subcategory: '',
        description: 'ECS 弹性云服务器', product_url: 'https://www.huaweicloud.com/product/ecs.html',
        aliases: ['elastic cloud server'], tags: ['compute'],
        logo: { source_url: 'https://example/ecs.svg' }, architecture: {},
      }],
    };
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => { fetches += 1; return { ok: true, status: 200, json: async () => MANIFEST }; };
    const r1 = await m.getServiceIcon('ecs');
    e.afterPrewarm = fetches;                        // 期望 1
    const r2 = await m.getServiceIcon('ecs');
    e.afterSecondRead = fetches;                     // 期望仍 1
    e.cacheHit = e.afterSecondRead === 1 && r2?.source === r1?.source;
    m.clearIconCache();
    const r3 = await m.getServiceIcon('ecs');
    e.afterClearRefetch = fetches;                   // 期望 2
    e.refetchAfterClear = e.afterClearRefetch === 2;
    let idem = true;
    try { m.clearIconCache(); m.clearIconCache(); } catch (err) { idem = false; e.idemErr = String(err); }
    await m.getServiceIcon('obs');
    e.afterIdemRefetch = fetches;                    // 期望 3
    e.idempotent = idem && e.afterIdemRefetch === 3;
    e.iconSource = r3?.source;
    globalThis.fetch = realFetch;
    e.pass = e.cacheHit && e.refetchAfterClear && e.idempotent;
    e.detail = `预热后 fetch=${e.afterPrewarm}, 二次读命中(仍=${e.afterSecondRead}), 清理后 fetch=${e.afterClearRefetch}, 重复清理后 fetch=${e.afterIdemRefetch}, source=${e.iconSource}`;
  } catch (err) { e.detail = `异常: ${err}`; }
  out.entries.icon = e;
}

// ---------- 入口 3: search-market ----------
{
  const e = { name: 'clearMarketCache (search-market.ts:150)', pass: false };
  try {
    const m = await load('search-market.js');
    let indexFetches = 0;
    let mapFetches = 0;
    const INDEX = { skills: [{ name: 'ecs', title: 'ECS', description: '华为云 ECS 技能', categories: ['计算'] }], categories: ['计算'] };
    const MAP = { ecs: '弹性云服务器' };
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      const u = String(url);
      if (u.includes('cn-en-map.json')) { mapFetches += 1; return { ok: true, status: 200, json: async () => MAP }; }
      indexFetches += 1;
      return { ok: true, status: 200, json: async () => INDEX };
    };
    await m.searchMarketplace('ecs');
    e.afterPrewarm = indexFetches;                   // 期望 1
    await m.searchMarketplace('ecs');
    e.afterSecondRead = indexFetches;                // 期望仍 1
    e.cacheHit = e.afterSecondRead === 1;
    m.clearMarketCache();
    await m.searchMarketplace('ecs');
    e.afterClearRefetch = indexFetches;              // 期望 2
    e.refetchAfterClear = e.afterClearRefetch === 2;
    let idem = true;
    try { m.clearMarketCache(); m.clearMarketCache(); } catch (err) { idem = false; e.idemErr = String(err); }
    await m.searchMarketplace('obs');
    e.afterIdemRefetch = indexFetches;               // 期望 3
    e.idempotent = idem && e.afterIdemRefetch === 3;
    e.cnEnMapFetches = mapFetches;
    globalThis.fetch = realFetch;
    e.pass = e.cacheHit && e.refetchAfterClear && e.idempotent;
    e.detail = `预热后 index fetch=${e.afterPrewarm}, 二次读命中(仍=${e.afterSecondRead}), 清理后 fetch=${e.afterClearRefetch}, 重复清理后 fetch=${e.afterIdemRefetch}`;
  } catch (err) { e.detail = `异常: ${err}`; }
  out.entries.market = e;
}

out.verdict = Object.values(out.entries).every((e) => e.pass) ? 'PASS' : 'FAIL';
out.assertion = Object.values(out.entries).map((e) => `${e.name.split(' ')[0]}=${e.pass ? 'OK' : 'NG'}`).join(' ');
out.finishedAt = new Date().toISOString();

const text = JSON.stringify(out, null, 2);
console.log(text);
if (process.env.HDK_EVIDENCE) {
  const d = join(process.env.HDK_EVIDENCE, 'D6-9');
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), text, 'utf8');
}
process.exit(out.verdict === 'PASS' ? 0 : 1);
