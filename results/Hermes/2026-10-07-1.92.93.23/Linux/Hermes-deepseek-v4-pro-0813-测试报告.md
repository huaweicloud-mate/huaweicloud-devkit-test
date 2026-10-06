# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-10-07 05:20`（北京时间）
> **执行归档**：`results/Hermes/2026-10-07-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 P0 FAIL，且有 3 例因主账号凭证失效转 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ECS `ecs-hd-ai-work-00-0007`，IP 1.92.93.23） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12 |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b474`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 确认已配置） |
| 真云凭证 | cn-north-4（主账号 AKSK 预置 + 只读子账号 test001 下发） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 102 / 展开级 43 / 追踪表 211 行 |

> **执行方法**：38 批探针（.mjs/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn mcp-server 驱动协议 + 真云 E2E 建删资源；决策/结果落 `evidence/<case-id>/stdout.txt`。本日被测版本与 2026-10-05/10-06 相同（`1.1.8-next.1` / `ffd7b474`，prepare_env 自动取 latest/next 中版本更高者），38 批探针对 `ffd7b474` 全量 fresh 重跑。

> **⚠️ 本日关键环境变化（非代码回归）**：主账号（hw018619646）AK/SK 于 2026-10-07 起被 IAM 拒绝——`hcloud ECS/VPC/CTS/RDS` 真机 API 一律返回 `APIGW.0301 Incorrect IAM authentication information: Unauthorized`（+`project_id required`）。昨日（2026-10-06）同凭证可正常建删 VPC。只读子账号 test001 仍有效（6/6 只读通过 + 写操作被 PolicyNotAuthorized 拒绝），OBS（obsutil 独立凭证）仍有效。据此，凡依赖主账号真机 API 建删资源的用例（D4-14、D3-S1、D3-S2）如实转 `BLOCKED`，其余用例不受影响。14 项产品缺陷（11 FAIL + 3 SPEC）与 10-06 逐条一致，无新修复、无新回归。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 102 + 展开级 43 |
| 已执行 | 设计级 98（4 条 NOT_RUN 为文档比对/OS 专属）+ 展开级 43 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（设计级） | `76 / 11 / 8 / 3 / 4` |
| PASS / FAIL（展开级） | `42 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，设计级） | `84.4%`（76/90） |
| 通过率（展开级） | `97.7%`（42/43） |
| P0 / P1 / P2 缺陷 | `4(3 FAIL+1 SPEC) / 6(5 FAIL+1 SPEC) / 4(3 FAIL+1 SPEC)` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `主账号失效致真云建删未发生（无本次资源创建）；OBS/沙箱正常归零；仅 OBS 桶 tctest-hermes-obs-mux6b4nc 建删归零 ✓` |

> **较 v1.1.7 进展（同 10-05/10-06 结论）**：修复 4 项——D4-16（env-dump shell 包裹）、D4-23（全局规则 mdc 注入）、D3-S3（沙箱预览出 URL）、D1-68（区域 env 变量）；部分修复 2 项——D4-2（`HW_` 前缀已拦截）、D10-3（路由准确率 21.4%→92.9%）。SPEC 漂移 1 项 D10-4（规则库 16→19 条）。本日 38 批探针 fresh 重跑，产品缺陷结论与 10-06 逐用例一致。

---

## 三、状态汇总

### 3.1 设计级（102 行，OS 专属豁免 1）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 76 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | 不符预期，根因见缺陷清单（FINDINGS #1/#2/#5/#6/#7/#9/#10/#11/#12/#13 + 历史 #3） |
| BLOCKED | 8 | 环境阻塞，见 §五（其中 3 例为主账号 AK/SK 失效致真机 API 不可达） |
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
| 4 | P0 | D10-4 | 规则库 16→19 条断言漂移 | cloud-risk-rules.json（19 规则） | 待提单 |
| 5 | P1 | D4-6 | hook_check_command --admin-pass 不告警 | cloud-risk-rules.json:68（stages 缺 command） | 待提单 |
| 6 | P1 | D4-17 | hook 模糊输入 fail-open | risk-rule-engine.mjs:103-106 | 待提单 |
| 7 | P1 | D4-25 | Python hook 写遥测误分类 cli:invoke | huaweicloud-safety.py:46 | 待提单 |
| 8 | P1 | D9-9 | capabilities.cancellation 未声明 | mcp-protocol.mjs:45-49 | 待提单 |
| 9 | P1 | D10-3 | serviceCatalog「云主机」未命中 92.9% | tools.mjs:1968 routeMap | 待提单 |
| 10 | P1 | D3-S7 | RDS 复合意图部署目标未命中 + 创建前置缺失 | tools.mjs:1968 + RDS 前置 | 待提单 |
| 11 | P2 | D4-26 | findings.evidence JSON key 明文泄漏 | risk-rule-engine.mjs:19-23 | 待提单 |
| 12 | P2 | D3-S5 | 复合意图分层路由未分解 | tools.mjs:1968 routeMap | 待提单 |
| 13 | P2 | D3-S6 | FunctionGraph 创建函数参数校验未通过（未生成 URN） | 场景缺代码归档 | 待提单 |
| 14 | P2 | D8-9 | sanitizeValue 未脱敏 AK/SK/token | telemetry.mjs:189-191 | 待提单 |

> 完整「现象 + 唯一断言 + 根因 + 证据」见同目录 `FINDINGS.md`（`file_issue.py` 解析输入）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列「Windows（升级检测链 EINVAL 专属…）」）；Linux 侧由 EXP-NR3-10（disttags 探针，实测 queryDistTagsSync/queryDistTags 无 EINVAL）代表覆盖 | — |
| D8-1 | 设计级 | P2 | NOT_RUN | 改用例 | 文档与能力一致需白盒 docs 全量比对，本轮探针未覆盖 | 拆为可自动化核对的结构性断言 |
| D8-4 | 设计级 | P1 | NOT_RUN | 改用例 | 引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖 | 提供机器可判定的 getting-started 步骤清单脚本 |
| D8-6 | 设计级 | P2 | NOT_RUN | 改用例 | 中英文文档一致需中英双源逐段比对，本轮未覆盖 | 提供中英双源对照核对脚本 |
| D2-10 | 设计级 | P1 | BLOCKED | 补环境 | R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换） | 补 KooCLI 多 profile 夹具 |
| D2-13 | 设计级 | P1 | BLOCKED | 补环境 | R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） | 补隔离凭证夹具 |
| D3-S1 | 设计级 | P1 | BLOCKED | 补环境 | 主账号 AK/SK 失效：run_readonly ListServersDetails 返回 APIGW.0301 Unauthorized（昨日返回 servers=[]）。「只读命令返回实例清单」真机断言无法验证 | 维护者轮换主账号凭证 |
| D3-S2 | 设计级 | P1 | BLOCKED | 补环境 | 主账号 AK/SK 失效：场景「删VPC先确认」的 VPC 创建/删除归零无法真机执行（confirm-not-deny 本地层已 PASS，仅真机建删受阻） | 维护者轮换主账号凭证 |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | 供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 | 补 SBOM/审计通道 |
| D4-14 | 设计级 | P2 | BLOCKED | 补环境 | 主账号 AK/SK 失效：「建 VPC→查 CTS→删→归零」真机闭环无法执行（CreateVpc/ListVpcs/CTS 全返回 APIGW.0301 Unauthorized），昨日同凭证可建删归零 | 维护者轮换主账号凭证 |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 确认令牌过期/重复确认边界需审批流 + 可注入时钟 | 补可注入时钟夹具 |
| D9-6 | 设计级 | P1 | BLOCKED | 调归属 | 跨客户端互通需多客户端并存环境（单机仅 Hermes） | 调归属为多客户端并存机器执行 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D9-13 实测 tools/call 返回无 AK/SK/token 明文；D2-4 实测 show_profile_redacted 全 `<redacted>`）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`（真云合规：本轮主账号失效致写资源未创建，无本次资源残留；D4-13 只读子账号写操作被 PolicyNotAuthorized 正确拒绝）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针内置 redact，AK/SK 均 `***`；D4-26/D8-9 缺陷为「未覆盖形态」而非「测试侧泄露」）
- 备注：本日 D3-C13 OBS 走 `hcloud OBS mb/rm`（obsutil 委托独立凭证）实测建删归零均 success；主账号凭证失效仅影响 `hcloud ECS/VPC/CTS/RDS` 真机 API，不影响 OBS/沙箱/本地路由/审批流。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D4-14 / D3-S2） | 否（主账号 AK/SK 失效，CreateVpc 返回 Unauthorized） | —（未创建视为无残留） | ListVpcs 无法真机执行，但本地确认未创建 ✓ |
| OBS 桶（D3-C13） | 是（tctest-hermes-obs-mux6b4nc） | 已删 | `OBS rm -f -> success` ✓ |
| 沙箱会话（D3-S3） | 是（connect/upload/deploy） | close_session | 会话正常关闭 ✓ |
| VPC（D4-20 拒绝路径） | 否（拒绝后零操作） | — | 拒绝流 decision=deny ✓ |
| FunctionGraph 函数（D3-S6） | 否（CreateFunction 参数校验未通过未创建） | — | cleanup（未创建视为无残留）✓ |
| RDS 实例（D3-S7） | 否（CreateInstance 参数/前置缺失未创建） | — | 无残留 ✓ |
| 只读子账号写 VPC（D4-13） | 否（PolicyNotAuthorized） | — | 归零核实 created=false ✓ |

