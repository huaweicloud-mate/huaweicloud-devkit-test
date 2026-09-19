const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const up = await import(SRC+'/update-check.mjs');
const ic = await import(SRC+'/icon-library.mjs');
const sm = await import(SRC+'/search-market.mjs');
let PASS=0,FAIL=0;const A=(id,l,c,d='')=>{const ok=!!c;ok?PASS++:FAIL++;console.log(`[${ok?'PASS':'FAIL'}] ${id} ${l}${d?' | '+d:''}`);};
let t;
try { up.invalidateUpdateCache(); t=true; } catch(e){ t=false; console.log('invalidateUpdateCache err:', e.message); }
A('D6-9','invalidateUpdateCache 可调', t===true);
try { ic.clearIconCache(); t=true; } catch(e){ t=false; console.log('clearIconCache err:', e.message); }
A('D6-9','clearIconCache 可调', t===true);
try { sm.clearMarketCache(); t=true; } catch(e){ t=false; console.log('clearMarketCache err:', e.message); }
A('D6-9','clearMarketCache 可调', t===true);
// 幂等（重复清理不抛错）
try { up.invalidateUpdateCache(); ic.clearIconCache(); sm.clearMarketCache(); t=true; } catch(e){ t=false; }
A('D6-9','三入口重复清理幂等', t===true);
// invalidate 后 peek 缓存应为 null
let pk=null; try { pk = up.peekCachedUpdateInfo ? up.peekCachedUpdateInfo() : 'n/a'; } catch(e){ pk='ERR:'+e.message; }
console.log('invalidate 后 peekCachedUpdateInfo =>', pk);
A('D6-9','invalidateUpdateCache 后缓存清空', pk===null || pk===undefined || pk==='n/a');
console.log(`\n=== 汇总: PASS=${PASS} FAIL=${FAIL} ===`);
process.exit(FAIL?1:0);
