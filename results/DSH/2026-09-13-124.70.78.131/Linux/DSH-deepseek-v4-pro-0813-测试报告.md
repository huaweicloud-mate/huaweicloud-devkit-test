# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-13 21:51:41（北京时间）
> **执行归档**：`results/DSH/2026-09-13-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（4 缺陷：3 P0 + 1 P1；P0 有 3 处安全缺口，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 24.04，6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next，gitHead `3b6290bc`，hdk checkout 同 commit） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（已安装，credentials 已配置） |
| 真云凭证 | `~/.config/huaweicloud/credentials.json`（已配置；本轮未用于任何写操作） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/auth/proxy）/ MCP 协议 / 安全分类 / 凭证 R 规则 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）直调已安装包 `huaweicloud-devkit@1.1.4-next.3` 的 `plugins/huaweicloud-core/src/*` 导出函数 + CLI 真机执行，决策/结果落 `stdout.log`；证据统一落 `evidence/<group>/`。凭证 R 规则用例用 `HUAWEICLOUD_HOME` 临时目录隔离，不触碰真实凭证。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152（设计级 81 + 展开级 71） |
| 已执行（设计级，非 NOT_RUN） | 52 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（设计级） | 36 / 4 / 12 / 0 / 29 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 90.0%（36/40） |
| P0 / P1 / P2 缺陷 | 3 / 1 / 0（详见 §五） |
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
| PASS | 36 | 有证据且通过 PASS 门禁 |
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

> 逐用例结果与副本 CSV「执行状态」+「evidencePath」列一致（同一来源，机械生成）。

| 用例 ID | 优先级 | 标题 | 结果 | 证据路径 | 备注 |
|---|---|---|---|---|---|
| D1-1 | P1 | 全新环境引导安装 | PASS | evidence/dsh-install | install --target dsh 闭环（skills/MCP/safety/hook+运行时依赖全落位） |
| D1-3 | P1 | doctor健康自检 | PASS | evidence/cli-readonly | doctor exit 0 + 自检输出 |
| D1-4 | P2 | status/update幂等 | PASS | evidence/cli-readonly | status exit 0；update 无倒退语义见 D1-27/40 |
| D1-5 | P1 | uninstall干净度 | BLOCKED | - | uninstall 破坏性，执行后需重装+重启，本轮不做 |
| D1-6 | P2 | install-hcloud | PASS | evidence/cli-readonly | install-hcloud exit 0 + KooCLI 指引 |
| D1-26 | P1 | 升级提醒工具注册与协议暴露 | PASS | evidence/d1-upgrade | check_update+upgrade 双注册 + schema |
| D1-27 | P1 | 检测语义-已是最新 | PASS | evidence/d1-upgrade | judgeUpdate up_to_date |
| D1-28 | P1 | 检测语义-有新版本 | PASS | evidence/d1-upgrade | judgeUpdate update_available + targetVersion |
| D1-30 | P2 | semver 比对正确性 | PASS | evidence/d1-upgrade | semverCompare 边界 + hasPrerelease |
| D1-31 | P1 | dismiss 冷却期 | PASS | evidence/d1-upgrade | skip 文件字段 + 冷却判 dismissed |
| D1-33 | P2 | skip 文件持久化与多路径 | PASS | evidence/d1-upgrade | writeSkipState/readSkipState + resolveSkipFilePath |
| D1-39 | P0 | Windows 升级检测链可用性 | BLOCKED | - | Windows 专属（EINVAL/文件锁），本机 Linux |
| D1-40 | P0 | 镜像 lag 下检测正确性 | PASS | evidence/d1-upgrade | 反向提醒防护（remote<=local → up_to_date） |
| D1-41 | P1 | check_update 真实 MCP 返回契约 | PASS | evidence/supplement | 返回 {result, updateAvailable} 结构 |
| D2-1 | P1 | auth init三端同步 | BLOCKED | - | 需真云 AK/SK 三端同步写入 |
| D2-4 | P0 | 凭证脱敏正确性 | PASS | evidence/d4-security | redactSecrets 对象/键值/嵌套全覆盖 |
| D2-5 | P1 | 凭证缺失报错指引 | PASS | evidence/supplement | HDKIT_CRED_MISSING + auth init/HW_* 指引 |
| D2-10 | P1 | R7 current档跟随 | BLOCKED | - | 需真云 KooCLI current profile 多账号切换 |
| D2-11 | P0 | R3 STS token拒绝落盘 | BLOCKED | - | 需真云 STS securityToken 临时凭证轮换链路 |
| D2-12 | P1 | R10 runtime非空禁止落盘 | PASS | evidence/supplement | setRuntimeCredentials 仅内存，文件未建 |
| D2-13 | P1 | R9 configuredBySession优先env | PASS | evidence/supplement | S1 持久化账号优先 env 注入默认 |
| D2-16 | P1 | import文件读取后擦除 | PASS | evidence/supplement | tools.mjs:953-978 read→rmSync |
| D3-A1 | P1 | skill检索完整性 | PASS | evidence/supplement | 58 skill 目录 + meta 齐全 |
| D3-B1 | P2 | list_operations规范名 | PASS | evidence/supplement | 结构化契约 + hcloud ECS --help 成功 |
| D3-B3 | P1 | run_readonly脱敏执行 | BLOCKED | - | 需真云只读命令 + 输出脱敏回归（避免真实数据进证据） |
| D3-B5 | P2 | detect_framework识别 | PASS | evidence/supplement | CRA fixture → Create React App SPA |
| D3-C4 | P1 | 服务创建类回归 | BLOCKED | - | 真云多服务创建→删除→归零 E2E |
| D3-C5 | P1 | 工具冒烟 | BLOCKED | - | 真云工具冒烟 E2E |
| D4-1 | P0 | 凭证文件读取拦截 | PASS | evidence/d4-security | cat/type/Get-Content 均 deny |
| D4-2 | P0 | 凭证env打印拦截 | FAIL | evidence/d4-security | HW_ACCESS_KEY/HW_SECRET_KEY 前缀未拦截，根因 §五 #1 |
| D4-3 | P0 | 明文secret API拦截 | PASS | evidence/d4-security | ShowSecretVersion/GetSecretValue deny |
| D4-5 | P0 | 写操作误判检测 | PASS | evidence/d4-security | 写 deny / 只读 allow / obs cp deny |
| D4-7 | P1 | hook三工具有效性 | PASS | evidence/d4-security | command/artifacts/deploy_plan 均 deny + 16 rules |
| D4-9 | P0 | 公开暴露/破坏性预检 | PASS | evidence/d4-security | 公网端口/--force/ResetPassword deny |
| D4-15 | P0 | hook绕过尝试 | PASS | evidence/d4-security | 大小写/拆分/URL 编码变体均 deny |
| D4-16 | P0 | 命令包裹穿透 | FAIL | evidence/d4-security | bash/sh -c 包裹 hcloud 写命令未 hard-deny，根因 §五 #2 |
| D4-17 | P1 | hook模糊fail-closed | PASS | evidence/d4-security | 空 args deny + assertAllowed throws |
| D4-21 | P0 | hook_check_artifacts 具名回归 | PASS | evidence/d4-security | 宽泛 IAM Administrator deny |
| D4-22 | P0 | hook_check_deploy_plan 具名回归 | PASS | evidence/d4-security | 公网 FunctionGraph 无鉴权 warn |
| D4-23 | P0 | 全局规则注入生效性 | FAIL | evidence/dsh-install | ~/.dsh 下 huawei-agent-rules* = 0，根因 §五 #3 |
| D5-1 | P1 | 清单发现加载 | PASS | evidence/dsh-install | install 落位 + 58 skill 目录发现 |
| D5-3 | P1 | 工具全量枚举 | PASS | evidence/d9-protocol | 39 tools 无重复 + schema齐 |
| D8-7 | P0 | 7 个 meta/通用技能可机械执行 | PASS | evidence/dsh-install | 7/7 SKILL.md 可机械加载 |
| D9-1 | P1 | tools/list合规 | PASS | evidence/d9-protocol | 39 工具齐 + inputSchema 结构合法 |
| D9-2 | P1 | JSON-RPC错误码 | FAIL | evidence/d9-protocol | 无 -32601 结构化错误码，根因 §五 #4 |
| D9-3 | P1 | tools/call响应格式 | PASS | evidence/d9-protocol | content[].text + isError=false |
| D9-4 | P1 | 协议生命周期 | PASS | evidence/d9-protocol | initialize/tools·resources list/不支持方法拒绝 |
| D9-8 | P2 | inputSchema版本合规 | PASS | evidence/d9-protocol | 单一 JSON Schema draft |
| D10-4 | P0 | 安全干预有效性 | BLOCKED | - | 需真实 Agent 互动驱动 plan→审批 评测 |

---

## 五、缺陷清单

> 缺陷均为真实执行后填写（探针已重跑复现）。根因详情与证据见 FINDINGS.md。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY` 应 `deny` | `allow`（risk=not_huaweicloud） | safety-policy.mjs:335-336 | P | 待提单 |
| 2 | P0 | D4-16 | shell 包裹 hcloud 写命令穿透 | `bash -c "hcloud ecs DeleteServers ..."` 应 `deny` | `allow`（仅 warn） | safety-policy.mjs:67-77 | P | 待提单 |
| 3 | P0 | D4-23 | 全局规则未注入安装目标 | install 后 ~/.dsh 应有 huawei-agent-rules.* | 0 文件 | package.json files 无 rules + setup-cli.mjs 无注入 | P | 待提单 |
| 4 | P1 | D9-2 | JSON-RPC 错误码不规范 | 未知方法应返回 `-32601` | 抛普通 Error('Unsupported method') | mcp-protocol.mjs:95 | G | 待提单 |

---

## 六、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D1-39 / EXP-NR3-09/10/11 | Windows 专属升级检测链（EINVAL/文件锁/better-sqlite3） | Windows 环境 | 提供 Windows 机器 |
| D1-5 | uninstall 破坏性（删 ~/.dsh），需重装+重启 | 可重装的隔离环境 | 隔离 HOME 后复测 |
| D2-1 / D2-10 / D2-11 | 需真云 AK/SK 三端同步 / current profile 切换 / STS token 轮换 | 真云账号 | 提供真云凭证与多账号 |
| D3-B3 / D3-C4 / D3-C5 / EXP-C4-* | 需真云只读执行 + 多服务创建→删除→归零 E2E | 真云账号 + 资源配额 | 真云执行并按红线清理 |
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
- 建议：优先修复 3 个 P0 安全缺陷（D4-2 env 前缀、D4-16 shell 包裹、D4-23 全局规则发布/注入），D4-2/D4-16 同属 `safety-policy.mjs` 命令分类层，可合并修复；D4-23 需补 npm `files` 白名单 + `setup-cli.mjs` 注入逻辑。

---

*报告生成时间：2026-09-13 21:51:41（北京时间）*
*执行者：DSH（deepseek-official/deepseek-v4-pro-0813）*