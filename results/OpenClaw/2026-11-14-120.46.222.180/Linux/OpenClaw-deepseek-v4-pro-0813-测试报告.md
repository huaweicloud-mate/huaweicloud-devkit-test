# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-14（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-14-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（5 项 FAIL + 1 项 NOT_RUN，全部为 v1 历史缺陷在 v1.1.14-next.5 基线的复现，无新增产品缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 24.04，kernel 6.8.0-106-generic） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.14-next.5`（npm `@next`，gitHead `4fb59d76`） |
| 工具全集 | `47`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `KooCLI 7.2.12`（doctor 提示 paired 7.3.12 版本不匹配） |
| 真云凭证 | `cn-north-4`（AK/SK 统一账号；只读子账号 test001 用于 D4-13） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级探针直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（safety-policy / risk-rule-engine / tools / update-check / telemetry / koocli-version / auth 等）做确定性断言；协议用例经 stdio 驱动 `mcp-server.mjs`（tools/list / 错误码 / 生命周期 / 凭证不泄露）；评测用例跑 `eval/harness` 与 `run-eval.mjs`；真云 E2E 经 `plan_cli_command → run_approved_command` 审批流驱动真实建删（VPC/OBS/FunctionGraph/沙箱），测后逐一归零验证。证据统一落 `evidence/<case-id>/stdout.log`。本日 SUT 为 v1.1.14-next.5 基线（.mjs 源码，非 v2 下一代 TypeScript 基线）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（NOT_RUN 1 = D1-39 Windows 专属，OS 结构性不适用） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `139 / 6 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 145） | `95.9%` |
| P0 / P1 / P2 缺陷 | `1 / 2 / 3`（全部 v1 历史缺陷复现，无新增） |
| 红线（I 类）违规 | `1`（D4-3 KMS DecryptData 明文 secret/密钥 API 未拦截） |
| 资源释放 | `全部归零`（VPC/OBS/FunctionGraph/沙箱均测后删除，ListVpcs/ListFunctions/obsutil ls 二次核实 0 残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `101` | 有证据且通过 PASS 门禁 |
| FAIL | `5` | D1-65 / D4-3 / D4-25 / D4-27 / D8-9（历史复现） |
| BLOCKED | `0` | 无环境阻塞（真云正常） |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `1` | D1-39 Windows 专属（Linux 结构性不适用） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 中文「云主机」路由 MISS（历史复现） |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | D4安全 | 明文 secret API 拦截（KMS DecryptData / csms download-secret 未拦截） | `safety/policy.json` blockedSecretOperations 缺项；`safety-policy.mjs:230` | 历史问题 |
| 2 | P1 | `D4-27` | D4安全 | 双路径输出脱敏缺口（空格分隔形态泄露 AK/SK） | `safety-policy.mjs:42` redactString 仅匹配 `key[:=]value` | 历史问题 |
| 3 | P1 | `EXP-E01` | D10评测 | 中文「云主机」意图路由 MISS | `tools.mjs:2358` ECS keywords 缺「云主机」 | 历史问题 |
| 4 | P2 | `D1-65` | D1安装 | 调试模式环境变量契约漂移（telemetry 域 '1' 不生效） | `telemetry/telemetry.mjs:82` 仅 `=== 'true'` | 历史问题 |
| 5 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类（写动词落 cli:invoke 而非 cli:write） | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置不匹配空格 | 历史问题 |
| 6 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏缺口（sanitizeValue 不脱敏） | `telemetry/telemetry.mjs:190-197` 无敏感值脱敏 | 历史问题 |

### 根因详情

1. **[P0] D4-3**：`classifyTextCommand('hcloud KMS DecryptData ...')` / `('hcloud csms download-secret ...')` 返回 `decision=allow`。根因 `plugins/huaweicloud-core/src/safety/policy.json` 的 `blockedSecretOperations` 仅含 `ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue`，缺 `DecryptData`/`DecryptDatakey`（KMS）与 `download-secret`（小写）。红线「MUST NOT call hcloud csms download-secret / hcloud kms decrypt」被绕过。证据 `evidence/D4-3/stdout.log`。
2. **[P1] D4-27**：`redactSecrets('--access-key AKIA... --secret-key sk...')` 空格分隔形态未脱敏（`=` 形态正常）。根因 `safety-policy.mjs:42` `redactString` 正则 `key[:=]\s*value` 不匹配 `key <空格> value`。证据 `evidence/D4-27/stdout.log`。
3. **[P1] EXP-E01**：中文意图「帮我查一下我账号在华北北京四有哪些云主机」路由 MISS（`Run hcloud --help`）。根因 `tools.mjs:2358` ECS keywords 缺「云主机」同义词。D10-3 准确率 92.9%（HIT=13 MISS=1）。证据 `evidence/EXP-E01/stdout.log`。
4. **[P2] D1-65**：`update-check.mjs:241` 支持 `DEBUG=1||true`，`telemetry/telemetry.mjs:82` 仅 `=== 'true'`（`1` 不生效）→ telemetry 域契约漂移。证据 `evidence/D1-65/stdout.log`。
5. **[P2] D4-25**：`record_cli_event('hcloud ECS DeleteServer --force')` / `('hcloud VPC CreateVpc ...')` 落 `cli:invoke` 非 `cli:write`。根因 `huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置 `(^|[A-Za-z0-9])` 不匹配空格分隔写动词。证据 `evidence/D4-25/stdout.log`。
6. **[P2] D8-9**：`sanitizeValue('AK=AKID... token=...')` 原样保留敏感值。根因 `telemetry/telemetry.mjs:190-197` 无敏感值脱敏。证据 `evidence/D8-9/stdout.log`。

