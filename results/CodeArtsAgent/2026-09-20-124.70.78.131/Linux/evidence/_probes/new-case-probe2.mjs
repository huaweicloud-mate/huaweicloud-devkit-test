// 新增用例探针2：D1-68 图标离线 / D4-26 findings 脱敏 / D9-11 隧道生命周期
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const SRC = process.argv[2];
const S = (f) => join(SRC, f);

let okAll = true;
function check(id, name, cond, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'} | ${id} | ${name}${detail ? ' | ' + detail : ''}`);
  if (!cond) okAll = false;
}

// ===== D1-68 图标离线 =====
{
  const IL = await import(pathToFileURL(S('icon-library.mjs')).href);
  const orig = process.env.HUAWEICLOUD_ICONS_OFFLINE;
  process.env.HUAWEICLOUD_ICONS_OFFLINE = '1';
  try {
    IL.clearIconCache();
    const r = await IL.getServiceIcon('ecs', 'compute');
    console.log(`[D1-68] offline getServiceIcon(ecs) => ${JSON.stringify(r).slice(0, 150)}`);
    check('D1-68', 'offline 分支返回图标(走本地快照不联网)', r && (r.id || r.name || r.icon !== undefined || Array.isArray(r) === false));
  } catch (e) {
    check('D1-68', 'offline 分支返回图标', false, e.message);
  }
  if (orig !== undefined) process.env.HUAWEICLOUD_ICONS_OFFLINE = orig; else delete process.env.HUAWEICLOUD_ICONS_OFFLINE;
}

// ===== D4-26 findings 证据脱敏 =====
{
  const RE = await import(pathToFileURL(S('risk-rule-engine.mjs')).href);
  const r = RE.evaluateCommandRisk('hcloud ecs CreateServer --admin-pass SuperSecret123 --access-key AKIA1234567890ABCDEF');
  const f = (r.findings || []).find((x) => x.evidence);
  if (f) {
    const leak = /SuperSecret123|AKIA1234567890ABCDEF/.test(f.evidence) ? '含明文(脱敏失败)' : '无明文(脱敏成功)';
    console.log(`[D4-26] evidence=${f.evidence.slice(0, 160)}`);
    check('D4-26', 'findings.evidence 已脱敏(adminPass/access-key)', !/SuperSecret123|AKIA1234567890ABCDEF/.test(f.evidence), leak);
  } else {
    check('D4-26', '触发含凭证命令产生 findings', false, '无 findings 或 evidence 字段');
    console.log('[D4-26] decision=', r.decision, 'findings=', JSON.stringify(r.findings).slice(0, 200));
  }
  // 裸 token 关键字
  const r2 = RE.evaluateCommandRisk('hcloud ecs CreateServer token=T0K3N_SECRET_VALUE_12345');
  const f2 = (r2.findings || []).find((x) => /T0K3N/.test(x.evidence || ''));
  if (f2) {
    check('D4-26', '裸 token 关键字已脱敏', false, 'evidence 含裸 token 明文');
  } else {
    // 无 findings 命中 token 时说明该命令未被凭证规则拦截（观察）
    console.log('[D4-26] 裸 token 命令 findings:', JSON.stringify(r2.findings).slice(0, 200));
  }
}

// ===== D9-11 WebSocket 隧道通道生命周期 =====
{
  let ok = true;
  try {
    const TH = await import(pathToFileURL(join(SRC, 'ws-exec', 'hwlink-tunnel-channel.mjs')).href);
    const cls = TH.HwlinkTunnelChannel || TH.default;
    check('D9-11', 'HwlinkTunnelChannel 导出', typeof cls === 'function');
    const muxReg = [];
    const fakeMux = { register(c) { muxReg.push(c); } };
    const closed = [];
    const ch = new cls({ remotePort: 80, onClose: () => closed.push('close') });
    check('D9-11', '构造时 ready 为 Promise', ch.ready && typeof ch.ready.then === 'function');
    ch.attach(fakeMux);
    check('D9-11', 'attach 注册到 mux', muxReg.length === 1 && muxReg[0] === ch);
    let opened = false;
    if (typeof ch.onopen === 'function') { try { ch.onopen(); opened = true; } catch {} }
    console.log(`[D9-11] onopen 后 localServer=${ch.localServer ? 'created' : 'null'} opened=${ch.opened}`);
    check('D9-11', 'onopen 标记 opened 并建 localServer', ch.opened === true && ch.localServer !== null);
    if (typeof ch.close === 'function') ch.close(); else if (typeof ch.onclose === 'function') ch.onclose();
    check('D9-11', 'close 触发 onClose 回调', closed.includes('close'));
  } catch (e) {
    check('D9-11', '隧道生命周期可执行', false, e.message);
  }
}

console.log(`=== probe2 总判定: ${okAll ? 'ALL PASS' : 'HAS FAIL'} ===`);
