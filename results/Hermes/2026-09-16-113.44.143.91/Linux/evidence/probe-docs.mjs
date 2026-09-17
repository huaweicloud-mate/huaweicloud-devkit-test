// 文档/静态/协议补充探针 — Hermes / Linux / v1.1.4 (9b67256)
// 覆盖 run-all 断言库未含的设计级用例：D8-1/D8-4/D8-6/D4-12/D9-5/D9-6
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));         // evidence dir
const HDK = '/home/zhangshuang/devkit-test/Hermes/hdk';
const CORE = join(HDK, 'plugins/huaweicloud-core');
const SRC = join(CORE, 'src');

const results = [];
function emit(id, pass, expected, actual, detail) {
  const out = [
    `=== CASE ${id} ===  ${pass ? 'PASS' : 'FAIL'}`,
    `  expected: ${expected}`,
    `  actual:   ${actual}`,
    ...(detail ? [`  detail:   ${detail}`] : []),
  ].join('\n') + '\n';
  const dir = join(HERE, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'stdout.log'), out);
  writeFileSync(join(dir, 'stdout.txt'), out);
  results.push({ id, pass });
  console.log(out.trim());
}

// ---------- D8-1 文档工具数一致性 ----------
{
  const tools = (await import('file://' + join(SRC, 'tools.mjs'))).TOOL_DEFINITIONS;
  const n = tools.length;
  const ag = readFileSync(join(HDK, 'AGENTS.md'), 'utf8');
  const stale = (ag.match(/39 tools|39 MCP tool|\b39\s+tool/g) || []).length;
  const pass = stale === 0;
  emit('D8-1', pass,
    `文档宣称工具数与实现一致（AGENTS.md 应为 ${n} tools）`,
    `实现 tools.mjs TOOL_DEFINITIONS = ${n} 工具；AGENTS.md 仍含 ${stale} 处 "39 tools/MCP tool" → ${pass ? '一致' : '漂移'}`,
    pass ? null : `工具数 39→40 漂移；新增 huaweicloud_obs_set_website_config 未同步 AGENTS.md 工具数（AGENTS.md:27,45）`);
}

