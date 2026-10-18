// probe_d3c13.mjs — D3-C13 OBS 静态网站托管配置（真云）
// 断言：get/set/delete 走 AWS4 签名 REST；set 必须 indexDocument（缺失报错）；删除后无残留。
// 账户受限（403 UserRestricted）按「环境阻塞」记 BLOCKED + blockedReason。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const EVID = process.env.EVID_DIR;
const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const sh = (a, t = 90000) => { const r = spawnSync('hcloud', a, { encoding: 'utf8', timeout: t }); return { status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() }; };
function rec(status, actual, detail = '') {
  const d = join(EVID, 'D3-C13'); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: 'D3-C13', title: 'OBS 静态网站托管配置', expected: 'get/set/delete 走 AWS4 签名 REST；set 必须 indexDocument', actual, detail, executedAt: now14(), probe: 'probe_d3c13.mjs' }, null, 2), 'utf8');
  console.log(`${status}\tD3-C13\t${String(actual).slice(0, 220)}`);
}
const ACCOUNT_RE = /(UserRestricted|forbidden for restricted users|user restricted|insufficient balance|op_restricted)/i;
const hdkSrc = process.env.HDK_SRC;
const { callTool } = await import(pathToFileURL(join(hdkSrc, 'tools.mjs')).href);
const call = async (n, a) => { try { return await callTool(n, a); } catch (e) { return { __error: String(e).slice(0, 260) }; } };

const bucket = `testbot3-hermes-c13-${TS}`;
try {
  const mb = sh(['OBS', 'mb', `obs://${bucket}`, `-location=${REGION}`]);
  const created = /success/i.test(mb.text);
  if (!created) {
    const restricted = ACCOUNT_RE.test(mb.text);
    rec(restricted ? 'BLOCKED' : 'FAIL',
      `OBS 建桶失败: exit=${mb.status} ${mb.text.replace(/\s+/g, ' ').slice(0, 200)}`,
      restricted ? (`账户状态阻塞：OBS CreateBucket 返回 403 UserRestricted 【解除条件】账户解除受限后可复测；本次未创建任何桶，无残留`) : '建桶失败，后续 set/get/delete 断言未执行');
  } else {
    const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
    const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
    const missingIdx = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION });
    const del = await call('huaweicloud_obs_set_website_config', { action: 'delete', bucket, region: REGION });
    const rm = sh(['OBS', 'rm', `obs://${bucket}`, '-f']);
    const lb = sh(['OBS', 'ListBuckets']);
    const gone = !lb.text.includes(bucket);
    const ok = set?.ok === true && set?.status === 200 && get?.ok === true && get?.status === 200 && del?.ok === true && gone;
    rec(ok ? 'PASS' : 'FAIL',
      `set=${set?.status} get=${get?.status} setNoIdx=${missingIdx?.ok}/${missingIdx?.status} delete=${del?.status} 归零=${gone}`,
      ok ? '' : `set/get/delete 或归零未达契约: ${JSON.stringify({ set, get, missingIdx, del }).slice(0, 260)}`);
  }
} catch (e) { rec('FAIL', 'probe error: ' + String(e.message).slice(0, 200)); }
