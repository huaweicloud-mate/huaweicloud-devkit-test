// D1-41 check_update MCP 契约 + D1-42 dismiss 真实闭环 + D2-4 lowercase 脱敏复核
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SERVER = process.env.HDK_MCP_SERVER;
const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const sp = await import(`file://${HDK}/src/safety-policy.mjs`);
const uc = await import(`file://${HDK}/src/update-check.mjs`);

function writeEv(id, status, expected, actual, detail) {
  mkdirSync(join(EVID, id), { recursive: true });
  writeFileSync(join(EVID, id, 'stdout.txt'),
    `=== CASE ${id} ===  ${status}\n  expected: ${expected}\n  actual:   ${actual}\n  detail:   ${detail || ''}\n`, 'utf-8');
  console.log(`${status.padEnd(6)} ${id}  ${actual.slice(0,130)}`);
}

function spawnServer() {
  const child = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'ignore'] });
  let buf = ''; const pending = new Map(); let nextId = 1;
  child.stdout.on('data', (d) => {
    buf += d.toString('utf8'); let i;
    while ((i = buf.indexOf('\n')) !== -1) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!l) continue; let m; try { m = JSON.parse(l); } catch { continue; } if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } }
  });
  return { child, rpc(method, params) { return new Promise((r) => { const id = nextId++; pending.set(id, r); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }) + '\n'); }); } };
}

const srv = spawnServer();
await srv.rpc('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'hermes' } });

// D1-41 check_update 真实 MCP 返回契约
{
  const r = await srv.rpc('tools/call', { name: 'huaweicloud_check_update', arguments: {} });
  let o = {};
  try { o = JSON.parse(r.result.content[0].text); } catch { o = { raw: (r.result?.content?.[0]?.text) || '' }; }
  const ok = o.currentVersion && o.result;
  writeEv('D1-41', ok ? 'PASS' : 'FAIL', 'check_update 真实 MCP 返回 {currentVersion, result} 契约',
    `currentVersion=${o.currentVersion}, result=${o.result}, keys=${Object.keys(o).join(',')}`, '');
}
// D1-42 dismiss 真实闭环 (readSkipState + judgeUpdate 跨调用)
{
  const f = uc.skipFilePath();
  uc.writeSkipState(f, '9.9.9', { at: Date.now() });
  const st1 = uc.readSkipState(f);
  const j1 = uc.judgeUpdate('1.1.4', { latest: '9.9.9', next: '9.9.9' }, st1, Date.now()).result;
  // 跨调用: 重新读 skip state 再判
  const st2 = uc.readSkipState(f);
  const j2 = uc.judgeUpdate('1.1.4', { latest: '9.9.9', next: '9.9.9' }, st2, Date.now()).result;
  // 清理
  uc.writeSkipState(f, '', { at: 0 });  // reset
  const ok = j1 === 'dismissed' && j2 === 'dismissed';
  writeEv('D1-42', ok ? 'PASS' : 'FAIL', 'dismiss 落盘 → 读回 → 跨调用仍 dismissed',
    `首判=${j1}, 跨调用=${j2}`, `skipPath=${f}`);
}
// D2-4 凭证脱敏 (对象 + lowercase 字符串)
{
  const obj = sp.redactSecrets({ accessKeyId: 'AK123secret', secretAccessKey: 'sk_abcdef', region: 'cn-north-4' });
  const lower = sp.redactSecrets('ak=AK123456 sk=SKsecret');
  const upper = sp.redactSecrets('AK=AK123456 SK=SKsecret');
  const objOk = obj.accessKeyId === '<redacted>' && obj.secretAccessKey === '<redacted>';
  const lowerLeak = lower === 'ak=AK123456 sk=SKsecret';  // 未脱敏 = 缺陷
  const upperOk = /<redacted>/.test(upper);
  writeEv('D2-4', (objOk && !lowerLeak && upperOk) ? 'PASS' : 'FAIL',
    '凭证字段与字符串(含小写 ak=/sk=)均脱敏 <redacted>',
    `对象脱敏=${objOk}, lowercase字符串=${lower}(未脱敏=缺陷), uppercase=${upper}`,
    'safety-policy.mjs:45 .replace(/(AK|SK).../g) 大小写敏感无 /i → lowercase ak=/sk= 漏网(findings #3)');
}

srv.child.stdin.end();
setTimeout(() => process.exit(0), 200);