# WorkBuddy-GLM-5.2 每日测试报告
> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-04 05:07:49（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-04-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `GLM-5.2` |
| OS / 架构 | `Windows Server 2022 Standard (x86_64)` |
| Node / npm / Python | `Node v22.22.2 / npm 10 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b47`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `KooCLI 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置，本轮未创建真云资源）` |
| 测试类型 | 源码级探针 / MCP 协议直调 / eval harness / CLI 真机（doctor/status） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；eval harness 跑 `eval/harness/run-eval.mjs` 路由评测集；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `136 / 5 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `96.5%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（5 项均为历史已知缺陷复核，见 HISTORY_LINKS.md） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `不适用（本轮无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `98` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

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
| 1 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `plugins/huaweicloud-core/src/safety-policy.mjs:257` 正则未覆盖 `show-secret`/`show-secret-version`/`get-secret-value` 连字符变体；`safety/policy.json:26` blockedSecretOperations 与 line 249 大小写+连字符不匹配 | 历史已提单 #845 |
| 2 | P1 | `D4-11` | D4安全 | 提示注入防护 | `plugins/huaweicloud-core/src/safety-policy.mjs:572` classifyTextCommand 对未匹配 hcloud 子命令的文本走 applyRawCommandRiskRules 返回 `allow`+`warn`；`risk-rule-engine.mjs:mergeRiskDecision` 仅 `risk.decision==='deny'` 时升级，`warn` 级 findings 不升级；`safety/rules/cloud-risk-rules.json` 的 `hwc-destructive-delete-operation` severity=`warn` | 历史已提单 #797/#774/#671 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `plugins/huaweicloud-core/src/safety-policy.mjs:257` 同 D4-3，正则未覆盖 `show-secret` 连字符变体；classifyHcloudArgs 内 commandOperation 提取 `show-secret` 与 blockedSecretOperations 的 `ShowSecret` 大小写+连字符不匹配 | 历史已提单 #845 |
| 4 | P0 | `D4-28` | D4安全 | Node 版安全 hook 链路 | `plugins/huaweicloud-core/src/safety-policy.mjs:257` 同 D4-3/D4-16，classifyTextCommand → classifyHcloudArgs 路径未拦截 `show-secret` 连字符变体 | 历史已提单 #845 |
| 5 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由未识别"云主机"意图 | `plugins/huaweicloud-core/src/tools.mjs:1978` serviceCatalog routeMap 的 ECS 关键词列表 `['弹性云服务器','云服务器','服务器','虚拟机','镜像']` 未包含"云主机" | 历史已提单 #845/#844/#705 |

### 根因详情

**#1 [P0] D4-3 明文secret API拦截 — CSMS show-secret/show-secret-version/get-secret-value 未拦截**

- 期望：所有 CSMS 密钥读取类命令（show-secret、show-secret-version、get-secret-value，含连字符变体）应判 `deny`（risk=secret）
- 实际：`hcloud csms show-secret --secret-id test`、`hcloud csms show-secret-version --version-id v1`、`hcloud csms get-secret-value --name mysecret` 三条均判 `allow`（risk=read_only）；仅无连字符的 `hcloud csms showsecret` 正确判 `deny`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:257` 正则 `/secret[_-]?string|secret[_-]?binary|showsecret|showsecretversion|getsecretvalue/i` 未匹配连字符变体；`safety/policy.json:26` blockedSecretOperations 列表与 line 249 的 `op.toLowerCase() === operation.toLowerCase()` 比较也未处理连字符
- 证据：`evidence/D4-3/stdout.log`（3 条 allow + 1 条 deny 对照）

**#2 [P1] D4-11 提示注入防护 — "Ignore previous instructions" 类注入未拦截**

- 期望：包含 "Ignore previous instructions"、"Please ignore all safety rules" 等提示注入模式的命令应判 `deny`
- 实际：均判 `allow`（risk=not_huaweicloud），仅附加 `warn` 级 findings，未升级为 `deny`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:572` classifyTextCommand 对未匹配 hcloud 子命令的文本走 applyRawCommandRiskRules 返回 `allow`+`warn`；`risk-rule-engine.mjs:mergeRiskDecision` 仅当 `risk.decision==='deny'` 时升级
- 证据：`evidence/D4-11/stdout.log`（前 2 项 allow+warn，第 3 项 deny 对照）

**#3 [P0] D4-16 命令包裹穿透 — bash -c "hcloud CSMS show-secret" 未拦截**

- 期望：`bash -c "hcloud CSMS show-secret --secret-id test"` 应判 `deny`（risk=secret）
- 实际：判 `allow`（risk=read_only），命令包裹穿透 hook 检测
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:257` 同 D4-3，正则未覆盖 `show-secret` 连字符变体；classifyHcloudArgs 内 commandOperation 提取的 operation 为 `show-secret`（含连字符），与 blockedSecretOperations 的 `ShowSecret`（无连字符）大小写+连字符不匹配
- 证据：`evidence/D4-16/stdout.log`（第 4 项 allow，其余 deny）

**#4 [P0] D4-28 Node 版安全 hook 链路 — args 数组形式 CSMS show-secret 判 allow**

- 期望：args 数组形式传入的 CSMS show-secret 命令应判 `deny`（permissionDecision=deny）
- 实际：`hook_check_command({ args: ["hcloud","CSMS","show-secret","--secret-id","test"] })` 提取 commandText 后判 `allow`，`allHighRiskDenied=false`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:257` 同 D4-3/D4-16，classifyTextCommand → classifyHcloudArgs 路径未拦截 `show-secret` 连字符变体
- 证据：`evidence/D4-28/stdout.log`（第 4 项 allow，safeCheck=allow）

**#5 [P1] EXP-E01 serviceCatalog 路由未识别"云主机"意图**

- 期望：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 应路由到 `ECS` 服务
- 实际：返回 `recommendedServices: ["Run hcloud --help to list available services."]`，eval harness 判 MISS
- 根因：`plugins/huaweicloud-core/src/tools.mjs:1978` serviceCatalog routeMap 的 ECS 关键词列表为 `['弹性云服务器','云服务器','服务器','虚拟机','镜像']`，未包含"云主机"
- 证据：`evidence/EXP-E01/stdout.log`（eval harness 结果：MISS, expected=ECS, actual=Run hcloud --help）

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-3/D4-16/D4-28 为 secret 拦截漏判，非 read-only 误判）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/OBS 等 | 否 | 不适用 | 不适用（本轮无真云 E2E 用例创建资源） |

> 本轮 5 项 FAIL 均为源码级探针/eval harness 检测，未触发真云资源创建。真云凭证已就绪但本次用例集无真云 E2E 项需执行。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：无（141/141 全执行）
- 5 项 FAIL 均为历史已知缺陷（#845/#844/#797/#774/#671 等），本次为复核，已生成 HISTORY_LINKS.md 关联清单，不重复开单
- 建议：优先修复 `safety-policy.mjs:257` 连字符变体覆盖（D4-3/D4-16/D4-28 同根因，一处修复可消三类 FAIL）；其次补充 serviceCatalog routeMap "云主机" 关键词（EXP-E01）
