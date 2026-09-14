# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-14 23:06（北京时间）
> **执行归档**：`results/DSH/2026-09-14-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（9 缺陷：5 P0 + 3 P1 + 1 P2，均有根因文件:行号 + 证据，见 FINDINGS.md）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | DSH + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu，6.8.0-106-generic） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4-next.6`（npm @next，gitHead `69ac7279`，hdk checkout 同 commit） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS，含 next.6 新增 `huaweicloud_obs_set_website_config`） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI，credentials 已配置） |
| 真云凭证 | `~/.config/huaweicloud/credentials.json`（已配置；本轮未用于任何真实云写操作） |
| 测试类型 | 源码级探针（.mjs 直调 plugins/huaweicloud-core/src 导出函数）/ 真机 CLI（doctor/status/install-hcloud/auth/install）/ MCP 协议 / 安全分类 / 意图路由 |
| 设计真源 | 设计级 81 / 展开级 71 / 追踪表 183 行 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）import 已安装包 `huaweicloud-devkit@1.1.4-next.6` 的 `safety-policy`/`risk-rule-engine`/`mcp-protocol`/`tools`/`update-check`/`auth`/`detect-framework` 导出函数，决策与断言落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<group>/`。安全/凭证用例用临时 `HUAWEICLOUD_HOME` 隔离，不触碰真实凭证。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152（设计级 81 + 展开级 71） |
| 已执行（设计级，非 BLOCKED） | 45（PASS 36 + FAIL 9） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（设计级） | 36 / 9 / 36 / 0 / 0 |
| PASS / FAIL / BLOCKED / NOT_RUN（展开级） | 3 / 0 / 68 / 0 |
| 通过率（设计级，分母=PASS+FAIL+SPEC） | 80.0%（36/45） |
| P0 / P1 / P2 缺陷 | 5 / 3 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建任何真实云资源） |

### P0 覆盖（18 条，全覆盖：PASS / FAIL / BLOCKED，无 NOT_RUN）

| 状态 | 数量 | 清单 |
|---|---|---|
| PASS | 9 | D1-40 / D4-1 / D4-3 / D4-5 / D4-9 / D4-21 / D4-22 / D8-7 / D4-7（D4-7 为 P1） |
| FAIL | 5 | D2-4 / D4-2 / D4-15 / D4-16 / D4-23 |
| BLOCKED | 5 | D1-39（Windows）/ D2-11（STS 真云）/ D4-18·D4-19（互动确认流）/ D10-4（真实评测） |

---

## 三、状态汇总

### 3.1 设计级（81）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 36 | 有证据且通过 PASS 门禁（verify_no_fake_pass 通过） |
| FAIL | 9 | 不符预期，根因见 FINDINGS.md（5 P0 + 3 P1 + 1 P2） |
| BLOCKED | 36 | 环境阻塞（真云 / 互动确认流 / Windows / 真实评测 / 性能基准），见 §六，均有 blockedReason |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **81** | |

### 3.2 展开级（71）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 3 | EXP-D5-6-1（DSH·D5-1）/ EXP-D5-6-3（DSH·D5-3）/ EXP-NR3-02（Linux·D1-27） |
| FAIL | 0 | — |
| BLOCKED | 68 | 22×真云 E2E（EXP-C4）+ 3×D1-39 专属（EXP-NR3-09/10/11）+ 18×其他客户端终端矩阵 + 15×真实评测（EXP-E）+ 5×dismiss 竞态 + 5×D1-58 白名单 merge，见 §六 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **71** | |

---

## 四、逐用例结果（设计级 PASS/FAIL 45 项）

| 用例 ID | 优先级 | 标题 | 结果 | 证据路径 |
|---|---|---|---|---|
| D1-1 | P1 | 全新环境引导安装 | PASS | evidence/dsh-install |
| D1-3 | P1 | doctor健康自检 | PASS | evidence/cli-readonly |
| D1-4 | P2 | status/update幂等 | PASS | evidence/cli-readonly |
| D1-6 | P2 | install-hcloud | PASS | evidence/cli-readonly |
| D1-26 | P1 | 升级提醒工具注册与协议暴露 | PASS | evidence/d1-upgrade |
| D1-27 | P1 | 检测语义-已是最新 | PASS | evidence/d1-upgrade |
| D1-28 | P1 | 检测语义-有新版本 | PASS | evidence/d1-upgrade |
| D1-30 | P2 | semver 比对正确性 | PASS | evidence/d1-upgrade |
| D1-31 | P1 | dismiss 冷却期 | PASS | evidence/d1-upgrade |
| D1-33 | P2 | skip 文件持久化与多路径 | PASS | evidence/d1-upgrade |
| D1-40 | P0 | 镜像 lag 下检测正确性 | PASS | evidence/d1-upgrade |
| D1-41 | P1 | check_update 真实 MCP 返回契约 | PASS | evidence/supplement |
| D1-42 | P1 | dismiss 真实闭环与跨调用持久化 | PASS | evidence/d1-upgrade |
| D2-4 | P0 | 凭证脱敏正确性 | FAIL | evidence/d4-security |
| D2-5 | P1 | 凭证缺失报错指引 | PASS | evidence/supplement |
| D2-12 | P1 | R10 runtime非空禁止落盘 | PASS | evidence/supplement |
| D2-13 | P1 | R9 configuredBySession优先env | PASS | evidence/supplement |
| D2-16 | P1 | import文件读取后擦除 | PASS | evidence/supplement |
| D3-A1 | P1 | skill检索完整性 | PASS | evidence/supplement |
| D3-B1 | P2 | list_operations规范名 | PASS | evidence/supplement |
| D3-B5 | P2 | detect_framework识别 | PASS | evidence/supplement |
| D4-1 | P0 | 凭证文件读取拦截 | PASS | evidence/d4-security |
| D4-2 | P0 | 凭证env打印拦截 | FAIL | evidence/d4-security |
| D4-3 | P0 | 明文secret API拦截 | PASS | evidence/d4-security |
| D4-4 | P1 | 写操作审批门 | PASS | evidence/d4-security |
| D4-5 | P0 | 写操作误判检测 | PASS | evidence/d4-security |
| D4-6 | P1 | adminPass回显警告（写门禁阻断） | PASS | evidence/d4-security |
| D4-7 | P1 | hook三工具有效性 | PASS | evidence/d4-security |
| D4-9 | P0 | 公开暴露/破坏性预检 | PASS | evidence/d4-security |
| D4-15 | P0 | hook绕过尝试 | FAIL | evidence/d4-security |
| D4-16 | P0 | 命令包裹穿透 | FAIL | evidence/d4-security |
| D4-17 | P1 | hook模糊fail-closed | FAIL | evidence/d4-security |
| D4-21 | P0 | hook_check_artifacts 具名回归 | PASS | evidence/d4-security |
| D4-22 | P0 | hook_check_deploy_plan 具名回归 | PASS | evidence/d4-security |
| D4-23 | P0 | 全局规则 huawei-agent-rules.md 注入生效性 | FAIL | evidence/dsh-install |
| D5-1 | P1 | 清单发现加载 | PASS | evidence/supplement |
| D5-3 | P1 | 工具全量枚举 | PASS | evidence/d9-protocol |
| D8-1 | P2 | 文档与能力一致 | FAIL | evidence/supplement |
| D8-7 | P0 | 7 个 meta/通用技能机械执行验证 | PASS | evidence/supplement |
| D9-1 | P1 | tools/list合规 | PASS | evidence/d9-protocol |
| D9-2 | P1 | JSON-RPC错误码 | FAIL | evidence/d9-protocol |
| D9-3 | P1 | tools/call响应格式 | PASS | evidence/d9-protocol |
| D9-4 | P1 | 协议生命周期 | PASS | evidence/d9-protocol |
| D9-8 | P2 | inputSchema版本合规 | PASS | evidence/d9-protocol |
| D10-3 | P1 | 路由准确率+混淆矩阵 | FAIL | evidence/supplement |

---

## 五、缺陷清单

> 缺陷均为真实探针执行后填写（已落 evidence）。根因与证据见 FINDINGS.md。本轮 9 项缺陷中，4 项（D4-2/D4-16/D4-23 为 P0、D9-2 为 P1）为 next.3 → next.6 延续的既知缺陷（上轮提单 #650 仍 OPEN）；5 项为 next.6 新增/延伸（D2-4 小写 ak=、D4-15 命令替换、D4-17 fail-open、D8-1 文档漂移、D10-3 中文路由）。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏漏小写 ak=/sk= | 小写 `ak=`/`sk=` 应 `<redacted>` | 返回原文 | safety-policy.mjs:45 | P | 待提单 |
| 2 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY` 应 `deny` | `allow` | safety-policy.mjs:336 | P | 待提单（#650 延续） |
| 3 | P0 | D4-15 | 命令替换绕过 | `$(...)` 破坏性删除应 `deny` | `allow` | risk-rule-engine.mjs:50-53 | P | 待提单 |
| 4 | P0 | D4-16 | shell 包裹穿透 | `bash -c "hcloud ..."` 应 `deny` | `allow`（仅 warn） | safety-policy.mjs:345 | P | 待提单（#650 延续） |
| 5 | P1 | D4-17 | 畸形输入 fail-open | 畸形 artifact 应 `deny` | `allow` | risk-rule-engine.mjs:103-106 | G | 待提单 |
| 6 | P0 | D4-23 | 全局规则未注入 | install 应有 `huawei-agent-rules.md` | 0 文件 | package.json files + setup-cli.mjs | P | 待提单（#650 延续） |
| 7 | P1 | D9-2 | JSON-RPC 错误码漂移 | 未知方法应 `-32601` | 抛普通 Error（无 code） | mcp-protocol.mjs:95 / mcp-server.mjs:169 | G | 待提单（#650 延续） |
| 8 | P2 | D8-1 | 文档 39 vs 实现 40 工具 | 文档应 40 | 文档 39 | hdk/AGENTS.md:27,45 | G | 待提单 |
| 9 | P1 | D10-3 | 中文意图路由 miss | 「创建 2C4G Ubuntu 云服务器」应路由 ECS | `Run hcloud --help` | tools.mjs:1776-1907 | G | 待提单 |

