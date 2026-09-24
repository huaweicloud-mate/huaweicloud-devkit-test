// D6-9: 缓存清理三入口 (invalidateUpdateCache / clearIconCache / clearMarketCache)
import { writeFileSync } from 'node:fs';
import { invalidateUpdateCache } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { clearIconCache, getServiceIcon } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/icon-library.mjs';
import { clearMarketCache } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/search-market.mjs';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-24-1.94.218.129/Linux/evidence/d6-cache/stdout.log';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 160), expected: String(expected) });
}

let ok1 = false, ok2 = false, ok3 = false, idem = false;
try { invalidateUpdateCache(); ok1 = true; } catch { ok1 = false; }
invalidateUpdateCache();  // 重复调用应幂等
try { invalidateUpdateCache(); idem = true; } catch { idem = false; }
test('D6-9', 'invalidateUpdateCache', ok1 && idem, `callable=${ok1} idem=${idem}`, '清理函数可调用且幂等');

try { clearMarketCache(); ok2 = true; } catch { ok2 = false; }
test('D6-9', 'clearMarketCache', ok2, `callable=${ok2}`, '市场缓存清理可调用');

// 图标缓存：clear 后 offline 模式重新加载 snapshot
process.env.HUAWEICLOUD_ICONS_OFFLINE = '1';
clearIconCache();
const r1 = await getServiceIcon('obs');
clearIconCache();
const r2 = await getServiceIcon('obs');
ok3 = r1?.ok === true && r2?.ok === true && r1?.source === 'snapshot';
delete process.env.HUAWEICLOUD_ICONS_OFFLINE;
test('D6-9', 'clearIconCache-reload', ok3, `src=${r1?.source} then ${r2?.source}`, 'clear 后重新拉取快照');

const output = JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);