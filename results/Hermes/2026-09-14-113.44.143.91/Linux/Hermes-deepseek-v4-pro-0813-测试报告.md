# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-14 07:26:23（北京时间）
> **执行归档**：`results/Hermes/2026-09-14-113.44.143.91/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 4 项 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux（x86_64，Ubuntu 6.8 内核） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.11.15 |
| 被测版本（SUT） | `v1.1.4-next.3`（npm @next，gitHead `3b6290b`，PR #647） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS，tools/list 实测 39） |
| hcloud / 依赖 | hcloud 7.2.12 / 运行时依赖仅 undici |
| 真云凭证 | session 级（`configuredBySession=True`）→ 实测 `APIGW.0301 Unauthorized`，真云未使用 |
| 测试类型 | 源码级探针（96 用例断言库）/ 真机 CLI（install/doctor/status/update/uninstall）/ MCP 协议 stdio / 补充探针 |
| daily 基础用例 | 设计级 81 / 展开级 71（追踪表 183 行） |

> **执行方法**：复用并重跑源码级断言库 `_lib/hdk-asserts.mjs`（直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数），证据落 `evidence/<case-id>/stdout.txt`；CLI/hook/协议/白名单/补充探针分别落 `evidence/*-stdout.txt`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily 设计+展开） | `152` |
| 已执行（PASS+FAIL+SPEC） | `124` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `104 / 19 / 8 / 1 / 20` |
| 通过率（分母=PASS+FAIL+SPEC） | `83.9%` |
| P0 / P1 / P2 缺陷 | `4 / 4 / 1` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（未实际创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `66` | 有证据且通过 PASS 门禁 |
| FAIL | `7` | 缺陷 #1/#2/#3/#4/#5/#7/#8 |
| BLOCKED | `6` | 真云凭证无效 / Windows 缺失 / 环境残留 |
| SPEC-MISMATCH | `1` | 缺陷 #6（-32603 vs -32601） |
| NOT_RUN | `1` | D10-5 多轮交互未覆盖 |
| **合计** | **`81`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 服务矩阵 C4 22 条 + 路由 3 条 + NR3 6 条 + D1-58 5 条 + Hermes D5 2 条 |
| FAIL | `12` | 中文路由 EXP-E* 12 条（缺陷 #7） |
| BLOCKED | `2` | Windows/macOS 终端矩阵 |
| SPEC-MISMATCH | `0` | 0 |
| NOT_RUN | `19` | 其他客户端 D5 矩阵 18 条 + NR3-03 |
| **合计** | **`71`** | |

---

## 四、逐用例结果（已执行项）

### 4.1 设计级

| 用例 ID | 优先级 | 标题/枚举 | 结果 | 证据路径 |
|---|---|---|---|---|
| `D1-1` | P1 | 全新环境引导安装 | PASS | `evidence/cli-stdout.txt` |
| `D1-2` | P2 | 多Agent探测 | PASS | `evidence/cli-stdout.txt` |
| `D1-3` | P1 | doctor健康自检 | PASS | `evidence/cli-stdout.txt` |
| `D1-4` | P2 | status/update幂等 | PASS | `evidence/cli-stdout.txt` |
| `D1-5` | P1 | uninstall干净度 | PASS | `evidence/cli-stdout.txt` |
| `D1-6` | P2 | install-hcloud | BLOCKED | `` |
| `D1-26` | P1 | 升级提醒工具注册与协议暴露 | PASS | `evidence/D1-26/stdout.txt` |
| `D1-27` | P1 | 检测语义-已是最新 | PASS | `evidence/D1-27/stdout.txt` |
| `D1-28` | P1 | 检测语义-有新版本 | PASS | `evidence/D1-28/stdout.txt` |
| `D1-30` | P2 | semver 比对正确性 | PASS | `evidence/D1-30/stdout.txt` |
| `D1-31` | P1 | dismiss 冷却期 | PASS | `evidence/D1-31/stdout.txt` |
| `D1-33` | P2 | skip 文件持久化与多路径 | PASS | `evidence/D1-33/stdout.txt` |
| `D1-39` | P0 | Windows 升级检测链可用性 | BLOCKED | `` |
| `D1-40` | P0 | 镜像 lag 下检测正确性(反向提醒防护) | PASS | `evidence/D1-40/stdout.txt` |
| `D1-41` | P1 | check_update 真实 MCP 返回契约 | PASS | `evidence/D1-41/stdout.txt` |
| `D1-42` | P1 | dismiss 真实闭环与跨调用持久化 | PASS | `evidence/D1-42/stdout.txt` |
| `D1-45` | P1 | 兜底提示真实序列与预热竞态 | PASS | `evidence/D1-45/stdout.txt` |
| `D1-58` | P1 | 通用 MCP 白名单接入（Claude/Cursor merge 语义） | PASS | `evidence/d158-stdout.txt` |
| `D2-10` | P1 | R7 current档跟随 | PASS | `evidence/D2-10/stdout.txt` |
| `D2-11` | P0 | R3 STS token拒绝落盘 | PASS | `evidence/D2-11/stdout.txt` |
| `D2-12` | P1 | R10 runtime非空禁止落盘 | PASS | `evidence/D2-12/stdout.txt` |
| `D2-13` | P1 | R9 configuredBySession优先env | PASS | `evidence/D2-13/stdout.txt` |
| `D2-16` | P1 | import文件读取后擦除 | PASS | `evidence/D2-16/stdout.txt` |
| `D4-18` | P0 | confirm-not-deny审批语义 | PASS | `evidence/D4-18/stdout.txt` |
| `D4-19` | P0 | 确认流下预检仍生效 | PASS | `evidence/D4-19/stdout.txt` |
| `D4-20` | P1 | 拒绝后零操作 | PASS | `evidence/D4-20/stdout.txt` |
| `D2-1` | P1 | auth init三端同步 | PASS | `evidence/D2-1/stdout.txt` |
| `D2-2` | P2 | auth status判定准确性 | PASS | `evidence/D2-2/stdout.txt` |
| `D2-4` | P0 | 凭证脱敏正确性 | FAIL | `evidence/D2-4/stdout.txt` |
| `D2-5` | P1 | 凭证缺失报错指引 | PASS | `evidence/D2-5/stdout.txt` |
| `D3-A1` | P1 | skill检索完整性 | PASS | `evidence/D3-A1/stdout.txt` |
| `D3-B1` | P2 | list_operations规范名 | PASS | `evidence/D3-B1/stdout.txt` |
| `D3-B3` | P1 | run_readonly脱敏执行 | BLOCKED | `` |
| `D3-B5` | P2 | detect_framework识别 | PASS | `evidence/D3-B5/stdout.txt` |
| `D3-C4` | P1 | 服务创建类回归 | BLOCKED | `` |
| `D3-C5` | P1 | 工具冒烟 | PASS | `evidence/D3-C5/stdout.txt` |
| `D4-1` | P0 | 凭证文件读取拦截 | PASS | `evidence/D4-1/stdout.txt` |
| `D4-2` | P0 | 凭证env打印拦截 | FAIL | `evidence/D4-2/stdout.txt` |
| `D4-3` | P0 | 明文secret API拦截 | PASS | `evidence/D4-3/stdout.txt` |
| `D4-4` | P1 | 写操作审批门 | PASS | `evidence/D4-4/stdout.txt` |
| `D4-5` | P0 | 写操作误判检测 | PASS | `evidence/D4-5/stdout.txt` |
| `D4-6` | P1 | adminPass回显警告 | PASS | `evidence/D4-6/stdout.txt` |
| `D4-7` | P1 | hook三工具有效性 | PASS | `evidence/D4-7/stdout.txt` |
| `D4-8` | P1 | Python/Node策略一致 | FAIL | `evidence/hook-stdout.txt` |
| `D4-9` | P0 | 公开暴露/破坏性预检 | PASS | `evidence/D4-9/stdout.txt` |
| `D4-10` | P2 | 规则库新增回归 | PASS | `evidence/D4-10/stdout.txt` |
| `D4-11` | P1 | 提示注入防护 | PASS | `evidence/D4-11/stdout.txt` |
| `D4-12` | P2 | 供应链安装期安全 | PASS | `evidence/D4-12/stdout.txt` |
| `D4-13` | P1 | 最小权限凭证通过率 | BLOCKED | `` |
| `D4-14` | P2 | 操作可审计性 | BLOCKED | `` |
| `D4-15` | P0 | hook绕过尝试 | PASS | `evidence/D4-15/stdout.txt` |
| `D4-16` | P0 | 命令包裹穿透 | FAIL | `evidence/D4-16/stdout.txt` |
| `D4-17` | P1 | hook模糊fail-closed | FAIL | `evidence/hook-stdout.txt` |
| `D4-21` | P0 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | PASS | `evidence/D4-21/stdout.txt` |
| `D4-22` | P0 | hook_check_deploy_plan 具名回归（部署计划预检） | PASS | `evidence/D4-22/stdout.txt` |
| `D4-23` | P0 | 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标 | FAIL | `evidence/cli-stdout.txt` |
| `D4-24` | P1 | 确认令牌过期与重复确认边界（审批流健壮性） | PASS | `evidence/D4-24/stdout.txt` |
| `D5-1` | P1 | 清单发现加载 | PASS | `evidence/cli-stdout.txt` |
| `D5-3` | P1 | 工具全量枚举 | PASS | `evidence/D5-3/stdout.txt` |
| `D6-1` | P2 | 检索响应延迟 | PASS | `evidence/D6-1/stdout.txt` |
| `D6-3` | P2 | MCP冷启时间 | PASS | `evidence/D6-3/stdout.txt` |
| `D6-4` | P1 | 并发调度正确性 | PASS | `evidence/D6-4/stdout.txt` |
| `D9-9` | P1 | tools/call 超时协议语义与取消 | PASS | `evidence/D9-9/stdout.txt` |
| `D7-4` | P2 | 国内镜像源安装 | PASS | `evidence/D7-4/stdout.txt` |
| `D8-1` | P2 | 文档与能力一致 | PASS | `evidence/D8-1/stdout.txt` |
| `D8-4` | P1 | 引导步骤可机械执行 | PASS | `evidence/cli-stdout.txt` |
| `D8-6` | P2 | 中英文文档一致 | PASS | `evidence/D8-6/stdout.txt` |
| `D8-7` | P0 | 7 个 meta/通用技能指引可机械执行验证 | PASS | `evidence/D8-7/stdout.txt` |
| `D9-1` | P1 | tools/list合规 | PASS | `evidence/D9-1/stdout.txt` |
| `D9-2` | P1 | JSON-RPC错误码 | SPEC-MISMATCH | `evidence/protocol-stdout.txt` |
| `D9-3` | P1 | tools/call响应格式 | PASS | `evidence/D9-3/stdout.txt` |
| `D9-4` | P1 | 协议生命周期 | PASS | `evidence/D9-4/stdout.txt` |
| `D9-5` | P1 | stdio传输健壮 | PASS | `evidence/protocol-stdout.txt` |
| `D9-6` | P1 | 跨客户端互通 | PASS | `evidence/D9-6/stdout.txt` |
| `D9-7` | P2 | 协议版本协商降级 | PASS | `evidence/D9-7/stdout.txt` |
| `D9-8` | P2 | inputSchema版本合规 | PASS | `evidence/protocol-stdout.txt` |
| `D10-1` | P1 | 工具描述可选择性 | PASS | `evidence/D10-1/stdout.txt` |
| `D10-2` | P1 | skill激活率 | PASS | `evidence/D10-2/stdout.txt` |
| `D10-3` | P1 | 路由准确率+混淆矩阵 | FAIL | `evidence/D10-3/stdout.txt` |
| `D10-4` | P0 | 安全干预有效性 | PASS | `evidence/D10-4/stdout.txt` |
| `D10-5` | P1 | 多轮任务完成率 | NOT_RUN | `` |

### 4.2 展开级

| 用例 ID | 优先级 | 标题/枚举 | 结果 | 证据路径 |
|---|---|---|---|---|
| `EXP-D5-1-1` | P1 | OpenCode | NOT_RUN | `` |
| `EXP-D5-1-3` | P1 | OpenCode | NOT_RUN | `` |
| `EXP-D5-2-1` | P1 | Codex | NOT_RUN | `` |
| `EXP-D5-2-3` | P1 | Codex | NOT_RUN | `` |
| `EXP-D5-3-1` | P1 | CodeArtsAgent | NOT_RUN | `` |
| `EXP-D5-3-3` | P1 | CodeArtsAgent | NOT_RUN | `` |
| `EXP-D5-4-1` | P1 | CodeArtsWork | NOT_RUN | `` |
| `EXP-D5-4-3` | P1 | CodeArtsWork | NOT_RUN | `` |
| `EXP-D5-5-1` | P1 | WorkBuddy | NOT_RUN | `` |
| `EXP-D5-5-3` | P1 | WorkBuddy | NOT_RUN | `` |
| `EXP-D5-6-1` | P1 | DSH | NOT_RUN | `` |
| `EXP-D5-6-3` | P1 | DSH | NOT_RUN | `` |
| `EXP-D5-7-1` | P1 | OfficeAce | NOT_RUN | `` |
| `EXP-D5-7-3` | P1 | OfficeAce | NOT_RUN | `` |
| `EXP-D5-8-1` | P1 | Hermes | PASS | `evidence/cli-stdout.txt` |
| `EXP-D5-8-3` | P1 | Hermes | PASS | `evidence/protocol-stdout.txt` |
| `EXP-D5-9-1` | P1 | OpenClaw | NOT_RUN | `` |
| `EXP-D5-9-3` | P1 | OpenClaw | NOT_RUN | `` |
| `EXP-D5-10-1` | P1 | AtomCode | NOT_RUN | `` |
| `EXP-D5-10-3` | P1 | AtomCode | NOT_RUN | `` |
| `EXP-C4-01` | P1 | ECS | PASS | `evidence/EXP-C4-01/stdout.txt` |
| `EXP-C4-02` | P1 | VPC | PASS | `evidence/EXP-C4-02/stdout.txt` |
| `EXP-C4-03` | P1 | OBS | PASS | `evidence/EXP-C4-03/stdout.txt` |
| `EXP-C4-04` | P1 | RDS | PASS | `evidence/EXP-C4-04/stdout.txt` |
| `EXP-C4-05` | P1 | GaussDB | PASS | `evidence/EXP-C4-05/stdout.txt` |
| `EXP-C4-06` | P1 | CCE | PASS | `evidence/EXP-C4-06/stdout.txt` |
| `EXP-C4-07` | P1 | FunctionGraph | PASS | `evidence/EXP-C4-07/stdout.txt` |
| `EXP-C4-08` | P1 | IAM | PASS | `evidence/EXP-C4-08/stdout.txt` |
| `EXP-C4-09` | P1 | CTS | PASS | `evidence/EXP-C4-09/stdout.txt` |
| `EXP-C4-10` | P1 | CES | PASS | `evidence/EXP-C4-10/stdout.txt` |
| `EXP-C4-11` | P1 | DDS | PASS | `evidence/EXP-C4-11/stdout.txt` |
| `EXP-C4-12` | P1 | DCS | PASS | `evidence/EXP-C4-12/stdout.txt` |
| `EXP-C4-13` | P1 | SMN | PASS | `evidence/EXP-C4-13/stdout.txt` |
| `EXP-C4-14` | P1 | DMS | PASS | `evidence/EXP-C4-14/stdout.txt` |
| `EXP-C4-15` | P1 | WAF | PASS | `evidence/EXP-C4-15/stdout.txt` |
| `EXP-C4-16` | P1 | CDN | PASS | `evidence/EXP-C4-16/stdout.txt` |
| `EXP-C4-17` | P1 | ModelArts | PASS | `evidence/EXP-C4-17/stdout.txt` |
| `EXP-C4-18` | P1 | DEW | PASS | `evidence/EXP-C4-18/stdout.txt` |
| `EXP-C4-19` | P1 | CBR | PASS | `evidence/EXP-C4-19/stdout.txt` |
| `EXP-C4-20` | P1 | EVS | PASS | `evidence/EXP-C4-20/stdout.txt` |
| `EXP-C4-21` | P1 | EIP | PASS | `evidence/EXP-C4-21/stdout.txt` |
| `EXP-C4-22` | P1 | ELB | PASS | `evidence/EXP-C4-22/stdout.txt` |
| `EXP-E01` | P1 | 帮我查一下我账号在华北北京四有哪些云主机 | FAIL | `evidence/EXP-E01/stdout.txt` |
| `EXP-E02` | P1 | 创建一台 2C4G 的 Ubuntu 云服务器, 规格通用型 | FAIL | `evidence/EXP-E02/stdout.txt` |
| `EXP-E03` | P1 | 把本地 dist 目录部署成一个公网静态网站 | FAIL | `evidence/EXP-E03/stdout.txt` |
| `EXP-E04` | P1 | 给这台服务器绑定一个弹性公网IP | FAIL | `evidence/EXP-E04/stdout.txt` |
| `EXP-E05` | P1 | 看一下我的云数据库MySQL实例的状态 | FAIL | `evidence/EXP-E05/stdout.txt` |
| `EXP-E06` | P1 | 创建一个 Redis 缓存实例用于会话存储 | PASS | `evidence/EXP-E06/stdout.txt` |
| `EXP-E07` | P1 | 给生产环境的服务器配置一个每日备份策略 | FAIL | `evidence/EXP-E07/stdout.txt` |
| `EXP-E08` | P1 | 我的ECS启动失败了, 帮我分析原因 | FAIL | `evidence/EXP-E08/stdout.txt` |
| `EXP-E09` | P1 | 开设一个 Kubernetes 集群用于微服务部署 | PASS | `evidence/EXP-E09/stdout.txt` |
| `EXP-E10` | P1 | 部署一个函数处理图片自动压缩 | FAIL | `evidence/EXP-E10/stdout.txt` |
| `EXP-E11` | P1 | 查一下我账号这个月的费用情况 | FAIL | `evidence/EXP-E11/stdout.txt` |
| `EXP-E12` | P1 | 把应用日志指标推送到云监控告警 | FAIL | `evidence/EXP-E12/stdout.txt` |
| `EXP-E13` | P1 | 申请HTTPS证书并配置到我的域名 | FAIL | `evidence/EXP-E13/stdout.txt` |
| `EXP-E14` | P1 | 我账号下的用户都有哪些权限, 帮我审计一下 | FAIL | `evidence/EXP-E14/stdout.txt` |
| `EXP-E15` | P1 | 帮我领一下华为云的代金券 | PASS | `evidence/EXP-E15/stdout.txt` |
| `EXP-NR3-01` | P1 | Windows-stdio-COMMON | PASS | `evidence/D1-27/stdout.txt` |
| `EXP-NR3-02` | P1 | Linux-OS_MATRIX | PASS | `evidence/EXP-NR3-02/stdout.txt` |
| `EXP-NR3-03` | P1 | Windows-真实安装布局-CROSS_PROCESS | NOT_RUN | `` |
| `EXP-NR3-04` | P1 | Linux-OS_MATRIX | PASS | `evidence/EXP-NR3-04/stdout.txt` |
| `EXP-NR3-09` | P0 | Windows-stdio+真实存量-OS_MATRIX | BLOCKED | `` |
| `EXP-NR3-10` | P0 | Linux-OS_MATRIX | PASS | `evidence/EXP-NR3-10/stdout.txt` |
| `EXP-NR3-11` | P0 | macOS/ARM-OS_MATRIX | BLOCKED | `` |
| `EXP-NR3-23` | P1 | Windows-stdio-预热竞态-CLIENT_MATRIX | PASS | `evidence/D1-45/stdout.txt` |
| `EXP-NR3-24` | P1 | Linux-OS_MATRIX | PASS | `evidence/EXP-NR3-24/stdout.txt` |
| `EXP-D1-58-01` | P1 | Linux L(隔离HOME) | PASS | `evidence/d158-stdout.txt` |
| `EXP-D1-58-02` | P1 | Linux L(隔离HOME) | PASS | `evidence/d158-stdout.txt` |
| `EXP-D1-58-03` | P1 | Linux L(隔离HOME) | PASS | `evidence/d158-stdout.txt` |
| `EXP-D1-58-04` | P1 | Linux L(隔离HOME) | PASS | `evidence/d158-stdout.txt` |
| `EXP-D1-58-05` | P1 | Linux L(隔离HOME) | PASS | `evidence/d158-stdout.txt` |

> 逐用例结果与实际 CSV「执行状态」+「evidencePath」列完全一致（同一来源生成）。

---

## 五、缺陷清单（详尽）

| # | 级别 | 用例ID | 缺陷描述 | 期望（精确断言） | 实际 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整 | `env \| grep HW_ACCESS_KEY` → `deny` | `allow` | `safety-policy.mjs:335-336` | 待提单 |
| 2 | P0 | `D4-16` | 命令包裹穿透写拦截 | `bash -c 'hcloud ... DeleteServers'` → `deny` | `allow` | `safety-policy.mjs:345` | 待提单 |
| 3 | P0 | `D4-23` | 全局规则未注入安装目标 | install 后 11 目标含 `huawei-agent-rules` | 全部缺失 | `setup-cli.mjs`（未复制 `rules/`） | 待提单 |
| 4 | P0 | `D2-4` | 脱敏缺小写 ak=/sk= | `redact('ak=AK.. sk=SK..')` → `<redacted>` | 原文不脱敏 | `safety-policy.mjs:45` | 待提单 |
| 5 | P1 | `D4-8` | Python/Node 钩子策略不一致 | Py 对 DeleteServers → `deny` | Py 放行 | `huaweicloud-safety.py:46,185` | 待提单 |
| 6 | P1 | `D9-2` | JSON-RPC 错误码漂移 | 未知方法 → `-32601` | `-32603` | `mcp-server.mjs:169` | 待提单 |
| 7 | P1 | `D10-3`+EXP-E* | 中文意图路由未命中 | 中文意图命中服务 | 12/15 miss | `tools.mjs:1741-1802` | 待提单 |
| 8 | P1 | `D4-17` | hook 畸形输入 fail-open | 畸形输入 → 拒绝 | 放行 | `huaweicloud-safety.mjs:45-48` | 待提单 |
| 9 | P2 | `D2-11` | R2 冲突门先于 R3 检查 | R3 立即拒绝 STS | 先返回 needs_confirmation | `tools.mjs:1176-1198` | 待提单 |

### 根因详情（关键 P0）

```markdown
**#1 [P0] D4-2 凭证 env 打印拦截不完整**
- 期望：env/printenv 打印 HW_* 凭证环境变量 → deny
- 实际：return allow
- 根因：safety-policy.mjs:335-336
  if (/(^|\s)(env|printenv|...)/i.test(text) && /HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text))  // ← 缺 HW_ 前缀
- 证据：evidence/D4-2/stdout.txt（env | grep HW_ACCESS_KEY 实测 allow）

**#2 [P0] D4-16 命令包裹穿透**
- 根因：safety-policy.mjs:345  /(^|\s)hcloud(\.exe)?\s+/i 仅匹配行首/空白前
- 绕过向量：bash -c '...' / $(...) / 反引号 / && 链接
- 证据：evidence/D4-16/stdout.txt

**#3 [P0] D4-23 全局规则孤岛**
- rules/huawei-agent-rules.mdc（3.8KB，MUST 级）存在但零引用
- setup-cli.mjs 安装函数（skills/commands/src/safety/hooks 复制清单）未含 rules/
- 证据：evidence/cli-stdout.txt（隔离 install 后 find 无 huawei-agent-rules）
```

---

## 六、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| `D3-B3`/`D3-C4`/`D4-13`/`D4-14` | 真云凭证无效（`APIGW.0301 Unauthorized`，session 级无有效 SK） | 有效 AKSK + 项目配额 | 配置真云凭证后复测 |
| `D1-6` | `/tmp/huaweicloud-cli-linux-arm64.tar.gz` 预置 root 文件 Permission denied | 干净 /tmp | 清理残留后复测 |
| `D1-39`/`EXP-NR3-09` | Windows 专属（`.cmd`/EINVAL 语义） | Windows 机器 | 补 Windows 终端 |
| `EXP-NR3-11` | macOS/ARM 专属 | macOS/ARM 机器 | 补 macOS 终端 |

---

## 七、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无原始 AK/SK，脱敏复核通过）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`（真云未实际创建资源）
- [x] 脱敏复核：`credentials.json` 未落入证据（仅审计字段名，值已脱敏）

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/沙箱/OBS 等真云资源 | 否（凭证无效未创建） | N/A | 残留 0 |
| 隔离 HOME（/tmp/hdk-cli.*、/tmp/hdk-d158.*） | 是（测试用） | 已 trap 自动删除 | 残留 0 |

> 真云只删本次创建资源；本轮凭证无效，未创建任何真云资源，无残留风险。

---

## 九、遗留与建议

- 待裁决 SPEC：`D9-2`（错误码 -32603 vs -32601，建议统一为 -32601 Method not found）。
- 本轮未覆盖：真云 E2E（D3-C4 建删、D4-14 审计，凭证无效）；多轮交互（D10-5）；Windows/macOS 终端矩阵。
- 观察项（非阻塞）：`#9` R2 冲突门先于 R3，建议 persist 时对 STS 凭证短路直接 reject（避免误导确认菜单）。
- 建议：serviceCatalog 增加中文关键词→服务映射，覆盖 D10-3/EXP-E 的 12 条 miss，提升中文场景路由准确率。
