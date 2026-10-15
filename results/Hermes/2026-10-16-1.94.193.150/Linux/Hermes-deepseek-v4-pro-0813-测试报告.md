# Hermes-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-16 05:28:12（北京时间）
> **执行归档**：`results/Hermes/2026-10-16-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.9-next.0`（npm @next，gitHead `6302921c`） |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：43 批探针（`run_all.sh` 编排）——源码级 `.mjs` 探针直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classify/hook/auth/protocol/extended/supplement/d8/d1/safety/scenario 等）+ spawn `mcp-server.mjs` 驱动 MCP 协议（D9/D10/routing/eval-harness）+ 真云 E2E（`realcloud_e2e.mjs`：D3-C1/C2/C3/C6/C7）+ 只读子账号（D4-13）+ 真云建删资源归零。证据统一落 `evidence/<case-id>/stdout.txt`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `122 / 12 / 9 / 3 / 4` |
| 通过率（分母 = PASS+FAIL = 134） | `91.0%` |
| P0 / P1 / P2 新增缺陷 | `3 / 5 / 4` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `归零（今日建 OBS / 沙箱 / EIP 均测后删除归零；ECS/VPC/subnet 因配额耗尽未创建，无残留）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `80` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `9` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `4` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 2 | P2 | `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | TODO: 待补根因 | 待提单 |
| 3 | P1 | `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | TODO: 待补根因 | 待提单 |
| 4 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | TODO: 待补根因 | 待提单 |
| 5 | P1 | `D4-6` | D4安全 | adminPass回显警告 | TODO: 待补根因 | 待提单 |
| 6 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | TODO: 待补根因 | 待提单 |
| 7 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | TODO: 待补根因 | 待提单 |
| 8 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补根因 | 待提单 |
| 9 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | TODO: 待补根因 | 待提单 |
| 10 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补根因 | 待提单 |
| 11 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | TODO: 待补根因 | 待提单 |
| 12 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> 完整「期望 / 实际 / 根因（文件:行号）/ 证据」见同目录 `FINDINGS.md`（14 项产品缺陷逐条，含 3 SPEC-MISMATCH：D9-9 / D8-9 / D10-4）。

| 用例ID | 根因（文件:行号） |
|---|---|
| `D4-2` | `safety-policy.mjs:515` env-dump 正则 `/HUAWEICLOUD\|HWC_\|HW_\|HCLOUD\|OS_/i` 不匹配 generic `access_key` |
| `D4-21` | `safety/rules/cloud-risk-rules.json:196` 规则 `hwc-iam-admin-policy` 未覆盖 HCL `actions=["*"]` / `AdministratorFullAccess` |
| `D9-12` | `mcp-protocol.mjs:32-41` initialize 未调 `runVersionCheck`；`mcp-protocol.mjs:55-57` `tools/list` 无 initialize 前置状态机 |
| `D4-6` | `safety/rules/cloud-risk-rules.json:68` `hwc-command-adminpass-exposure` `stages` 缺 `command` 阶段 |
| `D4-17` | `risk-rule-engine.mjs:106` `evaluate()` 无规则命中默认 `allow`（fail-open） |
| `D4-25` | `hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置捕获组要求前缀为行首/字母数字，空格前永不匹配 |
| `D9-9` | `mcp-protocol.mjs:47-49` initialize capabilities 仅 `{tools:{}}`，未声明 `cancellation` |
| `D10-3` | `tools.mjs:1985-2000` `routeMap` 缺口语化别名「云主机」（EXP-E01 未命中） |
| `D3-S7` | `tools.mjs:1985` `routeMap` 无 Web 部署目标意图分解；RDS 最小实例需 vpc/subnet/sg 前置 |
| `D4-26` | `risk-rule-engine.mjs:19` `redactEvidence` 正则不匹配 JSON 带引号 key `"adminPass":"..."` |
| `D3-S5` | `tools.mjs:1985` `routeMap` 无复合意图多路分解逻辑 |
| `D3-S6` | FunctionGraph `CreateFunction` 最小场景参数集不被 API 稳定接受（`function_name`↔`code.filename` 浮动） |
| `D8-9` | `telemetry/telemetry.mjs:189` `sanitizeValue` 仅去换行/截断，无 AK/SK/token 脱敏 |
| `D10-4` | `safety/rules/cloud-risk-rules.json` 规则 16→19 条（新增 3 warn），用例断言计数未同步 |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】Windows 专属用例（OS 列标注「专属」），Linux 侧由 EXP-NR3-10(disttags 探针 queryDistTags 返回对象、无 EINVAL)代表覆盖 |
| `D8-1` | D8质量 | 文档与能力一致 | 【改用例】需白盒 docs 全量比对，本轮未覆盖；建议提供可机器判定的文档↔能力映射清单 |
| `D8-4` | D8质量 | 引导步骤可机械执行 | 【改用例】需逐条核验 getting-started 步骤，本轮未覆盖；建议落到可脚本化步骤断言 |
| `D8-6` | D8质量 | 中英文文档一致 | 【改用例】需中英双源逐段比对，本轮未覆盖；建议提供中英对照抽取脚本 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D2-10` | D2认证 | R7 current档跟随 | 【补环境】R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换） |
| `D2-13` | D2认证 | R9 configuredBySession优先env | 【补环境】R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库） |
| `D3-C1` | D3功能 | ECS生命周期E2E | 【补环境】VPC router 配额耗尽(VPC.0114 OverQuota ['router'])：CreateVpc 失败→subnet/ECS 建链无法进行，ECS 生命周期真云 E2E 真机段无法执行；上一版测试侧清理缺陷(realcloud_e2e.mjs DeleteServers 缺 --delete_volume)已被上游 commit ddcbaa865/8ed45f93f 修复，但本轮因配额无法复测；解除=清理泄漏的 testbot1-hermes-e2e-* 及 devkit-bench-* VPC 或提配额后隔离重跑 |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | 【补环境】VPC router 配额耗尽(VPC.0114)：CreateVpc 返回空 id，VPC 建→plan deny→确认删除→归零 确认流真机段无法执行；解除=清理泄漏 VPC/提配额 |
| `D4-12` | D4安全 | 供应链安装期安全 | 【补环境】供应链安装期安全需 npm 安装期抓包/SBOM 审计通道 |
| `D4-13` | D4安全 | 最小权限凭证通过率 | 【补环境】VPC router 配额耗尽(VPC.0114)：写操作 CreateVpc 命中配额错误而非 IAM 最小权限拒绝，writeDenied 无法干净判定(readPassRate 83%：CES ListMetrics 被标 denied=true 但返回了 metrics 数据，待复核)；解除=清理泄漏 VPC/提配额后隔离重跑 |
| `D4-14` | D4安全 | 操作可审计性 | 【补环境】VPC router 配额耗尽(VPC.0114)：真云 CreateVpc 失败，create→audit→delete 链路无法验证；解除=清理泄漏 VPC/提配额 |
| `D4-24` | D4安全 | 确认令牌过期与重复确认边界（审批流健壮性） | 【补环境】确认令牌过期/重复确认边界需审批流 + 可注入时钟 |
| `D9-6` | D9协议 | 跨客户端互通 | 【调归属】跨客户端互通需多客户端并存环境（单机仅 Hermes） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（CLI/真云操作均走脱敏，证据目录无明文 AK/SK）
- [x] 写操作误判 read-only：`0`（D4-13 最小权限写拒绝因 VPC 配额未干净判定，属断言待复核，非误判）
- [x] 红线（I 类）违规：`无`（真云只建本次资源、测后归零；今日 ECS/VPC/subnet 因配额未创建，无残留）
- [x] 脱敏复核：`已复核`（evidence 目录 stdout.txt 无原始凭证/未脱敏明文）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2 / D3-C13） | 是 | 已删 | `rm -f` success / removed，无残留 |
| 沙箱会话（D3-C3 / D3-C6 / D3-S3） | 是 | close_session ok | 无残留 |
| EIP（D3-C7） | 是 | DeletePublicip | ListEips 无本次 id |
| VPC/subnet/ECS（D3-C1 / D3-S2 / D4-14） | 否（配额耗尽未创建） | — | 归零=true，无残留 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单。本轮因 VPC 配额耗尽未创建 VPC，基线盘点 5 个 VPC 均为前序残留（非本轮创建），未触碰。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities.cancellation 未声明）、`D8-9`（sanitizeValue 未脱敏 AK/SK/token）、`D10-4`（规则库 16→19 条计数漂移）
- 环境阻塞：`VPC router 配额 5/5 耗尽`——泄漏 VPC `testbot1-hermes-e2e-*`×2 + `devkit-bench-*`×2 + `tctest-diag2`；解除后隔离重跑 D3-C1/D3-S2/D4-13/D4-14
- 已修复（测试侧）：`D3-C1` 真云清理缺陷（realcloud_e2e.mjs commit `ddcbaa865`/`8ed45f93f`）
- 建议：① 上游优先修复 P0（D4-2 / D4-21 / D9-12 / D10-4）；② 建立 VPC 泄漏周期清理任务，避免配额耗尽反复阻塞真云用例
