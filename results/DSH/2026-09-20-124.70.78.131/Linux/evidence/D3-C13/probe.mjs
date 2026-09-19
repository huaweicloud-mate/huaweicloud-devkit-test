import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);
const hc = (a) => spawnSync('hcloud', ['obs', ...a], { shell:false, encoding:'utf8', timeout:120000 });
let PASS=0,FAIL=0;
function A(id,l,c,d){const ok=!!c;ok?PASS++:FAIL++;const det=d?(' | '+d):'';console.log('['+(ok?'PASS':'FAIL')+'] '+id+' '+l+det);}

const ts = Date.now();
const bucket = `tctest-dsh-web-${ts}`;
const region = 'cn-north-4';

const mb = hc(['mb', `obs://${bucket}`, '-location=cn-north-4']);
console.log('创建 OBS 桶:', bucket, '| exit:', mb.status, (mb.stderr||mb.stdout||'').slice(0,120).replace(/\s+/g,' '));
const lsAfter = hc(['ls']);
const created = String((lsAfter.stdout||'')+(lsAfter.stderr||'')).includes(bucket);
A('D3-C13','创建测试 OBS 桶', created, 'bucket='+bucket+' exit='+mb.status);

const tool = (args) => callTool('huaweicloud_obs_set_website_config', { bucket, region, ...args });

// ① get 未配置
const g1 = await tool({ action:'get' });
console.log('get(未配置) => status:', g1.status, '| body:', String(g1.body||'').slice(0,80));
A('D3-C13','get 未配置桶走签名 REST(返回状态码)', typeof g1.status === 'number', `status=${g1.status}`);

// ② set indexDocument
const set = await tool({ action:'set', indexDocument:'index.html' });
console.log('set(index.html) => ok:', set.ok, '| status:', set.status, '| url:', set.websiteUrl);
A('D3-C13','set indexDocument 成功(200)', set.ok===true && set.status===200, `ok=${set.ok} status=${set.status}`);

// ③ get 核对
const g2 = await tool({ action:'get' });
console.log('get(已配置) => status:', g2.status, '| body:', String(g2.body||'').slice(0,160));
A('D3-C13','get 核对到 IndexDocument/index.html', /IndexDocument|index\.html/i.test(String(g2.body||'')));

// ④ 无 indexDocument set 报错
let setErr = false;
try { await tool({ action:'set' }); } catch(e){ setErr = /indexDocument/.test(String(e.message||e)); console.log('set 无 indexDocument 报错:', String(e.message||e).slice(0,100)); }
A('D3-C13','set 缺 indexDocument 报错', setErr);

// ⑤ delete
const del = await tool({ action:'delete' });
console.log('delete => ok:', del.ok, '| status:', del.status);
A('D3-C13','delete 网站配置成功(204)', del.ok===true && (del.status===204 || del.status===200), `status=${del.status}`);

// 清理桶归零
const rb = hc(['rm', `obs://${bucket}`, '-f']);
console.log('删除 OBS 桶 exit:', rb.status, (rb.stderr||rb.stdout||'').slice(0,80).replace(/\s+/g,' '));
A('D3-C13','删除测试 OBS 桶归零', rb.status===0);
console.log('\n=== 汇总: PASS='+PASS+' FAIL='+FAIL+' ===');
process.exit(FAIL?1:0);