> 以上 6 项经 `file_issue.py` 历史查重，均命中上游既有 open issue（D4-3→#1055；D4-27→#1065/#938/#896 等；EXP-E01→#852/#705 等；D1-65→#844/#754；D4-25→#1065/#844；D8-9→#1055），本次不重复开单。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属（Windows EINVAL 语义），本机 Linux 结构性不适用；Linux 侧由 D1-40 镜像 lag 用例覆盖。分类【调归属】 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无新增（D2-4 show_profile_redacted AK 掩码/SK 非明文；D9-13 tools/call 无明文凭证；D4-27 空格形态为历史脱敏缺口）
- [x] 写操作误判 read-only：`0`（plan 写操作均 decision=deny，D4-5/D4-18 验证通过）
- [x] 红线（I 类）违规：`1`（D4-3 KMS DecryptData / csms download-secret 未拦截，历史 P0 复现）
- [x] 脱敏复核：通过（D2-4/D4-6/D9-13 复核无明文；D4-27/D8-9 历史缺口已列缺陷清单）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC | tctest-openclaw-c1/s2/audit 等 | DeleteVpc | ListVpcs 0 残留 ✅ |
| OBS | tctest-openclaw-obs-*/web-* | obsutil rm -f | obsutil ls 0 残留 ✅ |
| FunctionGraph | tctest-openclaw-fn-* | DeleteFunction（base URN） | ListFunctions 0 残留 ✅ |
| 沙箱 | connect(ephemeral pool) | close_session | 正常关闭，无计费残留 ✅ |
| EIP | 无 tctest-openclaw 前缀创建 | — | ListPublicips total_count=0 ✅ |

> 探针中途清理的测试侧残留：D4-13 只读子账号写测试曾通过 KooCLI admin 配置意外创建 `tctest-ro-x` VPC，已在当日 06:00 前 DeleteVpc 归零核实。

---

## 八、遗留与建议

- **6 项 FAIL 均为 v1 历史缺陷的 v1.1.14-next.5 复现**：D4-3（KMS/密钥 API 拦截缺口，P0）、D4-27（空格形态脱敏，P1）、EXP-E01（云主机路由，P1）、D1-65（telemetry DEBUG 契约漂移，P2）、D4-25（Python hook 写动词分类，P2）、D8-9（sanitizeValue 脱敏，P2）。均已在上游 open issue 跟踪（见 HISTORY_LINKS 关联），无需新开单。
- **D4-3 为 P0 红线缺口**：`hcloud kms DecryptData` / `hcloud csms download-secret` 未纳入安全拦截，建议维护方在 v2 冻结前补全 `blockedSecretOperations`（DecryptData/DecryptDatakey/download-secret）。
- **D1-70 proxy.json 污染**（测试侧，非产品缺陷）：本机 `~/.config/huaweicloud/proxy.json` 残留 `proxy.example:8080` 虚假代理，曾导致 `sandbox_check_user` 抛 `Cannot read properties of undefined (reading 'bind')`（undici ProxyAgent 解析异常）。已备份移除（`proxy.json.bak-20261114`），建议 prepare_env.py 增加 proxy.json 残留自检（与 D1-70 一致）。
- **doctor 版本提示**：KooCLI 7.2.12 与插件 paired 7.3.12 不匹配（WARN），非阻断，但建议升级钉版本。
- **工具计数漂移**：AGENTS.md 写「43 tools / 39 MCP tool definitions」，实际 v1.1.14-next.5 为 47 工具，文档计数滞后。