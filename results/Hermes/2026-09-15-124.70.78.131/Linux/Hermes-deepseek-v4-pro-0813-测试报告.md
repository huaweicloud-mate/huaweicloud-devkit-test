# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-15 19:30`（北京时间）
> **执行归档**：`results/Hermes/2026-09-15-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（复现 6 项缺陷：3 P0 + 3 P1；全部经历史查重命中上游 open issue，不重复提单，关联见 HISTORY_LINKS.md）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic，ECS） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4`（npm latest 正式版，gitHead `9b67256e`，release PR `#669`） |
| 工具全集 | `40`（`tools/list` 实测） |
| hcloud / 依赖 | 已配置（doctor 确认；hcloud 已安装） |
| 真云凭证 | cn-north-4（AKSK 已配置；本轮**未创建/删除任何真云资源**，仅只读脱敏查询） |
| 测试类型 | 源码级探针（safety-policy / risk-rule-engine / update-check / mcp-config-merge / serviceCatalog）+ 真机 CLI（install/doctor/status/update/uninstall）+ MCP 协议 + 凭证脱敏 + 路由 + 白名单合并 |
| daily 基础用例 | 设计级 77 / 展开级 26（Hermes+Linux 预筛后） |

> **执行方法**：探针脚本（.mjs/.sh）直调安装包 `plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；CLI 安装/卸载在**同时隔离 HOME 与 HERMES_HOME** 的临时目录完成，未污染真实 agent home。本轮为**强制完整重跑**（测试仓库用例刚做较大改动）：全部 12 个主探针重新运行 + 新增 routing / merge / updatecheck / disttags 4 个源码级探针，证据全部重新落盘。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 103（设计级 77 + 展开级 26） |
| 已执行（设计级 PASS+FAIL） | 51 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（设计级） | 45 / 6 / 23 / 0 / 3 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 88.2%（45 / 51） |
| 展开级 | PASS 8 / BLOCKED 18 |
| P0 / P1 / P2 新增缺陷 | 0（6 项缺陷全部历史查重命中，不重复提单） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源；隔离 HERMES_HOME 已删除） |

> **本轮较上一轮（13:14）扩展的源码级覆盖**：D1-28（detect 新版本）、D1-31（dismiss 冷却期）、D1-33（skip 文件持久化/多路径）、D1-58（MCP 白名单 merge 语义）、D10-3（serviceCatalog 中/英路由）、EXP-NR3-10（Linux 升级检测链负面验证）——前四项此前标 BLOCKED，本轮经源码级直调转 PASS/FAIL，弥合红线 4「可源码级直调函数不得标 BLOCKED」。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 45 | 有证据且通过 PASS 门禁 |
| FAIL | 6 | 不符预期，根因见缺陷清单（D4-2/D4-16/D4-21 P0；D9-2/D4-17/D10-3 P1） |
| BLOCKED | 23 | 环境阻塞，见 §五 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 3 | 文档一致性核对（D8-1/D8-4/D8-6） |
| **合计** | **77** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 8 | EXP-D5-8-3、EXP-NR3-02、EXP-NR3-10、EXP-D1-58-01~05 |
| BLOCKED | 18 | EXP-E01~E15 评测 harness(15)、EXP-D5-8-1 多客户端、EXP-NR3-04/24 |
| SPEC-MISMATCH / NOT_RUN | 0 | — |
| **合计** | **26** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 六项缺陷均真实执行后确认；全部经历史查重命中上游 open issue，不重复提单。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截未覆盖 `HW_` 前缀 | `env \| grep HW_ACCESS_KEY` 应 `deny` | `allow, risk=not_huaweicloud` | `safety-policy.mjs:336` | 已跟踪 #652-1 等 |
| 2 | P0 | `D4-16` | env-dump 规则被 shell 包裹穿透 | `sh -c "env \| grep HUAWEICLOUD_ACCESS_KEY"` 应 `deny` | `allow` | `safety-policy.mjs:335` | 已跟踪 #652-2 等 |
| 3 | P0 | `D4-21` | HCL 形态 broad IAM 未拦截 | HCL `actions = ["*"]` 应 `deny` | `decision=allow` | `cloud-risk-rules.json:179` | 已跟踪 #652-3 等 |
| 4 | P1 | `D9-2` | JSON-RPC 错误码未区分 | 未知 method→`-32601`；未知 tool→`-32602` | 两者 `-32603` | `mcp-server.mjs:169` | 已跟踪 #652-4 等 |
| 5 | P1 | `D4-17` | hook 模糊 fail-open | 畸形/空输入应 `deny` | 默认 `allow`/`ok` | `risk-rule-engine.mjs:106` | 已跟踪 #679 等 |
| 6 | P1 | `D10-3` | serviceCatalog 中文意图路由缺失 | 中文意图应命中对应服务 | 回退 `Run hcloud --help` | `tools.mjs:1786-1883` | 已跟踪 #689/#683/#674 |

### 根因详情（P0/P1 缺陷代码片段 + 复现证据）

**#1 [P0] D4-2**：env-dump 正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀。证据 `evidence/D4-2/stdout.log`。

**#2 [P0] D4-16**：env-dump 词边界 `(^|\s)(env|printenv…)` 匹配原始文本，`sh -c "…"` 包裹内层 `env` 前为引号漏命中。证据 `evidence/D4-16/stdout.log`（含 wrap-probe）。

**#3 [P0] D4-21**：`hwc-iam-admin-policy` 规则仅覆盖 JSON 形态，HCL `actions = ["*"]` / `AdministratorFullAccess` 后缀未覆盖。证据 `evidence/D4-21/stdout.log`（含 hcl-probe）。

**#4 [P1] D9-2**：`mcp-server.mjs:169` catch 硬编码 `-32603`。证据 `evidence/D9-2/stdout.log`。

**#5 [P1] D4-17**：`risk-rule-engine.mjs:106` `evaluate()` 无规则命中（含畸形/空输入）默认 `allow`，缺 fail-closed 兜底。证据 `evidence/D4-17/stdout.log`。

**#6 [P1] D10-3**：`tools.mjs:1778-1883` `serviceCatalog` routeMap 仅 sandbox（网站/网页/静态）与 voucher（领券/代金券/优惠券/激励金/领取）含中文关键字，其余 21 条仅英文；匹配逻辑 `tools.mjs:1887` 对英文走 `tokens.has(kw)`，中文意图无法命中。证据 `evidence/D10-3/stdout.log`（英文意图 ECS/OBS/IAM 正确命中，中文「创建云服务器/对象存储桶/权限管理」均回退）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-2 | 设计级 | P2 | BLOCKED | 补环境 | 多 Agent 探测需多客户端并存（单机仅 Hermes） | — |
| D1-6 | 设计级 | P2 | BLOCKED | 补环境 | install-hcloud 需 KooCLI 下载源/镜像网络引导 | — |
| D1-39 | 设计级 | P0 | BLOCKED | 调归属 | Windows 升级检测链 EINVAL 专项；Linux 由 NR3-10 负面验证（已探针 PASS） | 归属调整：Windows 专项 |
| D1-40 | 设计级 | P0 | BLOCKED | 调归属 | 镜像 lag 检测需镜像源环境 | 归属调整：Windows/镜像环境 |
| D1-42 | 设计级 | P1 | BLOCKED | 补环境 | dismiss 真实闭环需真实 agent 插件目录写入 + 进程重启持久化 | — |
| D1-45 | 设计级 | P1 | BLOCKED | 补环境 | 兜底提示预热竞态需会话预热时序 fixture | — |
| D2-1 | 设计级 | P1 | BLOCKED | 补环境 | auth init 三端同步会写真云凭证，避免污染统一账号 | — |
| D2-10 | 设计级 | P1 | BLOCKED | 补环境 | R7 current 档跟随需多 profile 夹具 | — |
| D2-13 | 设计级 | P1 | BLOCKED | 补环境 | R9 configuredBySession 优先 env 需 session 切换夹具 | — |
| D4-6 | 设计级 | P1 | BLOCKED | 改用例 | adminPass 回显警告完整 E2E 需真云创建 ECS；源码级脱敏已核验 | 拆分脱敏为源码级 + 警告为真云 E2E |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | 供应链安装期安全需 npm 抓包/SBOM 审计 | — |
| D4-13 | 设计级 | P1 | BLOCKED | 补环境 | 最小权限凭证通过率需只读 IAM 子账号（credentials.readonly.json 缺失） | — |
| D4-14 | 设计级 | P2 | BLOCKED | 补环境 | 操作可审计性需 CTS 审计日志 | — |
| D4-18 | 设计级 | P0 | BLOCKED | 补环境 | confirm-not-deny 审批语义需真云 + 标准客户端交互确认流 | — |
| D4-19 | 设计级 | P0 | BLOCKED | 补环境 | 确认流下预检需真云高危操作进入确认流 | — |
| D4-20 | 设计级 | P1 | BLOCKED | 补环境 | 拒绝后零操作需审批拒绝流 + 真云资源变更计数 | — |
| D4-23 | 设计级 | P0 | BLOCKED | 补环境 | 全局规则注入需 11 个 Agent 多机；且包内未见 huawei-agent-rules.md 制品（grep 无命中） | 建议先确认制品是否应作为产物随包发布 |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 确认令牌过期/重复确认边界需审批流 + 可注入时钟 | — |
| D5-1 | 设计级 | P1 | BLOCKED | 调归属 | 清单发现加载需全部客户端可发现（CLIENT_MATRIX） | 归属调整：多客户端矩阵 |
| D7-4 | 设计级 | P2 | BLOCKED | 补环境 | 国内镜像源安装需 GitCode/国内镜像网络 + GITCODE_TOKEN | — |
| D9-6 | 设计级 | P1 | BLOCKED | 调归属 | 跨客户端互通需多客户端并存 | 归属调整：多客户端矩阵 |
| D9-9 | 设计级 | P1 | BLOCKED | 改用例 | tools/call 超时协议语义需 inspector 夹具注入 30s 挂起；capabilities.cancellation 实测未声明 | 前置标注 inspector 夹具依赖 |
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | 安全干预有效性需 LLM 评测 harness + 预算 | — |
| D8-1 | 设计级 | P2 | NOT_RUN | 改用例 | 文档与能力一致需白盒 docs 全量比对 | 明确可机械执行的链接/命令清单 |
| D8-4 | 设计级 | P1 | NOT_RUN | 改用例 | 引导步骤可机械执行需逐条核验 getting-started 步骤 | 拆分可自动化核验断言 |
| D8-6 | 设计级 | P2 | NOT_RUN | 改用例 | 中英文文档一致需中英双源逐段比对 | 明确差异检查表 |

> 展开级 18 条 BLOCKED 镜像上表源设计用例：EXP-D5-8-1（源 D5-1 多客户端）、EXP-E01~E15（源 D10-3 评测集需 LLM harness，源码级 serviceCatalog 已探针见 D10-3 FAIL）、EXP-NR3-04（源 D1-42）、EXP-NR3-24（源 D1-45），不再逐条展开。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4 show_profile_redacted / auth_status 均 `<redacted>`，无 AK/SK/securityToken 明文泄露）
- [x] 写操作误判 read-only：`0`（D4-5 删除类写操作均判 deny/write；只读 ListServers 判 allow/read_only）
- [x] 红线（I 类）违规：`无`（本轮未创建/删除任何真云资源）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云凭证仅以 `<redacted>` 指纹出现；D2-11/D2-16 用假凭证 + mkdtemp 隔离）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源（ECS/沙箱/OBS 等） | 否 | — | 未创建，无残留 |
| 隔离 HERMES_HOME（install/uninstall 测试） | 是 | 已删 | iso-home-20260915-rerun 目录随探针退出清理 |
| 临时 HUAWEICLOUD_HOME / skip 临时文件（D2/D1-31/33） | 是 | 已删 | mkdtemp 临时目录随探针退出清理 |

> 真云只删本次创建资源；本轮未创建任何真云资源。

---

## 八、遗留与建议

- 待裁决 SPEC：无。
- 观察（非缺陷）：
  1. 工具全集实测 `40`；设计真源 D5-3「预期结果」已更新为 `40 工具`，与实测一致。
  2. `resolveSkipFilePath`（update-check.mjs）依赖「插件目录存在 package.json」判定走插件目录副本；当前 npm 包 `plugins/huaweicloud-core/` 仅 `openclaw.plugin.json`（无 package.json），故 skip 文件始终回退到共享路径 `~/.config/huaweicloud/devkit-skip.json`（D1-33 已探针复核，会话化后缀仍生效，非缺陷，仅记录）。
  3. `capabilities.cancellation` 实测未声明（D9-9）；`tools/list` 各 inputSchema 未标注 `$schema` 草案（D9-8）。
  4. `serviceCatalog` routeMap 仅 2/23 条含中文关键字，中文意图大面积 miss（已跟踪 #689/#683/#674）。
- 建议（按缺陷优先级）：见 FINDINGS.md（6 项均已跟踪，无新增提单）。
- 本轮未覆盖范围：真云 E2E（建删资源）、多终端矩阵、审批流交互、LLM 评测 harness、文档全量比对。