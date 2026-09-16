# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-17 07:09`（北京时间）
> **执行归档**：`results/Hermes/2026-09-17-113.44.143.91/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（设计级 10 项产品缺陷：5 P0 + 4 P1 + 1 P2 + 1 项 SPEC-MISMATCH；展开级 11 条 FAIL 为同一根因 D10-3 叠加）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic，ECS，IP 113.44.143.91） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.5`（npm latest 正式版，gitHead `e7ed6f66`，release PR `#696`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS 实测，含 `huaweicloud_obs_set_website_config`） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 确认） |
| 真云凭证 | cn-north-4（MCP 层 credentials.json 有效；hcloud CLI 端 KooCLI 凭证 IAM 认证失败，见 D4-14） |
| 测试类型 | 源码级探针 + 真机 CLI（install/doctor/status）+ MCP 协议 + 真云 E2E + D10 评测 harness |
| daily 基础用例 | 设计级 78 / 展开级 48（Hermes+Linux 预筛后） |

> **执行方法**：grouped 探针（d4-security/d2-auth/d1-upgrade/mcp-tools/c4-service-matrix）源码级直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 深挖探针（D2/D4 hook 一致性 + STS/redact 语义）+ 真云 E2E（`scripts/realcloud_e2e.mjs`）+ D10 评测 harness（`eval/harness/run-eval.mjs`）+ D9 协议探针（`eval/harness/protocol-probe.mjs` + d9-protocol-probe）。证据统一落 `evidence/<case-id>/stdout.log`，回填后跑双门禁（verify_no_fake_pass + verify_coverage）通过。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 126（设计级 78 + 展开级 48） |
| 设计级 PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 65 / 10 / 1 / 1 / 1 |
| 展开级 PASS / FAIL / BLOCKED / NOT_RUN | 36 / 11 / 0 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 85.5%（65/76）；展开级 76.6%（36/47） |
| P0 / P1 / P2 新增缺陷 | 5 / 4 / 1（详见 FINDINGS.md；另 1 项 SPEC-MISMATCH） |
| 红线（I 类）违规 | 0 |
| 资源释放 | MCP 层真机 sandbox 建站归零验证通过；hcloud 端建删因凭证 IAM 失败未产生资源（无残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 65 | 有证据且通过 PASS 门禁 |
| FAIL | 10 | D2-11/D2-4/D4-2/D4-16/D4-23（P0）、D4-8/D4-17/D10-3/D9-2（P1）、D8-1（P2） |
| BLOCKED | 1 | D4-14（hcloud 端凭证 IAM 失败） |
| SPEC-MISMATCH | 1 | D9-9（capabilities.cancellation 未声明） |
| NOT_RUN | 1 | D1-39 Windows 专属（Linux 由展开级 EXP-NR3-10 代表覆盖） |
| **合计** | **78** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 36 | EXP-C4-* 服务矩阵 22 + EXP-E06/E09/E15 路由命中 + NR3/D1-58/D5-8 探针 |
| FAIL | 11 | EXP-E01~E05/E07/E10~E14（中文意图路由 MISS，同 D10-3 根因） |
| BLOCKED / NOT_RUN | 0 / 1 | EXP-E08 为诊断类意图（explain_error 工具），不适用 serviceCatalog 服务路由 |
| **合计** | **48** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-11` | STS 临时凭证冲突态绕过 R3 拒绝落盘 | `{status:error, scope:rejected}` | `status=needs_confirmation` | `tools.mjs:1214-1231` |
| 2 | P0 | `D2-4` | redact 漏小写 ak=/sk= | `ak=AK123456` 应脱敏 | 原样返回（对象/字符串形态均漏） | `safety-policy.mjs:34-45` |
| 3 | P0 | `D4-2` | 凭证 env 打印拦截未覆盖 HW_ 前缀 | `env \| grep HW_ACCESS_KEY` 应 `deny` | `allow` | `safety-policy.mjs:397-400` |
| 4 | P0 | `D4-16` | env-dump 被 shell 包裹穿透 | `sh -c "printenv ..."` 应 `deny` | `allow` | `safety-policy.mjs:398` |
| 5 | P0 | `D4-23` | 全局规则 huawei-agent-rules.md 未注入 | 安装应产出并注入 | 源码零命中（未实现） | 源码零命中 |
| 6 | P1 | `D4-8` | Python/Node 钩子策略不一致 | 同输入应判定一致 | Node `deny` / Python 放行 | `hooks/huaweicloud-safety.py:170-188` |
| 7 | P1 | `D4-17` | hook 模糊 fail-open | 异常输入应默认拒绝 | 默认 `allow`/放行 | `risk-rule-engine.mjs:105-107` |
| 8 | P1 | `D10-3` | serviceCatalog 中文路由缺失 | 中/英意图均命中；≥90% | 中文 21.4% 回退 | `tools.mjs:1778-1885` |
| 9 | P1 | `D9-2` | invalid params 返回无 error 对象 | 应 `-32602` | 无 error 对象（unknown tool `-32603`） | `mcp-protocol.mjs:46-77` + `tools.mjs:1485` |
| 10 | P2 | `D8-1` | 文档工具数漂移（39→40） | 文档与实现一致（40） | AGENTS.md 仍写 39 | `AGENTS.md:27,45` |
| 11 | SPEC | `D9-9` | capabilities.cancellation 未声明 | 应声明（或明确不支持） | 缺失 | `mcp-protocol.mjs` initialize |

> 完整根因/断言/证据见 FINDINGS.md（含 #11 SPEC 与 #12 非产品缺陷 D4-14）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属（npm.cmd spawnSync 无 shell:true EINVAL）；Linux 由展开级 EXP-NR3-10（54 条通用断言）代表覆盖 | — |
| D4-14 | 设计级 | P2 | BLOCKED | 补环境 | hcloud 端 KooCLI 凭证 IAM 认证失败 APIGW.0301（MCP 层 credentials.json 正常）；无法真机建删 + CTS 审计 | 重新 auth init 同步 KooCLI 端凭证后复测 |
| EXP-E08 | 展开级 | P1 | NOT_RUN | 改用例 | 诊断类意图（explain_error 工具），不适用 serviceCatalog 服务路由（run-eval 标 N/A） | 该条「源码级 serviceCatalog 路由断言」与诊断工具语义冲突，建议改用例为「explain_error 工具触发」而非服务路由 |

> 展开级「不涉及本客户端/OS」已在建包时剔除（init_day 预筛），无跨客户端展开级残留。本轮 BLOCKED=1、NOT_RUN=2，均已在上面逐条说明原因。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4 redact / D4-2 env 均使用假凭证；脱敏探针未落真 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`0`（MCP 层真机只建删本次 sandbox 会话资源，测后归零）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云凭证仅以 `<redacted>` 指纹出现）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 sandbox 会话（D3-C6/C3） | 是 | 已关 | close_session 返回 ok，无残留 |
| 真云 hcloud VPC/ECS/OBS（D3-C1/C2） | 否（IAM 失败） | — | 未产生资源（凭证 IAM 认证失败） |
| 隔离 HUAWEICLOUD_HOME（D2-11 探针） | 是 | 已清理 | mkdtemp 随探针退出 |
| 临时 /tmp 探针脚本 | 是 | 已清 | 退出即清理 |

> 真云只删除本次 Hermes 创建资源；hcloud 端本轮因凭证 IAM 失败未产生任何资源。Hermes 自身残留 = 0。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities.cancellation 未声明——契约漂移，需上游决定声明 cancellation 或明确不支持）。
- 本轮已覆盖：grouped 探针 163 项断言 + 深挖（D2-11/D4-2/D4-8/D4-17 hook/STS/redact 语义）+ 真云 E2E（MCP 层 sandbox 建站真机归零）+ D10 评测 harness（15 条）+ D9 协议探针（D9-1~9 全量）。
- 较昨日新增：`D9-2`（invalid params -32602 缺失）、`D9-9`（cancellation 未声明）两项，系 protocol-probe 新增 D9-2b/D9-9a 断言后暴露。
- 环境观察：本轮 hcloud CLI 端（KooCLI profile）凭证 IAM 认证失败（APIGW.0301），而 MCP 层 credentials.json（sandbox）正常——三端凭证不同步状态，建议执行 auth init 对齐。
- 建议：上游按 FINDINGS.md 逐项修复，重点补 `HW_` 前缀 env-dump、STS 凭证冲突态 R3 校验、Python 钩子规则对齐、invalid params 错误码、serviceCatalog 中文关键字路由、huawei-agent-rules.md 注入实现。