# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-10-15 05:58:00`（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-15-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：**PARTIAL**（13 FAIL + 3 SPEC-MISMATCH，均为历史延续；无新提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（`6.8.0-106-generic`） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `1.1.9-next.0`（npm @next，gitHead `6302921c`，PR #914） |
| 工具全集 | `42`（tools.mjs TOOL_DEFINITIONS，含新增 `huaweicloud_competition_voucher_claim`） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 已确认（Hermes MCP Python SDK 未装，属目标插件依赖提示） |
| 真云凭证 | cn-north-4（AKSK 主账号 + test001 只读子账号） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| 设计真源 | 设计级 107 / 展开级 39 / 追踪表 |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：run_all.sh 33 支源码级/协议/harness/真云探针本机 fresh 重跑（对 1.1.9-next.0），另补 d3s2 重跑、D3-S6 真云 standalone 重跑、D4-24 直调复核、d4-15-bypass/wrap/hcl 直调、new-e2e + sandbox-e2e fresh 重跑。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146（设计级 107 + 展开级 39） |
| 已执行 | 145（1 条 OS 专属豁免 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 127 / 13 / 2 / 3 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 88.8%（127/143） |
| P0 / P1 / P2 新增缺陷 | 0 / 0 / 0（16 项全部命中历史缺陷单，不重复提单） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本次创建 tctest-openclaw VPC/OBS/FunctionGraph 残留 0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 |
|---|---|
| PASS | 89 |
| FAIL | 12 |
| BLOCKED | 2 |
| SPEC-MISMATCH | 3 |
| NOT_RUN | 1（D1-39 Windows 专属） |
| **合计** | **107** |

### 3.2 展开级

| 状态 | 数量 |
|---|---|
| PASS | 38 |
| FAIL | 1（EXP-E01） |
| BLOCKED | 0 |
| SPEC-MISMATCH | 0 |
| NOT_RUN | 0 |
| **合计** | **39** |

---

## 四、缺陷清单

