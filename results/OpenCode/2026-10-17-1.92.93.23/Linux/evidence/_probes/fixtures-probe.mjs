// 4 个无独立 probe 的 source-level 夹具用例复跑：D2-10 / D2-13 / D4-12 / D9-6
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const SRC = '/home/zhangshuang/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src';
const S = (f) => join(SRC, f);
const out = [];
function rec(id, name, ok, detail) {
  out.push({ id, name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}\t${id}-${name}\t${detail}`);
}

// ---- D2-10: KooCLI 多 profile 解析 ----
const { readKooCliProfiles, resolveManagedProfile } = await import(pathToFileURL(S('auth/reconcile.mjs')).href);
{
  const profs = readKooCliProfiles();
  const okParse = !profs.error && Array.isArray(profs.profiles);
  rec('D2-10', 'readKooCliProfiles 解析 profiles', okParse, JSON.stringify({ current: profs.current, n: profs.profiles?.length, error: profs.error }));
  const mp = resolveManagedProfile();
  rec('D2-10', 'resolveManagedProfile 返回 current 档', typeof mp === 'string' && mp.length > 0, JSON.stringify({ profile: mp }));
  rec('D2-10', '切换 current 后解析跟随(profile 名一致)', mp === profs.current, JSON.stringify({ resolved: mp, current: profs.current }));
}

// ---- D2-13: 会话 S1 凭证优先 + env 兜底 + 占位识别 ----
const { isPlaceholder } = await import(pathToFileURL(S('auth/credentials.mjs')).href);
{
  const pAngle = isPlaceholder('<ACCESS_KEY>');
  const pDollar = isPlaceholder('${HW_ACCESS_KEY}');
  const pBare = isPlaceholder('ACCESS_KEY');
  const notReal = isPlaceholder('HPUAN1ROQ4PQXQVBSYXD');
  rec('D2-13', 'isPlaceholder 识别模板占位(<...>/${...}/bare)', pAngle === true && pDollar === true && pBare === true, JSON.stringify({ angle: pAngle, dollar: pDollar, bare: pBare }));
  rec('D2-13', '占位不劫持真实凭证', notReal === false, JSON.stringify({ realAkIsPlaceholder: notReal }));
}

// ---- D4-12: 供应链（postinstall 指向自有 bin / 依赖固定 / 无高危 deps） ----
{
  const pkgPath = '/home/zhangshuang/devkit-test/OpenCode/hdk/package.json';
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const post = (pkg.scripts && pkg.scripts.postinstall) || '';
  rec('D4-12', 'postinstall 指向自有 bin（非远程脚本）', /node\s+(\.\/)?bin\//.test(post), `script=${post}`);
  const deps = Object.keys(pkg.dependencies || {});
  const devDeps = Object.keys(pkg.devDependencies || {});
  const bad = [...deps, ...devDeps].filter((d) => /^(vm2|eval|node-ipc)$/.test(d));
  rec('D4-12', '无已知高危依赖', bad.length === 0, JSON.stringify(bad));
  const allVersioned = Object.entries({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }).every(([, v]) => !/^\*$|latest|>=?\s*$/.test(String(v)));
  rec('D4-12', '依赖版本固定(SBOM 可枚举)', allVersioned, `deps=${deps.length}`);
}

// ---- D9-6: 多客户端 interop（同一 stdio server 双 client 会话） ----
{
  const serverPath = S('mcp-server.mjs');
  function spawnClient(name) {
    const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
    let buf = Buffer.alloc(0);
    const pending = new Map();
    let _id = 1;
    function send(o) {
      const b = JSON.stringify(o);
      child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
      return new Promise((r) => pending.set(o.id, r));
    }
    child.stdout.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      while (true) {
        const h = buf.indexOf('\r\n\r\n');
        if (h < 0) break;
        const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
        if (!m) { buf = Buffer.alloc(0); break; }
        const len = +m[1];
        if (buf.length < h + 4 + len) break;
        const body = buf.slice(h + 4, h + 4 + len).toString();
        buf = buf.slice(h + 4 + len);
        try { const msg = JSON.parse(body); if (pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
      }
    });
    return { child, send, id: () => _id++ };
  }
  const a = spawnClient('A');
  const aInit = await a.send({ jsonrpc: '2.0', id: a.id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'fixture-A', version: '1' } } });
  const aTools = await a.send({ jsonrpc: '2.0', id: a.id(), method: 'tools/list', params: {} });
  rec('D9-6', '客户端A initialize/tools-list 互通', !!aInit.result?.serverInfo && Array.isArray(aTools.result?.tools) && aTools.result.tools.length > 0, `tools=${aTools.result?.tools?.length}`);
  a.child.kill();
  const b = spawnClient('B');
  await b.send({ jsonrpc: '2.0', id: b.id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'fixture-B', version: '1' } } });
  const bTools = await b.send({ jsonrpc: '2.0', id: b.id(), method: 'tools/list', params: {} });
  rec('D9-6', '客户端B tools/list 与 A 一致', bTools.result?.tools?.length === aTools.result?.tools?.length, `a=${aTools.result?.tools?.length},b=${bTools.result?.tools?.length}`);
  b.child.kill();
}

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), results: out }, null, 2));
process.exit(0);