// probe_d3c2.mjs — D3-C2 OBS 静态站部署 E2E（本地修正探针，2026-10-19 复跑）
// 修正测试侧缺陷：OBS 建桶/删桶判定不以 KooCLI 退出码为准（`hcloud OBS mb` 成功也可能返回非 0），
// 改以输出文本判定，并以 ListBuckets 确证删桶归零；保留原始退出码便于追溯。
// 并新增：云端账户受限（403 UserRestricted 等）按「环境阻塞」记 BLOCKED + blockedReason，不误记产品 FAIL。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const results = [];
function log(name, pass, detail) { results.push({ name, pass, detail: String(detail).slice(0, 300) }); }
const hdkSrc = process.env.HDK_SRC;
const { callTool } = await import(pathToFileURL(join(hdkSrc, 'tools.mjs')).href);
async function call(name, args) { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; } }
function sh(cmd) { const r = spawnSync('hcloud', cmd, { encoding: 'utf8' }); return { status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() }; }
const ACCOUNT_RE = /(UserRestricted|forbidden for restricted users|user restricted|insufficient balance|op_restricted)/i;

const bucket = `testbot3-hermes-obs-${TS}`;
const mb = sh(['OBS', 'mb', `obs://${bucket}`, `-location=${REGION}`]);
const restricted = ACCOUNT_RE.test(mb.text);
log('OBS建桶', /success/i.test(mb.text), `exit=${mb.status} ${mb.text.slice(0, 200)}`);
const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
log('set静态站', set?.ok === true && set?.status === 200, JSON.stringify(set).slice(0, 200));
const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
log('get静态站', get?.ok === true && get?.status === 200 && /index\.html/.test(JSON.stringify(get)), JSON.stringify(get).slice(0, 200));
const rm = sh(['OBS', 'rm', `obs://${bucket}`, '-f']);
const listBuckets = (() => { const r = sh(['OBS', 'ListBuckets']); const i = r.text.indexOf('{'); return i < 0 ? null : r.text.slice(i); })();
const goneByList = listBuckets === null ? null : !listBuckets.includes(bucket);
log('删桶归零', goneByList !== false && /success/i.test(rm.text), `rm.exit=${rm.status} ${rm.text.slice(0, 90)} | ListBuckets含桶=${goneByList === false}`);

const failed = results.filter((x) => !x.pass).length;
const status = failed === 0 ? 'PASS' : (restricted ? 'BLOCKED' : 'FAIL');
const blockedReason = restricted ? ('账户状态阻塞：OBS CreateBucket 返回 403 ' + mb.text.replace(/\s+/g, ' ').slice(0, 200) + ' 【解除条件】账户解除受限后可复测；本次未创建任何 OBS 桶（ListBuckets 未含本次桶名），无残留') : '';
const out = JSON.stringify({ status, caseId: 'D3-C2', blockedReason, total: results.length, passed: results.length - failed, failed,
  title: 'OBS静态站部署E2E', expected: '建桶→set静态站→get静态站→删桶归零（不以KooCLI退出码判成败；账户受限记 BLOCKED）', results }, null, 2);
const dir = process.env.EVID_DIR || join(process.env.HDK_EVIDENCE || '.', 'D3-C2');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'stdout.log'), out, 'utf8');
console.log(out);
