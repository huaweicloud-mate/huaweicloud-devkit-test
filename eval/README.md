# D10 Agent 行为评测（可复现评测基建）

> 状态：**ITER-003-2026-09-09 建成 v1 → ITER-004 2026-09-19 建成 v2（真实 Agent 会话 harness）**
> 设计依据：docs/01-测试规划.md §D10（Azure ToolDescriptionEvaluator / AWS skill 激活率对标）
> 版本化：评测集 `eval-set-vN.csv`，每 Release 前评审更新一次；维护责任归测试负责人

## 结构

```
eval/
├── README.md                # 本文档
├── prompts/
│   ├── eval-set-v1.csv      # 自然语言评测集 v1（15 条，路由评测用，EXP-E01~E15）
│   └── eval-set-v2.csv      # 评测集 v2（15 条，加「期望skill」「安全期望」两列，供真实 Agent 评测）
├── harness/                 # 评测执行 harness（可重复跑）
│   ├── run-eval.mjs         # D10-3 路由评测（确定性：直调 serviceCatalog，无需 LLM）
│   ├── protocol-probe.mjs   # D9 协议层探针
│   ├── run-agent-eval.mjs   # ★ 真实 Agent 会话评测（驱动 dsh headless 真实 LLM）
│   └── fixtures/            # Issue #7 批次② 夹具/harness（D2-10/13、D9-6/9/10/11、EXP-D5-2-1/2-3）
└── results/                 # 每轮评测结果（模型/温度/激活skill/是否成功）
    └── README.md            # 结果记录格式与趋势说明
```

> **fixtures/ 用法**：`node eval/harness/fixtures/<script>.mjs <hdk src> [--evid <dir>]`，或 `run-all.mjs` 批量执行全部 8 项（详见 `eval/harness/fixtures/README.md`）。

## 两个 harness 的区别（关键）

| | `run-eval.mjs`（路由评测） | `run-agent-eval.mjs`（真实会话评测） |
|---|---|---|
| 测什么 | D10-3 路由映射对不对 | D10-1/2/5/9 Agent 行为（选工具/激活skill/走审批） |
| 驱动对象 | 直接 spawn mcp-server，调 `service_catalog` | 驱动 dsh headless（**真实 LLM** + 已接 devkit MCP） |
| 是否经 LLM | ❌ 否（确定性） | ✅ 是（真实模型决策） |
| 覆盖用例 | D10-3 | D10-1/D10-2/D10-5/D10-9 |

## 评测集（eval-set-v2.csv）列说明

| 列 | 内容 |
|---|---|
| id | EXP-E01~E15（与展开级矩阵同源） |
| prompt | 用户自然语言任务（中文，模拟真实场景） |
| 期望路由 | 正确服务/工具类别 |
| 期望动作 | read / plan / deploy / 诊断 / 执行 |
| 期望skill | 应激活的场景技能（huawei-ecs/obs/...） |
| 安全期望 | 只读（不产生写）/ 走审批（写操作须经确认） |
| 来源 | 展开级矩阵「D10评测集」行 |

## 真实 Agent 会话 harness 用法

```bash
# 全量 15 条（写操作类慢，建议分类跑）
node eval/harness/run-agent-eval.mjs

# 只跑某一动作类（成本控制）
node eval/harness/run-agent-eval.mjs --only read      # 只读类（快、无写风险）
node eval/harness/run-agent-eval.mjs --only 诊断       # 诊断类
node eval/harness/run-agent-eval.mjs --only 执行       # 领券等
node eval/harness/run-agent-eval.mjs --only plan       # 写规划类（慢，含审批流）

# 只跑前 N 条 / 指定评测集
node eval/harness/run-agent-eval.mjs --limit 3
node eval/harness/run-agent-eval.mjs ./prompts/自定义.csv

# 超时覆盖（默认 300s/条）
AGENT_EVAL_TIMEOUT_MS=180000 node eval/harness/run-agent-eval.mjs --only read
```

**前置条件**：本机 `dsh`（DeepSeek Harness）`--profile headless` 已接 devkit MCP 插件 + OpenGW 网关模型。
取证方式：从 Agent 真实输出抽取执行的 `hcloud <Service> <Operation>` 命令 + MCP 工具，判定动作类型（read/plan/deploy/诊断/执行）与安全期望（写操作是否走审批）是否达标。

## 可重复跑要求（D10-6 达标判据）

1. **固定采样参数**：固定主模型 + temperature=0（评测结果可比）
2. **版本化**：评测集 CSV 版本化（v1→vN），修改走 git 历史
3. **量化入趋势**：results/ 每轮记录 `时间戳/模型/用例数/激活率/路由准确率`，trends 追加
4. **成本预算**：每轮 ≤ 10 客户端 × 15 用例 × 3 模型 = 450 次调用上限；主模型 1 + 备选 2

## 执行方式

- **真实 Agent 会话评测**（D10-1/2/5/9）→ `run-agent-eval.mjs` 驱动 dsh headless（真实 LLM）
- **确定性路由评测**（D10-3）→ `run-eval.mjs` 直调 serviceCatalog，无需 LLM
- 安全用例按红线执行：只读/无破坏性，写操作须经审批确认

## 状态

- [x] ITER-003：目录结构 + eval-set-v1.csv（15 条）+ 本文档 —— 评测基建 v1 **建成**
- [x] ITER-004（2026-09-19）：`run-agent-eval.mjs` 真实 Agent 会话 harness + eval-set-v2.csv（三维度）+ 首轮分类基线（read 4/4、诊断 1/1、执行 1/1、plan/deploy 抽样达标）—— **建成**
- [ ] ITER-005+：写操作类（plan/deploy）全量基线 + 跨客户端（OpenCode/Codex 等 CDP 会话）扩展 + trends 趋势门