> 真云只删本次创建资源。本日主账号失效导致 VPC 建删未能真机执行（已如实标 BLOCKED，未伪造 PASS）；唯一实际创建并归零的资源为 OBS 桶（tctest-hermes-obs-mux6b4nc，obsutil 独立凭证有效）。

---

## 八、遗留与建议

- **本日环境告警**：主账号（hw018619646）AK/SK 于 2026-10-07 起被 IAM 拒绝（`APIGW.0301 Unauthorized`），导致真云 VPC/ECS/CTS/RDS 用例（D4-14、D3-S1、D3-S2）真机执行受阻。**请维护者轮换主账号 AK/SK 并同步 `~/.config/huaweicloud/credentials.json` + KooCLI default profile 后复测这 3 例**。只读子账号 test001 与 OBS（obsutil）凭证仍有效，D4-13、D3-C13 等不受影响。
- **观察项（待裁决，非本轮产品缺陷）**：`huaweicloud_auth_status`/`huaweicloud_check_cli` 对失效凭证仍报 `authenticated=true`/`kooCliStatus=ok`（仅做本地配置存在性检查，未做云端凭证有效性校验），建议维护者评估是否在 `auth status`/`check_cli` 增加一次云端探活（如 `hcloud VPC ListVpcs`）以区分「配置存在」与「凭证有效」。
- 待裁决 SPEC（3 项，均非安全回归）：`D8-9`（sanitizeValue 是否应脱敏）、`D9-9`（cancellation 是否应声明）、`D10-4`（规则库 16→19 条）。
- 历史缺陷（file_issue.py 查重后转 HISTORY_LINKS.md 复核）：`D9-12`（上游 #814）及 D4-2/D4-21/D4-17/D4-25/D4-26/D8-9/D9-9 等在 v1.1.7 已提单项。
- 本轮 v1.1.8-next.1 实质修复（较 v1.1.7，本日续确认）：`D4-16`、`D4-23`、`D3-S3`、`D1-68`；部分修复 `D4-2`、`D10-3`。
- 建议（试用例/探针质量）：D3-C4 探针对 DMS/DEW（聚合服务，listOperations 返回 `{aggregate:true,subServices}` 而非顶层 command/result）断言需适配聚合服务形态；D6-4 探针硬编码 `40` 工具数已随工具增至 `41` 失效；D1-27/D4-11/D4-17/D8-7 探针存在正则误判，建议校准探针断言避免假阴性。