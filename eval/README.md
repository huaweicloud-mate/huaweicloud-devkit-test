# D10 Agent 行为评测（可复现评测基建）

> 状态：**ITER-003-2026-09-09 建成 v1**（D10-6 评测基建，测试侧交付项）
> 设计依据：docs/01-测试规划.md §D10（Azure ToolDescriptionEvaluator / AWS skill 激活率对标）
> 版本化：评测集 `eval-set-vN.csv`，每 Release 前评审更新一次；维护责任归测试负责人

## 结构

```
eval/
├── README.md            # 本文档
├── prompts/
│   └── eval-set-v1.csv  # 自然语言评测集（15 条，从展开级矩阵 EXP-E01~E15 抽取）
├── harness/             # 评测执行 harness（可重复跑）
│   └── run-eval.mjs     # 调用 invoke-mcp.mjs / mcp-server.mjs 跑单条评测（待 Iter-004 完善）
└── results/             # 每轮评测结果（模型/温度/激活skill/是否成功）
    └── README.md        # 结果记录格式与趋势说明
```

## 评测集（eval-set-v1.csv）列说明

| 列 | 内容 |
|---|---|
| id | EXP-E01~E15（与展开级矩阵同源） |
| prompt | 用户自然语言任务（中文，模拟真实场景） |
| 期望路由 | 正确服务/工具类别（ECS/OBS/EIP/RDS/DCS/CBR/CCE/FG/CES/IAM/费用/voucher） |
| 期望动作 | read / plan / approve / deploy / 执行 |
| 来源 | 展开级矩阵「D10评测集」行 |

## 可重复跑要求（D10-6 达标判据）

1. **固定采样参数**：固定主模型 + temperature=0（评测结果可比）
2. **版本化**：评测集 CSV 版本化（v1→vN），修改走 git 历史
3. **量化入趋势**：results/ 每轮记录 `时间戳/模型/用例数/激活率/路由准确率`，trends 追加
4. **成本预算**（规划 v1.3）：每轮 ≤ 3 客户端 × 15 用例 × 3 模型 = 135 次调用上限；主模型 1 + 备选 2

## 执行方式（会话级，人工或 CDP 自动化）

- 目标客户端会话内逐条发送 prompt，记录：模型、温度、激活的 skill/工具（从轨迹/日志取证）、最终是否成功
- 判定：检索/路由通道（search_docs 显式检索 vs 描述注入通道）分开记录（ITER-001 D10-1 教训）
- 安全用例（E15 领券）按红线执行：只读/无破坏性，落地前确认

## 状态

- [x] ITER-003：目录结构 + eval-set-v1.csv（15 条）+ 本文档 —— 评测基建 v1 **建成**
- [ ] ITER-004+：harness 脚本化（run-eval.mjs）+ 首轮真实跑分 + 趋势基线
