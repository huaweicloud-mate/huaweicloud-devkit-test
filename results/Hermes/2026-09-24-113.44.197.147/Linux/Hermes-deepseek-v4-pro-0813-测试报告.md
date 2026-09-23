# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-24 05:14（北京时间）
> **执行归档**：`results/Hermes/2026-09-24-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：**PARTIAL**（设计级 18 FAIL + 2 SPEC-MISMATCH，展开级 14 FAIL；SUT 由 v1.1.7-next.0 升级至 v1.1.7-next.1 = 仅帮助文案/文档变更，全部缺陷实测复现、根因未变，统一走 `file_issue.py` 历史查重处理）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（113.44.197.147） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.7-next.1（npm @next，gitHead `657ceb7`，PR #806） |
| 上轮版本对比 | v1.1.7-next.0（gitHead `0790e92a`）→ v1.1.7-next.1（gitHead `657ceb7`）：`git diff` 确认仅 `tools.mjs` apiKeyHint 帮助文案 + `huawei-sandbox/SKILL.md` 文档 + `test/structure.test.mjs`，**无任何 safety/hooks/serviceCatalog/redact 源码逻辑变更** |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | KooCLI hcloud 7.2.12，doctor 11 pass 0 warn 0 fail |
| 真云凭证 | cn-north-4（管理员 AK/SK 有效 + 只读 IAM 子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 stdio / 真云 E2E（建删归零 + CTS 审计 + 只读子账号最小权限 + D3 场景 + FunctionGraph）+ D10 评测 harness |
| daily 基础用例 | 设计级 100 / 展开级 43（Hermes+Linux 预筛后） |

> **执行方法**：复用 `run-today.sh` 22 支源码级探针 fresh 重跑（v1.1.7-next.1）+ `eval/harness/run-eval.mjs` + 真云补测（D4-13 只读子账号 / D4-14 VPC 建删归零+CTS / D3-S1/S2/C13/S4 真云场景 / D3-S6 FunctionGraph 建删归零 / D3-S3 沙箱预览）+ D2-26/D4-27 源码级直调探针 + 收尾补删 OBS 空桶归零。证据统一落 `evidence/<case-id>/stdout.txt`（+ 22 份 `fresh-*.txt`）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 100 + 展开级 43 = 143 |
| 已执行 | 141（执行状态列全部回填，NOT_RUN 2 条） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 107 / 32 / 0 / 2 / 2 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 107 / 141 = 75.9% |
| P0 / P1 / P2 新增缺陷 | 0 / 0 / 0（v1.1.7-next.0→next.1 为帮助文案/文档变更，全部为历史缺陷复现，见 HISTORY_LINKS） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 真云 VPC/OBS/FunctionGraph/沙箱会话均已建删归零；只读账号写全被 IAM 拒绝 |

> **版本变更摘要**：`git diff 0790e92a..657ceb7` 显示 v1.1.7-next.1 共 15 文件（+114/-67），仅 `tools.mjs` apiKeyHint 字符串（+2/-2，DevBridge API Key 帮助文案措辞）+ `huawei-sandbox/SKILL.md` 文档（devbridge auth 探测说明）+ `test/structure.test.mjs` 测试，**无任何 `plugins/huaweicloud-core/src|hooks|safety` 逻辑变更**。故本轮 34 项缺陷与 v1.1.7-next.0 完全一致、逐条实测复现、根因未变。

---

## 三、状态汇总

### 3.1 设计级（100）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 78 | 有证据且通过 PASS 门禁（含 D4-13/D4-14 真云 PASS、D2-26 备份恢复闭环 PASS、D3-C13 OBS 静态网站真云 PASS、D3-S6 FunctionGraph 建删归零 PASS、D3-S2 删VPC先确认全量 ListVpcs 归零 PASS、D8-1/D8-4 文档复核 PASS、D5-1/D5-3 工具全量枚举 PASS） |
| FAIL | 18 | D2-4/D2-11/D4-4/D4-5/D4-8/D4-11/D4-16/D4-17/D4-23/D4-25/D4-26/D4-27/D1-70/D3-C4/D3-S1/D3-S3/D3-S5/D10-3 |
| BLOCKED | 0 | 全部消解 |
| SPEC-MISMATCH | 2 | D1-68（HW_REGION 优先级）、D8-9（sanitizeValue 未脱敏敏感值） |
| NOT_RUN | 2 | D1-39（Windows 专属）、D3-S7（RDS 建删归零耗时，未执行），见 §五 |
| **合计** | **100** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 29 | EXP-C4-01~13/15~17/19~22（20 服务矩阵）+ EXP-D5-8-1/-3 + EXP-E06/E09/E15 + EXP-NR3-02/04/10/24 |
| FAIL | 14 | EXP-C4-14(DMS)/-18(DEW) unsupported + EXP-E01/E02/E03/E04/E05/E07/E08/E10/E11/E12/E13/E14（中文路由 miss） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **43** | |

---

## 四、缺陷清单（34 项：18 设计级 + 14 展开级 + 2 SPEC；其中 3 项测试侧）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 小写 ak=/sk= 不脱敏 | safety-policy.mjs redactSecrets 缺 /i | 历史复现 |
| 2 | P0 | D2-11 | R2 冲突门先于 R3 STS 拒绝 | tools.mjs:1214-1237 | 历史复现 |
| 3 | P0 | D4-5 | Change* 写操作误判只读 | safety/policy.json:27-31 缺 Change | 历史复现 |
| 4 | P0 | D4-16 | 命令包裹/子shell 穿透 | safety-policy.mjs:428 | 历史复现 |
| 5 | P0 | D4-23 | 全局规则未注入 | setup-cli.mjs 未复制 rules/ | 历史复现 |
| 6 | P1 | D4-4 | 审批门 Change* 漏拦截 | safety/policy.json:27-31 | 历史复现 |
| 7 | P1 | D4-8 | Python/Node 钩子不一致 | huaweicloud-safety.py:46 | 历史复现 |
| 8 | P1 | D4-17 | 畸形输入 fail-open | hooks parse catch return | 历史复现 |
| 9 | P1 | D4-11 | 提示注入自然语言夹带写命令 | safety-policy.mjs:428 | 历史复现 |
| 10 | P1 | D10-3 | 中文意图路由 miss | tools.mjs serviceCatalog 英文-only | 历史复现 |
| 11 | P1 | D4-27 | 双路径脱敏缺裸 token/小写 ak/sk | safety-policy.mjs:42-45 | 历史复现 |
| 12 | P1 | D1-70 | 代理 no_proxy CIDR 未匹配 | proxy-config.mjs:42-47 | 复现 |
| 13 | P1 | D3-S1 | 场景-只读查ECS 中文路由 miss | tools.mjs serviceCatalog（同 D10-3） | 复现 |
| 14 | P1 | D3-S3 | 场景-沙箱预览无公网URL（DevBridge 隧道未建） | sandbox DevBridge 隧道未建立 | 复现 |
| 15 | P1 | D3-C4/EXP-C4-14/18 | DMS/DEW list_operations unsupported | 营销聚合名无单一 KooCLI 服务标识 | 测试侧/改用例 |
| 16 | P2 | D3-S5 | 复合意图分层路由 miss | tools.mjs serviceCatalog（同 D10-3） | 复现 |
| 17 | P2 | D4-25 | Python hook 遥测写操作落 cli:invoke | huaweicloud-safety.py record_cli_event | 复现 |
| 18 | P2 | D4-26 | findings 证据明文泄漏 | risk-rule-engine.mjs:97 excerpt 未脱敏 | 复现 |
| 19 | P2 | D1-68 | HW_REGION 优先（SPEC-MISMATCH） | credentials.mjs:133 | SPEC |
| 20 | P2 | D8-9 | sanitizeValue 未脱敏敏感值（SPEC-MISMATCH） | telemetry.mjs:189 | SPEC |
| 21 | P1 | EXP-E01~E14 | 中文意图路由 miss（12 条） | tools.mjs serviceCatalog（同 D10-3） | 历史复现 |

> 完整现象/断言/根因/证据逐条见 `FINDINGS.md`。
> SUT 由 v1.1.7-next.0@0790e92a 升级至 v1.1.7-next.1@657ceb7（仅帮助文案/文档变更，无逻辑改动），缺陷全部实测复现、根因未变，经上游 open issue 查重命中已跟踪缺陷单，本轮不重复提单（关联清单见 `HISTORY_LINKS.md`）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属 OS 用例（升级检测链 `.cmd`/EINVAL 语义），本机 Linux 无法复现；Linux 侧由 EXP-NR3-10 通用断言 PASS | OS 列已标 Windows-only，如需 Linux 独立断言可新增 Linux 专属用例 |
| D3-S7 | 设计级 | P1 | NOT_RUN | 补环境 | 真云跨服务编排（WebApp+RDS）需真机创建 RDS 实例（单次 provisioning 10~20 分钟 + 按需计费），每日测试单轮时间窗口内无法建立「建删归零」闭环，避免遗留未归零付费资源 | 建议排独立补测轮（更长时间窗口）执行 D3-S7 真云编排 |

> 本轮 BLOCKED 已全部消解：D4-13（只读子账号 test001 env 动态切换 PASS + 写被 IAM 拒绝 PASS）、D4-14（真云 VPC 建删归零 + CTS 审计 PASS）、D3-S6（FunctionGraph 建函数+定时触发器+删除归零 PASS）、D3-S2（真云 VPC 建删归零，全量 ListVpcs 校验 PASS）、D3-C13（OBS 静态网站建删归零 PASS）、D3-S4（领券闭环 PASS）。无 BLOCKED 残留。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录 stdout 经脱敏，真云探针用占位符；D2-4/D4-26/D4-27 为实现级脱敏缺口，已跟踪）
- [x] 写操作误判 read-only：D4-5「Change* 误判只读」已记 FAIL 并跟踪（非真云误删资源）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始 AK/SK/未脱敏日志（发现 3 项实现级脱敏缺口 D2-4/D4-26/D4-27，均已记入 FINDINGS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-S2 hdk1-s2-*） | 是 | 已删（run_approved 确认后删除） | ListVpcs 全量不再含本次 VPC（归零） |
| VPC（D4-14 hdk1-audit-*） | 是 | 已删（DeleteVpc） | ListVpcs 不再含本次 VPC（归零） |
| OBS 桶（D3-C13 hdk1-s13-*） | 是 | 已删（`-r -f` 清对象 + 收尾补 `OBS rm ... -f` 删空桶） | `hcloud OBS ls` 无 hdk1 残留（归零） |
| FunctionGraph（D3-S6 hdk1-s6-*） | 是 | 已删（DeleteFunction） | ListFunctions 不再含本次函数（归零） |
| 沙箱会话（D3-S3） | 是 | close_session | 会话已关闭 |
| 只读账号写（test001 建 VPC） | 否（IAM 拒绝） | — | VPC.0010 PolicyNotAuthorized，无资源产生 |

> 真云只删本次创建资源（VPC 2 + OBS 桶 1 + FunctionGraph 1 + 沙箱会话 1）。
> 本轮收尾已补删 D3-C13 遗留的空 OBS 桶（`hcloud OBS rm obs://hdk1-s13-* -f`）并复查 `hcloud OBS ls` 无 hdk1 残留，归零闭环。

