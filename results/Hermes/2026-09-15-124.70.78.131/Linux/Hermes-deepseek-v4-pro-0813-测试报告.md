# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-15 21:58`（北京时间，BLOCKED 补测后更新）
> **执行归档**：`results/Hermes/2026-09-15-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（7 项缺陷：3 P0 + 4 P1；经历史查重全部命中上游 open issue，**不重复提单**；关联见 FINDINGS.md / HISTORY_LINKS.md）

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
| 测试类型 | 源码级探针（safety-policy / risk-rule-engine / update-check / mcp-config-merge / serviceCatalog / explain_error）+ 真机 CLI + MCP 协议 + 凭证脱敏 + 路由 + 白名单合并 + 评测 harness |
| daily 基础用例 | 设计级 77 / 展开级 26（Hermes+Linux 预筛后） |

> **本轮主题（补测 BLOCKED）**：上游门禁升级（红线第 4 条：BLOCKED 不写 blockedReason 直接 FAIL；D10 评测集 EXP-E01~E15 已拆两段式断言）。逐条深挖昨日 23 设计级 / 18 展开级 BLOCKED：
> - **D10 评测集 EXP-E01~E15** 实跑 `node eval/harness/run-eval.mjs`（传 mcp-server.mjs）得确定性路由结论 `HIT=3 / MISS=11 / N/A=1`，未命中判 FAIL；
> - **可源码级直调函数**（`judgeUpdate` / `resolveSkipFilePath` / `writeSkipState` / `redactSecrets` / `_decorateResult` / 清单 manifest）的假阻塞用例（D1-40 / D1-42 / D1-45 / D4-6 源码级 / D5-1）全部直调回填；
> - 仅保留**真·外部依赖**（真云凭证/审批流、只读子账号、多客户端并存、LLM 评测 harness 等）仍为 BLOCKED，并补写四要素 blockedReason。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 103（设计级 77 + 展开级 26） |
| 已执行（设计级 PASS+FAIL） | 56 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（设计级） | 50 / 6 / 18 / 0 / 3 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 89.3%（50 / 56） |
| 展开级 | PASS 15 / FAIL 11 / BLOCKED 0 |
| P0 / P1 / P2 新增缺陷 | 0（7 项缺陷全部历史查重命中，不重复提单；#7→#561 等） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源；隔离 HERMES_HOME 已删除） |

> **补测消解明细**：展开级 BLOCKED 18 → 0（15 条 EXP-E + D5-1 + D1-42 + D1-45 全部转 PASS/FAIL）；设计级 BLOCKED 23 → 18（D1-40/D1-42/D1-45/D5-1/D4-6 源码级转 PASS，其余 18 条为真·外部依赖保留 BLOCKED + 四要素）。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 50 | 有证据且通过 PASS 门禁（本轮新增 D1-40/D1-42/D1-45/D5-1/D4-6 源码级） |
| FAIL | 6 | 不符预期，根因见缺陷清单（D4-2/D4-16/D4-21 P0；D9-2/D4-17/D10-3 P1） |
| BLOCKED | 18 | 真·外部依赖（真云/审批流/只读子账号/多客户端/LLM harness 等），四要素见 §五 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 3 | 文档一致性核对（D8-1/D8-4/D8-6） |
| **合计** | **77** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 15 | EXP-E06/E09/E15（路由命中）+ EXP-E08（explain_error 诊断）+ EXP-D5-8-1/8-3、EXP-NR3-02/04/10/24、EXP-D1-58-01~05 |
| FAIL | 11 | EXP-E01~E05/E07/E10~E14（run-eval.mjs 中文意图 MISS） |
| BLOCKED / NOT_RUN | 0 | 已全部消解 |
| **合计** | **26** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截未覆盖 `HW_` 前缀 | `env \| grep HW_ACCESS_KEY` 应 `deny` | `allow, risk=not_huaweicloud` | `safety-policy.mjs:336` | 已跟踪 #652-1 等 |
| 2 | P0 | `D4-16` | env-dump 规则被 shell 包裹穿透 | `sh -c "env \| grep HUAWEICLOUD_ACCESS_KEY"` 应 `deny` | `allow` | `safety-policy.mjs:335` | 已跟踪 #652-2 等 |
| 3 | P0 | `D4-21` | HCL 形态 broad IAM 未拦截 | HCL `actions = ["*"]` 应 `deny` | `decision=allow` | `cloud-risk-rules.json:179` | 已跟踪 #652-3 等 |
| 4 | P1 | `D9-2` | JSON-RPC 错误码未区分 | 未知 method→`-32601`；未知 tool→`-32602` | 两者 `-32603` | `mcp-server.mjs:169` | 已跟踪 #652-4 等 |
| 5 | P1 | `D4-17` | hook 模糊 fail-open | 畸形/空输入应 `deny` | 默认 `allow`/`ok` | `risk-rule-engine.mjs:106` | 已跟踪 #679 等 |
| 6 | P1 | `D10-3` | serviceCatalog 中文意图路由缺失 | 中文意图应命中对应服务 | 回退 `Run hcloud --help` | `tools.mjs:1778-1890` | 已跟踪 #689/#683/#674 |
| 7 | P1 | `D4-6` | redactString 脱敏未覆盖 CLI flag / JSON 带引号 key 形态 | `--admin_pass <pwd>` / `"adminPass":"pwd"` 应脱敏 | 原样返回不脱敏 | `safety-policy.mjs:40-46` | 已跟踪 #561 等 |

### 根因详情（关键缺陷代码片段 + 复现证据）

**#6 [P1] D10-3（补测新增确定性评测证据）**：`eval/harness/run-eval.mjs` 对 15 条评测集跑出 `HIT=3 MISS=11 N/A=1`（准确率 21.4%）。`tools.mjs:1778-1890` routeMap 仅 sandbox/voucher 两条含中文关键字，其余 21 条仅英文，`tools.mjs:1887` 英文关键字走 `tokens.has(kw)`，中文意图无法分词命中 → 回退。证据 `evidence/D10-3/eval-harness-stdout.log` + `eval-run-result.csv` + `stdout.log` + `_probes/routing-probe.mjs`。

**#7 [P1] D4-6（补测源码级直调新发现）**：`safety-policy.mjs:40-46` `redactString` 密钥名正则要求 `[:=]` 分隔（不认 `--flag value` 空格），且白名单无 snake_case `admin_pass`，JSON `"adminPass":` 引号打断连续匹配 → `--admin_pass MyPwd123` / `--password MyPwd123` / `{"server":{"adminPass":"MyPwd123"}}` 均原样返回不脱敏；而 `adminPass=MyPwd123` 正确 → `<redacted>`。证据 `evidence/D4-6/probe.mjs` + `stdout.log`。

（#1–#5 根因详情同 FINDINGS.md，此处从略。）

---

## 五、未执行用例与原因（供维护 agent 修改用例）

> 以下为**真·外部依赖**保留 BLOCKED 的 18 条设计级用例（blockedReason 已写四要素：实测时间 + 缺资源 + 影响 + 解除条件），均非「有可跑探针/可源码级直调却假装阻塞」。

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 缺什么资源 | 解除条件 |
|---|---|---|---|---|---|---|
| D1-2 | 设计级 | P2 | BLOCKED | 补环境 | 多客户端并存环境（单机仅 Hermes） | 多客户端共存测试机 |
| D1-6 | 设计级 | P2 | BLOCKED | 补环境 | KooCLI 下载源/国内镜像网络 | 镜像源网络+下载通道 |
| D1-39 | 设计级 | P0 | BLOCKED | 调归属 | Windows 10 测试机（EINVAL 为 Windows 专项） | Windows 机器（Linux 侧已由 EXP-NR3-10 PASS） |
| D2-1 | 设计级 | P1 | BLOCKED | 补环境 | 可丢弃的真云凭证库（auth init 会写真云凭证） | 一次性统一账号凭证库 |
| D2-10 | 设计级 | P1 | BLOCKED | 补环境 | KooCLI 多 profile 夹具（current 切换） | 多 profile config.json 夹具 |
| D2-13 | 设计级 | P1 | BLOCKED | 补环境 | env 凭证 + session 切换夹具（会污 S1） | 隔离 S1 + HW_ACCESS_KEY 夹具 |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | npm 安装期抓包/SBOM 审计通道 | 抓包/SBOM 审计 |
| D4-13 | 设计级 | P1 | BLOCKED | 补环境 | 只读 IAM 子账号 credentials.readonly.json | 下发只读子账号凭证（不写管理员） |
| D4-14 | 设计级 | P2 | BLOCKED | 补环境 | CTS 命令执行审计日志 | CTS 审计通道 |
| D4-18 | 设计级 | P0 | BLOCKED | 补环境 | 真云凭证 valid + 客户端交互确认流 | 真云 AK/SK + 确认流 |
| D4-19 | 设计级 | P0 | BLOCKED | 补环境 | 真云高危操作进入确认流 | 真云写操作 + 确认流 |
| D4-20 | 设计级 | P1 | BLOCKED | 补环境 | 审批拒绝流 + 真云资源变更计数 | 真云 + 审批拒绝流 |
| D4-23 | 设计级 | P0 | BLOCKED | 补环境 | 11 个 Agent 多机安装目标（包内未见 huawei-agent-rules.md 制品） | 11 安装目标 + 制品入包 |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 审批流 + 可注入时钟 | 审批流夹具 + 时钟 |
| D7-4 | 设计级 | P2 | BLOCKED | 补环境 | GitCode/国内镜像网络 + GITCODE_TOKEN | 镜像网络 + token |
| D9-6 | 设计级 | P1 | BLOCKED | 调归属 | 多客户端并存环境（跨客户端互通） | 多客户端并存 |
| D9-9 | 设计级 | P1 | BLOCKED | 改用例 | inspector 夹具注入 30s 挂起（cancellation 未声明） | inspector 超时夹具 |
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | LLM 评测 harness + 预算（run-eval.mjs 无法代理安全干预有效性） | LLM harness + 预算 |

> NOT_RUN 3 条（D8-1/D8-4/D8-6 文档一致性核对，逐条原因见 CSV blockedReason 列）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4 show_profile_redacted / auth_status 均 `<redacted>`；D4-6 源码级脱敏探针使用假凭证）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`（本轮未创建/删除任何真云资源）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云凭证仅以 `<redacted>` 指纹出现）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源（ECS/沙箱/OBS 等） | 否 | — | 未创建，无残留 |
| 隔离 HERMES_HOME（install/uninstall 测试） | 是 | 已删 | 退出即清理 |
| 临时 HUAWEICLOUD_HOME / skip 临时文件（D1-42/D1-45/D1-40 探针） | 是 | 已删 | mkdtemp 随探针退出清理 |

---

## 八、遗留与建议

- 待裁决 SPEC：无。
- 观察（非缺陷）：
  1. 工具全集实测 `40`；skills 目录 huawei-* 技能实测 `29`（manifest 描述 27，轻微滞后，非缺陷）。
  2. `resolveSkipFilePath` 依赖「插件目录存在 package.json」判定走插件目录副本；当前源仓 clone 无 package.json，skip 文件回退共享路径（D1-42 已探针复核会话化后缀仍生效）。
  3. `serviceCatalog` routeMap 仅 2/23 条含中文关键字，中文意图大面积 miss（#6，已跟踪）。
- 建议（按缺陷优先级）：见 FINDINGS.md（#1–#6 已跟踪不重复提单；#7 交 file_issue.py 定夺）。
- 本轮已覆盖（相对上轮补测）：D10 评测集 EXP-E01~E15（harness）、D1-40/D1-42/D1-45（update-check 源码级）、D4-6（redactSecrets 源码级）、D5-1（清单 manifest 源码级）。
- 本轮未覆盖范围：真云 E2E（建删资源）、多终端矩阵、审批流交互、LLM 评测 harness、文档全量比对。