# FINDINGS — 缺陷发现清单（Hermes-GLM-5.2）

> **落盘路径**：`results/Hermes/2026-10-06-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-10-06 05:22 CST
> **被测版本**：huaweicloud-devkit@1.1.8-next.1 (installed) / 1.1.7 (hdk source)

---

## #1【P1】D9-9 EXP-E01~E15 serviceCatalog 路由准确率低（21.4% MISS）

- **现象**：运行 `node eval/harness/run-eval.mjs` 对 15 条中文意图评测集进行 serviceCatalog 路由测试，11 条 MISS（未命中预期服务），准确率仅 21.4%（3 HIT / 11 MISS / 1 N/A）。MISS 案例包括 ECS查询、ECS创建、OBS静态站、EIP绑定、RDS查询、CBR备份、FunctionGraph部署、BSS费用、CES监控、ELB证书、IAM审计等核心场景。
- **断言**：serviceCatalog 对中文意图的路由准确率应 > 50%，当前 21.4% 远低于预期
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由逻辑对中文自然语言意图匹配能力不足，多数意图返回 "Run hcloud --help to list available services." 而非路由到正确服务
- **影响**：用户用中文描述需求时无法正确路由到对应华为云服务，严重影响用户体验
- **证据**：`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E15/stdout.log`，`eval/results/eval-run-20261005215739.csv`
- **状态**：已提单 #856

## #2【P2】D9-9 capabilities.cancellation 未声明（SPEC-MISMATCH）

- **现象**：MCP initialize 握手返回的 capabilities 中未声明 notifications.cancellation，protocol-probe.mjs 判定 SPEC-MISMATCH
- **断言**：initialize.result.capabilities.notifications 应包含 cancellation 声明
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47` capabilities 对象未包含 notifications.cancellation
- **影响**：MCP 客户端无法使用取消协议，长操作无法中断
- **证据**：`evidence/D9-9/stdout.log`，`eval/results/protocol-probe-20261005215708.json`
- **状态**：已提单 #856

## #3【P0】EXP-NR3-09 已知回归缺陷（修复前证据保留）

- **现象**：P0 回归用例 EXP-NR3-09 预期 FAIL，为已知缺陷修复前证据保留
- **断言**：该用例预期 FAIL（修复前），FIX(sim) 仅证明修复方向
- **根因**：已知回归缺陷，详见历史 issue
- **证据**：`evidence/EXP-NR3-09/stdout.log`
- **状态**：已知缺陷，历史单已存在 (#852)

## #4【非产品缺陷】EXP-E08 诊断类意图路由 N/A

- **现象**：EXP-E08 "我的ECS启动失败了 帮我分析原因" 评测结果为 N/A（非服务路由类意图，属于诊断类）
- **说明**：诊断类意图不在 serviceCatalog 路由范围内，N/A 是合理结果，非产品缺陷
- **证据**：`evidence/EXP-E08/stdout.log`
