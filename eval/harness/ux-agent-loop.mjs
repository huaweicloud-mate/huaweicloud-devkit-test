// ux-agent-loop.mjs — D11-40 体验度量对照（范式④）· 自建 agent loop 版
//
// 为什么不用 `dsh --profile headless` 包一层：headless 只把**最终 assistant 消息**打到 stdout，
// 既无 token usage、也无工具调用/步数痕迹（本仓实测：10 条里 steps 恒为 0 → 三指标不可观测）。
// 本脚本改为**直接驱动 OpenAI 兼容网关**（dsh 的 opengw 路由），自己跑 tool-calling 循环：
//   - tokens       = Σ usage.prompt_tokens + completion_tokens（网关真实返回）
//   - steps        = MCP tools/call 实际调用次数
//   - fails        = 工具返回 isError 次数 + 网关/协议错误次数
//   - clarifications = 最终答复命中「追问用户」特征（复用 ux-metrics.mjs 的 CLARIFY_PATTERNS）
//
// 用法:
//   node eval/harness/ux-agent-loop.mjs [eval-set.csv] --mcp <mcp-server.mjs> [--limit N] [--model <id>]
//                                        [--max-rounds N] [--out <csv>] [--json <path>]
// 认证: env OPENGW_API_KEY / DEEPSEEK_API_KEY；缺失则回退读 ~/.dsh/.credentials.yaml 的 refs（仅内存使用、不落盘）
// 口径: 三指标仅用于**同 SUT 基线版 ↔ 新版**相对对照（不劣化 + 至少一项改善），不作绝对判定。
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { UX_METRIC_KEYS, compareUxMetrics } from './ux-metrics.mjs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');

const argv = process.argv.slice(2);
const argOf = (n) => {
  const i = argv.indexOf(n);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
};
const csvPath = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--mcp' && argv[i - 1] !== '--limit' &&
  argv[i - 1] !== '--model' && argv[i - 1] !== '--max-rounds' && argv[i - 1] !== '--out' && argv[i - 1] !== '--json' && argv[i - 1] !== '--baseline')
  || join(REPO, 'eval', 'prompts', 'eval-set-ux.csv');
const MCP_SERVER = argOf('--mcp');
const LIMIT = Number(argOf('--limit') || 0) || Infinity;
const MODEL = argOf('--model') || 'deepseek-v4-flash-0731';
const MAX_ROUNDS = Number(argOf('--max-rounds') || 8);
const OUT_CSV = argOf('--out');
const JSON_OUT = argOf('--json');
const BASELINE = argOf('--baseline');

if (!MCP_SERVER || !existsSync(MCP_SERVER)) {
  console.error('用法: node eval/harness/ux-agent-loop.mjs [eval-set.csv] --mcp <mcp-server.mjs> [--limit N]');
  process.exit(2);
}

// ---- 网关配置与凭据（只在本进程内存中使用）----
const BASE_URL = process.env.OPENGW_BASE_URL || 'https://opengw.clouddeveloper.club/v1';
function loadKey() {
  for (const k of ['OPENGW_API_KEY', 'DEEPSEEK_API_KEY']) if (process.env[k]) return process.env[k];
  const p = join(homedir(), '.dsh', '.credentials.yaml');
  if (!existsSync(p)) return null;
  const txt = readFileSync(p, 'utf8');
  const m = /^\s{2}([A-Z_]+):\s*(\S+)\s*$/gm;
  let hit = null;
  let x;
  while ((x = m.exec(txt)) !== null) {
    if (x[1] === 'OPENGW_API_KEY' || (x[1] === 'DEEPSEEK_API_KEY' && !hit)) hit = x[2];
  }
  return hit;
}
const API_KEY = loadKey();
if (!API_KEY) {
  console.error('缺少网关凭据：设 OPENGW_API_KEY / DEEPSEEK_API_KEY，或在 ~/.dsh/.credentials.yaml 的 refs 中提供');
  process.exit(2);
}

