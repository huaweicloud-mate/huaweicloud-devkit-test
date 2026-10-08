# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **生成时间**：`2026-10-09 05:11:16`（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-09-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 P0 缺陷缺口）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8-next.1`（npm `@next`，gitHead `ffd7b474`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS，tools/list 实测 41） |
| hcloud / 依赖 | KooCLI 7.2.12（doctor 已配置） |
| 真云凭证 | cn-north-4（AKSK + 只读子账号 test001 已就绪） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：适配 `run_all.sh` 35 支源码级/协议/harness/真云探针本机 fresh 重跑（统一走 `hdk/plugins/huaweicloud-core/src`，SUT=1.1.8-next.1，gitHead ffd7b474）+ D3-S6 FunctionGraph / D4-24 确认令牌真机直跑 + D4-3/D4-15/D4-27/D4-26/D8-1 等关键缺陷点直调复核。证据统一落 `evidence/<case-id>/stdout.log`，经 `run_evidence.py` 回填三 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 141（设计级 102 + 展开级 39） |
| 已执行 | 141 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 123 / 13 / 1 / 3 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC，不含 BLOCKED/NOT_RUN） | 88.5%（123/139） |
| P0 / P1 / P2 新增缺陷 | 4 / 5 / 6 |
| 红线（I 类凭证泄露）违规 | 见缺陷 #6/#7（脱敏不完整残留） |
| 资源释放 | 全部归零（tctest- VPC 残留 0、hdk1-s6 FunctionGraph 残留 0、OBS 已删） |

---

## 三、状态汇总

### 3.1 设计级（102）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 85 | 有证据且通过 PASS 门禁 |
| FAIL | 12 | 不符预期，根因见缺陷清单 |
| BLOCKED | 1 | D3-S7 跨服务 RDS（需 VPC/子网/安全组前置 + 长 provisioning） |
| SPEC-MISMATCH | 3 | D9-9 取消语义 / D1-65 DEBUG 开关 / D1-68 region 优先级 |
| NOT_RUN | 1 | D1-39 Windows 专属 OS 用例 |
| **合计** | **102** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 中文「云主机」路由 MISS |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **39** | |

---

## 四、缺陷清单

> 全部 15 项缺陷经历史查重（详见 `HISTORY_LINKS.md`），序号/级别/根因与 `FINDINGS.md` 一致。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D4-3 | kms DecryptData 明文 secret API 未拦截 | `safety/policy.json` blockedSecretOperations 缺 DecryptData |
| 2 | P0 | D4-15 | ANSI-C 引号命令替换绕过写规则 | `risk-rule-engine.mjs` 纯正则未解析编码内层 |
| 3 | P0 | D4-21 | HCL/Terraform broad IAM 未拦截 | `risk-rule-engine.mjs` iam 规则仅匹配 JSON |
| 4 | P0 | D9-12 | initialize 时序未强制（tools/list 未返回 -32600） | `mcp-protocol.mjs` dispatch 无前置校验 |
| 5 | P1 | D4-17 | hook 畸形输入 fail-open | `risk-rule-engine.mjs` 无 finding 即 allow |
| 6 | P1 | D4-26 | findings 证据 secret_key/adminPass 明文残留 | `risk-rule-engine.mjs:19` redactEvidence |
| 7 | P1 | D4-27 | --key value 空格形态未脱敏 | `safety-policy.mjs:34` redactString |
| 8 | P1 | D3-S3 | 沙箱预览公网 URL 未建立（devbridge FAIL） | DevBridge 隧道未建立 + 缺 HW_API_KEY |
| 9 | P2 | D4-25 | Python hook 写命令落 cli:invoke | `huaweicloud-safety.py:46` 正则缺词边界 |
| 10 | P2 | D8-9 | sanitizeValue 不脱敏 AK/SK/token | `telemetry.mjs:189` |
| 11 | P2 | D8-1 | 文档声明 39 tools vs 实现 41 | `AGENTS.md:27/45` |
| 12 | P2 | D3-S5 | 复合意图分层路由 MISS | `tools.mjs` serviceCatalog 无复合拆分 |
| 13 | P1 | D9-9 | capabilities 未声明 cancellation（SPEC） | `mcp-protocol.mjs:47` |
| 14 | P2 | D1-65 | DEBUG=1 遥测域不生效（SPEC） | `telemetry.mjs:81` |
| 15 | P2 | D1-68 | region 优先级 HW_REGION > HUAWEICLOUD_REGION（SPEC） | `credentials.mjs:222` |

---

## 五、未执行用例与原因

| ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 【调归属】OS 专属 | Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注「Windows 专属」），Linux 由 D1-40 覆盖 |
| D3-S7 | 设计级 | P1 | BLOCKED | 【补环境】 | 跨服务交付需先编排 VPC/子网/安全组前置再创建 RDS，且 RDS provisioning 10~20min + 按需计费；探针 CreateInstance 返回 USE_ERROR Invalid parameter: db.port。建议独立补测轮 |

---

## 六、安全 / 红线

- 真云用例全部真机执行、建删归零已核验：D3-S6 FunctionGraph 建函数+定时触发器→删函数归零（今日 hdk1-s6-* 残留 0）；D3-S2/D4-14 VPC/OBS 建删归零。
- 凭证脱敏红线：D4-26/D4-27 存在残留缺口（已列入缺陷，命中历史单）。
- 未 mock、未假跑、未以无凭证标 BLOCKED（真云已具备执行条件即真机执行）。

## 七、资源释放

| 资源 | 创建 | 删除 | 归零验证 |
|---|---|---|---|
| VPC（tctest-*） | 多项 | 已删 | `ListVpcs` 无本次残留 ✅ |
| OBS 桶（tctest-*） | 1 | 已删 | OBS rm 归零 ✅ |
| FunctionGraph（hdk1-s6-*） | 1 | 已删 | `ListFunctions` 无残留 ✅ |
| 沙箱 session | 1 | 已关 | close_session ok ✅ |
| RDS | 0 | - | D3-S7 未建成（BLOCKED），无残留 |

## 八、遗留建议

- 4 项 P0 缺陷（D4-3/D4-15/D4-21/D9-12）均为历史延续，建议维护方优先修复。
- D3-S3 devbridge 隧道需补 HW_API_KEY 长生命周期凭证后复测（真·外部依赖）。
- D3-S7 建议独立补测轮（RDS provisioning 窗口），日常每天轮次不宜纳入。