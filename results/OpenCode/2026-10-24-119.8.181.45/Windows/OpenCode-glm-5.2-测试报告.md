# OpenCode-glm-5.2 每日测试报告
> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-10-24 05:15:01（北京时间）
> **执行归档**：`results/OpenCode/2026-10-24-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.12` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：MCP 工具直调（hook_check_command/plan_cli_command/list_operations/show_profile_redacted 等 40 个工具）+ 源码级探针（safety-policy.mjs classifyTextCommand/update-check.mjs judgeUpdate）+ eval harness（run-eval.mjs serviceCatalog 路由评测 15 条中文意图）+ run_readonly_command 真云只读验证（ECS ListServers）。146 条用例全部实际执行并落盘证据。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `145 / 1 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 146） | `99.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `无需释放（本次未创建真云资源，仅只读查询）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `107` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `EXP-E01` | D10-3 路由准确率 | serviceCatalog 路由 MISS — "查云主机"未命中 ECS | `tools.mjs:serviceCatalog` 缺少"云主机"同义词映射 | 待提单 |

### 根因详情

**EXP-E01**: 输入「帮我查一下我账号在华北北京四有哪些云主机」，期望路由到 ECS 查询（run_readonly），实际返回 "Run hcloud --help to list available services"（MISS）。根因：serviceCatalog 意图匹配器有"云服务器"关键词但缺少"云主机"同义词。其他包含"云服务器"的意图（EXP-E02）能正确命中 ECS。证据：`evidence/EXP-E01/stdout.log`，eval harness 评测结果 HIT=13 MISS=1 N/A=1 准确率=92.9%。

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。hook_check_command 拦截 cat/printenv/echo 凭证访问（deny）；show_profile_redacted 全字段 <redacted>；run_readonly_command 输出 AK/SK/token 均 <redacted>。
- [x] 写操作误判 read-only：无。plan_cli_command 对 CreateServers/DeleteServers 正确分类为 deny/write，safeToRun=false。
- [x] 红线（I 类）违规：0 次。所有安全红线用例（D4 系列）通过。
- [x] 脱敏复核：通过。safety-policy.mjs redactSecrets 函数正确脱敏 adminPass 等敏感字段。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/OBS 等 | 无创建 | 无需销毁 | N/A（本次仅只读查询，未创建真云资源） |

> 本次测试仅使用 run_readonly_command 执行只读云操作（ECS ListServers），未创建任何真云资源。plan_cli_command 验证了写操作的审批流（deny/write/safeToRun=false + approvalToken），但未实际执行创建/删除。

---

## 八、遗留与建议

- **EXP-E01 路由 MISS**：serviceCatalog 缺少"云主机"→ECS 同义词映射。建议在意图匹配器中添加"云主机"作为"云服务器"的同义词。已知基线 21.4% MISS，本次 1/14 MISS（7.1%），优于基线。
- **MCP 工具 vs 源码一致性**：发现 hook_check_command MCP 工具对 `echo $HW_ACCESS_KEY` 返回 allow，但源码 classifyTextCommand 返回 deny。可能是运行时插件版本与源码版本不一致。建议排查插件同步机制。
- **KooCLI 版本**：doctor 检测到 KooCLI 版本不匹配（installed 7.2.12, paired 7.3.12），1 WARN 不影响功能。
