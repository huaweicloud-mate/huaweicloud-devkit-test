# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **生成时间**：2026-11-16 05:17:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-16-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（6 项 FAIL，均为历史已知缺陷复现；真云 E2E 全 PASS 且资源归零）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent（deepseek-v4-pro-0813） |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `1.1.14-next.5`（npm @next，gitHead `4fb59d76`） |
| 工具全集 | 47（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已配置（`~/bin/hcloud`） |
| 真云凭证 | cn-north-4（AKSK + 只读子账号 test001 就绪） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107（预筛后）+ 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 真实 hcloud 建删资源，决策/结果落 `stdout.log`；统一 driver 见 `evidence/_probes/*.mjs`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146（设计级 107 + 展开级 39） |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 139 / 6 / 0 / 0 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 95.86% |
| P0 / P1 / P2 新增缺陷 | 2 / 1 / 3 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（VPC 残留 0，OBS 已删） |

---

## 三、状态汇总

### 3.1 设计级（107 条）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 101 | 有证据且通过 PASS 门禁 |
| FAIL | 5 | D4-3 / D4-21 / D4-25 / D4-26 / D8-9 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 1 | D1-39（Windows 专属，Linux 结构性不适用） |
| **合计** | **107** | |

### 3.2 展开级（39 条）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01（云主机路由 MISS） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-3 | 明文 secret API 拦截不完整 | DecryptData 应 `deny`（secret 风险） | `DecryptData=allow` | `safety-policy.mjs:249` + `:599` | 历史问题 |
| 2 | P0 | EXP-E01 | serviceCatalog「云主机」未路由 ECS | 含「云主机」应命中 ECS | 返回 `Run hcloud --help`（MISS） | `tools.mjs:2358-2371` | 历史问题 |
| 3 | P1 | D4-21 | HCL AdministratorFullAccess 未拦截 | 应命中 `hwc-iam-admin-policy` deny | `decision=warn`（落 sandbox 规则） | `risk-rule-engine.mjs:150` | 历史问题 |
| 4 | P2 | D4-25 | Python hook 写操作误分类 cli:invoke | 写操作应 `cli:write` | `cli:invoke`（缺 write） | `hooks/huaweicloud-safety.py:57` | 历史问题 |
| 5 | P2 | D4-26 | findings 证据未脱敏（--key value 空格形态） | evidence 应无明文凭证 | 明文 `Secret123` 留存 | `risk-rule-engine.mjs:97` + `safety-policy.mjs:34` | 历史问题 |
| 6 | P2 | D8-9 | sanitizeValue 未脱敏敏感值 | 应移除 AK/token 敏感值 | 返回原文 | `telemetry/telemetry.mjs:190` | 历史问题 |

> 6 项 FAIL 均为历史已知缺陷复现（被测版本 1.1.14-next.5 与上一轮一致，缺陷未修复），经 `file_issue.py` 历史查重全部命中上游 open issue，本轮不重复开单，详见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注 Windows 专属；Linux 由 D1-40 反向提醒覆盖） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（hdk-s3-c1/s2/audit/deny） | 是 | 已删 | 残留 0 |
| OBS bucket（hdk-s3-obs/web） | 是 | 已删 | 已删 |
| 沙箱 session | 连接 | 已关 | 会话已关闭 |

> 真云只删本次创建资源（前缀 `hdk-s3-`），归零核实 `VPC 残留=0`。

---

## 八、遗留与建议

- 6 项 FAIL 均为 v1.1.14-next.5 已存在的已知缺陷，建议维护者持续跟踪上游 issue 修复进度，修复后下一轮回归复测。
- 本轮真云 E2E（VPC/OBS 建删归零、沙箱 connect、审计）全 PASS，凭证与只读子账号链路正常。