// ---- 评测集 ----
function readEvalSet(p) {
  const raw = readFileSync(p, 'utf-8').trim().split(/\r?\n/);
  const rows = [];
  for (const line of raw.slice(1)) {
    if (!line.trim()) continue;
    // 逐字符切分（允许 prompt 内出现逗号：按「期望路由」等后置列从右往左取）
    const f = splitCsvLine(line);
    if (f.length < 7) continue;
    rows.push({ id: f[0], prompt: f[1], route: f[2], action: f[3], skill: f[4], safety: f[5] });
  }
  return rows.slice(0, LIMIT === Infinity ? undefined : LIMIT);
}
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i += 1; } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

// ---- MCP stdio 客户端（Content-Length framing，与 eval/replay/replay.mjs 同实现）----
function makeMcp(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let id = 1;
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try {
        const msg = JSON.parse(body);
        if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
      } catch { /* ignore */ }
    }
  });
  const send = (o) => {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pending.set(o.id, r));
  };
  return {
    send,
    request: (method, params) => send({ jsonrpc: '2.0', id: id++, method, params }),
    notify: (method, params) => { send({ jsonrpc: '2.0', method, params }); },
    kill: () => { try { child.kill(); } catch { /* ignore */ } },
  };
}

// ---- 网关调用 ----
async function chat(messages, tools) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, tools, tool_choice: 'auto', max_tokens: 1500 }),
  });
  if (!res.ok) throw new Error(`gateway HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const CLARIFY = [
  /请提供/g, /需要你/g, /请确认/g, /你能告诉我/g, /请告诉我/g, /请问/g, /是否要/g, /需要我/g,
  /不明确/g, /你希望/g, /麻烦(?:你)?(?:提供|告诉)/g, /补充(?:一下)?(?:你)?(?:的)?(?:需求|信息|说明)/g,
];
const countClarify = (t) => CLARIFY.reduce((n, re) => n + ((String(t).match(new RegExp(re.source, 'g')) || []).length), 0);

const evalSet = readEvalSet(csvPath);
console.log(`[UX-Loop] 评测集=${csvPath}（${evalSet.length} 条） | MCP=${MCP_SERVER}`);
console.log(`[UX-Loop] model=${MODEL} | baseURL=${BASE_URL} | maxRounds=${MAX_ROUNDS}`);

const mcp = makeMcp(MCP_SERVER);
await mcp.request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'ux-agent-loop', version: '1' } });
mcp.notify('notifications/initialized', {});
const listed = await mcp.request('tools/list', {});
const tools = (listed?.result?.tools || []).map((t) => ({
  type: 'function',
  function: { name: t.name, description: t.description || '', parameters: t.inputSchema || { type: 'object', properties: {} } },
}));
console.log(`[UX-Loop] 挂载 MCP 工具 ${tools.length} 个\n`);
if (tools.length === 0) {
  console.error('[UX-Loop] MCP 未暴露任何工具 → 结果不可判定');
  mcp.kill();
  process.exit(2);
}

const rows = [];
for (const item of evalSet) {
  process.stdout.write(`${item.id} ${item.prompt.slice(0, 14)}… `);
  const messages = [
    { role: 'system', content: '你是华为云助手，请用中文回答用户。' },
    { role: 'user', content: item.prompt },
  ];
  let tokens = 0;
  let steps = 0;
  let fails = 0;
  let rounds = 0;
  let finalText = '';
  let error = '';
  try {
    for (rounds = 1; rounds <= MAX_ROUNDS; rounds += 1) {
      const resp = await chat(messages, tools);
      tokens += (resp.usage?.prompt_tokens || 0) + (resp.usage?.completion_tokens || 0);
      const msg = resp.choices?.[0]?.message || {};
      messages.push(msg);
      const calls = msg.tool_calls || [];
      if (calls.length === 0) { finalText = msg.content || ''; break; }
      for (const tc of calls) {
        steps += 1;
        let outText = '';
        try {
          const r = await mcp.request('tools/call', {
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments || '{}'),
          });
          const c = r?.result?.content?.[0]?.text ?? JSON.stringify(r?.result ?? r?.error ?? {});
          outText = String(c);
          if (r?.result?.isError || r?.error) fails += 1;
        } catch (e) {
          fails += 1;
          outText = `工具调用异常: ${e.message}`;
        }
        messages.push({ role: 'tool', tool_call_id: tc.id, content: outText.slice(0, 4000) });
      }
    }
  } catch (e) {
    error = e.message;
    fails += 1;
  }
  const clarifications = countClarify(finalText);
  console.log(`steps=${steps} tokens=${tokens} fails=${fails} clarif=${clarifications}${error ? ` ERR(${error.slice(0, 40)})` : ''}`);
  rows.push({
    id: item.id, prompt: item.prompt, route: item.route, action: item.action,
    steps, tokens, fails, clarifications, rounds, error, final: finalText.slice(0, 400),
  });
}
mcp.kill();

const sum = (k) => rows.reduce((n, r) => n + r[k], 0);
const summary = { steps: sum('steps'), tokens: sum('tokens'), fails: sum('fails'), clarifications: sum('clarifications'), cases: rows.length };
console.log('\n=== 体验度量（范式④，自建 loop：网关真实 usage + MCP 调用计数） ===');
console.log(`用例=${summary.cases} | steps=${summary.steps} tokens=${summary.tokens} fails=${summary.fails} clarifications=${summary.clarifications}`);
console.log('口径：仅用于同 SUT「基线版 ↔ 新版」相对对照（不劣化 + 至少一项改善），不作绝对判定。');

let cmp = null;
if (BASELINE) {
  if (!existsSync(BASELINE)) {
    console.error(`[UX-Loop] 基线文件不存在: ${BASELINE}`);
    process.exit(2);
  }
  const b = JSON.parse(readFileSync(BASELINE, 'utf8'));
  cmp = compareUxMetrics(b.summary || {}, summary);
  console.log(`\n=== D11-40 对照判定（基线 = ${BASELINE}）===`);
  for (const k of UX_METRIC_KEYS) {
    const d = cmp.detail[k];
    const mark = d.delta > 0 ? '劣化' : d.delta < 0 ? '改善' : '持平';
    console.log(`  ${k.padEnd(15)} 基线=${String(d.baseline).padStart(7)} 当前=${String(d.current).padStart(7)} Δ=${d.delta} ${mark}`);
  }
  console.log(`  退化项: ${cmp.regressed.join(', ') || '无'} | 改善项: ${cmp.improved.join(', ') || '无'}`);
  console.log(`  判定: ${cmp.pass ? 'PASS（均不劣化且至少一项严格改善）' : 'NOT_MET（存在劣化，或无任何改善）'}`);
}

const outCsv = OUT_CSV || join(REPO, 'eval', 'results', `ux-agent-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.csv`);
mkdirSync(dirname(outCsv), { recursive: true });
const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
writeFileSync(outCsv, ['id,prompt,route,action,steps,tokens,fails,clarifications,rounds,error']
  .concat(rows.map((r) => [r.id, r.prompt, r.route, r.action, r.steps, r.tokens, r.fails, r.clarifications, r.rounds, r.error].map(esc).join(',')))
  .join('\n') + '\n', 'utf-8');
console.log(`结果落盘: ${outCsv}`);

if (JSON_OUT) {
  writeFileSync(JSON_OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), model: MODEL, mcp: MCP_SERVER,
  baseline: BASELINE || null, comparison: cmp, summary, cases: rows }, null, 2)}\n`, 'utf-8');
  console.log(`结构化结果已写出: ${JSON_OUT}`);
}
process.exit(rows.some((r) => r.error) ? 2 : 0);