---

## 六、阻塞项（主要分组，全部已回填 blockedReason）

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D1-39 / EXP-NR3-09/10/11 | Windows 专属升级检测链（EINVAL/文件锁/better-sqlite3） | Windows 环境 | 提供 Windows 机器 |
| D1-5 | uninstall 破坏性（删 ~/.dsh），需重装+重启 | 可重装隔离环境 | 隔离 HOME 后复测 |
| D2-1 / D2-10 / D2-11 / D3-B3 | 真云 AK/SK 三端同步 / current profile / STS / 只读脱敏 | 真云账号多状态 | 提供真云凭证与多账号 |
| D3-C4 / D3-C5 / EXP-C4-01~22 | 真云多服务创建→删除→归零 E2E | 真云资源配额 | 真云执行并按红线清理 |
| D4-18 / D4-19 / D4-20 / D4-24 | 互动确认流（confirm-not-deny / 预检仍生效 / 拒绝零操作 / 令牌边界） | 互动客户端 | 交互式会话 |
| D10-1/2/4/5 + EXP-E01~15 | 真实 Agent + 评测集驱动（工具描述/激活率/安全干预/多轮完成/路由混淆矩阵） | 真实 Agent + 评测集 | 评测环境 |
| D6-1/3/4 · D9-5/7/9 · D7-4 | 性能/冷启/并发压测 · stdio 健壮 · 版本降级 · 镜像源 | 压测工具 + 多网络环境 | 基准环境 |
| D1-58 + EXP-D1-58-* | Claude/Cursor MCP 白名单 merge 语义 | Claude/Cursor 客户端 | 对应客户端环境 |
| EXP-D5-1~10（除 DSH） | 其他 9 客户端终端矩阵 | 各客户端运行环境 | 多客户端机器 |
| D1-45 / EXP-NR3-01/03/04/23/24 | dismiss/预热真实会话序列与竞态时序 | 真实会话 | 真实会话链路 |
| D4-8 | Python/Node 双钩子一致性 | 双钩子接线环境 | 双路径接线复测 |
| D4-10/11/12/13/14 · D8-4 · D8-6 · D2-2 | 规则库回归基线 / 注入集 / 供应链审计 / 最小权限矩阵 / 审计链路 / 引导录屏 / 中英文 diff / auth 状态矩阵 | 专用测试基线 | 对应基线与集 |