> 16 项缺陷全部命中上游仓历史 issue（`file_issue.py --dry-run` 强关联命中），按红线「历史查重命中即不重复开单」，本轮不新开单，关联清单见 `HISTORY_LINKS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-3 | 明文 secret API 未拦截（kms DecryptData/DecryptDatakey） | safety/policy.json blockedSecretOperations 缺 DecryptData | 历史（#864 等） |
| 2 | P0 | D4-15 | hook 绕过：ANSI-C 引号命令替换未拦截 | risk-rule-engine.mjs 纯正则未解析 ANSI-C | 历史（#866 等） |
| 3 | P0 | D4-21 | hook_check_artifacts HCL/TF broad IAM 未拦截 | risk-rule-engine.mjs iam-admin-policy 仅 JSON 形态 | 历史（#752 等） |
| 4 | P0 | D9-12 | initialize 握手时序未强制（未 init 先 tools/list 未拒） | mcp-protocol.mjs:57 无 initialize 前置 | 历史（#844 等） |
| 5 | P1 | D4-17 | hook 模糊 fail-closed 缺口 | risk-rule-engine.mjs:106 无 finding 即 allow | 历史（#866 等） |
| 6 | P1 | D3-S3 | expose_tunnel 公网 URL 解析失效（OSC 133 未剥离） | session-manager.mjs:1277-1288 parseDevbridgeExposeOutput 无 ANSI 剥离 | 历史（#787 等，**根因收窄**） |
| 7 | P1 | D4-27 | 双路径输出脱敏缺口（--key value 空格形态） | safety-policy.mjs redactString 仅 key[:=]value | 历史（#896 等） |
| 8 | P1 | D9-9 | tools/call 取消语义未声明（SPEC） | mcp-protocol.mjs capabilities 无 cancellation | 历史（#844 等） |
| 9 | P1 | EXP-E01 | 评测集『云主机』中文意图路由 MISS | tools.mjs ECS keywords 缺『云主机』 | 历史（#852 等） |
| 10 | P2 | D4-25 | Python hook 写操作遥测分类错误 | huaweicloud-safety.py:46 WRITE_OPERATION_RE 词边界 | 历史（#844 等） |
| 11 | P2 | D4-26 | findings 证据脱敏不完整（secret_key/adminPass） | risk-rule-engine.mjs:19-25 redactEvidence | 历史（#791 等） |
| 12 | P2 | D8-9 | sanitizeValue 未做凭证脱敏 | telemetry.mjs sanitizeValue 无敏感值脱敏 | 历史（#896 等） |
| 13 | P2 | D8-1 | 文档与能力漂移（AGENTS.md 39 vs 实现 42） | AGENTS.md:27 硬编码 39 | 历史（#674 等） |
| 14 | P2 | D3-S5 | 复合意图分层路由 MISS | tools.mjs serviceCatalog 无复合意图拆解 | 历史（#788 等） |
| 15 | P2 | D1-65 | DEBUG 开关仅认字面量 'true'（SPEC） | telemetry.mjs:81 `=== 'true'` | 历史（#844 等） |
| 16 | P2 | D1-68 | region env 优先级与契约相反（SPEC） | credentials.mjs:225 HW_REGION 优先 | 历史（#844 等） |

> 补充说明：#6 D3-S3 本轮较历史「隧道未建立（缺 HW_API_KEY）」结论有进展——实际已真实建隧成功（authMode=API_KEY_KEYRING, HTTP 200），根因收窄为 `parseDevbridgeExposeOutput` 未剥离 OSC 133 导致 publicUrl 解析为空，属新的源码定位，但用例归属仍命中既有 #787/#786 历史单，不重复开单。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注「Windows 专属」） | Linux 侧由 D1-40/EXP-NR3-10 覆盖，无需改 |
| D3-C1 | 设计级 | P1 | BLOCKED | 补环境 | VPC CreateVpc 连续重试命中 VPC.0114『router 配额超限』（5 个 VPC 中 4 个为他人/hemedi残留，红线禁删） | 清理他人残留 VPC 释放配额后复测 |
| D3-S7 | 设计级 | P1 | BLOCKED | 补环境 | RDS CreateInstance 返回 USE_ERROR Invalid parameter: db.password，且需 vpc/subnet/sg 前置 + 10~20min provisioning | 前置网络编排 + 正确 db 参数 + 配额 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无明文 AK/SK，show_profile_redacted 全 `<redacted>`）
- [x] 写操作误判 read-only：`0`（DeleteServer/DeleteVpc 等全 deny/write）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志；真云只删本次创建资源

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（tctest-openclaw-s2/s2check/dbg） | 是 | 已删 | 残留 0 |
| VPC（D4-14 tctest 审计链路） | 是 | 已删 | 残留 0 |
| OBS 桶（tctest-openclaw-c2） | 是 | 已删 | 残留 0 |
| FunctionGraph（hdk1-s6-*） | 是 | 已删 | 残留 0 |
| 沙箱（D3-C3/D3-C6/D3-S3） | 连接 | close_session | 无计费残留 |

> 当前 VPC 仅剩历史他人资源（tctest-diag2/diag3=10-12 既有、hdk-t2-vpc、testbot1-hermes-e2e×2），均非本轮创建、未动。EIP 共 2 个（既有，非本轮创建）。

---

## 八、遗留与建议

- 待裁决 SPEC：D9-9（cancellation 未声明）、D1-65（DEBUG '1' vs 'true'）、D1-68（region 优先级）。
- 本轮未覆盖（说明范围）：D3-C1/D3-S7 因 VPC 配额 + RDS 参数/前置被 BLOCKED（有 blockedReason，已追一轮验证不可解，非假阻塞）。
- 建议：D4-3（DecryptData）与 D4-27（空格形态脱敏）为 4 个 P0/P1 安全缺口中的高频复现项，建议优先纳入 `safety/policy.json` 与 `redactString` 修复；D3-S3 已定位到 `parseDevbridgeExposeOutput` 缺 ANSI/OSC 剥离（与 `parseDeployCheckOutput` 不对称），建议对照补上。