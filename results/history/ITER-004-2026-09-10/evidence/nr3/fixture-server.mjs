// 可控 npm registry fixture 服务器（NR3 版本升级提醒测试专用, 2026-09-10）
// 特性:
//  - GET /huaweicloud-devkit -> 按 fixture.json 返回 packument（可热切换: 每次请求重读文件）
//  - GET /huaweicloud-devkit/-/huaweicloud-devkit-<v>.tgz -> 流式返回本地 tarball
//  - 其他包（undici 等真实依赖）-> 代理到官方 registry.npmjs.org
//  - GET /__stats -> {hits:{packument, tgz, proxy}, total}
// 场景模式 (fixture.json):
//  {
//    "mode": "ok" | "error500" | "badjson" | "halt",
//    "delayMs": 0,                     // packument 响应延迟（预热竞态用）
//    "dist-tags": {"latest":"1.1.2","next":"1.1.3-next.2"},
//    "tarballs": {"1.1.2":"fj-old.tgz","1.1.3":"fj-new.tgz"},   // 版本 -> tarball 文件
//    "shasums": {"1.1.2":"<sha1hex>"},
//    "integrity": {"1.1.2":"sha512-<b64>"}
//  }
// 用法(CLI): node fixture-server.mjs --port 4399 --fixture <file> --tarballs <dir>
import http from 'node:http';
import { readFileSync, createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';

const PROXY_UPSTREAM = 'https://registry.npmjs.org';

export function startFixture({ fixturePath, tarballDir, port = 0, host = '127.0.0.1', log = false }) {
  const hits = { packument: 0, tgz: 0, proxy: 0 };
  let overlay = null; // /__set 内存覆盖（场景热切换不落盘，避免污染源场景文件——2026-09-10 实证）
  function loadFixture() {
    try {
      const base = JSON.parse(readFileSync(fixturePath, 'utf8'));
      return overlay ? { ...base, ...overlay } : base;
    } catch {
      return overlay ? { ...overlay } : null;
    }
  }
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, `http://${host}`);
    const fx = loadFixture() || {};
    const boundPort = server.address().port; // 动态端口场景 packument 必须用实际绑定端口（2026-09-10 实证 :0 bug）
    if (u.pathname === '/__stats') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ hits, total: hits.packument + hits.tgz + hits.proxy, overlay }));
      return;
    }
    if (u.pathname === '/__set') {
      // POST body: {"mode":"badjson"} 或 {"mode":"ok","dist-tags":{...}} —— 内存覆盖，不写源文件
      let body = '';
      req.on('data', (d) => { body += String(d); });
      req.on('end', () => {
        try {
          overlay = JSON.parse(body || '{}'); // 整体替换覆盖层；tarballs/shasums 仍取基础文件
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: true, overlay }));
        } catch (e) {
          res.writeHead(400, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }
    if (u.pathname === '/huaweicloud-devkit') {
      hits.packument++;
      if (fx.mode === 'error500') {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end('{"error":"fixture injected 500"}');
        return;
      }
      if (fx.mode === 'badjson') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end('{"latest": "1.1.2" broken-json!!!');
        return;
      }
      if (fx.mode === 'halt') {
        // 不响应：npm 等待到自身超时 -> status null -> check_failed
        req.on('close', () => {});
        return;
      }
      const delayMs = Number(fx.delayMs || 0);
      const body = JSON.stringify(packumentFor(fx, boundPort, host));
      setTimeout(() => {
        res.writeHead(200, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
        res.end(body);
      }, delayMs);
      return;
    }
    const tgzMatch = u.pathname.match(/^\/huaweicloud-devkit\/-\/huaweicloud-devkit-([^/]+)\.tgz$/);
    if (tgzMatch) {
      hits.tgz++;
      const v = tgzMatch[1];
      const file = fx.tarballs?.[v] ? join(tarballDir, fx.tarballs[v]) : null;
      if (file && existsSync(file)) {
        res.writeHead(200, { 'content-type': 'application/octet-stream' });
        createReadStream(file).pipe(res);
      } else {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end(`tarball not found: ${v}`);
      }
      return;
    }
    // 代理其他包到官方 registry（undici 等运行时依赖）
    hits.proxy++;
    try {
      const pRes = await fetch(PROXY_UPSTREAM + u.pathname, {
        headers: {
          accept: req.headers.accept || 'application/json',
          'user-agent': req.headers['user-agent'] || 'fixture-probe/1.0',
          'accept-encoding': 'identity',
        },
      });
      const buf = Buffer.from(await pRes.arrayBuffer());
      res.writeHead(pRes.status, {
        'content-type': pRes.headers.get('content-type') || 'application/json',
        'content-length': buf.length,
      });
      res.end(buf);
    } catch (e) {
      res.writeHead(502, { 'content-type': 'text/plain' });
      res.end('proxy error: ' + e.message);
    }
  });
  return new Promise((resolve) => {
    server.listen(port, host, () => {
      const actualPort = server.address().port;
      if (log) console.log(`[fixture] listening http://${host}:${actualPort} fixture=${fixturePath}`);
      resolve({
        url: `http://${host}:${actualPort}`,
        port: actualPort,
        hits,
        getStats: () => ({ ...hits, total: hits.packument + hits.tgz + hits.proxy }),
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

function packumentFor(fx, port, host) {
  const versions = {};
  for (const v of Object.keys(fx.tarballs || {})) {
    const dist = {
      tarball: `http://${host}:${port}/huaweicloud-devkit/-/huaweicloud-devkit-${v}.tgz`,
    };
    if (fx.shasums?.[v]) dist.shasum = fx.shasums[v];
    if (fx.integrity?.[v]) dist.integrity = fx.integrity[v];
    versions[v] = {
      name: 'huaweicloud-devkit',
      version: v,
      dist,
      engines: { node: '>=22' },
      // bin 字段必填：npx 依 packument 的 bin 决定可执行命令（缺失时报 could not determine executable to run——2026-09-10 实证）
      bin: { 'huaweicloud-devkit': './bin/setup.cjs', 'huaweicloud-devkit-mcp': './plugins/huaweicloud-core/src/mcp-server.mjs' },
    };
  }
  return { name: 'huaweicloud-devkit', 'dist-tags': fx['dist-tags'] || {}, modified: new Date().toISOString(), versions };
}

// CLI 模式
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) {
  const argv = process.argv.slice(2);
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const fixturePath = arg('--fixture');
  const tarballDir = arg('--tarballs') || '.';
  const port = Number(arg('--port') || 4399);
  if (!fixturePath) {
    console.error('usage: node fixture-server.mjs --port <p> --fixture <file> --tarballs <dir>');
    process.exit(1);
  }
  const s = await startFixture({ fixturePath, tarballDir, port, log: true });
  if (port === 0) console.log(`FIXTURE_PORT=${s.port}`); // 供父进程解析动态端口
  process.on('SIGINT', () => process.exit(0));
  setInterval(() => {}, 1 << 30);
}