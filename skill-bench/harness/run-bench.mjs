// run-bench.mjs — 端到端技能评测 harness（可复现基线采集）
// 架构：直连 opengw(OpenAI 兼容) + devkit MCP 工具（自建 agent loop），忠实复现
//       「模型 + 40 工具 + retrieve_skill」的 agent 环境，采集三指标：
//       ① 任务成功率（ground-truth verifier 独立判定）② token 数 ③ 步数（工具调用次数）
// 不依赖 dsh（dsh headless 是黑盒，拿不到 token/步数）。
// 用法:
//   node harness/run-bench.mjs [task-id]               # 跑单个任务（默认 3 次采样）
//   node harness/run-bench.mjs --all                   # 跑全部任务
//   node harness/run-bench.mjs t01 --runs 5 --model deepseek-v4-flash-0731
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { startMcpServer, listTools, toOpenAITools, extractToolResult } from './mcp-client.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---- 配置（可被 env 覆盖）----
const CFG = {
  baseUrl: process.env.OPENGW_BASE_URL || 'https://opengw.clouddeveloper.club/v1',
  model: process.env.BENCH_MODEL || 'deepseek-v4-pro-0813',
  mcpServer: process.env.BENCH_MCP_SERVER || 'C:/Users/Administrator/.dsh/huaweicloud-plugins/src/mcp-server.mjs',
  region: process.env.BENCH_REGION || 'cn-north-4',
  credentialFile: resolve(os.homedir(), '.dsh', '.credentials.yaml'),
};

// ---- 参数解析 ----
const args = process.argv.slice(2);
let taskFilter = null;
let runs = 3;
let all = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--all') all = true;
  else if (args[i] === '--runs' && args[i + 1]) { runs = parseInt(args[++i], 10); }
  else if (args[i] === '--model' && args[i + 1]) { CFG.model = args[++i]; }
  else if (args[i] === '--mcp' && args[i + 1]) { CFG.mcpServer = args[++i]; }
  else if (!args[i].startsWith('--')) taskFilter = args[i];
}

// ---- 读取 API key（不打印）----
function readApiKey() {
  const txt = readFileSync(CFG.credentialFile, 'utf-8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*OPENGW_API_KEY\s*:\s*(.+?)\s*$/);
    if (m) return m[1];
  }
  throw new Error(`OPENGW_API_KEY 未在 ${CFG.credentialFile} 解析到`);
}

