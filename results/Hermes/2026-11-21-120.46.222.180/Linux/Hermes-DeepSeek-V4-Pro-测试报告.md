# Hermes-DeepSeek-V4-Pro 每日测试报告
> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-11-21 05:28:00（北京时间）
> **执行归档**：`results/Hermes/2026-11-21-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项 + P0 SPEC-MISMATCH 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4-Pro` |
| OS / 架构 | `Linux aarch64`（宿主 hostname `ecs-hd-ai-work-00-0003`） |
| Node / npm / Python | `Node v22.23.5 / npm / Python 3.12.3` |
| 被测版本（SUT） | `1.1.15`（npm latest，gitHead `bf79b643`，PR #1166） |
| 源码仓库 hdk | checkout `bf79b643`（= v1.1.15） |
| 工具全集 | `49`（tools.mjs TOOL_DEFINITIONS，含新增 `huaweicloud_plan_manifest`/`huaweicloud_run_approved_manifest`） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI 配对版 7.3.12，`check_cli` 报 version_mismatch） |
| 真云凭证 | `cn-north-4`（AKSK 统一账号 hw018619646 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 43（总计 150） |

> **版本注记**：1.1.14 → 1.1.15 仅**新增**批量 manifest 审批能力（`huaweicloud_plan_manifest` + `huaweicloud_run_approved_manifest`，tools.mjs +222 行；hcloud-cli.mjs `createToken` 选项），未改动任何既有函数。本轮全量重跑复核：既有 FAIL/SPEC 与 1.1.14 完全一致；**D3-C1 本轮真机建删归零通过，较昨日(1.1.14) FAIL 恢复为 PASS**。

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E（D3-C1/C2/C3/C6/C7、D4-13/14/18/19/20/23/24、D2-1、D3-S2/S3/S4、EXP-C4-*）真机建删资源并归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `149`（PASS/FAIL/SPEC 均有真实执行+证据；`D1-39` Windows 专属在 Linux 标 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 17 / 0 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC = 149） | `86.6%` |
| P0 / P1 / P2 缺陷（FAIL） | `4 / 9 / 4`（共 17） |
| SPEC-MISMATCH | `3`（D10-4 P0 / D9-9 P1 / D8-9 P2） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本轮全部归零`（真云 E2E 建删复核无残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `89` | 有证据且通过 PASS 门禁 |
| FAIL | `17`（含展开级拆分前设计级 FAIL 14） | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | D10-4 / D9-9 / D8-9 契约漂移 |
| NOT_RUN | `1` | D1-39（Windows 专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `40` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | EXP-C4-14（DMS）/ EXP-C4-18（DEW）/ EXP-E01（云主机） |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏—小写 ak/sk + JSON 带引号 key 未脱敏 | `safety-policy.mjs` redactString 正则大小写敏感 | 历史已提单 |
| 2 | P0 | `D4-2` | D4安全 | 凭证 env 打印拦截漏裸 access_key | `safety-policy.mjs` env-dump 正则未覆盖裸 access_key | 历史已提单 |
| 3 | P0 | `D4-21` | D4安全 | 制品预检漏拦 HCL actions=["*"]/托管策略 | `cloud-risk-rules.json` hwc-iam-admin-policy 仅匹配 JSON | 历史已提单 |
| 4 | P0 | `D9-12` | D9协议 | initialize 握手基线：非法时序 tools/list 未拒 -32600 | `mcp-protocol.mjs` dispatch 无 initialize 前置状态机 | 历史已提单 |
| 5 | P1 | `D3-C4` | D3功能 | DMS/DEW 两服务 list_operations 无路由 | `tools.mjs` list_operations 未返回 command/result | 历史已提单 |
| 6 | P1 | `D3-S7` | D3功能 | 跨服务交付 RDS 缺 db.password + 部署目标未命中 | `tools.mjs` RDS 最小参数集 + routeMap | 历史已提单 |
| 7 | P1 | `D4-4` | D4安全 | 写操作审批门漏拦截 Change* 写动词 | `safety/policy.json:27` writeOperationPrefixes 缺 Change | 历史已提单 |
| 8 | P1 | `D4-6` | D4安全 | adminPass 回显警告缺失（command 阶段未覆盖） | `cloud-risk-rules.json` hwc-command-adminpass-exposure | 历史已提单 |
| 9 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open | `risk-rule-engine.mjs` 无命中默认 allow | 历史已提单 |
| 10 | P1 | `D10-3` | D10评测 | 路由准确率 92.9%（缺「云主机」同义词） | `tools.mjs` routeMap ECS 关键词缺「云主机」 | 历史已提单 |
| 11 | P1 | `EXP-C4-14` | D3功能 | DMS 只读规划冒烟失败 | `tools.mjs` list_operations(DMS) | 历史已提单 |
| 12 | P1 | `EXP-C4-18` | D3功能 | DEW 只读规划冒烟失败 | `tools.mjs` list_operations(DEW) | 历史已提单 |
| 13 | P1 | `EXP-E01` | D10评测 | 「云主机」意图路由 MISS | `tools.mjs` routeMap 缺「云主机」别名 | 历史已提单 |
| 14 | P2 | `D3-S5` | D3功能 | 复合意图分层路由未拆分 | `tools.mjs` serviceCatalog 单意图匹配 | 历史已提单 |
| 15 | P2 | `D3-S6` | D3功能 | FunctionGraph 最小参数集缺 code | `tools.mjs` CreateFunction 缺 code | 历史已提单 |
| 16 | P2 | `D4-25` | D4安全 | Python hook 写命令遥测分类 cli:invoke(应 cli:write) | `hooks/huaweicloud-safety.py` WRITE_OPERATION_RE 前置捕获组 | 历史已提单 |
| 17 | P2 | `D4-26` | D4安全 | findings 证据脱敏 JSON 带引号 key 残留 | `risk-rule-engine.mjs` redactEvidence | 历史已提单 |

### 根因详情（SPEC-MISMATCH）

| 级别 | 用例 | 漂移点 |
|---|---|---|
| P0 | `D10-4` | 规则库实为 19 条(9 deny + 10 warn)，用例断言「16 条(9 deny + 7 warn)」计数滞后，属**测试侧改用例**（非产品缺陷） |
| P1 | `D9-9` | initialize `capabilities` 仅 `{tools:{}}`，未声明 `cancellation`（SPEC 契约要求） |
| P2 | `D8-9` | `sanitizeValue` 无 AK/SK/token 脱敏分支（SPEC:契约要求移除敏感值） |

> 完整字段级「现象/断言/根因/证据」见 `FINDINGS.md`（共 19 条缺陷记录 + 1 条非产品缺陷）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 用例 OS 列标注「专属」= Windows，本机为 Linux；Linux 侧由展开级 `EXP-NR3-10`（disttags 探针，本次 PASS）代表覆盖 | 调归属（OS 专属） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（探针均用假凭证/隔离 HOME；D2-4/D4-26/D8-9 为脱敏能力缺口，已记 FINDINGS，非本轮实际泄露）
- [x] 写操作误判 read-only：`无`（写命令均判 deny/write；D4-4 为「写动词漏拦截为 allow」，非「read-only 误判」）
- [x] 红线（I 类）违规：`无`（无 mock 假跑，真云 E2E 建删归零真实执行）
- [x] 脱敏复核：`D2-4 / D4-26 / D8-9` 存在脱敏缺口（已记 FINDINGS #1/#16/#19）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | CreateServers（最小规格 s6.small.1） | DeleteServers 含磁盘 | ✅ ListServersDetails 无本次 `tctest-hermes-ecs-*` |
| VPC/子网（D3-C1） | CreateVpc/CreateSubnet | DeleteSubnet/DeleteVpc | ✅ cleanOk=true，ListVpcs/ListSubnets 无本次资源 |
| VPC（D3-S2） | CreateVpc（tctest-hermes-s2-*） | 确认后 DeleteVpc | ✅ 归零验证 true |
| OBS（D3-C2） | mb + 静态站 | rm -r -f + rm -f | ✅ 删桶归零 |
| OBS（D3-C13） | mb + set website | OBS rm -f | ✅ 删除归零 |
| EIP（D3-C7） | CreatePublicip | DeletePublicip | ✅ 释放 ok |
| EIP（D4-14） | CreateVpc 审计 | DeleteVpc | ✅ 归零验证 ListVpcs 不含本次 |
| 沙箱会话（D3-C3/C6、D3-S3） | connect | close_session | ✅ 会话关闭 |
| D4-13 只读子账号 | 写 CreateVpc 被 IAM 拒绝 | — | ✅ created=false（零创建） |
| D3-S7 RDS | CreateInstance 失败（db.password） | — | ✅ 未创建任何资源 |

> **归零结论**：本轮所有真云用例建删资源均已归零并独立 List 复核（无 `tctest-hermes-*`/`testbot1` 残留）。共享账号内另有**其他 testbot 并发 agent**（testbot2-dsh / testbot3-hermes / testbot5-hermes）的在途资源与历史 `tctest-s7-*` 残留，**非本客户端（testbot1）创建，按红线「只删本次创建」不动它们**。

---

## 八、遗留与建议

1. **新增功能覆盖缺口（1.1.15）**：本轮被测版本新增「批量 manifest 审批」能力（`huaweicloud_plan_manifest` / `huaweicloud_run_approved_manifest`，tools.mjs +222 行），但 daily 用例矩阵**尚无覆盖该能力的用例**（无 D4-*/EXP-* 断言 manifest 审批门、digest 防篡改、continueOnError、审批令牌抽取）。建议补 D4 安全维度用例 + D3 功能维度用例。
2. **待裁决 SPEC**：D10-4（规则计数滞后）为测试侧改用例，非产品缺陷；D9-9（cancellation 未声明）、D8-9（sanitize 无脱敏）待维护者裁决契约意图。
3. **历史缺陷一致性**：17 项 FAIL + 3 项 SPEC 均与 1.1.14 一致（本版本仅 additive 变更），file_issue.py 查重后生成 HISTORY_LINKS.md 关联历史单。
4. **D3-C1 异步清理波动**：本轮 ECS 建删归零通过，但该用例在历史多日复现过「删除提交未轮询任务完成致 ECS/VPC 残留」的间歇性缺陷，建议持续关注（历史单已提）。
5. **KooCLI 版本漂移**：本机 hcloud 7.2.12 vs 插件配对版 7.3.12（`check_cli` 报 version_mismatch），为环境侧非功能缺陷，建议维护者统一各测机 hcloud 版本。