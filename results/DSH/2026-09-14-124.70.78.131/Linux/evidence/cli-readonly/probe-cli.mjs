// DSH/Linux daily probe — CLI black-box (doctor/status/install-hcloud/version/auth)
import { spawnSync } from 'node:child_process';
const results=[];
function run(args,timeout=30000){const r=spawnSync('huaweicloud-devkit',args,{encoding:'utf8',timeout,env:{...process.env,PATH:`${process.env.HOME}/nodejs/bin:${process.env.HOME}/bin:${process.env.PATH}`}});return{code:r.status,out:(r.stdout||'').trim(),err:(r.stderr||'').trim()};}
function check(id,name,pass,actual){results.push({id,name,pass:!!pass,actual:String(actual).slice(0,300)});}

const doctor=run(['doctor']);
check('D1-3','doctor exits 0', doctor.code===0, `code=${doctor.code}`);
check('D1-3','doctor prints self-check', /hcloud|MCP|skill|auth|proxy|node|version/i.test(doctor.out+doctor.err), (doctor.out+doctor.err).slice(0,120));

const status=run(['status']);
check('D1-4','status exits 0', status.code===0, `code=${status.code}`);
check('D1-4','status prints install state', status.out.length>0, status.out.slice(0,120));

const ih=run(['install-hcloud']);
check('D1-6','install-hcloud exits 0', ih.code===0, `code=${ih.code}`);
check('D1-6','install-hcloud prints KooCLI guidance', /hcloud|KooCLI|curl|install|choco|wget/i.test(ih.out+ih.err), (ih.out+ih.err).slice(0,120));

const ver=run(['version']);
check('D1-4','version exits 0 + prints version', ver.code===0 && /\d+\.\d+\.\d+/.test(ver.out), ver.out.slice(0,120));
const ver2=run(['--version']);
check('D1-4','--version flag works', ver2.code===0 && /\d+\.\d+\.\d+/.test(ver2.out), ver2.out.slice(0,120));

const auth=run(['auth','status']);
check('D2-auth','auth status exits 0', auth.code===0, `code=${auth.code}`);

const failed=results.filter(r=>!r.pass);
console.log('=== CLI PROBE RESULTS ===');
console.log(`total=${results.length} pass=${results.length-failed.length} fail=${failed.length}`);
for(const r of results) console.log(`${r.pass?'PASS':'FAIL'}  ${r.id}  ${r.name}  => ${r.actual}`);
if(failed.length){console.log('\nFAILED:');for(const r of failed)console.log(`  ${r.id} ${r.name}`);process.exit(1);}
console.log('\nALL CLI ASSERTIONS PASSED');
