# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-29 05:13:30（北京时间）
> **执行归档**：`results/AtomCode/2026-09-29-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（x86_64） |
| Node / npm / Python | Node v22.13.0 / npm 11.17.0 / Python 3.12.3 |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.7 (gitHead 7456d05)` |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 11 pass 0 warn 0 fail |
| 真云凭证 | cn-north-4（管理员 AKSK + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E + D10 评测集 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：49 个 grouped 探针（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn 真 mcp-server；真云 E2E 走 hcloud 真机建删归零（`probe-realcloud.mjs`）；D10 路由走 `spawn mcp-server` 注入 15 条中文意图；D9 协议探针直接 spawn `mcp-server.mjs` 断言 JSON-RPC 契约。证据统一落 `evidence/<case-id>/stdout.log` + 各分组 `.run.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140`（1 NOT_RUN = OS 专属 Windows 用例在 Linux） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `111 / 25 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 136） | `81.6%` |
| P0 / P1 / P2 新增缺陷 | `5 / 17 / 3`（25 FAIL 含展开级 D10-3 同根因 11 条） |
| 红线（I 类）违规 | `0`（无凭证泄漏，仅发现不完整脱敏/拦截缺陷） |
| 资源释放 | `全部归零`（tctest-d3c4-sg 安全组创建→删除归零，无残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `83` | 有证据且通过 PASS 门禁 |
| FAIL | `14` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | OS 专属（Windows 用例在 Linux） |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | D10-3 中文路由 MISS（与设计级 D10-3 同根因） |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏 JSON 场景漏脱敏 | safety-policy.mjs:34/49 | 待提单 |
| 2 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截不完整 | safety-policy.mjs:398-399 | 待提单 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透（sh -c） | safety-policy.mjs:398-399 | 待提单 |
| 4 | P0 | `D4-21` | D4安全 | 制品预检未检出 broad IAM | risk-rule-engine.mjs:150 | 待提单 |
| 5 | P0 | `D4-23` | D4安全 | 全局规则注入链路缺失 | package.json:8 + setup-cli.mjs | 待提单 |
| 6 | P1 | `D10-3` | D10评测 | 中文意图路由准确率仅 21.4% | tools.mjs:1817 | 待提单 |
| 7 | P1 | `D4-6` | D4安全 | adminPass 空格分隔值未脱敏 | safety-policy.mjs:34 | 待提单 |
| 8 | P1 | `D4-27` | D4安全 | 文本小写 ak=/sk= 未脱敏 | safety-policy.mjs:34 | 待提单 |
| 9 | P1 | `D3-S8` | D3功能 | 排障意图路由缺失 | tools.mjs:1817 | 待提单 |
| 10 | P1 | `D9-2` | D9协议 | JSON-RPC 非法入参未返回 -32602 | mcp-protocol.mjs:57 | 待提单 |
| 11 | P1 | `D9-4` | D9协议 | 协议生命周期未强制 | mcp-protocol.mjs:57 | 待提单 |
| 12 | P1 | `D9-9` | D9协议 | capabilities 未声明 cancellation | mcp-protocol.mjs:46-49 | 待提单（SPEC） |
| 13 | P2 | `D4-25` | D4安全 | Python hook 写命令未分类 cli:write | huaweicloud-safety.py:95-96 | 待提单 |
| 14 | P2 | `D8-9` | D8质量 | 遥测 sanitizeValue 未脱敏 | telemetry.mjs:189 | 待提单 |
| 15 | P2 | `D9-7` | D9协议 | 协议版本协商降级未实现 | mcp-protocol.mjs:46 | 待提单 |
| 16 | P1 | `EXP-E01/02/03/04/05/07/10/11/12/13/14` | D10评测集 | 中文意图路由 MISS（11 条） | tools.mjs:1817（同 D10-3） | 待提单 |

### 根因详情

- **#1 [P0] D2-4**：`redactSecrets('{"ak":..,"sk":..,"token":..}')` 原样返回 → 期望值替换为 `<redacted>`。根因 `safety-policy.mjs:49 redactSecrets → :34 redactString` 仅覆盖 `key=value`/`key: value`/对象键，未覆盖 JSON 键值字符串。证据 `evidence/d2-auth/probe.run.log`（redact-json pass=false）。
- **#2 [P0] D4-2**：`env | grep HW_SECRET_KEY` 返回 `allow` → 期望 `deny`。根因 `safety-policy.mjs:398-399` env-dump 正则缺 `HW_` 裸字面。
- **#3 [P0] D4-16**：`sh -c "env | grep HUAWEICLOUD"` 返回 `allow` → 期望 `deny`。根因 `safety-policy.mjs:398-399` 正则要求关键词前为空白/行首，引号包裹无法匹配。
- **#4 [P0] D4-21**：`evaluateArtifacts` 对 `Action:["*"]` 返回 findings 空。根因 `risk-rule-engine.mjs:150` 缺 broad IAM 规则。
- **#5 [P0] D4-23**：`package.json:8 files` 白名单缺 `rules/`，`setup-cli.mjs` 无 `.mdc` 注入。规则治理失效。
- **#6 [P1] D10-3**：中文意图 HIT=3 MISS=11 N/A=1，准确率 21.4%（断言≥90%）。根因 `tools.mjs:1817 routeMap` 中文关键词覆盖不足。
- **#7-#15**：见 `FINDINGS.md` 对应条目（adminPass 空格/小写 ak-sk/sanitizeValue/JSON-RPC 错误码/生命周期/版本协商/Python cli:write/cancellation 声明缺失）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 分类 | 原因 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 调归属（OS 专属） | OS 专属 Windows（EINVAL/npm.cmd 升级链）；Linux 结构化不适用，Linux 侧由 `probe-d1-39-linux` 源码级 queryDistTagsSync 佐证 dist-tags 含 latest+next |

### BLOCKED

| 用例ID | 维度 | 标题 | 分类 | 阻塞原因 | 解除条件 |
|---|---|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | 补环境 | 需真实 DSH 插件安装/跳过验证；AGENT_TOOLKIT_MODE/SKIP_DSH 注入破坏性全局安装，run-only 不执行 | 客户端升级 dsh 后实测 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 补环境 | 需真实 RDS+沙箱多服务编排会话自动化（建库→部署→连接串注入→读写验证→归零）；本客户端无 dsh/CDP agent 会话 harness | 配齐 dsh/CDP 会话自动化 |
| `D9-6` | D9协议 | 跨客户端互通 | 补环境 | 需官方 MCP Inspector 校验 + ≥2 真实客户端互通冒烟环境；本机源码级 clientInfo 互操作已证 | 多客户端互通冒烟环境 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针均使用占位/假 AK-SK；真云 read-only 切换不落盘明文）
- [x] 写操作误判 read-only：`0`（DeleteServers/CreateServers 均判定写，未误分类 read-only）
- [x] 红线（I 类）违规：`无`（无 mock 假跑；真云用例真机建删归零）
- [x] 脱敏复核：证据 stdout.log 与 .run.log 无真实 AK/SK 明文（真云凭证仅引自 credentials.json 进程内读取，不落盘）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC 安全组 `tctest-d3c4-sg-*`（D3-C4/D4-14） | 是（真机 CreateSecurityGroup） | 已删（DeleteSecurityGroup） | 是（ListSecurityGroups 过滤 tctest-d3c4- 剩余 = 0） |
| 只读子账号写探测 `tctest-ro-write-probe`（D4-13） | dry_run（不落资源） | N/A | 是（dry_run=true 未创建） |
| 隔离 HOME `hdk-d2real-*`（D2-16/D2-11） | 是（mkdtemp） | 已删（rmSync recursive） | 是（进程内 isoHome 清理） |

> 真云只删本次创建资源；删除前按 `tctest-d3c4-` 前缀盘点 + 白名单，未碰既有/他人资源。残留 = 0。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities.cancellation 未声明 → 是否补通知/取消语义，维护者裁决）。
- 本轮未覆盖（说明范围）：`D9-6` 跨客户端互通（需多客户端冒烟环境）、`D3-S7` 跨服务 Web+RDS 编排（需 dsh/CDP 会话自动化）、`D1-67` DSH 跳过安装（需 dsh 客户端）。
- 建议：14 项 FAIL 均为 v1.1.7 稳定复现（与上游既有缺陷一致），其中 5 项 P0 为安全脱敏/拦截缺口，建议优先修复 `redactString` 大小写/JSON/空格三形态与 env-dump 正则 `HW_` 覆盖。