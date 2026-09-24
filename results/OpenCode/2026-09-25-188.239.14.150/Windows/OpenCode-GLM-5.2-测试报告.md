# OpenCode-GLM-5.2 每日测试报告

> **报告名**：`OpenCode-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-25 05:15:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-25-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit@1.1.7（gitHead 7456d059）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `GLM-5.2` |
| OS / 架构 | `Windows` (Windows NT, x64) |
| 机器 IP | `188.239.14.150` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.7`（npm latest, gitHead 7456d059） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级直调（import 源码模块 + 函数级断言）+ MCP 工具真机执行（hook_check_command/run_readonly_command/plan_cli_command/sandbox_check_user）+ eval harness 路由评测（run-eval.mjs）+ 真云 E2E（ECS ListServersDetails / VPC CreateVpc+DeleteVpc 归零）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `118` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `101 / 17 / 0 / 0 / 23` |
| 通过率（分母 = PASS+FAIL = 118） | `85.6%` |
| P0 / P1 / P2 新增缺陷 | `3 / 3 / 0`（合并 6 项设计级 + 11 项展开级 = 6 条 FINDINGS） |
| 红线（I 类）违规 | 无 |
| 资源释放 | 真云 VPC 创建后立即删除归零，ListVpcs 验证无残留 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `96` | 有证据且通过 PASS 门禁 |
| FAIL | `6` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `5` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 路由 MISS（归入 D10-3 缺陷） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `23` | 22 条 EXP-C4 归属 Hermes（调归属）+ 1 条 EXP-E08 诊断类 N/A |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证env打印拦截不完整 | `safety/rules/cloud-risk-rules.json:39` HW_前缀未覆盖 | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截缺失 | `safety/rules/cloud-risk-rules.json` 缺内联密钥参数规则 | 待提单 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `src/risk-rule-engine.mjs:143` 不提取shell包裹内层命令 | 待提单 |
| 4 | P1 | `D4-7` | D4安全 | hook_check_command对内联密钥无效 | `safety/rules/cloud-risk-rules.json` 同#2 | 待提单 |
| 5 | P1 | `D4-17` | D4安全 | 未知命令fail-open | `src/risk-rule-engine.mjs:106` 无匹配返回allow | 待提单 |
| 6 | P1 | `D10-3` | D10评测 | serviceCatalog路由准确率21.4% | `src/tools.mjs` serviceCatalog匹配模式不足 | 待提单 |

> EXP-E01~E05, E07, E10~E14 的 11 条展开级 FAIL 均归入 #6 D10-3 路由缺陷（同一根因）。

### 根因详情

**#1 D4-2**：`hook_check_command("printenv HW_SECRET_KEY")` → `allow`。`hwc-command-env-dump` 规则正则 `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_` 前缀。devkit 使用 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 但正则不含 `HW_`。证据：`evidence/D4-2/stdout.log`

**#2 D4-3**：`hook_check_command("hcloud ECS CreateServers --adminPass Password123! --ak AK --sk SK")` → `allow`。缺少检测 hcloud 命令内联密钥参数（`--adminPass`/`--ak`/`--sk`）的规则。证据：`evidence/D4-3/stdout.log`

**#3 D4-16**：`hook_check_command("sh -c \"cat credentials.json\"")` → `allow`。`evaluateCommandRisk()` 不解析 shell 包裹内层命令。`bash -c "hcloud ECS DeleteServers"` 正确返回 `warn`，但 `sh -c "cat credentials.json"` 穿透。证据：`evidence/D4-16/stdout.log`

**#4 D4-7**：`hook_check_command` 对含 `--ak`/`--sk` 命令返回 `allow`，而 `hook_check_artifacts` → `deny`，`hook_check_deploy_plan` → `warn`。同 #2 根因。证据：`evidence/D4-7/stdout.log`

**#5 D4-17**：`hook_check_command("unknown-command-xyz")` → `allow`。空/null/undefined/空白输入正确返回 `deny`，但有效未知命令 fail-open。`risk-rule-engine.mjs:106` 无匹配时返回 `allow`。证据：`evidence/D4-17/stdout.log`

