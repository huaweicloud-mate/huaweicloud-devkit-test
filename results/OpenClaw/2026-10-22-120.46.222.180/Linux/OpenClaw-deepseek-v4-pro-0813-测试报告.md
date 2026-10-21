# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-10-22 05:25:00`（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-22-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（13 项产品缺陷，含 1 项 1.1.10 新回归 P1）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 24.04） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.10`（npm latest，gitHead `b0e9f026`，PR #974） |
| 工具全集 | `43`（`tools.mjs` TOOL_DEFINITIONS，1.1.10 新增 `huaweicloud_check_account_type`） |
| hcloud / 依赖 | hcloud 7.2.12（配对 7.3.12，doctor 提示 version_mismatch 但不影响只读/审计探针） |
| 真云凭证 | cn-north-4（AK/SK 预置 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| 设计真源 | daily 精选：设计级 107 / 展开级 39 / 追踪表 + 使命 mission-001（9 条） |

> **执行方法**：探针脚本（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E（ECS/OBS/沙箱/FunctionGraph/RDS/只读子账号）真机建删归零；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 107 + 展开级 39 + 使命 9 |
| 已执行 | 146（设计级 107 + 展开级 39） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 127 / 14 / 1 / 3 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 88.2%（127/144） |
| P0 / P1 / P2 新增缺陷 | 0 / **1** / 0（其余 12 项为历史延续） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（ECS/VPC/子网/EIP/OBS 桶/FunctionGraph 函数均删净复核） |

> 与昨日（1.1.10 同版本）结论一致：13 项产品缺陷持续，含 1 项 1.1.10 新回归 P1（D3-C3/D3-S3 deploy_nginx 写验证误判）。

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 89 | 有证据且通过 PASS 门禁 |
| FAIL | 13 | 不符预期，根因见缺陷清单 |
| BLOCKED | 1 | D3-S7 RDS 真云外部依赖 |
| SPEC-MISMATCH | 3 | D1-65/D1-68/D9-9 契约漂移待裁决 |
| NOT_RUN | 1 | D1-39 Windows 专属在 Linux |
| **合计** | **107** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01（云主机路由 MISS） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

### 3.3 使命（mission-001，9 条，与设计级重叠）

| 状态 | 数量 |
|---|---|
| PASS | 6 |
| FAIL | 3（D4-3 / D4-15 / D4-25） |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 是否新回归 |
|---|---|---|---|---|---|
| 1 | P1 | D3-C3/D3-S3 | deploy_nginx 写验证误判（OSC-133 未 strip） | session-manager.mjs:1010 | **是（1.1.10）** |
| 2 | P0 | D4-3 | 明文 secret API 未拦截（DecryptData/DecryptDatakey） | safety/policy.json:26 | 否 |
| 3 | P0 | D4-15 | hook 绕过（ANSI-C 引号命令替换） | risk-rule-engine.mjs | 否 |
| 4 | P0 | D4-21 | hook_check_artifacts HCL broad IAM 未拦截 | risk-rule-engine.mjs | 否 |
| 5 | P0 | D9-12 | initialize 时序未强制（-32600） | mcp-protocol.mjs:57 | 否 |
| 6 | P1 | D4-17 | hook 模糊 fail-closed 缺口 | risk-rule-engine.mjs | 否 |
| 7 | P1 | D4-27 | 双路径脱敏缺空格形态 | safety-policy.mjs:34 | 否 |
| 8 | P1 | EXP-E01 | 『云主机』中文意图路由 MISS | tools.mjs | 否 |
| 9 | P2 | D3-S5 | 复合意图分层路由 MISS | tools.mjs serviceCatalog | 否 |
| 10 | P2 | D4-25 | Python hook 写→cli:invoke | huaweicloud-safety.py:46 | 否 |
| 11 | P2 | D4-26 | findings 证据脱敏不完整 | risk-rule-engine.mjs:19 | 否 |
| 12 | P2 | D8-1 | AGENTS.md 39 vs 43 工具漂移 | AGENTS.md:45 | 否 |
| 13 | P2 | D8-9 | sanitizeValue 未脱敏 | telemetry/telemetry.mjs:189 | 否 |

完整现象/断言/根因/证据见 `FINDINGS.md`（统一提单解析输入）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | OS 专属：Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注「Windows 专属」，Linux 由 D1-40 覆盖） | 无（OS 专属用例，非本 OS 不适用属预期） |
| D3-S7 | 设计级 | P1 | BLOCKED | 补环境 | RDS 跨服务交付需 vpc/subnet/sg 前置编排 + 正确 db 参数（`--password` 与 KooCLI 冲突需 `--cli-jsonInput`）+ 3~8min provisioning + 按需计费 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真实 AK/SK 在 stdout.log 中已 redact）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（tctest-openclaw-c1） | 是 | 已删 | 手工复核 serverId 已消失 |
| VPC（含 D3-C1/D3-S2/D4-14/D4-13 探针） | 是 | 已删 | ListVpcs 复核不含本次资源 |
| 子网 | 是 | 已删 | ListSubnets 复核不含本次 |
| EIP | 是 | 已删 | ListPublicips total_count=0 |
| OBS 桶（tctest-openclaw-c2） | 是 | 已删 | OBS ls 复核不含本次桶 |
| FunctionGraph 函数（hdk-s6） | 是 | 已删 | DeleteFunction 归零 ok=true |
| RDS（D3-S7） | 未创建成功 | — | ListInstances 无本次残留 |

> 真云只删本次创建资源，未触碰他人并发资源（testbot3-hermes / 其他 agent 的历史 VPC/ECS 仅盘点未动）。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-65`（telemetry 域 DEBUG '1' 不生效）、`D1-68`（region 优先级）、`D9-9`（cancellation 未声明）。
- 本轮 BLOCKED：`D3-S7` RDS 跨服务交付（需前置网络编排 + 配额，真云外部依赖）。
- 建议：1.1.10 新回归 D3-C3/D3-S3 优先级最高，`parseDeployNginxVerifyOutput` 应在调用前 `stripTerminalEscapes`（与 `parseDeployCheckOutput` 一致），一行修复即可打通沙箱部署主流程。