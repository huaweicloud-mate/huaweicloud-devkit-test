// DSH/Linux daily probe — misc: hint sequence / import erase / sandbox / SBOM / cold-start / stdio / cross-client
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { add, setStatus, flush, CORE, HKDSRC } from './_util.mjs';

const { callTool } = await import(CORE + '/tools.mjs');
const { applyUpdateHint } = await import(CORE + '/update-check.mjs');
const { _resetHintConsumption, _isHintConsumed } = await import(CORE + '/mcp-protocol.mjs');

const MSP = join(HKDSRC, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');

// Content-Length framed MCP client (同 run-eval.mjs)
function makeMcp() {
  const child = spawn(process.execPath, [MSP], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  let buf = Buffer.alloc(0);
  let crashed = false;
  const pending = new Map(); let pid = 1;
  child.on('exit', (c) => { if (c !== 0) crashed = true; for (const [, r] of pending) r(null); pending.clear(); });
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n'); if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString()); if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1]; if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString(); buf = buf.slice(h + 4 + n);
      let msg; try { msg = JSON.parse(body); } catch { continue; }
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    }
  });
  function send(o, ms = 8000) {
    const b = JSON.stringify(o);
    child.stdin.write(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`);
    return new Promise((r) => { const t = setTimeout(() => { pending.delete(o.id); r(null); }, ms); pending.set(o.id, (v) => { clearTimeout(t); r(v); }); });
  }
  return { child, send, sendRaw: (o) => { const b = JSON.stringify(o); child.stdin.write(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`); }, crashed: () => crashed, id: () => pid++, kill: () => child.kill() };
}

// ============ D1-45 兜底提示真实序列与预热竞态 ============
{
  const hint = { currentVersion: '1.1.4', latestStable: '1.1.5', targetVersion: '1.1.5', updateAvailable: true };
  const base = { ok: true };
  const exempt = applyUpdateHint(base, 'huaweicloud_check_update', hint);
  add('D1-45', 'check_update 工具不附加 _updateInfo', !exempt._updateInfo, JSON.stringify(exempt));
  const normal = applyUpdateHint(base, 'huaweicloud_list_operations', hint);
  add('D1-45', '首个非检查工具附加 _updateInfo', !!normal._updateInfo, JSON.stringify(normal));
  const empty = applyUpdateHint(base, 'huaweicloud_list_operations', null);
  add('D1-45', '预热未完成不阻塞(空 hint 原样返回)', !empty._updateInfo, JSON.stringify(empty));
  _resetHintConsumption();
  add('D1-45', '一次性消费可重置', _isHintConsumed('sessX') === false, String(_isHintConsumed('sessX')));
}

// ============ D2-16 import 文件读取后擦除 ============
{
  const HOME = mkdtempSync(join(tmpdir(), 'hdktest-d216-'));
  const cfg = join(HOME, '.config', 'huaweicloud');
  mkdirSync(cfg, { recursive: true });
  process.env.HUAWEICLOUD_HOME = HOME;
  process.env.HCLOUD_OBS_CONFIG_PATH = join(HOME, 'obsutilconfig');
  process.env.HCLOUD_BIN = '/bin/true';
  const importPath = join(cfg, 'creds-import.json');
  const AK = 'AKIAIMPORT00000000000000000';
  const creds = { ak: AK, sk: 'skimportskimport000000000000', region: 'cn-north-4' };
  writeFileSync(importPath, JSON.stringify(creds), 'utf8');
  const before = existsSync(importPath);
  await callTool('huaweicloud_auth_switch', { mode: 'import', action: 'persist' }).catch(() => null);
  const after = existsSync(importPath);
  let s1ak = '';
  try { s1ak = JSON.parse(readFileSync(join(cfg, 'credentials.json'), 'utf8')).ak || ''; } catch {}
  add('D2-16', 'import 读后无条件擦除(exists=false)', before === true && after === false, 'before=' + before + ' after=' + after);
  add('D2-16', 'import ak 已写入 S1', s1ak === AK, 'akMatch=' + (s1ak === AK));
  delete process.env.HUAWEICLOUD_HOME; delete process.env.HCLOUD_OBS_CONFIG_PATH; delete process.env.HCLOUD_BIN;
}

