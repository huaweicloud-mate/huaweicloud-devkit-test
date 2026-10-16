// run-horizontal-eval.mjs — 横向技能实测（零真云成本）：激活可达性 + 路由（适用时）
// 背景：覆盖地图声称横向 8 技能「端到端天然带出」——属**断言非测量**（策略文档 P1 #5）。
//       本脚本把它们变成可复跑的数字：retrieve_skill 能否加载 + service_catalog 能否按意图推荐。
// 用法: node l2/run-horizontal-eval.mjs        （可选 BENCH_MCP_SERVER 指定被测包）
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = process.env.BENCH_MCP_SERVER || 'C:/Users/Administrator/.dsh/huaweicloud-plugins/src/mcp-server.mjs';

// 版本锚点：逐级上溯找 name=huaweicloud-devkit 的 package.json
function detectDevkitVersion() {
  if (process.env.BENCH_DEVKIT_VERSION) return process.env.BENCH_DEVKIT_VERSION;
  try {
    let dir = dirname(serverPath);
    for (let i = 0; i < 6; i++) {
      const p = join(dir, 'package.json');
      if (existsSync(p)) {
        try {
          const pkg = JSON.parse(readFileSync(p, 'utf-8'));
          if (pkg.name === 'huaweicloud-devkit') return `${pkg.name}@${pkg.version}`;
        } catch { /* 继续上溯 */ }
      }
      const up = dirname(dir);
      if (up === dir) break;
      dir = up;
    }
    return 'unknown';
  } catch { return 'unknown'; }
}

// 横向技能集：[技能名, 意图(可为空=不适用路由), 期望服务(可为空)]
// 新版技能名以 1.1.9-next.0 实测目录为准（其中 getting-started 归入 huaweicloud-core 侧能力发现链）
const H_SET = [
  ['huaweicloud-core', '我想了解华为云 devkit 能做什么、怎么开始', ''],
  ['huaweicloud-safety', '执行云操作前的安全注意事项与风险规则', ''],
  ['huawei-iac', '用基础设施即代码描述并创建一批云资源', ''],
  ['huaweicloud-api-and-sdk', '用 API 或 SDK 编程调用华为云服务', ''],
  ['huaweicloud-troubleshooting', '云资源创建失败或报错时如何排查定位', ''],
  ['huawei-getting-started', '第一次使用华为云，从哪开始', ''],
  ['huaweicloud-capability-discovery', '帮我找到能完成这个任务的技能或服务', ''],
  ['huaweicloud-cli-and-auth', '配置 KooCLI 认证与凭证以调用云服务', ''],
];

function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
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
    for (;;) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) return;
      const len = Number(/(?:^|\r\n)Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString())?.[1] || 0);
      const body = buf.slice(h + 4, h + 4 + len);
      if (body.length < len) return;
      buf = buf.slice(h + 4 + len);
      try {
        const o = JSON.parse(body.toString());
        if (o.id && pending.has(o.id)) { pending.get(o.id)(o); pending.delete(o.id); }
      } catch { /* 忽略非 JSON 帧 */ }
    }
  });
  return {
    call: (name, params) => send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: params } }),
    init: () => send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'horizontal-eval', version: '1.0' } } }),
    kill: () => child.kill(),
  };
}

const textOf = (r) => {
  const c = r?.result?.content;
  if (!Array.isArray(c)) return '';
  return c.filter((x) => x.type === 'text').map((x) => x.text).join('\n');
};

const srv = makeServer(serverPath);
await srv.init();

const results = [];
for (const [skill, intent, expectSvc] of H_SET) {
  const r2 = await srv.call('huaweicloud_retrieve_skill', { name: skill });
  let j2 = null;
  try { j2 = JSON.parse(textOf(r2)); } catch { /* 非 JSON=失败 */ }
  const skillHit = !!(j2 && j2.ok === true && j2.content);

  let routeHit = null;
  let svcs = [];
  if (intent) {
    const r1 = await srv.call('huaweicloud_service_catalog', { intent });
    let j1 = {};
    try { j1 = JSON.parse(textOf(r1)); } catch { /* 忽略 */ }
    svcs = j1.recommendedServices || [];
    routeHit = expectSvc ? svcs.some((s) => s.includes(expectSvc) || expectSvc.includes(s)) : null;
  }
  results.push({ skill, intent: intent || null, routeHint: svcs.join('/') || null, routeHit, skillHit });
  console.log(`${skill.padEnd(34)} 激活[${skillHit ? 'OK' : 'MISS'}]${intent ? `  路由[${svcs.join(',') || '兜底'}]` : '  路由[不适用]'}`);
}

const act = results.filter((r) => r.skillHit).length;
console.log(`\n=== 横向技能实测（${H_SET.length} 个）===`);
console.log(`retrieve_skill 激活成功=${act}/${H_SET.length}`);
const miss = results.filter((r) => !r.skillHit).map((r) => r.skill);
if (miss.length) console.log(`激活失败: ${miss.join(', ')}`);

const outDir = join(__dirname, 'results');
mkdirSync(outDir, { recursive: true });
const devkitVersion = detectDevkitVersion();
const slug = String(devkitVersion || 'unknown').replace(/[^0-9A-Za-z.-]/g, '_');
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync(join(outDir, `horizontal-eval-${ts}-${slug}.json`),
  JSON.stringify({ meta: { ts, mode: 'horizontal-activation', mcpServer: serverPath, devkitVersion, activated: act, total: H_SET.length }, results }, null, 2), 'utf-8');
console.log(`被测版本=${devkitVersion}`);
console.log(`结果落盘: l2/results/horizontal-eval-${ts}-${slug}.json`);
srv.kill();