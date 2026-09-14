// DSH/Linux daily probe — isolated install + global rules injection (D1-1, D4-23)
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const results=[];
function check(id,name,pass,actual){results.push({id,name,pass:!!pass,actual:String(actual).slice(0,300)});}
const PATH=`${process.env.HOME}/nodejs/bin:${process.env.HOME}/bin:${process.env.PATH}`;
const iso = mkdtempSync(join(tmpdir(),'hdk-dsh-install-'));
const targetHome = join(iso,'home'); const { mkdirSync } = await import('node:fs'); mkdirSync(targetHome,{recursive:true});

// D1-1 install in isolated HOME
const install = spawnSync('huaweicloud-devkit',['install','--target','dsh'],{encoding:'utf8',timeout:90000,env:{...process.env,HOME:targetHome,HUAWEICLOUD_HOME:targetHome,PATH}});
check('D1-1','install --target dsh exits 0', install.status===0, `code=${install.status}`);
check('D1-1','install output non-empty', (install.stdout||'').length>0, (install.stdout||'').slice(0,150));

// D4-23 global rules injection
function findRules(dir){ const out=[]; try{ for(const e of readdirSync(dir,{withFileTypes:true})){ const p=join(dir,e.name); if(e.isDirectory()) out.push(...findRules(p)); else if(/huawei-agent-rules/i.test(e.name)) out.push(p); } }catch{} return out; }
let agentRules = [];
for (const base of [targetHome, join(iso,'.dsh'), join(iso,'.config'), join(iso,'.huaweicloud'), iso]) {
  if (existsSync(base)) agentRules.push(...findRules(base));
}
check('D4-23','huawei-agent-rules.* injected to install target', agentRules.length>0, `found=${agentRules.length}`);

// package.json files array (source-level, D4-23 root)
try {
  const pkg = JSON.parse((await import('node:fs')).readFileSync(`${process.env.HOME}/nodejs/lib/node_modules/huaweicloud-devkit/package.json`,'utf8'));
  const files = pkg.files || [];
  const hasRules = files.some(f=>String(f).includes('rules'));
  check('D4-23','package files includes rules/', hasRules, JSON.stringify(files));
} catch(e){ check('D4-23','package.json readable', false, e.message); }

const failed=results.filter(r=>!r.pass);
console.log('=== INSTALL PROBE RESULTS ===');
console.log(`total=${results.length} pass=${results.length-failed.length} fail=${failed.length}`);
for(const r of results) console.log(`${r.pass?'PASS':'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if(failed.length){console.log('\nFAILED:');for(const r of failed)console.log(`  ${r.id} ${r.name}`);process.exit(1);}
console.log('\nALL INSTALL ASSERTIONS PASSED');
rmSync(iso,{recursive:true,force:true});
