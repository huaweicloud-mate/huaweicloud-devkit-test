# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-10-19 05:45:00`（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-19-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（存在 P0 缺陷 4 项 + P1 缺陷 2 项，不得写 PASS；另有真云写账号降级致使 4 资源用例 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Ubuntu 24.04.4 LTS / Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.9`（npm `latest` 正式版，gitHead `05a67b64`） |
| 工具全集 | `42`（tools.mjs TOOL_DEFINITIONS 实际枚举，文档声明 39 → D8-1 漂移） |
| hcloud / 依赖 | KooCLI 7.2.12 / gh shuangheaven |
| 真云凭证 | cn-north-4（AK/SK 已配置 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 探针（ECS/OBS/沙箱/FunctionGraph/VPC）真机建删归零；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146（设计级 107 + 展开级 39） |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 125 / 12 / 5 / 3 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 89.3% |
| P0 / P1 / P2 缺陷 | 4 / 2 / 10 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（无 tctest-openclaw/tctest-codeartsagent 残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 87 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | 不符预期，根因见缺陷清单 |
| BLOCKED | 5 | 真云写账号降级（补环境），见阻塞项 |
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

## 四、缺陷清单（详尽）

> 根因、证据、断言全量见 `FINDINGS.md`，此处为索引级汇总。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | 明文 secret API 未拦截（kms DecryptData/DecryptDatakey） | `safety/policy.json` blockedSecretOperations 缺 Decrypt* | 待提单 |
| 2 | P0 | `D4-15` | hook 绕过（ANSI-C 引号命令替换）未拦截 | `risk-rule-engine.mjs` 纯正则未解析 ANSI-C 内层 | 待提单 |
| 3 | P0 | `D4-21` | hook_check_artifacts HCL 广泛 IAM 未拦截 | `risk-rule-engine.mjs` iam-admin-policy 仅匹配 JSON | 待提单 |
| 4 | P0 | `D9-12` | initialize 时序未强制（未 initialize 先 tools/list） | `mcp-protocol.mjs` dispatch 无 initialize 前置校验 | 待提单 |
| 5 | P1 | `D4-17` | hook 模糊 fail-closed 缺口（$(...)/畸形 JSON） | `risk-rule-engine.mjs` 无 finding 即 allow | 待提单 |
| 6 | P1 | `D4-27` | 双路径脱敏缺口（--key value 空格形态） | `safety-policy.mjs:40` redactString 不匹配空格分隔 | 待提单 |
| 7 | P1 | `D3-C3` | deployNginx 部署 .conf 残留未清理，端口 8080-8089 耗尽 | `session-manager.mjs:880` tee 写新 conf 无清理 | 待提单（新增） |
| 8 | P2 | `EXP-E01` | 『云主机』中文意图路由 MISS | `tools.mjs` ECS keywords 缺『云主机』 | 待提单 |
| 9 | P2 | `D4-25` | Python hook 写操作遥测分类错误（cli:invoke） | `hooks/huaweicloud-safety.py:46` | 待提单 |
| 10 | P2 | `D4-26` | findings 证据脱敏不完整（secret_key/adminPass 明文） | `risk-rule-engine.mjs` redactEvidence 键名表不精确 | 待提单 |
| 11 | P2 | `D8-9` | sanitizeValue 未做凭证脱敏 | `telemetry.mjs:189` | 待提单 |
| 12 | P2 | `D8-1` | AGENTS.md 声明 39 tools，实现 42 | `AGENTS.md:27` | 待提单 |
| 13 | P2 | `D3-S5` | 复合意图分层路由 MISS | `tools.mjs` serviceCatalog 无复合拆解 | 待提单 |
| 14 | P2 | `D1-65` | DEBUG 仅认 'true'（spec） | `telemetry.mjs:81` | 待裁决 SPEC |
| 15 | P2 | `D1-68` | region 优先级 HW_REGION 优先于 HUAWEICLOUD_REGION（spec） | `auth/credentials.mjs:225` | 待裁决 SPEC |
| 16 | P2 | `D9-9` | 取消语义未声明（spec） | `mcp-protocol.mjs` capabilities | 待裁决 SPEC |

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注「Windows 专属」；Linux 由 D1-40 覆盖） | — |
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | ECS CreateServers → `Ecs.0067 insufficient balance`（账户余额不足，最低配置仍扣费失败） | — |
| `D3-C2` | 设计级 | P1 | BLOCKED | 补环境 | OBS mb → `403 UserRestricted`（账号级写限制，05:34 复测确认）；obs_set_website_config 工具本身验证正常 | — |
| `D3-C13` | 设计级 | P1 | BLOCKED | 补环境 | OBS mb → `403 UserRestricted`（账号级写限制） | — |
| `D3-S7` | 设计级 | P1 | BLOCKED | 补环境 | RDS CreateInstance → `USE_ERROR Invalid parameter: db.password`，需 VPC/子网/安全组前置 + 长 provisioning + 按需计费 | — |
| `D3-S6` | 设计级 | P2 | BLOCKED | 补环境 | FunctionGraph CreateFunction → `FSS.0403 user restricted`（账号级写限制，ListFunctions 只读正常） | — |

> 解除条件统一为：账号充值 / 恢复 OBS/FunctionGraph 写权限 / RDS 配额后重跑归零。

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
| ECS/VPC/子网（D3-C1） | 是（VPC/子网成，ECS 余额不足） | 已删 VPC/子网 | 残留 0（tctest-openclaw 无残留） |
| OBS 桶（D3-C2/D3-C13） | 否（403 未建成） | — | 无残留 |
| 沙箱（D3-C3/D3-C6/D3-S3） | 是 | 已 close_session | 无残留（nginx conf 测试残留已手工清理） |
| FunctionGraph（D3-S6） | 否（FSS.0403 未建成） | — | 无残留 |
| VPC（D3-S2/D4-14） | 是 | 已删 | 残留 0 |

> 真云只删本次创建资源（tctest-openclaw-c1/tctest-codeartsagent-*）；删除前全量盘点 + 白名单，未删既有/他人资源。

---

## 八、遗留与建议

- **待裁决 SPEC**：`D1-65`（DEBUG 开关）、`D1-68`（region 优先级）、`D9-9`（取消语义声明）——均为契约漂移，需维护方裁决契约意图。
- **正式版新增**：`deployNginx .conf 残留`（#7）——建议 deployNginx 改用固定 conf 名幂等覆盖，或在 session close 时清理 `/etc/nginx/conf.d/<project>.conf`。
- **历史延续 15 项**：与 2026-10-17（1.1.9-next.0）结论一致，`file_issue.py` 查重后将避免重复开单。
- **本轮未覆盖（说明范围）**：真云 ECS/OBS/FG 写链路因账号降级未完整执行（只读/沙箱链路已覆盖）；真实 Agent 会话评测（D10-1/2/5/9）依赖 dsh/CDP，本客户端无 dsh，未纳入。
- **建议**：账号（hw018619646）真云写权限/余额就绪后补测 D3-C1/D3-C2/D3-C13/D3-S6 归零。