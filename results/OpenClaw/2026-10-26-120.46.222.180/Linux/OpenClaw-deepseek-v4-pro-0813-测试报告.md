# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-26 05:22:27（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-26-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项；全部为历史延续，SUT 与昨日同比未变）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（6.8.0-106-generic） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.12`（npm latest，gitHead `4ed07801`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12`（plugin 配对 7.3.12，有 version_mismatch 提示） |
| 真云凭证 | `cn-north-4`（AK/SK + 只读子账号 test001 已就绪并真机执行） |
| 测试类型 | 源码级探针 / MCP 协议 / 真机 CLI / 真云 E2E / eval-harness |
| daily 基础用例 | 设计级 107 / 展开级 39（init_day 预筛后） |

> **执行方法**：探针脚本（`.mjs`）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn `mcp-server.mjs` 做协议/工具链路验证，决策/结果落 `stdout.log`；真机 CLI（hcloud）执行真云 E2E 建删归零；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（NOT_RUN 仅 1 条 OS 专属 P0 豁免） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `127 / 14 / 1 / 3 / 1` |
| 通过率（分母 = PASS+FAIL = 141，不含 BLOCKED/NOT_RUN） | `90.1%` |
| P0 / P1 / P2 缺陷（14 FAIL 归并为 13 项产品缺陷） | `4 / 5 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/VPC/EIP/OBS/FunctionGraph/沙箱 session 均已清理）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `89` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 不符预期，根因见缺陷清单（历史延续） |
| BLOCKED | `1` | 真云外部依赖（D3-S7 RDS） |
| SPEC-MISMATCH | `3` | 契约漂移（D1-65/D1-68/D9-9），待裁决 |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 列标注专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 云主机路由 MISS（历史延续） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单（14 FAIL 归并为 13 项产品缺陷，全部历史延续）

| # | 级别 | 用例ID | 维度 | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D3-C3` / `D3-S3` | D3功能 | 沙箱 deploy_nginx 写验证误判（nginx -t 通过却报 did not pass） | `sandbox/session-manager.mjs:1010` 未 stripTerminalEscapes | 历史 #981 |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API 未拦截（kms DecryptData/DecryptDatakey） | `safety/policy.json:26` 缺两项 | 历史 |
| 3 | P0 | `D4-15` | D4安全 | hook 绕过尝试未完全拦截（ANSI-C 引号命令替换） | `risk-rule-engine.mjs` 未解析 ANSI-C | 历史 |
| 4 | P0 | `D4-21` | D4安全 | hook_check_artifacts HCL/Terraform 广泛 IAM 未拦截 | `risk-rule-engine.mjs` iam-admin-policy 仅匹配 JSON | 历史 |
| 5 | P0 | `D9-12` | D9协议 | initialize 握手时序未强制（未 initialize 先 tools/list 返回 46 工具） | `mcp-protocol.mjs:57` 无 initialize 前置校验 | 历史 |
| 6 | P1 | `D4-17` | D4安全 | hook 模糊 fail-closed 缺口（$(...) 命令替换内层 allow） | `risk-rule-engine.mjs` 无 finding 即 allow | 历史 |
| 7 | P1 | `D4-27` | D4安全 | 双路径输出脱敏缺口（--key value 空格形态未脱敏） | `safety-policy.mjs:34` 正则仅匹配 key[:=]value | 历史 |
| 8 | P1 | `EXP-E01` | D10评测 | 『云主机』中文意图路由 MISS | `tools.mjs` ECS keywords 缺「云主机」同义词 | 历史 |
| 9 | P2 | `D3-S5` | D3功能 | 复合意图分层路由 MISS（未拆分命中多 service） | `tools.mjs` serviceCatalog 单关键词并集 | 历史 |
| 10 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类（写→cli:invoke 而非 cli:write） | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置 | 历史 |
| 11 | P2 | `D4-26` | D4安全 | findings 证据脱敏不完整（secret_key/adminPass 明文残留） | `risk-rule-engine.mjs:19` redactEvidence 正则 | 历史 |
| 12 | P2 | `D8-1` | D8质量 | 文档与能力漂移（AGENTS.md 硬编码工具数 vs 实际 46） | `AGENTS.md` 未随 tools.mjs 同步 | 历史 |
| 13 | P2 | `D8-9` | D8质量 | sanitizeValue 未脱敏（AK/SK/token 原样保留） | `telemetry/telemetry.mjs:189` 无敏感值脱敏 | 历史 |

