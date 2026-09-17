# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-18 05:50`（北京时间）
> **执行归档**：`results/Hermes/2026-09-18-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（8 项产品缺陷，全部经历史查重命中上游 open issue，**不重复提单**；其中新增用例 D4-27 的「裸 token 未脱敏」已由上游 #726 覆盖）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic，ECS，IP 124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.11 |
| 被测版本（SUT） | `v1.1.5`（npm latest 正式版，gitHead `e7ed6f66`） |
| 工具全集 | `40`（`tools/list` 实测，协议探针校核 schema 无残缺） |
| KooCLI / 依赖 | KooCLI 7.2.12（check_cli / doctor 确认） |
| 真云凭证 | cn-north-4（AKSK 已配置；本轮真机建删 VPC/安全组并归零验证） |
| 测试类型 | 源码级探针 + 真机 CLI（install/doctor/status/uninstall）+ MCP 协议 + 真云 E2E（建删资源/审计/审批/只读子账号）+ D10 评测 harness |
| daily 基础用例 | 设计级 80 / 展开级 48（Hermes+Linux 预筛后） |

> **本轮要求**：强制完整重跑（不得以「今天已跑过」为由跳过）。相对 2026-09-17：SUT 未变（v1.1.5），全部探针/真云/harness 重新执行并落盘新鲜证据；本日 daily 精选集新增 D2-26（凭证备份/恢复）与 D4-27（redactSecrets/redactOutput 双路径脱敏）两条用例；关键差异为 D4-13 只读子账号从「5/6（IMS 被判被拒）」修正为 **6/6 全部可用**（探针缺陷修正，见 §四备注）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 128（设计级 80 + 展开级 48） |
| 设计级 PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 58 / 7 / 11 / 0 / 4 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 89.2%（58 / 65） |
| 展开级 PASS / FAIL / BLOCKED / NOT_RUN | 37 / 11 / 0 / 0 |
| P0 / P1 / P2 新增缺陷 | 0（8 项产品缺陷全部历史查重命中，不重复提单；D4-27 裸 token 已由上游 #726 覆盖） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本轮 Hermes 建删资源（VPC + 安全组）全部归零 |

> **v1.1.5 复测结论（与 09-17 一致）**：
> - 已修复有效：`printenv HW_SECRET_KEY`→deny；`sh -c "hcloud ecs DeleteServer --force"`→deny；`sh -c "cat credentials.json"`→deny；未知 method→`-32601`；裸 `env | grep HUAWEICLOUD_ACCESS_KEY`→deny。
> - 残留缺口：`env | grep HW_ACCESS_KEY` 仍 allow；`sh -c "env | grep …"` 仍 allow；未知 tool 仍 `-32603`；HCL broad IAM 仍 allow；fail-open 仍 allow；中文路由仍 21.4%；redactString 字符串路径缺裸 `token` + `admin_pass` 变体（D4-27 新增发现）。

---

## 三、状态汇总

### 3.1 设计级（80）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 58 | 有证据且通过 PASS 门禁 |
| FAIL | 7 | D4-2 / D4-16 / D4-21（P0）；D9-2 / D4-17 / D10-3 / D4-27（P1） |
| BLOCKED | 11 | 真·外部依赖，见 §五 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 4 | D1-39 Windows 专属（Linux 由 EXP-NR3-10 覆盖）+ D8-1/4/6 文档一致性 |
| **合计** | **80** | |

### 3.2 展开级（48）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 37 | EXP-C4-01~22 + EXP-E06/E09/E15/E08 + EXP-D5-8-1/8-3 + EXP-NR3-02/04/10/24 + EXP-D1-58-01~05 |
| FAIL | 11 | EXP-E01~E05/E07/E10~E14（run-eval.mjs 中文意图 MISS） |
| BLOCKED / NOT_RUN | 0 | 已全部消解 |
| **合计** | **48** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 铁律：缺陷均真实执行后填写；根因为 v1.1.5 源码文件:行号；全部历史查重命中 open issue，不重复提单，关联见 FINDINGS.md / HISTORY_LINKS.md。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果（v1.1.5） | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截未覆盖 `HW_` 前缀 | `env \| grep HW_ACCESS_KEY` 应 `deny` | `allow`（`printenv HW_SECRET_KEY` 已 `deny`） | `safety-policy.mjs:398-399` | 历史 #652-1 等 |
| 2 | P0 | `D4-16` | env-dump 规则被 shell 包裹穿透 | `sh -c "env \| grep HUAWEICLOUD_ACCESS_KEY"` 应 `deny` | `allow`（destructive/secret 包裹命令已修复，env-dump 未回溯） | `safety-policy.mjs:398` | 历史 #652-2 等 |
| 3 | P0 | `D4-21` | HCL broad IAM 未拦截 | HCL `actions = ["*"]` 应 `deny` | `decision=allow`，findings 空 | `cloud-risk-rules.json:179,196` | 历史 #652-3 等 |
| 4 | P1 | `D9-2` | JSON-RPC 未知 tool 错误码未区分 -32602 | 未知 tool 应 `-32602` | `-32603`（未知 method `-32601` 已修复） | `mcp-server.mjs:169` | 历史 #652-4/#638 |
| 5 | P1 | `D4-17` | hook 模糊 fail-open | 畸形/空输入应 `deny` | 默认 `allow`/`ok` | `risk-rule-engine.mjs:106` | 历史 #679/#674 等 |
| 6 | P1 | `D10-3` | serviceCatalog 中文意图路由缺失 | 中文意图命中对应服务；评测级 ≥90% | 回退 `Run hcloud --help`，准确率 21.4% | `tools.mjs:1778-1908` | 历史 #689/#683/#674 |
| 7 | P1 | `D4-6` | redactString 脱敏未覆盖 CLI flag / JSON 带引号 key | `--admin_pass <pwd>` / `"adminPass":"pwd"` 应脱敏 | 原样返回不脱敏（`adminPass=xxx→<redacted>` 正确） | `safety-policy.mjs:42` | 历史 #561/#712 等 |
| 8 | P1 | `D4-27` | redactSecrets/redactOutput 字符串路径缺裸 `token` / `admin_pass` 变体 | 双路径对 AK/SK/token/password/adminPass/secret_key 均无明文残留 | 字符串 `token=` 泄漏；`--admin-pass=` 泄漏（对象/JSON 路径正确脱敏） | `safety-policy.mjs:42` | 历史 #726（裸 token）+ #561/#712 |

### 根因详情（关键缺陷代码片段 + 复现证据）

**#1/#2 [P0] env-dump 拦截缺口**：v1.1.5 `safety-policy.mjs:418-419` 新增 `$HW_*` 变量引用 + `printenv HW_*` 两条规则，故 `printenv HW_SECRET_KEY` 已 deny；但 `safety-policy.mjs:398-399` 的 env-dump 关键字正则仍为 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i`（缺 `HW_`），且依赖 `(^|\s)(env|printenv...)` 词边界，故 `env | grep HW_ACCESS_KEY` 仍 allow，`sh -c "env | grep …"` 包裹形态也 allow。证据 `evidence/D4-2/stdout.log` + `evidence/D4-16/stdout.log`（含 wrap-probe）。