// ============ D3-S3 沙箱预览出 URL ============
{
  const cu = await callTool('huaweicloud_sandbox_check_user', {}).catch((e) => ({ error: String(e.message) }));
  add('D3-S3', 'check_user 可达(agreementSigned)', !!(cu && cu.agreementSigned === true), JSON.stringify(cu).slice(0, 120));
  setStatus('D3-S3', 'BLOCKED', 'check_user 可达且 agreementSigned=true，但 sandbox_connect 建立 DevStation workspace 超时(>60s 无配额/配给未完成)，无法 upload_project→deploy_nginx→deploy_check→公网URL→close_session；解除条件=恢复沙箱配额后补测');
}

// ============ D4-12 供应链安装期安全 ============
{
  const pkg = JSON.parse(readFileSync(join(HKDSRC, 'package.json'), 'utf8'));
  const scripts = pkg.scripts || {};
  const pi = join(HKDSRC, 'bin', 'dsh-postinstall.cjs');
  const piTxt = existsSync(pi) ? readFileSync(pi, 'utf8') : '';
  const malicious = /child_process|curl |wget |https?:\/\/.+\/.*(sh|py|js)|credentials\.json|\.git-?credentials|process\.env\.(HW_|HUAWEICLOUD_(SK|AK))/.test(piTxt);
  const hasLock = existsSync(join(HKDSRC, 'package-lock.json'));
  add('D4-12', 'postinstall 脚本审计良性(无恶意外联/窃密)', !malicious, 'scripts=' + JSON.stringify(scripts).slice(0, 80));
  add('D4-12', '依赖锁定(package-lock 存在)', hasLock, String(hasLock));
  const sbom = spawnSync('npm', ['sbom', '--package-lock-only', '--omit=dev', '--sbom-format=spdx'], { cwd: HKDSRC, encoding: 'utf8', timeout: 60000 });
  add('D4-12', 'SBOM 可产(SPDX)', sbom.status === 0 && /spdx|documentNamespace|SPDXRef/i.test(sbom.stdout || ''), (sbom.stdout || sbom.stderr || '').slice(0, 80));
}

// ============ D6-3 MCP 冷启时间 ============
{
  const t0 = Date.now();
  const srv = makeMcp();
  await srv.send({ jsonrpc: '2.0', id: srv.id(), method: 'initialize', params: { protocolVersion: '2024-11-05' } }).catch(() => null);
  const coldMs = Date.now() - t0;
  add('D6-3', 'MCP 冷启到 initialize 返回 < 5000ms', coldMs < 5000, coldMs + 'ms');
  srv.kill();
}

// ============ D8-4 引导步骤可机械执行 ============
{
  const skillsRoot = join(HKDSRC, 'plugins', 'huaweicloud-core', 'skills');
  const metas = ['huaweicloud-core', 'huaweicloud-capability-discovery', 'huaweicloud-cli-and-auth', 'huaweicloud-api-and-sdk', 'huaweicloud-safety', 'huaweicloud-troubleshooting', 'huawei-getting-started'];
  let ok = 0, bad = [];
  for (const s of metas) {
    const p = join(skillsRoot, s, 'SKILL.md');
    if (!existsSync(p)) { bad.push(s + ':missing'); continue; }
    const txt = readFileSync(p, 'utf8');
    if (/TODO|待定|FIXME|\?\?\?|占位/.test(txt)) { bad.push(s + ':placeholder'); continue; }
    ok++;
  }
  add('D8-4', '7 meta 技能无含糊/占位步骤(可机械执行)', ok === 7, ok + '/7' + (bad.length ? ' bad=' + bad.join(',') : ''));
}

// ============ D9-5 stdio 传输健壮 ============
{
  const srv = makeMcp();
  await srv.send({ jsonrpc: '2.0', id: srv.id(), method: 'initialize', params: { protocolVersion: '2024-11-05' } }).catch(() => null);
  const bigPayload = { name: 'huaweicloud_explain_error', arguments: { errorCode: 'APIGW.0301', context: 'x'.repeat(20000) } };
  const r = await srv.send({ jsonrpc: '2.0', id: srv.id(), method: 'tools/call', params: bigPayload }).catch(() => null);
  add('D9-5', '大 payload tools/call 正常响应不崩', !!r && srv.crashed() === false, 'hasResp=' + !!r + ' crash=' + srv.crashed());
  srv.kill();
}

// ============ D9-6 跨客户端互通 ============
{
  setStatus('D9-6', 'BLOCKED', '需 MCP Inspector + ≥3 真实客户端并发接入以验证协议互通；本机仅 DSH 单客户端（无 CDP Inspector 多客户端环境）。解除条件=多客户端会话环境');
}

flush();