### 根因详情（详见 FINDINGS.md）

每项缺陷的「期望 / 实际 / 根因（文件:行号）/ 证据」已完整落 `FINDINGS.md`（13 项产品缺陷 + 3 项 SPEC-MISMATCH + 1 项非产品缺陷），此处不重复展开。关键根因：

- **#1 D3-C3/D3-S3（P1）**：`sandbox/session-manager.mjs:1010` deployNginx 直接调 `parseDeployNginxVerifyOutput(result.stdout)` 未先 strip OSC-133 终端转义，锚定 `^DB_NGINX_T=` 正则被遮蔽 → nginxTest 解析为空 → 误判 nginx -t 失败。
- **#2 D4-3（P0）**：`safety/policy.json:26` blockedSecretOperations 仅含 ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue，缺 kms DecryptData/DecryptDatakey → 明文 secret API 可绕过。
- **#5 D9-12（P0）**：`mcp-protocol.mjs:57` dispatch tools/list 分支无 initialize 前置校验，任意时序放行。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 优先级 | 标题 | 分类 | 原因 |
|---|---|---|---|---|---|
| `D1-39` | D1安装 | P0 | Windows 升级检测链可用性 | 调归属（OS 专属） | OS 列明确标注「Windows 专属」（升级检测链 EINVAL 语义专属 Windows）；本机 Linux 结构性不适用，由 D1-40 反向提醒防护覆盖 Linux 侧行为。 |

### BLOCKED

| 用例ID | 维度 | 优先级 | 标题 | 分类 | 阻塞原因 |
|---|---|---|---|---|---|
| `D3-S7` | D3功能 | P1 | 场景-跨服务交付(Web应用+RDS)并归零 | 补环境 | 复合意图命中 RDS，但 CreateInstance 需 vpc/subnet/sg 前置编排 + 正确 db 参数（--password 与 KooCLI 系统参数冲突需 --cli-jsonInput），provisioning 3~8min + 按需计费。解除条件：补 RDS 前置网络编排 + 配额 + 正确 db 参数。真云外部依赖，非产品缺陷。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（所有 evidence 输出经 redact 管道，无明文 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D4-27/D4-26 为产品脱敏缺口本身，已作为缺陷记录，测试证据内凭证均为测试用假值）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS (D3-C1) | 是（c6.large.2 + 40GB GPSSD + VPC + 子网 + EIP） | 已删（ECS/VPC/子网/EIP） | 复核 VPC 空、ECS 0、EIP total_count=0（VPC 异步最终一致，手工二次 DeleteVpc 归零） |
| OBS (D3-C2/D3-C13) | 是（临时桶） | 已删（先删对象后删桶） | rmOk=true |
| FunctionGraph (D3-S6) | 是（Python 函数 + TIMER 触发器） | 已删（DeleteFunction） | ListFunctions 0 残留 |
| VPC (D4-14 审计) | 是（建→查 CTS→删） | 已删 | ListVpcs 不含本次资源 |
| VPC (D3-S2 删VPC先确认) | 是 | 已删 | 归零 true |
| 沙箱 session (D3-C3/C6) | 是（DevStation workspace） | 已 close_session | session 关闭 ok |

> 真云只删本次创建资源（时间戳命名 `tctest-openclaw-*`）；删除前全量盘点 + 白名单，未删既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-65`（debug 环境变量 '1' 不生效）、`D1-68`（region 优先级 HW_REGION 优先于 HUAWEICLOUD_REGION）、`D9-9`（capabilities 未声明 notifications.cancellation）。
- 本轮未覆盖：真实 Agent 会话评测（D10-1/2/5/9 需 dsh/CDP harness，OpenClaw 非 DSH 客户端）；多终端矩阵（EXP-D5-9 仅 OpenClaw 单点抽样）。
- 建议：13 项产品缺陷全部历史延续（SUT 4ed07801 未变），与昨日 #981 等既有单一致，不重复提单；FINDINGS 非空将按流程统一「查重后」生成 HISTORY_LINKS 与既有单复核结论。