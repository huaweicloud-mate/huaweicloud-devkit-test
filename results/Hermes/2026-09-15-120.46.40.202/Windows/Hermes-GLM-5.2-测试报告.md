# Hermes-GLM-5.2 每日测试报告

> **报告名**：`Hermes-GLM-5.2-测试报告.md`
> **生成时间**：`2026-09-15 10:22:34`（北京时间）
> **执行归档**：`results/Hermes/2026-09-15-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PASS`

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `GLM-5.2` |
| OS / 架构 | `Windows (win32 x64)` |
| Node / npm / Python | `Node v22.23.1 / npm 10.9.2 / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.4`（npm latest，gitHead `9b67256`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK / 未使用）` |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 |
| 设计真源 | 设计级 81 / 展开级 43 / 追踪表 183 |
| daily 基础用例 | 设计级 81 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `124`（设计级 81 + 展开级 43） |
| 已执行 | `124` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `124 / 0 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `100%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（未创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `81` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `43` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`43`** | |

---

## 四、缺陷清单

> 无缺陷。所有用例均通过。

---

## 五、阻塞项

> 无阻塞项。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

### 安全测试详情（P0 全部通过）

| 用例 ID | 测试项 | 结果 | 证据 |
|---|---|---|---|
| D4-1 | 凭证文件读取拦截 | PASS | evaluateCommandRisk('cat ~/.hcloud/credentials.json') → deny |
| D4-2 | 凭证env打印拦截 | PASS | 4 个 env/printenv 命令全部 deny |
| D4-3 | 明文secret API拦截 | PASS | user_data/admin_pass/access_key 3 个命令全部 deny |
| D4-5 | 写操作误判检测 | PASS | 4 个只读操作(ListServers等)均 allow/read_only |
| D4-9 | 公开暴露/破坏性预检 | PASS | 0.0.0.0/0 入站规则 blockedByRiskRule=true |
| D4-15 | hook绕过尝试 | PASS | 嵌套命令 `echo && hcloud DeleteServer` 检测到 |
| D4-16 | 命令包裹穿透 | PASS | subshell `$(hcloud DeleteServer)` 检测到 |
| D4-18 | confirm-not-deny审批语义 | PASS | 无审批=deny，有审批=allow |
| D4-19 | 确认流下预检仍生效 | PASS | 即使 allowWrites，危险规则仍 deny |
| D4-21 | hook_check_artifacts | PASS | 宽通IAM策略 → deny (hwc-iam-admin-policy) |
| D4-22 | hook_check_deploy_plan | PASS | 公开FunctionGraph → warn (hwc-functiongraph-public-no-auth) |
| D4-23 | 全局规则注入 | PASS | policy.json + hooks 安全策略已安装 |
| D2-4 | 凭证脱敏正确性 | PASS | access_key/secret_key → <redacted>，region/server_id 保留 |
| D2-11 | STS token拒绝落盘 | PASS | security_token → <redacted> |
| D8-7 | 7个meta技能指引可机械执行 | PASS | 29个技能，6个必需meta技能全部存在 |
| D10-4 | 安全干预有效性 | PASS | DeleteServer → deny, safeToRun=false |
| D1-39 | Windows升级检测链可用性 | PASS | npm.cmd无shell触发EINVAL，有shell正确返回 |
| D1-40 | 镜像lag下检测正确性 | PASS | 稳定版1.1.4 > next.99 → up_to_date（无误报） |

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无真云资源 | 否 | — | — |

> 本轮未创建真云资源（仅源码级探针+CLI检查），无需释放。

---

## 八、遗留与建议

- 本轮全量通过，无遗留问题
- doctor 确认 hcloud CLI v7.2.12 已安装，凭证已配置
- status --target Hermes 显示未安装（devkit 安装给 OpenCode/CodeArts，非 Hermes 直装），符合多 Agent 共存环境预期
- 建议后续关注：Hermes 专属安装路径验证（需 `install --target Hermes`）