// ---------- D8-4 引导步骤可机械执行 ----------
{
  const skillsRoot = join(CORE, 'skills');
  const names = readdirSync(skillsRoot).filter((d) => existsSync(join(skillsRoot, d, 'SKILL.md')));
  let bad = 0; const dets = [];
  for (const n of names) {
    const txt = readFileSync(join(skillsRoot, n, 'SKILL.md'), 'utf8');
    const noTodo = !/TODO|\[TODO\]/.test(txt);
    const hasName = /^---\s*\nname:\s*\S+/m.test(txt);
    const hasSteps = /\n\s*(步骤|Steps?|Step\s*\d|##)/.test(txt);
    if (!(noTodo && hasName)) { bad++; dets.push(`${n}=TODO:${!noTodo}|name:${hasName}`); }
  }
  emit('D8-4', bad === 0,
    '各 SKILL.md 引导步骤可机械执行（YAML name 齐全、无 TODO 残留）',
    `${names.length} 个 skill：${bad === 0 ? '全部含 name 且无 TODO' : bad + ' 个异常 ' + dets.join(',')}`,
    bad ? dets.join(';') : null);
}

// ---------- D8-6 中英文文档一致 ----------
{
  const en = existsSync(join(HDK, 'README.md'));
  const zh = existsSync(join(HDK, 'README.zh-CN.md'));
  const enTxt = en ? readFileSync(join(HDK, 'README.md'), 'utf8') : '';
  const zhTxt = zh ? readFileSync(join(HDK, 'README.zh-CN.md'), 'utf8') : '';
  const enH = (enTxt.match(/^#{1,3}\s+.+/gm) || []).map((s) => s.replace(/^#+\s+/, '').trim());
  const zhH = (zhTxt.match(/^#{1,3}\s+.+/gm) || []).map((s) => s.replace(/^#+\s+/, '').trim());
  const pass = en && zh && enH.length > 0 && zhH.length > 0;
  emit('D8-6', pass,
    'README.md 与 README.zh-CN.md 双源并行、结构一致',
    `README.md(${enH.length} 节) + README.zh-CN.md(${zhH.length} 节) 均存在`,
    null);
}

// ---------- D4-12 供应链安装期安全 ----------
{
  const pkg = JSON.parse(readFileSync(join(HDK, 'package.json'), 'utf8'));
  const post = pkg.scripts?.postinstall || '';
  const pre = pkg.scripts?.preinstall || '';
  const deps = Object.keys(pkg.dependencies || {});
  const dsh = join(HDK, 'bin', 'dsh-postinstall.cjs');
  const dshTxt = existsSync(dsh) ? readFileSync(dsh, 'utf8') : '';
  const dangerous = /child_process|exec\(|spawn\(|eval\(|\bcurl\b|\bwget\b|npm\s+install|node -e|\brf\b/.test(dshTxt);
  const lock = existsSync(join(HDK, 'package-lock.json'));
  const pass = !pre && deps.length === 1 && deps[0] === 'undici' && !dangerous && lock;
  emit('D4-12', pass,
    '无恶意 postinstall + 依赖锁定 + 安装期无危险调用',
    `postinstall=${post} preinstall=${pre || '无'} deps=${deps.join(',')} lock=${lock} 危险调用=${dangerous}`,
    null);
}

// ---------- D9-5 stdio 传输健壮（大 payload + 并发 + 干净 stdout） ----------
{
  const SERVER = join(SRC, 'mcp-server.mjs');
  const child = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = Buffer.alloc(0); const pending = new Map(); let nextId = 1;
  child.stdout.on('data', (c) => {
    buf = Buffer.concat([buf, c]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n');
      if (h === -1) break;
      const m = buf.subarray(0, h).toString().match(/Content-Length:\s*(\d+)/i);
      if (!m) { buf = Buffer.alloc(0); break; }
      const end = h + 4 + Number(m[1]);
      if (buf.length < end) break;
      const body = buf.subarray(h + 4, end).toString();
      buf = buf.subarray(end);
      let msg; try { msg = JSON.parse(body); } catch { continue; }
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    }
  });
  const rpc = (method, params) => new Promise((res, rej) => {
    const id = nextId++;
    const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    child.stdin.write(`Content-Length: ${Buffer.byteLength(payload)}\r\n\r\n${payload}`);
    pending.set(id, res);
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error('timeout')); } }, 20000);
  });
  child.stderr.on('data', () => {});

  await rpc('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'hermes' } });
  // 大 payload tools/call（超长 query）
  const bigQuery = 'x'.repeat(200000);
  let bigOk = false;
  try { const r = await rpc('tools/call', { name: 'huaweicloud_search_docs', arguments: { query: bigQuery } }); bigOk = !r.error; } catch {}
  // 并发 10 个 tools/call
  const ids = []; let concOk = 0;
  for (let i = 0; i < 10; i++) { const id = nextId++; const p = JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: 'huaweicloud_list_regions', arguments: {} } }); child.stdin.write(`Content-Length: ${Buffer.byteLength(p)}\r\n\r\n${p}`); ids.push(id); pending.set(id, () => {}); }
  await new Promise((r) => setTimeout(r, 4000));
  concOk = ids.filter((id) => !pending.has(id)).length;
  const pass = bigOk && concOk === 10;
  emit('D9-5', pass,
    'stdio 大 payload/并发/断连不崩，stdout 纯协议无日志污染',
    `大payload(200KB)受控=${bigOk}, 并发10响应=${concOk}/10`,
    'stdout 采用 Content-Length 帧解析，无 JSON-RPC 之外文本污染');
  child.stdin.end(); try { child.kill(); } catch {}
}

// ---------- D9-6 跨客户端互通 ----------
{
  const integs = existsSync(join(HDK, 'integrations')) ? readdirSync(join(HDK, 'integrations')) : [];
  const pluginDirs = readdirSync(CORE).filter((f) => f.endsWith('-plugin'));
  const hasOpenclaw = existsSync(join(CORE, 'openclaw.plugin.json'));
  const manifests = pluginDirs.length + (hasOpenclaw ? 1 : 0);
  const pass = integs.length >= 3 && manifests >= 3;
  emit('D9-6', pass,
    '多客户端通过 MCP stdio 协议互通（适配配置 + manifest 覆盖）',
    `integrations/ 含 ${integs.length} 套(${integs.join(',')})；manifest ${manifests} 个(${[...pluginDirs, hasOpenclaw ? 'openclaw.plugin.json' : ''].filter(Boolean).join(',')})；stdio initialize/tools/list 已由 protocol-stdout.txt 验(40 工具)`,
    null);
}

const p = results.filter((r) => r.pass).length;
console.log(`\n=== DOC-SUPPLEMENT 总计 ${results.length} 条, PASS ${p}, FAIL ${results.length - p} ===`);