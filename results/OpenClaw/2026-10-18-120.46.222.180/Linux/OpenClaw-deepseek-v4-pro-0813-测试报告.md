# OpenClaw-deepseek-v4-pro-0813-测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-10-18 06:05:00`（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-18-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（13 FAIL + 3 SPEC-MISMATCH，各为历史延续缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 24.04.4） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.9-next.1`（npm @next，gitHead `12efbe8c`） |
| 工具全集 | `42`（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（插件配对 7.3.12，version_mismatch） |
| 真云凭证 | cn-north-4（AKSK，统一账号 hw018619646） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数与 MCP server，真云 E2E 经 callTool 建删资源归零；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `128 / 13 / 1 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `88.9%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（全部为历史延续，经 file_issue.py 查重后确认） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（tctest-* VPC/子网/ECS/EIP 残留 0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 历史延续缺陷，详见缺陷清单 |
| BLOCKED | `1` | D3-S7 RDS 前置环境，见阻塞项 |
| SPEC-MISMATCH | `3` | D1-65 / D1-68 / D9-9 契约漂移 |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 列标注） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 云主机路由 MISS |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单（13 FAIL + 3 SPEC，均为历史延续）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D4-3 | 明文 secret API 未拦截（kms DecryptData/DecryptDatakey） | `plugins/huaweicloud-core/safety/policy.json` blockedSecretOperations 缺 DecryptData/DecryptDatakey |
| 2 | P0 | D4-15 | hook 绕过 ANSI-C 引号命令替换未拦截 | `plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则未解析 ANSI-C 内层 |
| 3 | P0 | D4-21 | hook_check_artifacts HCL/Terraform 广泛 IAM 未拦截 | `risk-rule-engine.mjs` iam-admin-policy 仅匹配 JSON |
| 4 | P0 | D9-12 | initialize 握手时序未强制（未 init 先 tools/list） | `mcp-protocol.mjs` dispatch tools/list 无 initialize 前置校验 |
| 5 | P1 | D4-17 | hook 模糊 fail-closed 缺口 | `risk-rule-engine.mjs` 无 finding 即 allow |
| 6 | P1 | D4-27 | 双路径输出脱敏缺口（--key value 空格形态） | `safety-policy.mjs` redactString 仅匹配 key[:=]value |
| 7 | P1 | D3-S3 | expose_tunnel 公网 URL 解析失效（OSC 133 未剥离） | `sandbox/session-manager.mjs:1320` parseDevbridgeExposeOutput 无 strip ANSI |
| 8 | P1 | EXP-E01 | 评测集『云主机』路由 MISS | `tools.mjs` ECS keywords 缺『云主机』同义词 |
| 9 | P2 | D4-25 | Python hook 写操作遥测分类错误（cli:invoke 应为 cli:write） | `hooks/huaweicloud-safety.py` WRITE_OPERATION_RE 前置字符类 |
| 10 | P2 | D4-26 | findings 证据脱敏不完整（secret_key/adminPass 残留） | `risk-rule-engine.mjs` redactEvidence 未覆盖键名 |
| 11 | P2 | D8-9 | sanitizeValue 未做凭证脱敏 | `telemetry/telemetry.mjs` sanitizeValue 无敏感值脱敏 |
| 12 | P2 | D8-1 | 文档与能力漂移（39 tools vs 42） | `AGENTS.md:27` 硬编码 |
| 13 | P2 | D3-S5 | 复合意图分层路由 MISS | `tools.mjs` serviceCatalog 无复合意图拆解 |
| 14 | P2 | D1-65 | DEBUG 开关仅认 'true'（SPEC） | `telemetry/telemetry.mjs:81` |
| 15 | P2 | D1-68 | region env 优先级与契约相反（SPEC） | `auth/credentials.mjs:225/173/339` |
| 16 | P2 | D9-9 | tools/call 取消语义未声明（SPEC） | `mcp-protocol.mjs` capabilities 未声明 cancellation |

> 全部 16 项为历史延续（昨日即已记录），根因与证据详见 FINDINGS.md；file_issue.py 查重后统一处理。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 语义专属（OS 列标注「Windows 专属」），Linux 由 D1-40 镜像 lag 防护覆盖 |
| D3-S7 | 设计级 | P1 | BLOCKED | 补环境 | 跨服务交付(Web+RDS)：RDS CreateInstance 返回 Invalid parameter: db.password，需 VPC/子网/安全组前置编排 + RDS 配额 + 10~20min provisioning |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（evidence 脱敏复核无明文 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：D9-13/D2-4 探针确认无明文凭证落盘

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS (D3-C1) | 是 | 已删（VPC 二次删除复核） | tctest-openclaw-c1 残留 0 |
| VPC/子网 (D3-C1/S2/D4-14) | 是 | 已删 | 残留 0 |
| OBS (D3-C2/C13) | 是 | 已删桶 | 残留 0 |
| FunctionGraph (D3-S6) | 是 | 已删函数 | 残留 0 |
| 沙箱会话 (D3-C3/C6/S3) | 是 | close_session | ok |
| EIP | 未创建新 | — | total_count=1 为 2026-10-14 既有 |

> 真云只删本次创建资源（`tctest-openclaw-*` 命名前缀），删除后全量盘点确认无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-65`（DEBUG '1'）、`D1-68`（region 优先级）、`D9-9`（cancellation 声明）。
- 本轮覆盖：源码级 + 协议 + 真云 E2E 全量 146 条；未覆盖真实 LLM Agent 会话评测（D10-1/2/5/9 需 dsh/CDP，OpenClaw 无 dsh）。
- 建议：D3-S3 的 `parseDevbridgeExposeOutput` 缺 CSI/OSC 剥离（同文件 parseDeployCheckOutput 已有），可低成本复用其 cleanStdout 逻辑修复。