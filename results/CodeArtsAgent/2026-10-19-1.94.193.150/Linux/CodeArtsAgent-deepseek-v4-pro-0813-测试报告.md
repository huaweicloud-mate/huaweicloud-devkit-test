# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-19 05:50:13（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-10-19-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 6.8.0-106） |
| 被测版本（SUT） | `1.1.9`（npm latest，gitHead `05a67b64`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级探针直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，或 spawn `mcp-server.mjs` 驱动 JSON-RPC；D1 安装域真机 CLI（隔离 HOME install/doctor/status/update/uninstall）；真云 E2E 真机建删归零；D10 评测集走 eval/harness/run-eval.mjs；结论落 evidence/<case-id>/。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 10 / 5 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `92.8%` |
| P0 / P1 / P2 新增缺陷 | `3 / 2 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | 本次创建资源全部归零（OBS 桶/沙箱/VPC/SG 已删除，配额阻塞用例未产生残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
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
| 1 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs` serviceCatalog 复合意图缺关键词拆分 | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `plugins/huaweicloud-core/safety/policy.json:26` blockedSecretOperations 未含 DecryptData | 待提单 |
| 3 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `plugins/huaweicloud-core/src/risk-rule-engine.mjs` 命令替换内层未进入风险匹配 | 待提单 |
| 4 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | `plugins/huaweicloud-core/src/risk-rule-engine.mjs` iam-admin-policy 仅匹配 JSON 未覆盖 HCL | 待提单 |
| 5 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 分类正则无词边界 | 待提单 |
| 6 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | `plugins/huaweicloud-core/src/risk-rule-engine.mjs` 脱敏未覆盖 secret_key/adminPass | 待提单 |
| 7 | P2 | `D8-1` | D8质量 | 文档与能力一致 | `AGENTS.md:27/45` 声明 39 与实际 42 未同步 | 待提单 |
| 8 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` sanitizeValue 无敏感值脱敏 | 待提单 |
| 9 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `plugins/huaweicloud-core/src/mcp-server.mjs:175` handleMessage 无 initialize 前置校验 | 待提单 |
| 10 | P1 | `EXP-E01` |  |  | `plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 中文「云主机」关键词缺失 | 待提单 |

### 根因详情

> 每个 FAIL 的断言/根因/证据见 FINDINGS.md 与各自 evidence/<case-id>/stdout.log；核心根因（文件:行号）已写入上方缺陷清单。D9-9 SPEC-MISMATCH 见 FINDINGS #11。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 升级检测链专属（OS 列标注「专属」），本机 Linux |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | 华为云 Router 配额超限 VPC.0114「Quota exceeded for resources: ['router']」，无法创建测试 VPC/子网，下游 ECS/RDS 编排失败。解除条件=释放 router 配额（清理遗留 VPC 或扩配额） |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | OBS 建桶 403 UserRestricted（This operation is forbidden for restricted users），账号被限制。解除条件=账号解除受限 |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | FunctionGraph CreateFunction 返回 FSS.0403「user restricted / Forbidden」，账号受限。解除条件=账号解除受限 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 华为云 Router 配额超限 VPC.0114「Quota exceeded for resources: ['router']」，无法创建测试 VPC/子网，下游 ECS/RDS 编排失败。解除条件=释放 router 配额（清理遗留 VPC 或扩配额）（serviceCatalog 复合意图命中 RDS OK，VPC 前置编排失败） |
| `D4-14` | D4安全 | 操作可审计性 | 华为云 Router 配额超限 VPC.0114「Quota exceeded for resources: ['router']」，无法创建测试 VPC/子网，下游 ECS/RDS 编排失败。解除条件=释放 router 配额（清理遗留 VPC 或扩配额）（CTS ListTraces 审计链已通过，CreateVpc 失败） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0（所有证据经 redact 脱敏）
- [x] 写操作误判 read-only：0（D4-5/D4-7/D4-9/D4-28 具名回归通过）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：evidence 无原始 AK/SK/明文密码（D4-27 双路径脱敏 PASS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2） | 是 | 已删 | ListBuckets 不含本次 ✓ |
| 测试 VPC/SG（D3-S2） | 是 | 已删 | zeroed=true ✓ |
| 沙箱会话（D3-C3/D3-C6/D3-S3） | 是 | close_session | 会话正常关闭 ✓ |
| 测试 VPC（D3-S7） | 尝试（VPC.0114 未建成） | 已清理 | 无残留 ✓ |
| 安全组（D3-C1） | 是 | 已删 | 无残留 ✓ |
| FunctionGraph（D3-S6） | 尝试（FSS.0403 未建成） | 无 | 无残留 ✓ |
| OBS（D3-C13） | 尝试（UserRestricted 未建成） | 无 | 无残留 ✓ |

> 真云只删本次创建资源；未触碰他人遗留资源。

---

## 八、遗留与建议

1. **10 项历史缺陷未修复**（D4-3/D4-21/D9-12/D4-17/EXP-E01/D3-S5/D4-25/D4-26/D8-1/D8-9），与 2026-10-18 根因一致，file_issue.py 查重后不重复开单。
2. **D9-9 SPEC-MISMATCH**：tools/call 取消语义（notifications.cancellation）仍未声明，需在 mcp-protocol.mjs capabilities 补齐。
3. **Router 配额需释放**：D3-C1/D3-S7/D4-14 被 VPC.0114 阻塞，建议维护侧清理遗留 VPC 后补测。
4. **账号受限需解除**：D3-C13（OBS UserRestricted）/D3-S6（FSS.0403）账号被服务端标记 restricted，建议维护侧核查账号状态后补测。
5. **D3-S3 已恢复**：上轮 deploy_nginx 偶发异常，本轮 nginx_serving=PASS（HTTP 200）。
