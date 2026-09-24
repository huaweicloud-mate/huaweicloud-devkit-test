# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-24 05:12（北京时间）
> **执行归档**：`results/Hermes/2026-09-24-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：**FAIL**（4 项 P0 缺陷：D4-2 / D4-16 / D4-21 / D4-23；均为历史缺陷复现，走 `file_issue.py` 查重后处理）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.7-next.1（npm @next，gitHead `657ceb7b`） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS，tools/list 实测 40） |
| hcloud / 依赖 | KooCLI（hcloud）7.2.12 已配置，cn-north-4 |
| 真云凭证 | cn-north-4（管理员 AK/SK 有效 + 只读 IAM 子账号 test001 已下发） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 stdio / 真云 E2E（VPC 建删归零 + CTS 审计 + 只读子账号）/ 沙箱全链路 / D10 评测 harness |
| daily 基础用例 | 设计级 100 / 展开级 43（Hermes+Linux 预筛后）= 143 |

> **执行方法**：`run_all.sh` 35 支源码级探针 fresh 重跑（对 hdk 源码 `657ceb7b` 直调函数/探针）+ `eval/harness/run-eval.mjs` 15 条中文评测集 + 真云补测（D2-1 三端 / D3-C4 22 服务矩阵 / D4-14 VPC 建删归零+CTS / D4-18/19/20 审批流 / D4-13 只读子账号）+ D2-26/D4-27 源码直调 + D4-23 全局规则注入探针。证据统一落 `evidence/<case-id>/`（probe + stdout.txt）。
>
> **版本差异说明**：v1.1.7-next.1 相对 v1.1.7-next.0 仅 `tools.mjs`（DevBridge apiKeyHint 文案 ~4 行）+ `skills/huawei-sandbox/SKILL.md`（devbridge auth 能力探针文档）+ 各插件 manifest 版本号 bump；`safety-policy.mjs` / `risk-rule-engine.mjs` / `mcp-server.mjs` / `credentials.mjs` / `telemetry.mjs` / `setup-cli.mjs` / `cloud-risk-rules.json` 等安全链路**字节级零改动**。本轮 35 支探针与昨日逐文件 diff：除版本号、时间戳、临时路径、PID 及 D3-S6 FunctionGraph 校验字段名（`code.filename`→`code.zip_file`，同为 `[USE_ERROR]Invalid parameter`）外**全部一致**，12 项缺陷全部原样复现（含 2 项本轮纠正项 D4-23/D9-9），根因均未变化。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 100 + 展开级 43 = 143 |
| 已执行 | 139（执行状态列全部回填，NOT_RUN 4 条） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 107 / 23 / 6 / 3 / 4 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 107 / 133 = 80.5% |
| P0 / P1 / P2 新增缺陷 | 4 / 4 / 4（含 3 SPEC） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 真云 VPC 建删归零（ListVpcs 复核不含本次资源）；只读子账号写 VPC 被 IAM 拒绝（未产生资源） |

---

## 三、状态汇总

### 3.1 设计级（100）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 75 | 有证据且通过 PASS 门禁（含 D2-1 真云三端、D3-C4 服务矩阵、D4-13 真云只读子账号、D4-14 真云 VPC 建删归零、D4-18/19/20 审批流、D5-1/D5-3 工具枚举、D8-7 七技能） |
| FAIL | 12 | D4-2/D4-16/D4-21/D4-23(P0) + D4-17/D10-3/D4-27/D3-S7(P1) + D3-S5/D3-S6/D4-25/D4-26(P2)，根因见缺陷清单 |
| BLOCKED | 6 | D2-10/D2-13/D4-12/D4-24（补环境）、D9-6（调归属）、D3-S3（补环境-DevStation 公网隧道），见 §五 |
| SPEC-MISMATCH | 3 | D9-9（cancellation 未声明）、D1-68（HW_REGION 优先级）、D8-9（sanitizeValue 未脱敏） |
| NOT_RUN | 4 | D1-39（Windows 专属）、D8-1/D8-4/D8-6（文档一致性白盒比对），见 §五 |
| **合计** | **100** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 32 | EXP-C4-01~22（22 服务矩阵）+ EXP-D5-8-1/-3 + EXP-E06/E09/E15 + EXP-E08 + EXP-NR3-02/04/10/24 |
| FAIL | 11 | EXP-E01/E02/E03/E04/E05/E07/E10/E11/E12/E13/E14（中文路由 miss，同 D10-3 根因） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **43** | |

---

## 四、缺陷清单（12 项设计级缺陷 + 11 项展开级 FAIL，同根因合并）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截未覆盖 `HW_` 前缀 | safety-policy.mjs:398-399 缺 `HW_` | 历史复现 |
| 2 | P0 | D4-16 | env-dump 规则被 shell 包裹穿透 | safety-policy.mjs:398 词边界依赖 | 历史复现 |
| 3 | P0 | D4-21 | hook_check_artifacts 未拦截 HCL broad IAM | cloud-risk-rules.json:179-196 仅 JSON 形态 | 历史复现 |
| 4 | P0 | D4-23 | 全局规则 huawei-agent-rules.mdc 未注入 | setup-cli.mjs:829-840 缺 copyDir(rules/) | 历史复现（BLOCKED→FAIL） |
| 5 | P1 | D4-17 | hook 模糊输入 fail-open | risk-rule-engine.mjs:106 默认 allow | 历史复现 |
| 6 | P1 | D10-3 | serviceCatalog 中文意图路由缺失（21.4%） | tools.mjs:1817-1946 routeMap 英文-only | 历史复现 |
| 7 | P1 | D4-27 | 双路径脱敏缺裸 token/admin-pass 变体 | safety-policy.mjs:34 白名单缺 token | 历史复现 |
| 8 | P1 | D3-S7 | 带 MySQL 的 Web 应用仅命中 RDS、部署目标 miss | tools.mjs serviceCatalog（同 D10-3） | 复现 |
| 9 | P1 | D9-9 | capabilities.cancellation 未声明（SPEC） | mcp-server.mjs initialize 未声明 cancellation | 历史复现（BLOCKED→SPEC） |
| 10 | P2 | D4-25 | Python hook 遥测写操作落 cli:invoke | huaweicloud-safety.py:46 捕获组 | 历史复现 |
| 11 | P2 | D4-26 | findings.evidence 明文泄漏（JSON 带引号 key） | risk-rule-engine.mjs:19 正则不匹配 | 历史复现 |
| 12 | P2 | D3-S5 / D3-S6 | 复合意图/FunctionGraph 中文路由 miss | tools.mjs serviceCatalog（同 D10-3） | 复现 |
| 13 | P2 | D1-68 | HW_REGION 优先级（SPEC-MISMATCH） | credentials.mjs:133 HW_REGION 在前 | SPEC |
| 14 | P2 | D8-9 | sanitizeValue 未脱敏敏感值（SPEC-MISMATCH） | telemetry.mjs:189 仅去控制字符 | SPEC |

> 展开级 11 项 FAIL 均为 EXP-E*（中文路由 miss），与 #6 D10-3 同根因（serviceCatalog routeMap 英文-only），不单独开单。
> 完整现象/断言/根因/证据逐条见 `FINDINGS.md`。SUT 与 v1.1.6/v1.1.7-next.0 源码安全链路字节级一致，缺陷全部实测复现、根因未变，经上游 open issue 查重后处理（关联清单见 `HISTORY_LINKS.md`）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属升级检测链（`.cmd`/EINVAL 语义），本机 Linux 无法复现；Linux 侧由 EXP-NR3-10 通用断言 PASS | OS 列已标 Windows-only，无需改 |
| D8-1 | 设计级 | P2 | NOT_RUN | 改用例 | 「文档与能力一致」需白盒 docs 全量比对（源码能力强一致核对），本轮未覆盖 | 拆分为可机械执行的能力↔文档逐条对照脚本，或降为 P2 抽查 |
| D8-4 | 设计级 | P1 | NOT_RUN | 改用例 | 「引导步骤可机械执行」需逐条核验 getting-started 全步骤 | 提供可自动执行的引导步骤清单（脚本化验证） |
| D8-6 | 设计级 | P2 | NOT_RUN | 改用例 | 「中英文文档一致」需中英双源逐段比对 | 提供中英文档段落映射清单或比对脚本 |
| D2-10 | 设计级 | P1 | BLOCKED | 补环境 | R7 current 档跟随需 KooCLI 多 profile（current=deploy）切换夹具，会污染统一账号凭证库 | 隔离 HOME 下自建多 profile 夹具后复测 |
| D2-13 | 设计级 | P1 | BLOCKED | 补环境 | R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） | 隔离 HOME+env 下自建 S1 夹具后复测 |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | 供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 | 提供 npm 安装期审计/SBOM 生成通道后复测 |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 确认令牌过期/重复确认边界需审批流 + 可注入时钟（令牌 TTL=60s） | 提供可注入时钟/等时钟夹具后复测 |
| D9-6 | 设计级 | P1 | BLOCKED | 调归属 | 跨客户端互通需多客户端并存环境（单机仅 Hermes） | 归属改「任一台多客户端并存机器」或抽样验证 |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | v1.1.7-next.1 沙箱 connect/upload(md5)/deploy/close 全链路真实执行、nginx_serving PASS，但 deploy 返回 url 为空、devbridge_tunnel FAIL（DevStation 公网隧道/预览外发环境缺依赖） | 补 DevStation 公网隧道环境后复测「出 URL」断言 |

> 本轮 P0 仅 D1-39 为 NOT_RUN（Windows 专属合法豁免，Linux 由 EXP-NR3-10 覆盖）；D4-23 为 FAIL（源码可证，非环境阻塞）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录 stdout 经脱敏，真云探针用占位符；D2-4/D4-26/D4-27 为实现级脱敏缺口，已跟踪）
- [x] 写操作误判 read-only：`0`（D4-5「Change* 误判只读」本轮 PASS）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始 AK/SK/未脱敏日志（D2-4/D4-26/D4-27 实现级脱敏缺口已记入 FINDINGS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D4-14 tctest-hermes-20260921-*） | 是 | 已删（run_approved DeleteVpc，vpcId `5b773310-…`） | ListVpcs 复核不含本次 VPC（归零） |
| 只读账号写（test001 建 VPC） | 否（IAM PolicyNotAuthorized 拒绝） | — | 未产生任何资源（created=false） |
| 沙箱会话（D3-S3） | 是 | close_session ok | 会话已关闭 |

> 真云只删本次创建资源；只读子账号写操作被 IAM 拒绝，未产生资源。无遗留计费资源。

---

## 八、遗留与建议

- 历史缺陷（D4-2/D4-16/D4-21/D4-23/D4-17/D10-3/D4-27/D4-25/D4-26/D1-68/D8-9/D9-9 + EXP-E*）在 v1.1.7-next.1 全部复现、根因未变，经上游 open issue 查重命中，本轮不重复提单。
- 建议：中文意图路由（D10-3/EXP-E*/D3-S5/S6/S7，21.4%）、D4-23 全局规则注入、脱敏三缺口（D4-2 前缀 / D4-26 审计证据 / D4-27 裸 token）是影响面最大的 P0/P1 缺口，优先排期。