**#6 D10-3**：eval harness 实测 `serviceCatalog` 路由准确率 21.4%（3 HIT / 14 total）。HIT：EXP-E06(DCS)、EXP-E09(CCE)、EXP-E15(Voucher)。MISS：EXP-E01~E05, E07, E10~E14 共 11 条。证据：`evidence/D10-3/stdout.log`、`evidence/eval-run-result.csv`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 原因 | 分类 |
|---|---|---|---|---|
| `EXP-C4-01`~`EXP-C4-22` | 展开级 | P2 | 归属 Hermes 客户端执行（展开级 agent 列标注 Hermes），非 OpenCode 归属。init_day.py 按 OS 预筛时未剔除（OS=Windows/Linux 匹配 Windows），但 agent 列为 Hermes。 | 调归属 |
| `EXP-E08` | 展开级 | P1 | 诊断类意图（"我的ECS启动失败了, 帮我分析原因"），eval harness 标记为 N/A（无特定服务路由期望） | 改用例 |

> **说明**：23 条 NOT_RUN 中 22 条 EXP-C4 归属 Hermes（init_day.py 过滤逻辑仅按 OS 预筛，未按 agent 列过滤，导致 Hermes 用例误入 OpenCode 展开级副本）。1 条 EXP-E08 为诊断类意图，eval harness 正确标记 N/A。这些均非 OpenCode 执行遗漏。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。真云执行仅使用 readonly_command 和 plan_cli_command，未暴露 AK/SK。
- [x] 写操作误判 read-only：无。VPC DeleteVpc 正确分类为 write/decision=deny。
- [x] 红线（I 类）违规：无。所有 PASS 用例有证据落盘 + evidencePath 回填，通过 verify_no_fake_pass 门禁。
- [x] 脱敏复核：`redactSecrets` 正确脱敏 AK/SK/token/password（D2-4、D4-26 PASS）。1.1.7 版本已修复 1.1.7-next.1 中 `token=` 未脱敏的问题。
- [x] 真云执行：D3-S1（ECS ListServersDetails 真机执行）、D3-S2（VPC DeleteVpc plan 真机执行）、D3-S3（sandbox_check_user 真机执行）、D4-13（run-as-readonly.py 只读凭证真机执行）。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC (71c5b850-ec71-41a0-aeaa-8a6f09de8e4f) | D4-13 readonly 测试创建 | run_approved_command 立即删除 | ListVpcs 验证无残留（仅 pre-existing tctest-s7 VPC） |
| ECS instances | 无创建 | N/A | ListServersDetails count=0 |
| Sandbox | 无创建 | N/A | sandbox_check_user 验证已签约 |

> 真云资源创建后立即删除归零，未留残留。

---

## 八、遗留与建议

1. **D4-2/D4-3/D4-7**：建议在 `cloud-risk-rules.json` 中新增/修改规则：① `hwc-command-env-dump` 正则增加 `HW_` 前缀；② 新增 `hwc-command-inline-secret` 规则检测 `--adminPass`/`--ak`/`--sk`/`--password`/`--token` 参数。
2. **D4-16**：建议 `evaluateCommandRisk()` 增加 shell 包裹解析（`sh -c`/`bash -c`/`cmd /c`），提取内层命令后递归检查。
3. **D4-17**：建议将默认 decision 从 `allow` 改为 `warn`（fail-closed 策略），未知命令至少告警。
4. **D10-3**：建议扩展 `serviceCatalog()` 的中文意图匹配模式，覆盖 ECS/RDS/EIP/CBR/FunctionGraph/BSS/CES/ELB/IAM 等服务的中文关键词。
5. **EXP-C4 归属问题**：建议 init_day.py 修复过滤逻辑，按 agent 列 + OS 列双重预筛，避免 Hermes 用例误入 OpenCode 展开级副本。
6. **已修复项**：D2-4（token= 脱敏）和 D4-26（findings 证据脱敏）在 1.1.7 正式版中已修复（1.1.7-next.1 中为 FAIL）。

---

## 版本对比（1.1.7-next.1 → 1.1.7）

| 用例 | 1.1.7-next.1 (9/24) | 1.1.7 (9/25) | 变化 |
|---|---|---|---|
| D2-4 | FAIL (token= 未脱敏) | PASS (redactSecrets 修复) | 已修复 |
| D4-26 | FAIL (token= 未脱敏) | PASS (同上) | 已修复 |
| D10-3 | FAIL (21.4%) | FAIL (21.4%) | 未变 |
| D4-2 | FAIL | FAIL | 未变 |
| D4-3 | FAIL | FAIL | 未变 |
| D4-7 | FAIL | FAIL | 未变 |
| D4-16 | FAIL | FAIL | 未变 |
| D4-17 | FAIL | FAIL | 未变 |
