// DSH/Linux daily probe — upgrade detection chain (v1.1.4 stable)
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { semverCompare, semverParse, hasPrerelease, judgeUpdate, readInstalledVersion,
        writeSkipState, readSkipState, resolveSkipFilePath, queryDistTagsSync } = await import(CORE + '/update-check.mjs');
const { TOOL_DEFINITIONS } = await import(CORE + '/tools.mjs');
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const results = [];
function check(id,name,pass,actual){results.push({id,name,pass:!!pass,actual:typeof actual==='string'?actual:JSON.stringify(actual)});}

// D1-26 registration
const names = TOOL_DEFINITIONS.map(t=>t.name);
const cu = TOOL_DEFINITIONS.find(t=>t.name==='huaweicloud_check_update');
const up = TOOL_DEFINITIONS.find(t=>t.name==='huaweicloud_upgrade');
check('D1-26','huaweicloud_check_update registered', !!cu, !!cu);
check('D1-26','huaweicloud_upgrade registered', !!up, !!up);
check('D1-26','check_update has description+inputSchema', !!cu?.description&&!!cu?.inputSchema, cu?.description?.slice(0,40));

// D1-30 semver
check('D1-30','1.1.2 > 1.1.1', semverCompare('1.1.2','1.1.1')>0, semverCompare('1.1.2','1.1.1'));
check('D1-30','stable > pre', semverCompare('1.1.0','1.1.0-next.9')>0, semverCompare('1.1.0','1.1.0-next.9'));
check('D1-30','equal = 0', semverCompare('1.1.0','1.1.0')===0, semverCompare('1.1.0','1.1.0'));
check('D1-30','pre increment', semverCompare('1.1.0-next.9','1.1.0-next.10')<0, semverCompare('1.1.0-next.9','1.1.0-next.10'));
check('D1-30','hasPrerelease', hasPrerelease('1.1.0-next.9')===true&&hasPrerelease('1.1.0')===false, `${hasPrerelease('1.1.0-next.9')},${hasPrerelease('1.1.0')}`);

// D1-27 up_to_date
const r27 = judgeUpdate('1.1.4',{latest:'1.1.4',next:null});
check('D1-27','up_to_date && !updateAvailable', r27.result==='up_to_date'&&r27.updateAvailable===false, r27);

// D1-28 update_available
const r28 = judgeUpdate('1.1.2',{latest:'1.1.4',next:'1.1.4-next.6'});
check('D1-28','update_available target=1.1.4', r28.result==='update_available'&&r28.updateAvailable===true, r28);

// D1-40 mirror lag no downgrade
const r40a = judgeUpdate('1.1.4',{latest:'1.1.3',next:null});
check('D1-40','remote<=local up_to_date', r40a.result==='up_to_date'&&r40a.updateAvailable===false, r40a);
const r40b = judgeUpdate('1.1.4-next.6',{latest:'1.1.3',next:'1.1.3-next.9'});
check('D1-40','pre remote<=local no downgrade', r40b.result==='up_to_date', r40b);

// D1-31 dismiss 冷却
{
  const f = join(tmpdir(),`d1-31-${Date.now()}.json`);
  writeSkipState(f,'1.1.4',{at:1000,days:3});
  const st = readSkipState(f);
  check('D1-31','skip fields', st.dismissedVersion==='1.1.4'&&!!st.dismissedAt&&!!st.expireAt, st);
  const cooled = judgeUpdate('1.1.2',{latest:'1.1.4'},st,2000);
  check('D1-31','cooldown -> dismissed', cooled.result==='dismissed'&&cooled.dismissed===true, cooled);
  const ms = new Date(st.expireAt).getTime()-new Date(st.dismissedAt).getTime();
  check('D1-31','expire = dismissed + 3 days', ms===3*24*60*60*1000, ms);
  rmSync(f,{force:true});
}

// D1-33 skip 持久化
{
  const f = join(tmpdir(),`d1-33-${Date.now()}.json`);
  const st = writeSkipState(f,'1.1.4');
  const parsed = JSON.parse(readFileSync(f,'utf8'));
  check('D1-33','skip JSON structure', parsed.dismissedVersion==='1.1.4'&&!!parsed.dismissedAt&&!!parsed.expireAt, parsed);
  const resolved = resolveSkipFilePath();
  check('D1-33','resolveSkipFilePath returns path', typeof resolved==='string'&&resolved.length>0, resolved);
  rmSync(f,{force:true});
}

// D1-39 detection chain (Linux part)
const inst = readInstalledVersion();
check('D1-39','readInstalledVersion returns version', typeof inst==='string'&&inst.length>0, inst);
let dist=null; try { dist=queryDistTagsSync({timeoutMs:20000}); } catch(e){ dist = {error: String(e)}; }
const distOk = !!dist && (typeof dist.latest==='string' || typeof dist.next==='string');
check('D1-39','queryDistTags returns dist-tags', distOk, dist && (dist.latest||dist.next||dist.error));

const failed=results.filter(r=>!r.pass);
console.log('=== UPDATE PROBE RESULTS (v1.1.4 stable) ===');
console.log(`total=${results.length} pass=${results.length-failed.length} fail=${failed.length}`);
for(const r of results) console.log(`${r.pass?'PASS':'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if(failed.length){console.log('--- FAILED ---');for(const r of failed)console.log(`  ${r.id} ${r.name}`);}
