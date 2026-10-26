# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-27 05:25（北京时间）
> **执行归档**：`results/OpenCode/2026-10-27-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL/P0 缺口，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux x86_64（IP 1.92.93.23） |
| Node / npm / Python | Node v22.13.0 / npm 10 / Python 3.12.3 |
| 被测版本（SUT） | huaweicloud-devkit@1.1.12（gitHead 4ed07801，release-1.1.12） |
| 工具全集 | 46（tools/list 枚举） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI；devkit 钉扎 7.3.12，版本 mismatch 见遗留） |
| 真云凭证 | cn-north-4（AK/SK 管理员 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/help）/ MCP 协议 / 真云 E2E（建删归零） |
| daily 执行包 | 设计级 107 / 展开级 39 / 追踪表 216 / 使命 mission-001（9 条） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 真云 hcloud 建删资源，决策/结果落 `stdout.log`；证据统一落 `evidence/<case-id>/`。后台 hourly_sync（interval 600）每 10 分钟增量提报。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily 设计级+展开级） | 146 |
| 已执行 | 145（D1-39 Windows 专属在 Linux 标 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 128 / 11 / 3 / 3 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 90.1%（128/142） |
| P0 / P1 / P2 缺陷（FAIL+SPEC） | 4 / 5 / 5 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（ECS/OBS/VPC/EIP/FunctionGraph 均删除并核实） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 90 | 有证据且通过 PASS 门禁 |
| FAIL | 10 | 不符预期，根因见缺陷清单 |
| BLOCKED | 3 | 沙箱服务维护（D3-C3/D3-C6/D3-S3） |
| SPEC-MISMATCH | 3 | 契约漂移（D8-9/D9-9/D10-4） |
| NOT_RUN | 1 | D1-39 Windows 专属在 Linux（NR3-10 已代表覆盖） |
| **合计** | **107** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 含 EXP-C4-01~22（DMS/DEW 聚合服务正确返回 subServices） |
| FAIL | 1 | EXP-E01「云主机」MISS |
| BLOCKED / SPEC / NOT_RUN | 0 / 0 / 0 | |
| **合计** | **39** | |

---

## 四、缺陷清单（详情见 FINDINGS.md，共 14 条）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截未覆盖裸 access_key | safety-policy.mjs:546 |
| 2 | P0 | D4-21 | hook_check_artifacts 未拦截 HCL 宽 IAM | cloud-risk-rules.json:196-218 |
| 3 | P0 | D9-12 | initialize 握手安全基线两处缺口 | mcp-protocol.mjs:32-59 |
| 4 | P1 | D3-S7 | 复合意图未分解 + RDS 最小实例失败 | tools.mjs:2023-2277 |
| 5 | P1 | D4-6 | adminPass 回显警告不覆盖 command 阶段 | cloud-risk-rules.json:74 |
| 6 | P1 | D4-17 | hook 模糊输入 fail-open | risk-rule-engine.mjs:103 |
| 7 | P1 | EXP-E01 | serviceCatalog「云主机」未命中 ECS | tools.mjs:2033-2037 |
| 8 | P2 | D3-S5 | 复合意图分层路由未分解 | tools.mjs:2023-2277 |
| 9 | P2 | D3-S6 | FunctionGraph 定时任务编排未闭合 | hcloud-cli.mjs:745 |
| 10 | P2 | D4-25 | Python hook 写操作遥测误分类 cli:invoke | huaweicloud-safety.py:46 |
| 11 | P2 | D4-26 | findings.evidence 脱敏未覆盖 JSON 引号 key | risk-rule-engine.mjs:22-23 |
| 12 | P0 | D10-4 | 规则库计数断言漂移 16→19（SPEC） | cloud-risk-rules.json |
| 13 | P1 | D9-9 | capabilities 未声明 cancellation（SPEC） | mcp-protocol.mjs:47-49 |
| 14 | P2 | D8-9 | sanitizeValue 未脱敏 AK/SK/token（SPEC） | telemetry.mjs:189-197 |

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D3-C3 | 设计级 | P1 | BLOCKED | 补环境 | `HDKIT_SANDBOX_MAINTENANCE`（沙箱功能升级优化中），connect/check_user 全部返回维护态，E2E 无法进入 | — |
| D3-C6 | 设计级 | P1 | BLOCKED | 补环境 | 同上，7 隐式工具 check_user/connect/sign_agreement 均维护态 | — |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | 同上，sandbox_check_user 失败无法部署预览 | — |
| D1-39 | 设计级 | P0 | NOT_RUN | —（OS 专属，归属正确，预期 NOT_RUN） | Windows 专属升级检测链（EINVAL），本机 Linux；Linux 由 NR3-10 queryDistTags 代表覆盖（disttags.log 实测 PASS） | — |

> 沙箱三用例为真·外部依赖（沙箱服务侧维护，非本机/凭证问题），已实测确认维护态并落盘证据，待沙箱恢复后复测。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证（AK/SK 均 `<redacted>`/脱敏），D4-13 只读子账号探针未落盘 AK/SK
- [x] 真云只删本次创建资源：ECS（D3-C1）、OBS（D3-C2/D3-C13）、VPC（D4-14/D3-S2）、EIP（D3-C7）、FunctionGraph（D3-S6）均创建后删除并归零核实

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是 | 已删 | ECS count 不含本次资源，VPC+子网 cleanOk=true |
| OBS 桶（D3-C2/D3-C13） | 是 | 已删 | rm -r -f 清对象 + rm bucket -f |
| VPC（D4-14/D3-S2/D4-20） | 是 | 已删 | ListVpcs 不含本次 vpcName |
| EIP（D3-C7） | 是 | 已删 | DeletePublicip 释放 |
| FunctionGraph（D3-S6） | 是 | 已删 | ListFunctions 无 hdk-s6 残留 |
| 沙箱（D3-C3/C6/S3） | 否（维护） | — | 未创建资源 |

---

## 八、遗留与建议

- 待裁决 SPEC：D10-4（规则计数 16→19）、D9-9（cancellation）、D8-9（sanitizeValue 脱敏）。
- 本轮未覆盖：多终端矩阵真实 Agent 会话评测（D10 真实 LLM harness，本机为 OpenCode 无 dsh，走确定性 serviceCatalog 路由已覆盖）；沙箱部署 E2E（服务维护）。
- 环境备注：本机 KooCLI 7.2.12 与 devkit 1.1.12 钉扎的 7.3.12 版本 mismatch（check_cli 已如实上报 version_mismatch，非产品缺陷，建议 `npx huaweicloud-devkit install-hcloud` 更新）。
- 建议：维护 agent 据「改用例/调归属」项修订 D1-39 归属说明；沙箱恢复后补测 D3-C3/D3-C6/D3-S3。