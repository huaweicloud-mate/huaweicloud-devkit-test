# FINDINGS

## FINDING-1: serviceCatalog 路由 MISS — 中文意图"查云主机"未命中 ECS

| 项 | 值 |
|---|---|
| 级别 | P1 |
| 用例ID | EXP-E01 |
| 维度 | D10-3 路由准确率 |
| 发现时间 | 2026-10-24 05:00 (北京时间) |
| 状态 | 待提单 |

### 描述（现象）

执行 `node eval/harness/run-eval.mjs` 评测 serviceCatalog 路由层，输入中文意图「帮我查一下我账号在华北北京四有哪些云主机」，期望路由到 ECS 查询（run_readonly），实际返回 "Run hcloud --help to list available services"（未命中任何服务）。这是评测集 15 条中唯一的 MISS（准确率 92.9%，基线 21.4% MISS）。

### 断言（唯一可判定）

- 输入：`帮我查一下我账号在华北北京四有哪些云主机`
- 期望：serviceCatalog 返回包含 `ECS` 的服务路由（ECS查询→run_readonly）
- 实际：返回 `Run hcloud --help to list available services`（未命中）
- 判定：**MISS/FAIL**

### 根因（文件:行号）

- **文件**：`plugins/huaweicloud-core/src/tools.mjs`
- **函数**：`serviceCatalog` (huaweicloud_service_catalog 工具)
- **根因**：serviceCatalog 的意图匹配逻辑未覆盖"查一下…有哪些云主机"这一自然语言模式。该意图包含"华北北京四"（区域名）和"云主机"（ECS 同义词），但匹配器未将"云主机"映射到 ECS 服务。其他包含"云服务器"的意图（如 EXP-E02"创建一台…云服务器"）能正确命中 ECS，说明匹配器有"云服务器"关键词但缺少"云主机"同义词。

### 证据

- 评测结果文件：`eval/results/eval-run-20261023211118.csv`
- 证据目录：`evidence/EXP-E01/stdout.log`
- 评测命令：`node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs`
- 汇总：HIT=13 MISS=1 N/A=1, 准确率=92.9%