**#8 [P1] D4-27（本日新增用例）**：直调 `redactSecrets`/`redactOutput` 5 项断言 2 项 PASS、3 项 FAIL——对象路径 `{token:...}` 与 `redactOutput(JSON)` 正确脱敏（`isSecretKeyName` 经 `policy.json` `secretKeyNamePatterns` 含 `token`/`ak`/`sk`）；但**字符串路径** `redactString`（`safety-policy.mjs:42`）key=value 白名单缺裸 `token`（仅 `security[_-]?token`/`x[_-]?auth[_-]?token`），且 `adminPass` 仅字面 camelCase 未覆盖 `admin_pass`/`admin-pass` 变体，故 `token=T0K3N...`、`--admin-pass=...` 与 `redactOutput` 非 JSON 回退均泄漏。证据 `evidence/D4-27/stdout.log`。

**D4-13（较 09-17 改善，非缺陷）**：用 test001 只读子账号实测 6 条只读命令**全部通过**（ECS NovaListServers / VPC ListVpcs / EVS ListVolumes / IMS ListImages / CES ListMetrics / EIP ListPublicips）；写操作 VPC CreateVpc 被 IAM 拒绝（PolicyNotAuthorized，符合预期），归零验证通过。09-17 报告「5/6（IMS 被拒）」源于探针缺陷：IMS ListImages 返回 2.1MB 输出，超出 execSync 默认 1MB `maxBuffer` 触发 ENOBUFS（`code=-1`），且 `403` 正则误匹配镜像 owner ID 十六进制（`…8c403ca9…`）被判 `denied`；探针修正（`maxBuffer:10MB` + `\b403\b`）后复测 **6/6 PASS**，IMS 只读实为长期可用。证据 `evidence/D4-13/stdout.log`。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-2 | 设计级 | P2 | BLOCKED | 补环境 | 多 Agent 探测需多客户端并存环境（单机仅 Hermes） | — |
| D1-6 | 设计级 | P2 | BLOCKED | 补环境 | install-hcloud 需「无 KooCLI 环境」前置 + 镜像/沙箱提示，本机已装 KooCLI 7.2.12 无法复现裸安装引导 | — |
| D2-10 | 设计级 | P1 | BLOCKED | 补环境 | R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换） | — |
| D2-13 | 设计级 | P1 | BLOCKED | 补环境 | R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） | — |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | 供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 | — |
| D4-23 | 设计级 | P0 | BLOCKED | 补环境 | 全局规则注入需 11 个 Agent 多机安装目标；包内 grep 无 huawei-agent-rules.md 制品 | — |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 确认令牌过期/重复确认边界需审批流 + 可注入时钟 | — |
| D7-4 | 设计级 | P2 | BLOCKED | 补环境 | 国内镜像源安装需国内网络 + 华为云 npm 镜像/GITCODE_TOKEN | — |
| D9-6 | 设计级 | P1 | BLOCKED | 调归属 | 跨客户端互通需多客户端并存环境（单机仅 Hermes） | — |
| D9-9 | 设计级 | P1 | BLOCKED | 改用例 | tools/call 超时协议语义需可注入延迟夹具(30s 挂起)；capabilities.cancellation 实测未声明(探针已确认 false)；取消/in-flight 需标准客户端 | 拆分「cancellation 未声明」为源码级可判定断言 |
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | 安全干预有效性需 LLM 评测 harness + 预算门禁（run-eval.mjs 无法代理该层） | — |
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10(disttags 探针)代表覆盖 | — |
| D8-1 | 设计级 | P2 | NOT_RUN | 改用例 | 文档与能力一致需白盒 docs 全量比对 | 标注为维护者专项或提供比对脚本 |
| D8-4 | 设计级 | P2 | NOT_RUN | 改用例 | 引导步骤可机械执行需逐条核验 getting-started 步骤 | 同上 |
| D8-6 | 设计级 | P2 | NOT_RUN | 改用例 | 中英文文档一致需中英双源逐段比对 | 同上 |

