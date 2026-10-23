// D3-C2 corrected probe: OBS 建桶 → 静态网站配置 set/get → 删桶归零.
// 断言按输出文本判定（hcloud OBS mb 成功时退出码=6，不能以退出码判成败）。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const hdkSrc = process.env.HDK_SRC || join(process.cwd(), '..', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const { callTool } = await import(pathToFileURL(join(hdkSrc, 'tools.mjs')).href);
const results = [];
function log(name, pass, detail) { results.push({ name, pass, detail: String(detail).slice(0, 300) }); }
async function call(name, args) { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; } }
function sh(cmd) { const r = spawnSync('hcloud', cmd, { encoding: 'utf8' }); return { status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() }; }

const bucket = `testbot3-hermes-obs-${TS}`;
const mb = sh(['OBS', 'mb', `obs://${bucket}`, `-location=${REGION}`]);
// 成功判据：输出含 "Create bucket [...] successfully"（退出码 6 属 KooCLI OBS 正常返回，不判失败）
const created = /Create bucket\s*\[[^\]]+\]\s*successfully/i.test(mb.text);
log('OBS建桶', created, `exit=${mb.status} | ` + mb.text.slice(0, 160));

const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
log('set静态站', set?.ok === true && set?.status === 200, JSON.stringify(set));

const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
log('get静态站', get?.ok === true && get?.status === 200, JSON.stringify(get).slice(0, 240));

const rm = sh(['OBS', 'rm', `obs://${bucket}`, '-f']);
log('删桶归零', /Delete bucket\s*\[[^\]]+\]\s*successfully/i.test(rm.text), `exit=${rm.status} | ` + rm.text.slice(0, 140));

const lsAfter = sh(['OBS', 'ls', `obs://${bucket}/`]);
log('删后不存在', !/Create bucket|Folder number|File number/i.test(lsAfter.text) || /does not exist|NoSuchBucket|404/i.test(lsAfter.text), lsAfter.text.slice(0, 140));

const failed = results.filter((x) => !x.pass).length;
const out = JSON.stringify({ case: 'D3-C2', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, executedAt: new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14), results }, null, 2);
console.log(out);
if (process.env.HDK_EVIDENCE) { const ev = join(process.env.HDK_EVIDENCE, 'D3-C2'); mkdirSync(ev, { recursive: true }); writeFileSync(join(ev, 'stdout.log'), out, 'utf8'); }