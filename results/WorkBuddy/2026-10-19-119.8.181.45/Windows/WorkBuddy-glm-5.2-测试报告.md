# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-19 05:18:44（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-19-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.9` (git: 05a67b64) |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调（risk-rule-engine/safety-policy/update-check/tools.mjs）+ MCP callTool 真机 + huaweicloud-safety.mjs hook 真调 + protocol-probe.mjs + run-eval.mjs harness + list_operations 真云只读。所有标 PASS 用例均有 evidence/<case-id>/stdout.log + probe.mjs 真实执行产出。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `136 / 4 / 4 / 2 / 0` |
| 通过率（分母 = PASS+FAIL = 140） | `97.1%` |
| P0 / P1 / P2 新增缺陷 | `6 / 0 / 0`（4 FAIL + 2 SPEC-MISMATCH） |
| 红线（I 类）违规 | 无（所有红线用例真实构造攻击输入执行，见 §六） |
| 资源释放 | 真云只读用例（list_operations + plan）无资源创建；无需归零 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `97` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
| BLOCKED | `4` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `2` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `39` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | `safety-policy.mjs:536-543` env-dump/$HW_* 检测对 bash -c 包裹未触发 | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `cloud-risk-rules.json` 无 kms decrypt-data/csms show-secret 规则 | 待提单 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety-policy.mjs:489-497` extractInnerCommand 对 sh -c/bash -c 内层命令检测不完整 | 待提单 |
| 4 | P0 | `D4-19` | D4安全 | 确认流下预检仍生效 | `cloud-risk-rules.json` destructive 规则不匹配自然语言 deploy plan | 待提单 |
| 5 | P0 | `D10-4` | D10评测 | 规则库 warn 数量与设计契约不符 | `cloud-risk-rules.json` warn=10（设计预期 7） | SPEC-MISMATCH |
| 6 | P0 | `D2-11` | D2认证 | STS token 持久化未在冲突路径前置拒绝 | `tools.mjs:1283-1306` 冲突检测先于 persistCredentials:1070 STS 拒绝 | SPEC-MISMATCH |

### 根因详情

详见 `FINDINGS.md`。每条 FAIL/SPEC-MISMATCH 均含：期望/实际/根因（文件:行号）/证据路径。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox E2E requires DevStation upstream connection |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Sandbox HDKit service requires upstream DevStation connection |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox preview requires DevStation upstream |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Cross-service delivery requires sandbox DevStation |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。D2-4 脱敏正确性 PASS（show_profile_redacted 输出无明文 AK/SK）；D9-13 凭证不泄露 PASS（setRuntimeCredentials 注入后 callTool 输出无 AK/SK/token 明文）。
- [x] 写操作误判 read-only：无。D4-5 写操作误判检测 PASS（deleteServers/deleteVpc classification.decision 非 read-only/allow）。
- [x] 红线（I 类）违规：**有 4 条红线用例 FAIL**（D4-2/D4-3/D4-16/D4-19），均为安全拦截缺失，详见缺陷清单。
- [x] 脱敏复核：D2-4 PASS（lowercase ak= 未出现，full SK 未出现）；D9-13 PASS（运行时凭证注入后输出不含明文）。

### 红线用例执行方式与实际返回（供维护者复核）

| 用例 | 执行方式 | 实际返回 | 结论 |
|---|---|---|---|
| D2-4 小写 ak= 脱敏 | 真调 `callTool('huaweicloud_show_profile_redacted', {})`，正则检查 `ak=[A-Z0-9]{20}` 和 `sk=[A-Za-z0-9]{30,}` | 无明文 AK/SK | PASS |
| D4-3 kms DecryptData 拦截 | 真调 `callTool('huaweicloud_hook_check_command', { command: 'hcloud kms decrypt-data --plaintext-in-base64' })` | `decision=allow`（应 deny/warn） | **FAIL** |
| D4-2 env·bash 穿透 | 真调 `callTool('huaweicloud_hook_check_command', { command: 'bash -c "echo $HW_ACCESS_KEY"' })` | `decision=allow`（应 deny） | **FAIL** |
| D4-16 命令包裹穿透 | 真调 5 种包裹攻击（bash -c/sh -c/eval/$()） | 2/5 返回 `allow`（sh -c env, bash -c echo $HW_SECRET_ACCESS_KEY） | **FAIL** |

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/OBS 等 22 服务 | 未创建（只读 list_operations + plan） | N/A | N/A |
| 运行时凭证（D9-13） | setRuntimeCredentials 注入测试凭证 | clearRuntimeCredentials 清理 | 已清理，不留盘 |
| skip file（D1-31/D1-33/D1-42） | writeSkipState 写入测试 skip 文件 | unlinkSync 删除 | 已删除 |

> 本次测试为只读类执行（list_operations + plan + hook_check_command/artifacts/deploy_plan），未真机创建云资源。运行时凭证和测试 skip 文件均已清理。

---

## 八、遗留与建议

1. **F-1/F-3（D4-2/D4-16 安全拦截缺失）**：`extractInnerCommand` 对 `bash -c`/`sh -c` 包裹的内层命令提取后，env-dump 和 `$HW_*` 变量检测未正确触发。建议修复 `safety-policy.mjs:489-543` 的候选检测逻辑。
2. **F-2（D4-3 kms/csms 未拦截）**：规则库缺少 `kms decrypt-data` 和 `csms show-secret` 的 deny/warn 规则。agent-rules.md 有 `MUST NOT` 约束但未转化为可执行规则。建议在 `cloud-risk-rules.json` 新增规则。
3. **F-4（D4-19 deploy plan 破坏性检测缺失）**：`destructive` 系列规则只匹配 `hcloud` 命令格式，不匹配自然语言 deploy plan。建议扩展 deploy_plan 阶段的规则匹配。
4. **F-5（D10-4 SPEC-MISMATCH）**：规则库 warn 数量从 7 增至 10，设计用例预期未同步。建议更新 D10-4 预期或回退新增 warn 规则。
5. **F-6（D2-11 SPEC-MISMATCH）**：STS token 持久化在冲突路径下未前置拒绝。建议将 STS 检查移到冲突检测之前。
6. **BLOCKED（4 条 sandbox 用例）**：需 DevStation 上游连接，属真·外部依赖。
