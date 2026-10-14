import { writeFileSync } from 'node:fs';
import http from 'node:http';
import { queryDistTagsFetch } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 180), expected: String(expected).slice(0, 180) });
}

// D1-60 HTTP 查询路径与自定义 registry（fetch 版）：自定义 registry 生效且去尾斜杠；失败/超时返回 null 不抛错。
const savedProxy = { HTTP_PROXY: process.env.HTTP_PROXY, HTTPS_PROXY: process.env.HTTPS_PROXY, ALL_PROXY: process.env.ALL_PROXY };
const savedReg = process.env.HUAWEICLOUD_NPM_REGISTRY;
// 关闭代理，避免本地服务器被路由到代理
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.ALL_PROXY;

let receivedPath = null;
const fastServer = http.createServer((req, res) => {
  receivedPath = req.url;
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ latest: '9.9.9', next: '2.0.0-next.0' }));
});

let slowTimer = null;
const slowServer = http.createServer((req, res) => {
  slowTimer = setTimeout(() => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ latest: '9.9.9' }));
  }, 10000);
});

try {
  await new Promise((resolve) => fastServer.listen(0, '127.0.0.1', resolve));
  const fastAddr = fastServer.address();
  process.env.HUAWEICLOUD_NPM_REGISTRY = `http://127.0.0.1:${fastAddr.port}/`; // 带尾斜杠
  const r1 = await queryDistTagsFetch({ timeoutMs: 3000 });
  test('D1-60-1', 'custom-registry-used-single-slash', receivedPath === '/-/package/huaweicloud-devkit/dist-tags', receivedPath, '/-/package/huaweicloud-devkit/dist-tags');
  test('D1-60-2', 'fetch-returns-dist-tags', r1 && r1.latest === '9.9.9' && r1.next === '2.0.0-next.0', JSON.stringify(r1), '{"latest":"9.9.9","next":"2.0.0-next.0"}');

  // 慢响应 + 短超时 -> abort 返回 null（不抛错）
  await new Promise((resolve) => slowServer.listen(0, '127.0.0.1', resolve));
  const slowAddr = slowServer.address();
  process.env.HUAWEICLOUD_NPM_REGISTRY = `http://127.0.0.1:${slowAddr.port}`;
  const t0 = Date.now();
  let threw = false;
  let r2 = null;
  try {
    r2 = await queryDistTagsFetch({ timeoutMs: 500 });
  } catch {
    threw = true;
  }
  const elapsed = Date.now() - t0;
  test('D1-60-3', 'slow-response-timeout-null-no-throw', r2 === null && threw === false, `r2=${r2},threw=${threw}`, 'null,false');
  test('D1-60-4', 'timeout-bounded', elapsed < 5000, `${elapsed}ms`, '<5000ms');

  // 连接拒绝（无监听端口）-> null（fetch 路径失败不抛错）
  process.env.HUAWEICLOUD_NPM_REGISTRY = 'http://127.0.0.1:1/';
  let r3 = null;
  let threw3 = false;
  try {
    r3 = await queryDistTagsFetch({ timeoutMs: 2000 });
  } catch {
    threw3 = true;
  }
  test('D1-60-5', 'connection-refused-null-no-throw', r3 === null && threw3 === false, `r3=${r3},threw=${threw3}`, 'null,false');
} finally {
  if (slowTimer) clearTimeout(slowTimer);
  if (slowServer.listening) slowServer.closeAllConnections?.();
  await new Promise((resolve) => (slowServer.listening ? slowServer.close(resolve) : resolve()));
  await new Promise((resolve) => (fastServer.listening ? fastServer.close(resolve) : resolve()));
  if (savedReg === undefined) delete process.env.HUAWEICLOUD_NPM_REGISTRY;
  else process.env.HUAWEICLOUD_NPM_REGISTRY = savedReg;
  if (savedProxy.HTTP_PROXY !== undefined) process.env.HTTP_PROXY = savedProxy.HTTP_PROXY;
  if (savedProxy.HTTPS_PROXY !== undefined) process.env.HTTPS_PROXY = savedProxy.HTTPS_PROXY;
  if (savedProxy.ALL_PROXY !== undefined) process.env.ALL_PROXY = savedProxy.ALL_PROXY;
}

const failed = results.filter((r) => !r.pass).length;
writeFileSync(
  new URL('./stdout.log', import.meta.url),
  JSON.stringify({ case: 'D1-60', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, results }, null, 2),
);