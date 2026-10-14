# skill-bench — 华为云 devkit 技能评测专项

独立于每日测试流水的「技能评测体系」专项。评测 devkit 的**技能是否让 agent 完成任务「更快更准」**，产出**成功率 / token / 步数**三条基线，版本间对比做防退化门。

## 与每日测试的隔离边界

- 不进 `test-cases/` 母版（不参与 `init_day` / `gen_daily` / `verify_new` 门禁）
- 不进 `results/` 每日包（不参与 `build_summary` / Summary 聚合 / 九节报告 / 邮件）
- 不进 `metrics/trend.csv`（那是每日用例执行率口径）
- 不占客户端 agent 每日测试任务（维护者侧专项，非 multica 分发）

## 目录结构

```
skill-bench/
├── tasks/tasks.json          # 3 个端到端任务（prompt + 期望技能 + verifier + cleanup）
├── fixtures/site/index.html  # T1 部署的静态站 fixture（含判据标记 DEVBENCH-PING-OK）
├── harness/
│   ├── mcp-client.mjs        # devkit MCP stdio 客户端 + tools/list → OpenAI function calling
│   └── run-bench.mjs         # 主 harness：agent loop + 三指标采集
├── verifiers/                # 每条任务的 ground-truth 判定 + 归零脚本
└── results/                  # 基线数据 JSON + 报告
```

## 评测架构

不包 dsh（headless 输出为黑盒、拿不到 token/步数），自建 agent loop：

```
opengw 网关模型（OpenAI 兼容，返回 usage）
      ↕  function calling
devkit MCP 工具（mcp-server.mjs，tools/list 实测 37 个）
      ↕  模型可 retrieve_skill 检索技能（复现 dsh 的技能环境）
agent loop：chat → tool_calls → 执行 → 回填 → 循环（max 40 轮）
      ↕
三指标采集：token(usage 累计) / 步数(tool_call 次数) / 成功率(独立 verifier 真机回读)
```

审批放行：写操作走 `plan_cli_command → run_approved_command`，harness 自动注入 `approvedByUser=true`（模拟评测环境用户已确认）。

## 复跑命令

```bash
# 前置：node、hcloud 已认证、opengw 凭证(~/.dsh/.credentials.yaml)、devkit MCP(.dsh/huaweicloud-plugins)

# 单个任务，3 次采样
node harness/run-bench.mjs t02-query-billing --runs 3
node harness/run-bench.mjs t01-deploy-static-site --runs 3
node harness/run-bench.mjs t03-config-security-group --runs 3

# 全部任务
node harness/run-bench.mjs --all --runs 3

# 自定义模型 / 指定 MCP
node harness/run-bench.mjs t01 --runs 1 --model deepseek-v4-flash-0731
BENCH_MCP_SERVER=/path/to/mcp-server.mjs node harness/run-bench.mjs t01 --runs 1
```

## 三指标口径

| 指标 | 口径 |
|---|---|
| 成功率 | 独立 verifier 真机回读判定（如部署=对象公网可达+内容标记、账单=金额命中、安全组=存在+入向80规则） |
| token | 该 run 模型 input(prompt) + output(completion) 累计 |
| 步数 | 工具调用次数 |

## 约束与注意

- 写任务（T1/T3）真机创建，**每 run 后必须归零**（cleanup 脚本），跑完人工 `hcloud OBS ls` / `hcloud VPC ListSecurityGroups` 终验无 `devkit-bench` 残留。
- 首份基线报告见 `results/baseline-report-20261014.md`。
- 演进路线：L3 对照组（裸模型 vs 开 skill）→ L1 任务集扩到 8~10 场景 → L2 逐 skill 覆盖地图 → token→成本折算。