# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-14 07:19:00（北京时间）
> **执行归档**：`results/DSH/2026-09-14-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（4 缺陷：3 P0 + 1 P1，均为 v1.1.4-next.3 既有缺陷，回归确认仍存在，已在上轮提单 #650，本轮未重复提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu，6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next，gitHead `3b6290bc`，hdk checkout 同 commit） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（已安装，credentials 已配置） |
| 真云凭证 | `~/.config/huaweicloud/credentials.json`（已配置；本轮未用于任何写操作） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/auth）/ MCP 协议 / 安全分类 / 凭证 R 规则 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）直调已安装包 `huaweicloud-devkit@1.1.4-next.3` 的 `plugins/huaweicloud-core/src/*` 导出函数 + CLI 真机执行，决策/结果落 `stdout.log`；证据统一落 `evidence/<group>/`。凭证 R 规则用例用 `HUAWEICLOUD_HOME` 临时目录隔离，不触碰真实凭证。本轮实测验证与 2026-09-13 上轮同版本，结果一致。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152（设计级 81 + 展开级 71） |
| 已执行（设计级，非 NOT_RUN） | 52 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（设计级） | 36 / 4 / 12 / 0 / 29 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 90.0%（36/40） |
| P0 / P1 / P2 缺陷 | 3 / 1 / 0（均为既有缺陷，详见 §五，已在上轮提单 #650） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建任何真实云资源，无需删） |

### P0 覆盖（18 条，全覆盖）

| 状态 | 数量 |
|---|---|
| PASS | 10（D1-40 / D2-4 / D4-1 / D4-3 / D4-5 / D4-9 / D4-15 / D4-21 / D4-22 / D8-7） |
| FAIL | 3（D4-2 / D4-16 / D4-23） |
| BLOCKED | 5（D1-39 Windows 专属 / D2-11 真云 STS / D4-18·D4-19 互动确认流 / D10-4 真实 Agent 评测） |
| NOT_RUN | 0 |

---

## 三、状态汇总

### 3.1 设计级（81）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 36 | 有证据且通过 PASS 门禁（verify_no_fake_pass 校验通过） |
| FAIL | 4 | 不符预期，根因见 §五 / FINDINGS.md |
| BLOCKED | 12 | 环境阻塞（Windows / 真云 / 互动确认流 / 破坏性 uninstall），见 §六 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 29 | 本轮未覆盖（真云 E2E 扩展 / 性能延迟压测 / 文档一致性 / 真实 Agent 评测），说明见 §九 |
| **合计** | **81** | |

### 3.2 展开级（71）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 3 | DSH 终端 2 行（EXP-D5-6-1/6-3）+ Linux OS_MATRIX 1 行（EXP-NR3-02） |
| FAIL | 0 | — |
| BLOCKED | 25 | 22×真云 E2E（EXP-C4-*）+ 3×D1-39 专属（EXP-NR3-09/10/11） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 43 | 其他客户端矩阵 / 真实 Agent 评测（EXP-E*）/ 隔离 HOME 场景 |
| **合计** | **71** | |

---

## 四、逐用例结果（已执行项，含 PASS/FAIL/BLOCKED/SPEC）

> 逐用例结果与副本 CSV「执行状态」+「evidencePath」列一致（同一来源，机械生成）。展开级 PASS 3 行单独列出，其余 25 行 BLOCKED（22×真云 E2E + 3×D1-39）按组汇总见 §六。

| 用例 ID | 优先级 | 标题 | 结果 | 证据路径 |
|---|---|---|---|---|
| D1-1 | P1 | 全新环境引导安装 | PASS | evidence/dsh-install |
| D1-3 | P1 | doctor健康自检 | PASS | evidence/cli-readonly |
| D1-4 | P2 | status/update幂等 | PASS | evidence/cli-readonly |
| D1-5 | P1 | uninstall干净度 | BLOCKED | - |
| D1-6 | P2 | install-hcloud | PASS | evidence/cli-readonly |
| D1-26 | P1 | 升级提醒工具注册与协议暴露 | PASS | evidence/d1-upgrade |
| D1-27 | P1 | 检测语义-已是最新 | PASS | evidence/d1-upgrade |
| D1-28 | P1 | 检测语义-有新版本 | PASS | evidence/d1-upgrade |
| D1-30 | P2 | semver 比对正确性 | PASS | evidence/d1-upgrade |
| D1-31 | P1 | dismiss 冷却期 | PASS | evidence/d1-upgrade |
| D1-33 | P2 | skip 文件持久化与多路径 | PASS | evidence/d1-upgrade |
| D1-39 | P0 | Windows 升级检测链可用性 | BLOCKED | - |
| D1-40 | P0 | 镜像 lag 下检测正确性(反向提醒防护) | PASS | evidence/d1-upgrade |
| D1-41 | P1 | check_update 真实 MCP 返回契约 | PASS | evidence/supplement |
| D2-1 | P1 | auth init三端同步 | BLOCKED | - |
| D2-4 | P0 | 凭证脱敏正确性 | PASS | evidence/d4-security |
| D2-5 | P1 | 凭证缺失报错指引 | PASS | evidence/supplement |
| D2-10 | P1 | R7 current档跟随 | BLOCKED | - |
| D2-11 | P0 | R3 STS token拒绝落盘 | BLOCKED | - |
| D2-12 | P1 | R10 runtime非空禁止落盘 | PASS | evidence/supplement |
| D2-13 | P1 | R9 configuredBySession优先env | PASS | evidence/supplement |
| D2-16 | P1 | import文件读取后擦除 | PASS | evidence/supplement |
| D3-A1 | P1 | skill检索完整性 | PASS | evidence/supplement |
| D3-B1 | P2 | list_operations规范名 | PASS | evidence/supplement |
| D3-B3 | P1 | run_readonly脱敏执行 | BLOCKED | - |
| D3-B5 | P2 | detect_framework识别 | PASS | evidence/supplement |
| D3-C4 | P1 | 服务创建类回归 | BLOCKED | - |
| D3-C5 | P1 | 工具冒烟 | BLOCKED | - |
| D4-1 | P0 | 凭证文件读取拦截 | PASS | evidence/d4-security |
| D4-2 | P0 | 凭证env打印拦截 | FAIL | evidence/d4-security |
| D4-3 | P0 | 明文secret API拦截 | PASS | evidence/d4-security |
| D4-5 | P0 | 写操作误判检测 | PASS | evidence/d4-security |
| D4-7 | P1 | hook三工具有效性 | PASS | evidence/d4-security |
| D4-9 | P0 | 公开暴露/破坏性预检 | PASS | evidence/d4-security |
| D4-15 | P0 | hook绕过尝试 | PASS | evidence/d4-security |
| D4-16 | P0 | 命令包裹穿透 | FAIL | evidence/d4-security |
| D4-17 | P1 | hook模糊fail-closed | PASS | evidence/d4-security |
| D4-18 | P0 | confirm-not-deny审批语义 | BLOCKED | - |
| D4-19 | P0 | 确认流下预检仍生效 | BLOCKED | - |
| D4-20 | P1 | 拒绝后零操作 | BLOCKED | - |
| D4-21 | P0 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | PASS | evidence/d4-security |
| D4-22 | P0 | hook_check_deploy_plan 具名回归（部署计划预检） | PASS | evidence/d4-security |
| D4-23 | P0 | 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标） | FAIL | evidence/dsh-install |
| D5-1 | P1 | 清单发现加载 | PASS | evidence/dsh-install |
| D5-3 | P1 | 工具全量枚举 | PASS | evidence/d9-protocol |
| D8-7 | P0 | 7 个 meta/通用技能指引可机械执行验证 | PASS | evidence/dsh-install |
| D9-1 | P1 | tools/list合规 | PASS | evidence/d9-protocol |
| D9-2 | P1 | JSON-RPC错误码 | FAIL | evidence/d9-protocol |
| D9-3 | P1 | tools/call响应格式 | PASS | evidence/d9-protocol |
| D9-4 | P1 | 协议生命周期 | PASS | evidence/d9-protocol |
| D9-8 | P2 | inputSchema版本合规 | PASS | evidence/d9-protocol |
| D10-4 | P0 | 安全干预有效性 | BLOCKED | - |

**展开级非 NOT_RUN（28 行，逐条见副本 CSV）**：

| 用例 ID | 源用例/终端 | 结果 | 证据路径 |
|---|---|---|---|
| EXP-D5-6-1 | D5-1 · DSH | PASS | evidence/dsh-install |
| EXP-D5-6-3 | D5-3 · DSH | PASS | evidence/d9-protocol |
| EXP-NR3-02 | D1-27 · Linux OS_MATRIX | PASS | evidence/d1-upgrade |
| EXP-C4-01 ~ EXP-C4-22（22 行） | D3-C4 · 真云多服务 | BLOCKED | - |
| EXP-NR3-09 / 10 / 11 | D1-39 · 专属 OS 矩阵 | BLOCKED | - |

---

## 五、缺陷清单

> 缺陷均为真实执行后填写（探针已重跑复现）。根因详情与证据见 FINDINGS.md。**本轮 4 项缺陷与 2026-09-13 上轮完全相同（SUT 未变，github 上 #650 仍 OPEN），属于既知缺陷的回归确认，未重复提单**；提单引用 `huaweicloud/huaweicloud-devkit#650`。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY` 应 `deny` | `allow`（risk=not_huaweicloud） | safety-policy.mjs:335-336 | P | 已提单 #650（回归确认） |
| 2 | P0 | D4-16 | shell 包裹 hcloud 写命令穿透 | `bash -c "hcloud ecs DeleteServers ..."` 应 `deny` | `allow`（仅 warn） | safety-policy.mjs:67-77 | P | 已提单 #650（回归确认） |
| 3 | P0 | D4-23 | 全局规则未注入安装目标 | install 后 ~/.dsh 应有 huawei-agent-rules.* | 0 文件 | package.json files 无 rules + setup-cli.mjs 无注入 | P | 已提单 #650（回归确认） |
| 4 | P1 | D9-2 | JSON-RPC 错误码不规范 | 未知方法应返回 `-32601` | 抛普通 Error('Unsupported method') | mcp-protocol.mjs:95 | G | 已提单 #650（回归确认） |

---

## 六、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D1-39 / EXP-NR3-09/10/11 | Windows 专属升级检测链（EINVAL/文件锁/better-sqlite3） | Windows 环境 | 提供 Windows 机器 |
| D1-5 | uninstall 破坏性（删 ~/.dsh），需重装+重启 | 可重装的隔离环境 | 隔离 HOME 后复测 |
| D2-1 / D2-10 / D2-11 | 需真云 AK/SK 三端同步 / current profile 切换 / STS token 轮换 | 真云账号 | 提供真云凭证与多账号 |
| D3-B3 / D3-C4 / D3-C5 / EXP-C4-01~22 | 需真云只读执行 + 多服务创建→删除→归零 E2E | 真云账号 + 资源配额 | 真云执行并按红线清理 |
| D4-18 / D4-19 / D4-20 | 需互动确认流（confirm-not-deny / 预检仍生效 / 拒绝零操作） | 互动客户端 | 交互式会话 |
| D10-4 | 需真实 Agent 互动驱动 plan→审批 安全干预评测 | 真实 Agent + 评测集 | 评测环境 |

---

## 七、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针仅用临时 `HUAWEICLOUD_HOME`，evidence 仅记录脱敏后的决策字段）
- [x] 写操作误判 read-only：`0`（D4-5 验证）
- [x] 红线（I 类）违规：`无`（本轮未创建任何真实云资源）
- [x] 脱敏复核：`evidence` 下 `*.log`/`*.mjs` 无原始 AK/SK/securityToken 明文（样例值 AKRT/STOREDAK 等为夹具）

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真实云资源（ECS/OBS/RDS/…） | 否 | — | 本轮未创建，无需删（真云 E2E 全部 BLOCKED） |
| 本机临时目录（HUAWEICLOUD_HOME 夹具） | 是 | 已删（probe finally rmSync） | 已清理 |

> 真云只删本次创建资源；本轮无真云写操作，残留 0。

---

## 九、遗留与建议

- 待裁决 SPEC：无（本轮 0 SPEC-MISMATCH）。
- 本轮未覆盖（说明范围）：真云 E2E（D2-1/D2-10/D2-11/D3-B3/D3-C4/D3-C5 + 22×EXP-C4）；性能延迟/冷启（D6-1/D6-3/D6-4）；文档一致性（D8-1/D8-4/D8-6）；跨客户端互通与协议降级（D9-5/D9-6/D9-7/D9-9）；真实 Agent 评测（D10-1/2/3/5 + EXP-E*）；多客户端矩阵（EXP-D5 其余 8 客户端）；隔离 HOME 白名单（D1-45/D1-58 + EXP-D1-58-*）。
- 建议：本轮回归确认 #650 的 3 个 P0 安全缺陷（D4-2 env 前缀、D4-16 shell 包裹、D4-23 全局规则发布/注入）仍未被修复，SUT 版本仍停留在 v1.1.4-next.3；待源码仓库发布修复版本后复测这些红线用例。

---

*报告生成时间：2026-09-14 07:19:00（北京时间）*
*执行者：DSH（deepseek-v4-pro-0813）*