---

## 七、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针仅用临时 `HUAWEICLOUD_HOME` + 夹具值 `AKRT/STOREDAK/ENVAK`，evidence 仅记录脱敏决策字段）
- [x] 写操作误判 read-only：`0`（D4-5 验证 ListServersDetails → read_only，DeleteServers/CreateServers → write deny）
- [x] 红线（I 类）违规：`无`（本轮未创建任何真实云资源）
- [x] 脱敏复核：`evidence` 下 `*.log`/`*.mjs` 无原始 AK/SK/securityToken 明文

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真实云资源（ECS/OBS/RDS/…） | 否 | — | 本轮未创建，无需删（真云 E2E 全部 BLOCKED） |
| 本机临时目录（HUAWEICLOUD_HOME 夹具 / 隔离 install HOME） | 是 | 已删（probe finally rmSync） | 已清理 |

> 真云只删本次创建资源；本轮无真云写操作，残留 0。

---

## 九、遗留与建议

- 待裁决 SPEC：无（本轮 0 SPEC-MISMATCH）。
- 本轮未覆盖（说明范围）：真云写 E2E、真实交互确认流、真实 Agent 评测、性能/冷启/并发基准、跨客户端互通、中英文文档 diff，均已回填 BLOCKED + blockedReason（见 §六）。
- 建议：next.6 引入 `huaweicloud_obs_set_website_config`（#347）后工具数升到 40，但 `AGENTS.md` 未同步（D8-1）；#650 的 3 个 P0 安全缺陷（D4-2 env 前缀、D4-16 shell 包裹、D4-23 规则注入）在 next.6 仍未修复，且新增 D2-4（小写 ak=/sk=）、D4-15（命令替换）、D4-17（fail-open）安全用例缺陷，建议优先收敛冗余拦截路径。

---

*报告生成时间：2026-09-14 23:06（北京时间）*
*执行者：DSH（deepseek-v4-pro-0813）*
