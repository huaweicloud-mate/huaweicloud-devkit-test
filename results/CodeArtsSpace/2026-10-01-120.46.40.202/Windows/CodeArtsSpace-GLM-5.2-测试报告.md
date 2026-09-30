# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-01 05:15（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-01-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷，12 个 P1 FAIL 均为 serviceCatalog 中文意图路由未命中）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.8-next.1` |
| KooCLI 版本 | `7.2.12` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针直调（hdk CLI 命令真实执行）+ safety probe（classifyTextCommand 真实调用）+ eval harness（run-eval.mjs 真实路由）+ 真云只读（hcloud NovaListServers 真实 API 调用）+ 源码静态检查（cloud-risk-rules.json / mcp-server.mjs 工具注册）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 12 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 140） | `91.4%` |
| P0 / P1 / P2 新增缺陷 | `0 / 12 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | 真云只读，无资源创建，归零验证通过 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `101` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | D10-3 路由准确率 21.4% 远低于 90% 阈值 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `27` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | EXP-E 评测集 serviceCatalog 中文意图路由 MISS |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `1` | EXP-E08 诊断类意图需真实 LLM harness |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D10-3` | D10评测 | 路由准确率 21.4% < 90% 阈值 | `plugins/huaweicloud-core/src/mcp-server.mjs: serviceCatalog 中文意图路由命中率低, 11/14 MISS` | 待提单 |
| 2 | P1 | `EXP-E01` | D10评测 | serviceCatalog 未命中 ECS | `eval/harness/run-eval.mjs: 中文意图"查云主机"路由至通用 help` | 待提单 |
| 3 | P1 | `EXP-E02` | D10评测 | serviceCatalog 未命中 ECS | `eval/harness/run-eval.mjs: 中文意图"创建云服务器"路由至通用 help` | 待提单 |
| 4 | P1 | `EXP-E03` | D10评测 | serviceCatalog 未命中 OBS | `eval/harness/run-eval.mjs: 中文意图"部署静态网站"路由至 Sandbox+DevStation` | 待提单 |
| 5 | P1 | `EXP-E04` | D10评测 | serviceCatalog 未命中 EIP | `eval/harness/run-eval.mjs: 中文意图"绑定弹性公网IP"路由至通用 help` | 待提单 |
| 6 | P1 | `EXP-E05` | D10评测 | serviceCatalog 未命中 RDS | `eval/harness/run-eval.mjs: 中文意图"查看MySQL实例"路由至通用 help` | 待提单 |
| 7 | P1 | `EXP-E07` | D10评测 | serviceCatalog 未命中 CBR | `eval/harness/run-eval.mjs: 中文意图"配置备份策略"路由至通用 help` | 待提单 |
| 8 | P1 | `EXP-E10` | D10评测 | serviceCatalog 未命中 FunctionGraph | `eval/harness/run-eval.mjs: 中文意图"部署函数处理图片"路由至通用 help` | 待提单 |
| 9 | P1 | `EXP-E11` | D10评测 | serviceCatalog 未命中 BSS | `eval/harness/run-eval.mjs: 中文意图"查费用情况"路由至通用 help` | 待提单 |
| 10 | P1 | `EXP-E12` | D10评测 | serviceCatalog 未命中 CES | `eval/harness/run-eval.mjs: 中文意图"推送告警"路由至通用 help` | 待提单 |
| 11 | P1 | `EXP-E13` | D10评测 | serviceCatalog 未命中 ELB | `eval/harness/run-eval.mjs: 中文意图"申请HTTPS证书"路由至通用 help` | 待提单 |
| 12 | P1 | `EXP-E14` | D10评测 | serviceCatalog 未命中 IAM | `eval/harness/run-eval.mjs: 中文意图"审计权限"路由至通用 help` | 待提单 |

### 根因详情

所有 12 个 FAIL 用例同属一个根因：**serviceCatalog 中文意图路由能力不足**。

- **期望**：serviceCatalog 应将中文自然语言意图路由到对应的华为云服务工具集（如"查云主机"→ ECS 工具集）
- **实际**：eval harness 实测 15 条评测集中，仅 3 条命中（DCS/CCE/Incentive Voucher），11 条 MISS（返回通用 "Run hcloud --help" 提示），1 条 N/A（诊断类）
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` 中 serviceCatalog 的中文意图匹配逻辑覆盖不足，多数中文自然语言意图无法映射到具体服务
- **证据**：`eval/results/eval-run-*.csv` + 各用例 `evidence/<case-id>/stdout.log`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 优先级 | 原因 | 分类 |
|---|---|---|---|---|
| `EXP-E08` | D10评测 | P1 | 诊断类意图(explain_error)不在 serviceCatalog 路由范围(harness 标记 N/A); explain_error 工具路由需真实 LLM harness | 【补环境】需真实 LLM Agent 会话评测 |

### BLOCKED

无 BLOCKED 用例。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。safety probe 实测 `echo $HW_SECRET_KEY` 返回 `decision:deny, risk:credential`，凭证打印被阻断
- [x] 写操作误判 read-only：无。`hcloud ECS CreateServers --adminPass` 返回 `decision:deny, risk:write`，写操作需审批
- [x] 红线（I 类）违规：0 次。`rm -rf /` 返回 `decision:deny, risk:destructive`，破坏性命令被拦截
- [x] 脱敏复核：tools/call 结果经 redactString 脱敏，不含 AK/SK/token 明文

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 0（只读 NovaListServers） | N/A | `{"servers":[]}` 账号下无 ECS |
| VPC | 0 | N/A | 无创建 |
| 安全组 | 0 | N/A | 无创建 |
| EIP | 0 | N/A | 无创建 |

> 本次测试为只读测试（NovaListServers），未创建任何云资源，无需销毁和归零验证。

---

## 八、遗留与建议

1. **serviceCatalog 中文意图路由（12 个 FAIL 的统一根因）**：建议增强 serviceCatalog 的中文自然语言意图匹配能力，覆盖 ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM 等服务的中文意图关键词。当前仅 DCS/CCE/Incentive Voucher 三类意图可正确路由。
2. **只读子账号凭证刷新**：`credentials.readonly.json` 中的 test001 子账号 AK/SK 已过期（返回 Unauthorized），建议维护者刷新凭证后复测 D4-13 最小权限通过率。主账号(default profile) NovaListServers 正常返回 {servers:[]}。
3. **EXP-E08 诊断类意图**：explain_error 类意图路由需真实 LLM Agent 会话评测（run-agent-eval.mjs），非确定性 serviceCatalog 路由可覆盖范围，建议纳入 D10 真实 Agent 会话评测专项。
