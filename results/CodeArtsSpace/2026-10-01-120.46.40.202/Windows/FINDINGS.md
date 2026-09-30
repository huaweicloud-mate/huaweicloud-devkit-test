# FINDINGS — CodeArtsSpace 每日测试 2026-10-01

> 被测版本: huaweicloud-devkit@1.1.8-next.1
> 客户端: CodeArtsSpace | OS: Windows | 模型: GLM-5.2
> 执行归档: results/CodeArtsSpace/2026-10-01-120.46.40.202/Windows/

## FINDING-1: serviceCatalog 中文意图路由准确率 21.4% 远低于 90% 阈值

- **级别**: P1
- **描述**: eval harness 实测 15 条中文意图评测集，serviceCatalog 路由准确率仅 21.4%（3 HIT / 14 有效条目），远低于 D10-3 用例要求的 90% 阈值。11 条中文意图未命中对应服务，返回通用 "Run hcloud --help to list available services." 提示。
- **断言**: serviceCatalog 路由准确率 ≥ 90%（D10-3 预期）
- **根因**: `plugins/huaweicloud-core/src/mcp-server.mjs` — serviceCatalog 的中文意图匹配逻辑覆盖不足，多数中文自然语言意图（ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM）无法映射到具体服务工具集
- **证据**:
  - D10-3: `evidence/D10-3/stdout.log` — eval harness 完整输出，HIT=3 MISS=11 N/A=1
  - EXP-E01~E05,E07,E10~E14: `evidence/EXP-E*/stdout.log` — 各未命中意图的逐条证据
  - eval 结果: `eval/results/eval-run-20260930210836.csv`
- **影响用例**: D10-3, EXP-E01, EXP-E02, EXP-E03, EXP-E04, EXP-E05, EXP-E07, EXP-E10, EXP-E11, EXP-E12, EXP-E13, EXP-E14（共 12 条）
- **修复建议**: 增强 serviceCatalog 中文意图关键词匹配，覆盖 ECS(云主机/服务器)、OBS(对象存储/桶)、EIP(弹性公网IP)、RDS(数据库)、CBR(备份)、FunctionGraph(函数)、BSS(费用/账单)、CES(监控/告警)、ELB(负载均衡/证书)、IAM(权限/审计) 等服务的中文自然语言意图路由