> 展开级「不涉及本客户端/OS」在建包时已剔除（init_day 预筛），无跨客户端展开级残留。NOT_RUN 仅 4 条（1 OS 专属 P0 豁免 + 3 文档一致性），BLOCKED 全部已写原因。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4 show_profile_redacted / auth_status 均 `<redacted>`；D4-6/D4-27 源码级脱敏探针使用假凭证）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`0`（真云仅建删本次创建资源，测后归零验证通过）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云凭证仅以 `<redacted>` 指纹或 `PolicyNotAuthorized` 权限错误出现）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 VPC `tctest-hermes-20260918-*`（D4-14） | 是 | 已删 | ListVpcs 不含本次资源 = 通过 |
| 真云安全组 `tctest-hermes-sg-pf-*`（D4-19） | 是 | 已删 | ListSecurityGroups 不含本次 SG = 通过 |
| 隔离 HERMES_HOME `iso-home-20260918`（install/uninstall D1-1/3/4/5） | 是 | 已删 | 退出即清理 |
| 临时 HUAWEICLOUD_HOME（D2-26 backup/restore 隔离） | 是 | 已删 | mkdtemp 随探针退出清理 |
| KooCLI test001 profile（D4-13） | 是 | 已删 | `configure delete --cli-profile=test001` 恢复 default |

> 真云只删除本次 Hermes 创建资源；删除前全量盘点，未触碰既有/他人资源。Hermes 自身残留 = 0。

---

## 八、遗留与建议

- 待裁决 SPEC：无。
- 观察（非缺陷）：
  1. 工具全集实测 `40`；skills 目录 huawei-* 技能实测 `29`（manifest 声明 27，描述略滞后，非缺陷）。
  2. `resolveSkipFilePath` 依赖「插件目录存在 package.json」判定走插件目录副本；当前源仓 clone 无 package.json，skip 文件回退共享路径（D1-33 已探针复核会话化后缀仍生效）。
  3. `serviceCatalog` routeMap 仅少量条目含 CJK 关键字，中文意图大面积 miss（#6，已跟踪）。
  4. v1.1.5 修复为**部分到位**：env-dump 裸命令/shell 包裹破坏性命令/`printenv HW_*`/未知 method `-32601` 已修；`env | grep HW_*`、shell 包裹 env-dump、未知 tool `-32602`、HCL broad IAM、fail-open、中文路由仍未修；redactString 字符串路径仍缺裸 `token` 与 `admin_pass` 变体（#8，D4-27）。
  5. D4-13 只读子账号本日修正为 **6/6 全部可用**（探针 maxBuffer/正则缺陷已修，IMS 只读实为长期可用，非产品缺陷）。
  6. 新增用例 D2-26（凭证 backup/restore）7/7 PASS、D4-27（双路径脱敏）2/5 PASS，均已落盘新鲜证据。
- 本轮未覆盖范围：多终端矩阵、审批流实时对话框（需标准客户端交互）、LLM 评测 harness、文档全量比对。