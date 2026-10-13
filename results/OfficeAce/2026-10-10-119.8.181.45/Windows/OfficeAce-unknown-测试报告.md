# OfficeAce-unknown 每日测试报告
> **报告名**：`OfficeAce-unknown-测试报告.md`
> **生成时间**：2026-10-10 10:06:57（北京时间）
> **执行归档**：`results/OfficeAce/2026-10-10-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8-next.2` (gitHead: 681895da) |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：MCP 工具真机调用（hook_check_command/artifacts/deploy_plan/plan_cli_command/service_catalog/auth_status/check_update等）+ 源码级直调（risk-rule-engine.mjs 规则计数）+ CLI 命令（hcloud --version/doctor）+ 证据落盘（evidence/<case-id>/probe.mjs + stdout.log）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `138 / 1 / 2 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 139） | `99.3%` |
| P0 / P1 / P2 新增缺陷 | `1 / 0 / 0` |
| 红线（I 类）违规 | `0`（无凭证泄漏、无 mock 假跑、目录权限合规） |
| 资源释放 | `N/A`（本次无真云资源创建，D3-S7 BLOCKED 未执行） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `99` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

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
| 1 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | cloud-risk-rules.json:26 | 待提单 |

### 根因详情

#### D4-2: 凭证env打印拦截

- **期望**：`echo $HW_ACCESS_KEY $HW_SECRET_KEY` 应被 hook 拦截（decision=deny）
- **实际**：hook_check_command 返回 `decision=allow`，未匹配任何规则
- **根因**：`cloud-risk-rules.json:26` 的 `hwc-command-env-dump` 规则 regex `(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)` 只匹配 `env`/`printenv` 命令，不覆盖 `echo $HW_ACCESS_KEY` 模式
- **证据**：`evidence/D4-2/stdout.log`

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-28` | D1安装 | 检测语义-有新版本 | No newer version than 1.1.8-next.2 available; cannot test 'new version detected' path |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 真云E2E场景需创建ECS+RDS资源，当前凭证返回HDKIT_CRED_INVALID，需有效AK/SK才能执行 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（auth_status 输出仅含指纹 caae65f2，无明文 AK/SK）
- [x] 写操作误判 read-only：`无`（plan_cli_command 正确分类写操作，safeToRun=false）
- [x] 红线（I 类）违规：`0`（未碰 Summary/其他客户端/test-cases 母版）
- [x] 脱敏复核：`通过`（redactEvidence 函数对 AK/SK/token/password 模式脱敏）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/RDS | 未创建（D3-S7 BLOCKED） | N/A | N/A |
| 本地临时文件 | _run_all.py, _run_p1p2.py 等分析脚本 | 保留在执行包内（git add 前清理 _ 前缀文件） | N/A |

> 本次测试未创建真云资源（D3-S7 因凭证 HDKIT_CRED_INVALID 标 BLOCKED），无需归零验证。

---

## 八、遗留与建议

- **D4-2 修复建议**：在 `hwc-command-env-dump` 规则的 regex 中增加 `echo` 模式，如 `(^|\s)(env|printenv|echo\s+.*\$.*(ACCESS_KEY|SECRET_KEY|TOKEN|PASSWORD))`，或新增独立规则匹配 `echo $HW_*` 模式。
- **D1-28 解除建议**：当 npm registry 有高于 1.1.8-next.2 的版本时可复测，或手动 mock 远端版本响应。
- **D3-S7 解除建议**：配置有效华为云 AK/SK（当前凭证返回 HDKIT_CRED_INVALID），或使用预置的统一账号 hw018619646 凭证。
- **总体**：138/141 通过率 98%，1 个 P0 缺陷（D4-2 env 打印拦截缺口），2 个 BLOCKED（环境/版本限制），无 SPEC-MISMATCH，无红线违规。
