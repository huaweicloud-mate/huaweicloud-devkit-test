# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-30 11:04`（北京时间）
> **执行归档**：`results/Hermes/2026-09-30-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 P0 FAIL，不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ECS，IP 124.70.78.131） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12 |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b474`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 确认已配置） |
| 真云凭证 | cn-north-4（AKSK 已预置 + 只读子账号 test001 已下发） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 102 / 展开级 43 / 追踪表 211 行 |

> **执行方法**：38 批探针（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn mcp-server 驱动协议 + 真云 E2E 建删资源；决策/结果落 `evidence/<case-id>/stdout.txt`。本日切到预发布 `1.1.8-next.1`（prepare_env 自动取 latest/next 中版本更高者）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 102 + 展开级 43 |
| 已执行 | 设计级 98（4 条 NOT_RUN 为文档比对/OS 专属）+ 展开级 43 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（设计级） | `79 / 11 / 5 / 3 / 4` |
| PASS / FAIL（展开级） | `42 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，设计级） | `84.9%`（79/93） |
| 通过率（展开级） | `97.7%`（42/43） |
| P0 / P1 / P2 缺陷 | `4(3 FAIL+1 SPEC) / 6(5 FAIL+1 SPEC) / 4(3 FAIL+1 SPEC)` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（VPC/OBS 建删归零，FunctionGraph/RDS 未创建无残留）` |

> **较 v1.1.7（2026-09-29）进展**：修复 4 项——D4-16（env-dump shell 包裹）、D4-23（全局规则 mdc 注入）、D3-S3（沙箱预览出 URL）、D1-68（区域 env 变量）；部分修复 2 项——D4-2（`HW_` 前缀已拦截）、D10-3（路由准确率 21.4%→92.9%）。新增 1 项 D10-4（规则库 16→19 条契约漂移）。

---

## 三、状态汇总

### 3.1 设计级（102 行，OS 专属豁免 1）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 79 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | 不符预期，根因见缺陷清单（FINDINGS #1/#2/#5/#6/#7/#9/#10/#11/#12/#13 + 历史 #3） |
| BLOCKED | 5 | 环境阻塞，见 §五 |
| SPEC-MISMATCH | 3 | 契约漂移：D8-9、D9-9、D10-4 |
| NOT_RUN | 4 | D1-39（OS 专属）+ D8-1/D8-4/D8-6（文档比对） |
| **合计** | **102** | |

### 3.2 展开级（43 行）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 42 | EXP-C4-01~22 + EXP-E02~E15 + EXP-E08 + EXP-D5-8-1/3 + EXP-NR3-02/04/10/24 |
| FAIL | 1 | EXP-E01（serviceCatalog「云主机」未命中） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **43** | |

---

## 四、缺陷清单（详尽，详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印未覆盖 generic `access_key` | safety-policy.mjs:514-515 | 待提单 |
| 2 | P0 | D4-21 | HCL 形态 broad IAM 未拦截 | cloud-risk-rules.json:196 | 待提单 |
| 3 | P0 | D9-12 | initialize 握手两处缺口 | mcp-protocol.mjs:32-55,57-59 | 历史 #814 |
| 4 | P0 | D10-4 | 规则库 16→19 条断言漂移 | cloud-risk-rules.json（19 规则）| 待提单 |
| 5 | P1 | D4-6 | hook_check_command --admin-pass 不告警 | cloud-risk-rules.json:68（stages 缺 command）| 待提单 |
| 6 | P1 | D4-17 | hook 模糊输入 fail-open | risk-rule-engine.mjs:103-106 | 待提单 |
| 7 | P1 | D4-25 | Python hook 写遥测误分类 cli:invoke | huaweicloud-safety.py:46 | 待提单 |
| 8 | P1 | D9-9 | capabilities.cancellation 未声明 | mcp-protocol.mjs:45-49 | 待提单 |
| 9 | P1 | D10-3 | serviceCatalog「云主机」未命中 92.9% | tools.mjs:1968 routeMap | 待提单 |
| 10 | P1 | D3-S7 | RDS 复合意图部署目标未命中 + 创建前置缺失 | tools.mjs:1968 + RDS 前置 | 待提单 |
| 11 | P2 | D4-26 | findings.evidence JSON key 明文泄漏 | risk-rule-engine.mjs:19-23 | 待提单 |
| 12 | P2 | D3-S5 | 复合意图分层路由未分解 | tools.mjs:1968 routeMap | 待提单 |
| 13 | P2 | D3-S6 | FunctionGraph 创建函数缺 code.filename | 场景缺代码归档 | 待提单 |
| 14 | P2 | D8-9 | sanitizeValue 未脱敏 AK/SK/token | telemetry.mjs:189-191 | 待提单 |