---

## 八、遗留与建议

- 历史缺陷（D2-4/D2-11/D4-4/D4-5/D4-8/D4-11/D4-16/D4-17/D4-23/D4-27/D10-3/EXP-E*）在 v1.1.7-next.1 全部复现、根因未变，经上游 open issue 查重命中，本轮不重复提单。
- 本轮复查复现缺陷：D1-70（代理 no_proxy CIDR）、D3-S1/D3-S5（中文路由 miss，同 D10-3）、D3-S3（沙箱预览公网 URL，DevBridge 隧道未建）、D4-25（Python hook 遥测分类）、D4-26（findings 证据脱敏）、D1-68（HW_REGION 优先级 SPEC）、D8-9（sanitizeValue SPEC），均由 `file_issue.py` 查重后处理。
- 服务矩阵 DMS/DEW 二项（EXP-C4-14/18）为营销聚合名，建议 test-cases 母版 D3-C4 展开规则补充映射说明（改用例类）。
- 版本观察：v1.1.7-next.1 为 dev 预发布线上的纯文档/文案推进，未修复任何既有缺陷；建议待正式版修复后回归。
- 建议：中文意图路由（D10-3/EXP-E*/D3-S1/D3-S5，准确率 21.4%）与 Change* 写动词（D4-4/D4-5，policy.json 缺 Change 前缀）影响面最大，优先排期修复；D4-16 shell-wrap 解包建议前移到 classifyTextCommand 路由前；脱敏三缺口（D2-4 小写、D4-26 审计证据、D4-27 裸 token）建议统一在 redactString/safety-policy 源头补齐。