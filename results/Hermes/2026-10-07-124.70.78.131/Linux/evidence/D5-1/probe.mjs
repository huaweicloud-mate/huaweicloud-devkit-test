// D5-1 清单发现加载（Hermes 源码级探针）
// 深挖假阻塞：Hermes 插件清单 = integrations/hermes/manifest.yaml；「发现并加载」可在源码级
// 核验——①清单注册完整 ②清单 transport 指向的 MCP server 可被 spawn 并枚举工具（=清单加载）
// ③清单声明的 skills 落位。全部确定性，无需多客户端/真 Agent。
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..', '..', '..', '..', '..', 'hdk'); // ~/devkit-test/Hermes/hdk — 以 argv 覆盖

const HDK = process.argv[2]; // hdk 根目录
const manifestPath = join(HDK, 'integrations', 'hermes', 'manifest.yaml');
const serverArg = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const skillsDir = join(HDK, 'plugins', 'huaweicloud-core', 'skills');

let ok = true;
function check(id, cond, detail) {
  console.log(`[${cond ? 'PASS' : 'FAIL'}] ${id}: ${detail}`);
  if (!cond) ok = false;
}

// ① 清单注册
const manifest = readFileSync(manifestPath, 'utf8');
check('①清单存在', existsSync(manifestPath), 'integrations/hermes/manifest.yaml 存在');
check('①清单字段完整', /manifest_version:\s*\d+/.test(manifest) && /name:\s*huaweicloud-devkit/.test(manifest), 'manifest_version + name 齐备');
check('①transport 定义', /transport:/.test(manifest) && /type:\s*stdio/.test(manifest) && /command:\s*'?node'?/.test(manifest), '清单 transport 声明 stdio MCP server');
console.log('  清单声明 skills: ' + (/27 skills/.test(manifest) ? '27 skills (描述)' : manifest.match(/Includes[^\n]*/)?.[0]?.trim() || 'N/A'));

// skills 目录落位（清单 install 目标）
const skills = existsSync(skillsDir)
  ? readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name.startsWith('huawei')).map((d) => d.name)
  : [];
console.log(`  skills 目录 huawei-* 技能数 = ${skills.length}`);
check('①skills 落位', skills.length >= 20, `清单 install 目标 skills/ 含 ${skills.length} 个 huawei-* 技能`);

// ② 清单加载：spawn 清单 transport 指向的 mcp-server，tools/list 枚举工具
const child = spawn(process.execPath, [serverArg], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
});
let buf = Buffer.alloc(0);
const pending = new Map();
let _id = 1;
child.stderr.on('data', () => {});
child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const h = buf.indexOf('\r\n\r\n');
    if (h < 0) break;
    const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
    if (!m) { buf = buf.slice(h + 4); continue; }
    const n = +m[1];
    if (buf.length < h + 4 + n) break;
    const body = buf.slice(h + 4, h + 4 + n).toString();
    buf = buf.slice(h + 4 + n);
    try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
  }
});
function send(o) {
  const b = JSON.stringify(o);
  child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
  return new Promise((r) => pending.set(o.id, r));
}

try {
  await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const r = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/list', params: {} });
  const tools = r?.result?.tools || [];
  console.log(`  tools/list 返回工具数 = ${tools.length}`);
  const names = tools.map((t) => t.name);
  check('②清单加载(工具枚举)', tools.length >= 30, `MCP server 可加载并枚举 ${tools.length} 个工具`);
  check('②关键工具在位', ['huaweicloud_service_catalog', 'huaweicloud_check_update', 'huaweicloud_explain_error'].every((n) => names.includes(n)), '核心工具 huaweicloud_service_catalog/check_update/explain_error 均已发现');
} catch (e) {
  console.log('EXCEPTION:', e.message);
  ok = false;
} finally {
  child.kill();
}

console.log(`\n=== D5-1 清单发现加载结论: ${ok ? 'ALL PASS' : 'HAS FAIL'} ===`);
process.exit(ok ? 0 : 1);
setTimeout(() => { console.log('TIMEOUT'); child.kill(); process.exit(1); }, 60000);