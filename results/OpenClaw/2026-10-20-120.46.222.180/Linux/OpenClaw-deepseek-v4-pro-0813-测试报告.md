# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-10-20 05:40:00`（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-20-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（存在 P0 缺陷 4 项，均为历史延续缺陷的当日复核；另有 2 项真云外部依赖 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Ubuntu 24.04 LTS / Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.9`（npm `latest` 正式版，gitHead `05a67b6`） |
| 工具全集 | `42`（tools.mjs TOOL_DEFINITIONS 实际枚举；AGENTS.md:27 声明 39 → D8-1 漂移） |
| hcloud / 依赖 | KooCLI 7.2.12 / gh shuangheaven |
| 真云凭证 | cn-north-4（AK/SK 已配置 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，结论落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 探针（ECS/OBS/沙箱/FunctionGraph/VPC）真机建删归零；证据统一落 `evidence/<case-id>/`。今日全部探针本机 fresh 重跑。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146（设计级 107 + 展开级 39） |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 128 / 12 / 2 / 3 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 143） | 89.5% |
| P0 / P1 / P2 缺陷 | 4 / 3 / 5（12 项，均历史延续，当日复核） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（无 tctest-* 本次残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 90 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | 不符预期，根因见缺陷清单 |
| BLOCKED | 2 | 真云外部依赖（VPC quota / RDS 前置），见未执行项 |
| SPEC-MISMATCH | 3 | 契约漂移，待裁决（D1-65/D1-68/D9-9） |
| NOT_RUN | 1 | D1-39 Windows 升级检测链专属（OS 列标注「Windows 专属」，Linux 由 D1-40 覆盖） |
| **合计** | **107** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01『云主机』路由 MISS |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | 全量执行 |
| **合计** | **39** | |

---

## 四、缺陷清单（索引）

> 根因、证据、断言全量见 `FINDINGS.md`。12 项缺陷均为历史延续（file_issue.py 查重命中上游已有 issue，本次为复核，不重复开单），清单如下。

| # | 级别 | 用例ID | 缺陷 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | `D4-3` | 明文 secret API 未拦截（kms DecryptData/DecryptDatakey） | `safety/policy.json` blockedSecretOperations 缺 Decrypt* |
| 2 | P0 | `D4-15` | hook 绕过（ANSI-C 引号命令替换）未拦截 | `risk-rule-engine.mjs` 纯正则未解析 ANSI-C 内层 |
| 3 | P0 | `D4-21` | hook_check_artifacts HCL 广泛 IAM 未拦截 | `risk-rule-engine.mjs` iam-admin-policy 仅匹配 JSON |
| 4 | P0 | `D9-12` | initialize 时序未强制（未 initialize 先 tools/list） | `mcp-protocol.mjs` dispatch 无 initialize 前置校验 |
| 5 | P1 | `D4-17` | hook 模糊 fail-closed 缺口（$(...)/空串） | `risk-rule-engine.mjs` 无 finding 即 allow |
| 6 | P1 | `D4-27` | 双路径脱敏缺口（--key value 空格形态） | `safety-policy.mjs:34` redactString 不匹配空格分隔 |
| 7 | P1 | `EXP-E01` | 『云主机』中文意图路由 MISS | `tools.mjs` ECS keywords 缺『云主机』 |
| 8 | P2 | `D4-25` | Python hook 写操作遥测分类错误（cli:invoke） | `hooks/huaweicloud-safety.py:46` |
| 9 | P2 | `D4-26` | findings 证据脱敏不完整（secret_key/adminPass） | `risk-rule-engine.mjs` redactEvidence 键名表 |
| 10 | P2 | `D8-9` | sanitizeValue 未做凭证脱敏 | `telemetry/telemetry.mjs:189` |
| 11 | P2 | `D8-1` | AGENTS.md 声明 39 tools，实现 42 | `AGENTS.md:27` |
| 12 | P2 | `D3-S5` | 复合意图分层路由 MISS | `tools.mjs` serviceCatalog 无复合拆解 |

> 待裁决 SPEC（3 项，非缺陷）：`D1-65`（DEBUG 开关认 'true'）、`D1-68`（region 优先级 HW_REGION 优先）、`D9-9`（cancellation 未声明）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注「Windows 专属」；Linux 由 D1-40 覆盖） | — |
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | VPC CreateVpc → `VPC.0114 Quota exceeded for resources: [router]`（账号级 VPC quota 已满；ListVpcs 仅存 5 个他方/历史 VPC，无本次残留）。无法走 CreateVpc→CreateSubnet→ECS→ACTIVE→删除归零完整链路 | 释放/提额 VPC quota 后重跑归零 |
| `D3-S7` | 设计级 | P1 | BLOCKED | 补环境 | 复合意图命中 RDS 但 CreateInstance → `USE_ERROR Invalid parameter: db.password`，且需 vpc/subnet/sg 前置编排 + 10~20min provisioning + 按需计费 | RDS 前置网络编排 + 正确 db 参数 + 配额后重跑 |

> 解除条件统一为：VPC router 配额释放 / RDS 前置网络编排就绪后重跑归零。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无原始凭证/未脱敏日志）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：真云探针输出经 redact 处理，无明文 AK/SK/token 落盘

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-C1） | 否（VPC.0114 未建成） | — | 无残留（ListVpcs 5 个均他方/历史） |
| OBS 桶（D3-C2/D3-C13） | 是 | 已删对象+删桶 | 归零 |
| FunctionGraph（D3-S6） | 是 | 已 DeleteFunction | 归零 |
| 沙箱（D3-C3/D3-C6/D3-S3） | 是 | 已 close_session | 无残留 |
| VPC（D3-S2/D4-14） | 是 | 已删 | 归零 |

> 真云只删本次创建资源（tctest-codeartsagent-*/tctest-openclaw-*/hdk-*）；删除前盘点 + 白名单，未删既有/他人资源。

---

## 八、遗留与建议

- **待裁决 SPEC**：`D1-65`（DEBUG 开关）、`D1-68`（region 优先级）、`D9-9`（取消语义声明）——均为契约漂移，需维护方裁决契约意图。
- **历史延续 12 项缺陷**：与 2026-10-18/10-19（1.1.9）结论一致，今日 fresh 复现确认不变；`file_issue.py` 查重命中上游已有 issue，本轮不重复开单（关联清单见 HISTORY_LINKS.md）。
- **真云写链路恢复**：昨日 OBS/FunctionGraph 写限制（403 UserRestricted / FSS.0403）今日已恢复，D3-C2/D3-C13/D3-S6 已转 PASS；VPC router quota 与 RDS 前置仍阻塞（D3-C1/D3-S7）。
- **本轮未覆盖（说明范围）**：真实 Agent 会话评测（D10-1/2/5/9）依赖 dsh/CDP，本客户端无 dsh，未纳入。
- **建议**：VPC router quota 释放、RDS 前置网络编排就绪后补测 D3-C1/D3-S7 归零。