// ---- opengw chat ----
async function chat(apiKey, messages, tools) {
  const res = await fetch(`${CFG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: CFG.model, messages, tools, tool_choice: 'auto', temperature: 0, stream: false }),
  });
  if (!res.ok) throw new Error(`opengw HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

// ---- system prompt ----
function buildSystemPrompt(task, toolCount) {
  return [
    '你是接入华为云 devkit 插件的 coding agent。你的环境已通过 MCP 加载了华为云的工具（下文 tools 参数已列出全部可用工具，共 ' + toolCount + ' 个）。',
    '评测任务（评测环境 headless，无人工在场，请自主完成）：',
    '',
    '规则：',
    '1. 优先使用 devkit 技能与工具完成云任务，不要依赖模型记忆里的过时做法。开始前可用 huaweicloud_retrieve_skill 检索相关技能、huaweicloud_service_catalog 判断服务归属、huaweicloud_list_regions 确认区域。',
    '2. 写操作（创建/删除/修改云资源）必须先 huaweicloud_plan_cli_command 规划并拿到 approval token，再用 huaweicloud_run_approved_command 执行（本评测环境已启用自动审批，approvedByUser 恒为 true，但你必须先走 plan 拿 token）。',
    '3. 只读查询用 huaweicloud_run_readonly_command。构造 hcloud 命令前先用 huaweicloud_list_operations 确认参数名。',
    '4. 完成任务后，最终回答必须给出可独立验证的结果（例如部署后的公网 URL、查询到的账单金额、创建的安全组名称与规则）。' + (task.region ? ` 本任务区域默认 ${task.region}。` : ''),
  ].join('\n');
}

// ---- 单次 agent 运行（一个 run）----
async function runOnce(task, apiKey, mcpsrv, openaiTools, runid) {
  const prompt = task.prompt
    .replace(/\{\{RUNID\}\}/g, runid)
    .replace(/<FIXTURE_SITE>/g, join(ROOT, 'fixtures', 'site', 'index.html'));
  const messages = [
    { role: 'system', content: buildSystemPrompt(task, openaiTools.length) },
    { role: 'user', content: prompt },
  ];
  let totalTokens = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let stepCount = 0;
  let finalAnswer = '';
  const toolTrace = [];
  let lastError = null;
  const MAX_ROUNDS = 40;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const data = await chat(apiKey, messages, openaiTools);
    const usage = data.usage || {};
    promptTokens += usage.prompt_tokens || 0;
    completionTokens += usage.completion_tokens || 0;
    totalTokens += (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);

    const msg = data.choices?.[0]?.message;
    if (!msg) { lastError = '模型返回无 message'; break; }
    messages.push(msg);

    const toolCalls = msg.tool_calls || [];
    if (toolCalls.length === 0) { finalAnswer = msg.content || ''; break; }

    for (const tc of toolCalls) {
      stepCount++;
      let a = {};
      try { a = JSON.parse(tc.function.arguments || '{}'); } catch { a = {}; }
      // 审批自动放行：run_approved_command 恒注入 approvedByUser=true（模拟评测环境用户已确认）
      if (tc.function.name === 'huaweicloud_run_approved_command') a.approvedByUser = true;
      toolTrace.push(tc.function.name);
      let resultText;
      try {
        const resp = await mcpsrv.call('tools/call', { name: tc.function.name, arguments: a });
        resultText = extractToolResult(resp);
      } catch (e) {
        resultText = `TOOL_CALL_ERROR: ${e.message}`;
      }
      // 结果截断，防 token 暴涨
      messages.push({ role: 'tool', tool_call_id: tc.id, content: resultText.slice(0, 8000) });
    }
  }
  if (!finalAnswer && !lastError) lastError = `达到最大轮数 ${MAX_ROUNDS} 仍未产出最终回答`;

  return { runid, totalTokens, promptTokens, completionTokens, stepCount, finalAnswer: finalAnswer.slice(0, 4000), toolTrace, lastError };
}

// ---- verifier 调度（独立进程跑 ground-truth 判定）----
function runVerifier(verifierScript, argsList) {
  const script = verifierScript.startsWith('/') ? verifierScript : join(ROOT, verifierScript);
  if (!existsSync(script)) return { success: false, detail: `verifier 脚本不存在: ${script}` };
  const r = spawnSync('node', [script, ...argsList], { encoding: 'utf-8', timeout: 120000, cwd: ROOT });
  if (r.status !== 0) return { success: false, detail: `verifier 退出码 ${r.status}: ${(r.stderr || r.stdout || '').slice(0, 500)}` };
  try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch { return { success: false, detail: `verifier 输出非 JSON: ${r.stdout.slice(0, 300)}` }; }
}

// ---- 主流程 ----
async function main() {
  const tasks = JSON.parse(readFileSync(join(ROOT, 'tasks', 'tasks.json'), 'utf-8'));
  const selected = all ? tasks : tasks.filter((t) => t.id === taskFilter);
  if (selected.length === 0) { console.error(`未找到任务 ${taskFilter}，可用: ${tasks.map((t) => t.id).join(', ')}`); process.exit(2); }

  const apiKey = readApiKey();
  const mcpsrv = startMcpServer(CFG.mcpServer);
  const tools = await listTools(mcpsrv);
  const openaiTools = toOpenAITools(tools);
  console.log(`[harness] 模型=${CFG.model} 工具数=${tools.length} 任务=${selected.length} 采样=${runs}`);

  const ts = new Date().toISOString().replace(/[-:T]/g, '').replace(/Z/, '').replace(/\.\d+/, '');
  const tsCompact = ts.slice(0, 14);
  const allResults = [];

  for (const task of selected) {
    console.log(`\n=== 任务 ${task.id}（${task.title}）===`);
    const taskRuns = [];
    for (let i = 0; i < runs; i++) {
      const runid = `${tsCompact}-${task.id.split('-')[0]}-${i}`.toLowerCase();
      console.log(`  run ${i + 1}/${runs} (runid=${runid}) ...`);
      const r = await runOnce(task, apiKey, mcpsrv, openaiTools, runid);
      // 只有没有崩溃/卡死的 run 才跑 verifier
      let verdict = null;
      if (!r.lastError) {
        verdict = runVerifier(task.verifier, [runid, task.region || CFG.region, r.finalAnswer]);
      } else {
        verdict = { success: false, detail: `agent 未产出结果: ${r.lastError}` };
      }
      r.verdict = verdict.success ? 'PASS' : 'FAIL';
      r.verdictDetail = verdict.detail || '';
      taskRuns.push(r);
      console.log(`    verdict=${r.verdict} token=${r.totalTokens} step=${r.stepCount} ${verdict.detail ? '| ' + String(verdict.detail).slice(0, 80) : ''}`);
      // 写操作任务：每 run 后归零
      if (task.cleanup) {
        const ret = runVerifier(task.cleanup, [runid, task.region || CFG.region, '']);
        console.log(`    cleanup: ${ret.success ? 'OK' : 'FAIL ' + ret.detail}`);
      }
    }
    const pass = taskRuns.filter((r) => r.verdict === 'PASS').length;
    const med = taskRuns.map((r) => r.totalTokens).sort((a, b) => a - b)[Math.floor(taskRuns.length / 2)];
    const medStep = taskRuns.map((r) => r.stepCount).sort((a, b) => a - b)[Math.floor(taskRuns.length / 2)];
    allResults.push({ task: { id: task.id, title: task.title, expectedService: task.expectedService, expectedSkill: task.expectedSkill },
      runs: taskRuns, successRate: pass / runs, medianTokens: med, medianSteps: medStep });
  }

  mcpsrv.kill();

  // 落盘
  const outDir = join(ROOT, 'results');
  mkdirSync(outDir, { recursive: true });
  const outJson = join(outDir, `baseline-${tsCompact}.json`);
  writeFileSync(outJson, JSON.stringify({ meta: { ts, model: CFG.model, mcpServer: CFG.mcpServer, runs }, tasks: allResults }, null, 2), 'utf-8');
  console.log(`\n结果落盘: ${outJson}`);

  // 控制台汇总
  console.log('\n=== 首份基线汇总（token=中位数, step=中位数）===');
  for (const t of allResults) {
    console.log(`  ${t.task.id} ${t.task.title}: 成功率=${(t.successRate * 100).toFixed(0)}% (${t.runs.filter((r) => r.verdict === 'PASS').length}/${t.runs.length})  token中位=${t.medianTokens}  step中位=${t.medianSteps}`);
  }
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });