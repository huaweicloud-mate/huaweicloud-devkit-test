# FINDINGS — 缺陷发现清单（CodeArtsWork-GLM-5.2）

> **落盘路径**：`results/CodeArtsWork/2026-09-18-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：`2026-09-18 07:55:00`（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段。

---

## #1【P1】EXP-C4-14 DMS 服务在 KooCLI 7.2.12 中不可用

- **现象**：`hcloud DMS --help` 返回 `[USE_ERROR]不支持的服务名称:DMS`
- **断言**：KooCLI 应支持 DMS 服务名，返回 Available Operations 列表
- **根因**：`KooCLI 7.2.12` 未包含 DMS 服务定义（DMS for Kafka/RabbitMQ/RocketMQ）
- **影响**：DMS 相关用例无法通过 KooCLI 执行，需通过 MCP skill `huawei-smn-dms` 间接覆盖
- **证据**：`evidence/EXP-C4-14/stdout.log`
- **状态**：待提单

## #2【P1】EXP-C4-18 DEW 服务在 KooCLI 7.2.12 中不可用

- **现象**：`hcloud DEW --help` 返回 `[USE_ERROR]不支持的服务名称:DEW`
- **断言**：KooCLI 应支持 DEW 服务名，返回 Available Operations 列表
- **根因**：`KooCLI 7.2.12` 未包含 DEW 服务定义（CSMS/KMS/凭证管理）
- **影响**：DEW 相关用例无法通过 KooCLI 执行，需通过 MCP skill `huawei-dew` 间接覆盖
- **证据**：`evidence/EXP-C4-18/stdout.log`
- **状态**：待提单

## #3【P1】EXP-E01~E14 serviceCatalog 中文意图路由准确率仅 21.4%

- **现象**：eval harness 跑 15 条中文意图，仅 3 条命中（EXP-E06 DCS、EXP-E09 CCE、EXP-E15 Voucher），11 条 MISS，1 条 N/A
- **断言**：serviceCatalog 应将中文意图正确路由到对应华为云服务（ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM 等）
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 函数中文意图→服务映射覆盖不足，多数中文意图返回通用帮助「Run hcloud --help to list available services.」
- **影响**：用户用中文描述需求时，Agent 无法正确路由到对应华为云服务，需用户手动指定服务名
- **证据**：`eval/results/eval-run-20260917234924.csv`（HIT=3 MISS=11 N/A=1，准确率=21.4%）
- **状态**：待提单