> 完整「现象 + 唯一断言 + 根因 + 证据」见同目录 `FINDINGS.md`（`file_issue.py` 解析输入）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列「Windows（升级检测链 EINVAL 专属…）」）；Linux 侧由 EXP-NR3-10（disttags 探针，实测 queryDistTagsSync/queryDistTags 无 EINVAL）代表覆盖 | — |
| D8-1 | 设计级 | P2 | NOT_RUN | 改用例 | 文档与能力一致需白盒 docs 全量比对（源码能力 ↔ docs 文档逐条核对），本轮探针未覆盖 | 可拆为「可自动化核对的结构性断言」（如 SKILL 清单/工具清单 vs 文档章节） |
| D8-4 | 设计级 | P1 | NOT_RUN | 改用例 | 引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖 | 提供机器可判定的 getting-started 步骤清单脚本 |
| D8-6 | 设计级 | P2 | NOT_RUN | 改用例 | 中英文文档一致需中英双源逐段比对，本轮未覆盖 | 提供中英双源对照核对脚本 |
| D2-10 | 设计级 | P1 | BLOCKED | 补环境 | R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换）；缺多 profile 并存环境 | 补 KooCLI 多 profile 夹具 |
| D2-13 | 设计级 | P1 | BLOCKED | 补环境 | R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库），缺独立 S1 夹具 | 补隔离凭证夹具 |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | 供应链安装期安全需 npm 安装期抓包/SBOM 审计通道，缺 SBOM/抓包审计工具链 | 补 SBOM/审计通道 |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 确认令牌过期/重复确认边界需审批流 + 可注入时钟，缺可注入时钟夹具 | 补可注入时钟夹具 |
| D9-6 | 设计级 | P1 | BLOCKED | 调归属 | 跨客户端互通需多客户端并存环境（单机仅 Hermes），缺多客户端环境 | 调归属为多客户端并存机器执行 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D9-13 实测 tools/call 返回无 AK/SK/token 明文；D2-4 实测 show_profile_redacted 全 `<redacted>`）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`（真云最低配置创建 + 测后删除归零；只删本次 tctest-hermes-* 前缀资源）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针内置 redact，AK/SK 均 `***`；详见 D4-26/D8-9 缺陷为「未覆盖形态」而非「测试侧泄露」）
- 备注：`huaweicloud_auth_status` 报告 S3(obsutilconfig) 指纹 `8b93f4b3` 与 S1 `caae65f2` 不一致（`manualModified:true`，全机共享 obsutilconfig 跨 agent 污染），但 D2-1/D3-C13 OBS 建删实测通过（未造成 403），本轮仅记录不影响结论。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D4-14 / D3-S2 / realcloud） | 是（tctest-hermes-20260930-*） | 已删 | ListVpcs 不含本次资源 ✓ |
| OBS 桶（D3-C13） | 是（tctest-hermes-obs-*） | 已删 | `OBS rm -f` success ✓ |
| VPC（D4-20 拒绝路径） | 否（拒绝后零操作） | — | ListVpcs 不含 ✓ |
| FunctionGraph 函数（D3-S6） | 否（CreateFunction 报错未创建） | — | cleanup（未创建视为无残留）✓ |
| RDS 实例（D3-S7） | 否（CreateInstance 报错未创建） | — | 无残留 ✓ |
| 只读子账号写 VPC（D4-13） | 否（PolicyNotAuthorized） | — | 归零核实 created=false ✓ |

> 真云只删本次创建资源；删除前全量盘点 + 白名单（`tctest-hermes-*` 前缀），禁删既有/他人资源。残留即 FAIL——本日零残留。

---

## 八、遗留与建议

- 待裁决 SPEC（3 项，均非安全回归，需维护者确认契约哪侧为准）：`D8-9`（sanitizeValue 是否应脱敏）、`D9-9`（cancellation 是否应声明）、`D10-4`（规则库 16→19 条——其中 19 条建议确认新增 3 条 warn 规则为预期后修订用例计数）。
- 历史缺陷（file_issue.py 查重后转 HISTORY_LINKS.md 复核）：`D9-12`（上游 #814）及 D4-2/D4-21/D4-17/D4-25/D4-26/D8-9/D9-9 等在 v1.1.7 已提单项。
- 本轮 v1.1.8-next.1 实质修复：`D4-16`、`D4-23`、`D3-S3`、`D1-68`；部分修复 `D4-2`、`D10-3` → 建议 release 维护者确认这 6 项在 changelog 中标注。
- 建议（试用例/探针质量）：D3-C4 探针对 DMS/DEW（聚合服务，listOperations 返回 `{aggregate:true,subServices}` 而非顶层 command/result）断言需适配聚合服务形态；D6-4 探针硬编码 `40` 工具数已随工具增至 `41` 失效；D1-27/D4-11/D4-17/D8-7 探针存在正则误判（query echo/`placeholder` 词/`ok` 字段/聚合响应），建议后续校准探针断言、避免假阴性。