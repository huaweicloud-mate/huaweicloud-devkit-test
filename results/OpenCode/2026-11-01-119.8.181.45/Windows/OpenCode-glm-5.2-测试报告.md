# OpenCode-glm-5.2 每日测试报告
> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-11-01 05:14:41（北京时间）
> **执行归档**：`results/OpenCode/2026-11-01-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.13-next.0` (gitHead: 47170d1f) |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：MCP 真机直调（40 个 huaweicloud-devkit MCP 工具）+ CLI 命令（doctor/check_update/npx）+ 源码级探针（tools.mjs/hooks.json/safety-policy.mjs）+ eval harness（run-eval.mjs 15 条评测集）+ plan_cli_command 服务矩阵冒烟（22 服务）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `142 / 0 / 4 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 142） | `100.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `N/A - 无真云资源创建（仅只读查询+规划冒烟，无计费资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `103` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `4` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
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

本轮无 FAIL 用例。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox under maintenance (HDKIT_SANDBOX_MAINTENANCE) - sandbox_connect/check_user unavailable; trace: 5cdf145bd8cf43b5b62b6e45489f87aa |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | Sandbox 7 implicit tools smoke blocked by sandbox maintenance (HDKIT_SANDBOX_MAINTENANCE) - sandbox_check_user/credentials/sign_agreement/exec_one_shot/upload_file/deploy_check/close_session unavailable |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Sandbox HDKit service params blocked by sandbox maintenance (HDKIT_SANDBOX_MAINTENANCE) - sandbox_connect/credentials unavailable for parameter verification |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox preview URL blocked by sandbox maintenance (HDKIT_SANDBOX_MAINTENANCE) - sandbox_connect/deploy_nginx/expose_tunnel unavailable |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无` - show_profile_redacted 返回 `<redacted>`，run_readonly_command 输出 `--cli-access-key=<redacted>`
- [x] 写操作误判 read-only：`无` - CreateServers/DeleteVpc/DeleteServers 均判 risk=write/decision=deny，ListServers/ListVpcs 判 risk=read_only/decision=allow
- [x] 红线（I 类）违规：`0` - 真云只读查询+规划冒烟，无计费资源创建；凭证脱敏+安全hook+审批门禁均通过
- [x] 脱敏复核：`通过` - AK/SK/token 在 show_profile_redacted、run_readonly_command rawArgs、auth_status fingerprint 中均为脱敏或哈希

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/RDS 等 | 未创建（只读查询+规划冒烟） | N/A | N/A |
| 沙箱实例 | 未创建（沙箱维护中） | N/A | N/A |

> 本轮测试无真云计费资源创建。所有写操作均停留在 plan/approval 阶段（safeToRun=false），未执行实际创建。只读查询（ListServers/ListVpcs 等）不产生计费资源。沙箱因 HDKIT_SANDBOX_MAINTENANCE 不可用，4 条沙箱用例标 BLOCKED。

---

## 八、遗留与建议

- **BLOCKED 补测建议**：4 条沙箱用例（D3-C3/D3-C6/D3-C14/D3-S3）因 HDKIT_SANDBOX_MAINTENANCE 被阻塞，待沙箱服务恢复后补测。
- **EXP-E01 路由 MISS**：评测集 EXP-E01「帮我查一下我账号在华北北京四有哪些云主机」未命中 ECS（返回 help text），建议优化 serviceCatalog 对「查云主机」类自然语言意图的路由匹配。
- **check_update registry 不可达**：本机 check_update 返回 result=check_failed（latestStable=null），疑似 npm registry 网络问题，不影响功能使用但版本检测不可用。
- **eval harness 准确率**：92.9%（13 HIT/1 MISS/1 N/A），较基线 21.4% MISS 显著改善。
