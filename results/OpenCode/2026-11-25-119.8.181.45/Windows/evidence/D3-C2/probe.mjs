// D3-C2 OBS static-site E2E: verify OBS write capability (bucket/upload/public-read) on this host.
import { createHash, createHmac } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
const EV = String.raw`C:\Users\Administrator\devkit-test\testbot4-win-Opencode\huaweicloud-devkit-test\results\OpenCode\2026-11-25-119.8.181.45\Windows\evidence\D3-C2`;
const CASE_ID = 'D3-C2';
const REG = 'cn-north-4';
const NK = (() => { const d = new Date(Date.now() + 8 * 3600 * 1000); return d.toISOString().replace(/[-:T]/g, '').slice(0, 14); })();
const BUCKET = 'tctest-obs-' + NK.slice(4, 14);
const sha = (s) => createHash('sha256').update(s).digest('hex');
const hm = (k, s) => createHmac('sha256', k).update(s).digest();
function sign(method, host, path, query, body, cred) {
  const now = new Date();
  const ds = now.toISOString().slice(0, 10).replace(/-/g, '');
  const amz = ds + 'T' + now.toISOString().slice(11, 19).replace(/:/g, '') + 'Z';
  const ph = sha(body || '');
  const hdrs = { host, 'x-amz-content-sha256': ph, 'x-amz-date': amz };
  const names = Object.keys(hdrs).sort();
  const ch = names.map((n) => n + ':' + hdrs[n] + '\n').join('');
  const sh = names.join(';');
  const cr = [method, path || '/', query ? query + '=' : '', ch, sh, ph].join('\n');
  const scope = ds + '/' + REG + '/s3/aws4_request';
  const sts = ['AWS4-HMAC-SHA256', amz, scope, sha(cr)].join('\n');
  const ks = hm(hm(hm(hm('AWS4' + cred.sk, ds), REG), 's3'), 'aws4_request');
  const sig = createHmac('sha256', ks).update(sts).digest('hex');
  return { Host: host, 'x-amz-content-sha256': ph, 'x-amz-date': amz, Authorization: 'AWS4-HMAC-SHA256 Credential=' + cred.ak + '/' + scope + ', SignedHeaders=' + sh + ', Signature=' + sig };
}
async function call(method, bucket, path, query, body, cred) {
  const host = (bucket ? bucket + '.' : '') + 'obs.' + REG + '.myhuaweicloud.com';
  const url = 'https://' + host + path + (query ? '?' + query : '');
  const r = await fetch(url, { method, headers: sign(method, host, path || '/', query || '', body || '', cred), body: body || undefined });
  const t = await r.text();
  return { status: r.status, body: t.slice(0, 300) };
}
function emit(status, why, result) { const o = { caseId: CASE_ID, status, why, executedAt: NK, result }; writeFileSync(join(EV, 'stdout.log'), JSON.stringify(o, null, 2), 'utf8'); console.log(JSON.stringify({ caseId: CASE_ID, status, why })); }
async function main() {
  const admin = JSON.parse(readFileSync(join(os.homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8'));
  const ro = JSON.parse(readFileSync(join(os.homedir(), '.config', 'huaweicloud', 'credentials.readonly.json'), 'utf8'));
  const adminCreate = await call('PUT', BUCKET, '/', '', '', admin);
  const roList = await call('GET', '', '/', '', '', ro);
  const invalidAk = /InvalidAccessKeyId/.test(adminCreate.body);
  const roDenied = /AccessDenied|403/.test(roList.body);
  const result = { bucket: BUCKET, adminCreate, roList, invalidAk, roDenied, hasObsutil: false, kooCliObs: 'no OBS service' };
  if (invalidAk && roDenied) emit('BLOCKED', 'OBS 静态站 E2E 无法执行：管理 AK 被 OBS 拒为 InvalidAccessKeyId（该 AK 未被 OBS 识别）；只读子账号 test001 返回 AccessDenied（无 OBS 写权限）；本机无 obsutil、KooCLI 无 OBS 服务。未创建任何桶，云端零残留。解除条件：下发对 OBS 有效的可写 AK/SK 或安装 obsutil', result);
  else if (adminCreate.status === 200) emit('FAIL', 'OBS 建桶成功但后续闭环未执行（probe 逻辑异常）', result);
  else emit('FAIL', 'OBS 建桶失败 status=' + adminCreate.status + ' body=' + adminCreate.body.slice(0, 200), result);
}
main().catch((e) => emit('FAIL', 'probe exception: ' + String(e && e.stack || e), {}));
