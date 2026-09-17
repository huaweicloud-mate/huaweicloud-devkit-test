// DSH/Linux daily probe — credential/auth core (v1.1.4 stable), hermetic via env relocation
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
const TMP = mkdtempSync(join(tmpdir(), 'hdk-auth-'));
process.env.HUAWEICLOUD_HOME = TMP;              // relocate S1 + .last_sync
process.env.HCLOUD_OBS_CONFIG_PATH = join(TMP, 'obsutilconfig'); // relocate S3
process.env.HCLOUD_CONFIG_PATH = join(TMP, 'hcloud-config.json'); // relocate KooCLI
delete process.env.HW_ACCESS_KEY; delete process.env.HW_SECRET_KEY; delete process.env.HW_SECURITY_TOKEN;

const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { callTool } = await import(CORE + '/tools.mjs');
const cred = await import(CORE + '/auth/credentials.mjs');
const rec = await import(CORE + '/auth/reconcile.mjs');
const { syncAuth } = await import(CORE + '/auth/service.mjs');

const results = [];
function check(id,name,pass,actual){results.push({id,name,pass:!!pass,actual:typeof actual==='string'?actual:JSON.stringify(actual)});}

// ---- D2-11 R3 STS token 拒绝落盘 ----
const sts = await callTool('huaweicloud_auth_switch', { action:'persist', ak:'AKSTS0000000000001', sk:'SKSTS0000000000001', securityToken:'ST-token-abc', region:'cn-north-4' });
check('D2-11','persist+token -> {error,scope:rejected}', sts.status==='error' && sts.scope==='rejected', sts);
const s1After = cred.readGlobalCredentials();
check('D2-11','token not persisted to S1 (no file)', s1After===null, s1After);

// ---- D2-13 R9 configuredBySession 优先 env ----
cred.writeGlobalCredentials({ ak:'S1AK000000000000001', sk:'S1SK000000000000001', region:'cn-north-4', configuredBySession:true });
process.env.HW_ACCESS_KEY='ENVAK00000000000001'; process.env.HW_SECRET_KEY='ENVSK00000000000001';
const r13a = cred.resolveCredentials();
check('D2-13','configuredBySession S1 wins over env', r13a.ak==='S1AK000000000000001', r13a.ak);
cred.setConfiguredBySession(false);
const r13b = cred.resolveCredentials();
check('D2-13','cleared flag -> env recover', r13b.ak==='ENVAK00000000000001', r13b.ak);
delete process.env.HW_ACCESS_KEY; delete process.env.HW_SECRET_KEY;

// ---- D2-12 R10 runtime 非空禁止落盘 ----
cred.writeGlobalCredentials({ ak:'S1AK000000000000001', sk:'S1SK000000000000001', region:'cn-north-4' });
cred.setRuntimeCredentials('RTAK000000000000001','RTSK000000000000001', undefined, 'cn-north-4');
const haveRT = cred.hasRuntimeCredentials();
const syncRes = syncAuth('all');
check('D2-12','runtime active -> sync ok:false suppressed', haveRT===true && syncRes.ok===false && /suppressed \(R10\)/.test(syncRes.error||''), syncRes);
const obsWrittenSuppressed = existsSync(process.env.HCLOUD_OBS_CONFIG_PATH);
check('D2-12','no S3/OBS written during suppressed sync', obsWrittenSuppressed===false, obsWrittenSuppressed);
cred.clearRuntimeCredentials();

// ---- D2-16 import 读后擦除 ----
const importPath = join(TMP,'.config','huaweicloud','creds-import.json');
writeFileSync(importPath, JSON.stringify({ ak:'IMPAK000000000000001', sk:'IMPSK000000000000001', region:'cn-north-4' }), 'utf8');
await callTool('huaweicloud_auth_switch', { action:'temporary', mode:'import' });
check('D2-16','import file wiped after read', existsSync(importPath)===false, importPath);

// ---- D2-10 R7 current 档跟随 ----
writeFileSync(process.env.HCLOUD_CONFIG_PATH, JSON.stringify({ current:'deploy', authEncrypt:false, profiles:[{name:'deploy',accessKeyId:'A1',secretAccessKey:'S1'},{name:'default',accessKeyId:'A0',secretAccessKey:'S0'}] }), 'utf8');
const kp1 = rec.readKooCliProfiles();
check('D2-10','readKooCliProfiles current=deploy', kp1.current==='deploy' && kp1.profiles.length===2, kp1.current+'/'+kp1.profiles.length);
check('D2-10','resolveManagedProfile -> deploy', rec.resolveManagedProfile()==='deploy', rec.resolveManagedProfile());
writeFileSync(process.env.HCLOUD_CONFIG_PATH, JSON.stringify({ current:'prod', authEncrypt:false, profiles:[{name:'prod',accessKeyId:'A2',secretAccessKey:'S2'}] }), 'utf8');
check('D2-10','switch current -> prod', rec.resolveManagedProfile()==='prod', rec.resolveManagedProfile());

// ---- D2-5 凭证缺失报错指引 ----
cred.clearRuntimeCredentials();
delete process.env.HW_ACCESS_KEY; delete process.env.HW_SECRET_KEY;
try { rmSync(cred.globalCredentialsPath(), { force: true }); } catch {}
try { cred.resolveCredentials(); check('D2-5','expected throw', false, 'no-throw'); }
catch(e) {
  const isGuided = e.code==='HDKIT_CRED_MISSING' && e.onboarding && Array.isArray(e.onboarding.steps) && e.onboarding.steps.length>0;
  check('D2-5','missing creds -> guided error (code+steps)', isGuided, `code=${e.code} steps=${e.onboarding?.steps?.length||0}`);
  check('D2-5','no bare stacktrace (has message)', typeof e.message==='string' && e.message.length>0, e.message.slice(0,60));
}

const failed=results.filter(r=>!r.pass);
console.log('=== AUTH PROBE RESULTS (v1.1.4 stable) ===');
console.log(`total=${results.length} pass=${results.length-failed.length} fail=${failed.length}`);
for(const r of results) console.log(`${r.pass?'PASS':'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if(failed.length){console.log('--- FAILED ---');for(const r of failed)console.log(`  ${r.id} ${r.name} => ${r.actual}`);}
rmSync(TMP,{recursive:true,force:true});
