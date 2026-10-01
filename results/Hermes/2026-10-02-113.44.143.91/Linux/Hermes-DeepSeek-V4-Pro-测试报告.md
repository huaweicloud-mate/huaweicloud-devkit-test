# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-10-02 05:35（北京时间）
> **执行归档**：`results/Hermes/2026-10-02-113.44.143.91/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（存在 19 项 FAIL + 3 项 SPEC-MISMATCH）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro |
| OS / 架构 | Linux（6.8.0-106-generic，x86_64，hostname `ecs-hd-ai-work-00-0007`） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b474`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | KooCLI 7.2.12（doctor/credentials 已配置） |
| 真云凭证 | cn-north-4（AK/SK + 只读子账号 test001 均就绪，真机执行） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E / eval harness |
| daily 基础用例 | 设计级 102 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数与钩子，真实执行断言；CLI 真机执行（install/doctor/status/hcloud）；真云用例最低规格创建→测后删除归零；证据按用例 ID 落 `evidence/<case-id>/`（probe.mjs + stdout.log），回填执行状态/时间/evidencePath。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `145`（设计级 102 + 展开级 43） |
| 已执行 | `143`（2 项 NOT_RUN：D1-39 OS 专属、D3-S7 复合真云交付） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `121 / 19 / 0 / 3 / 2` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `84.6%`（121/143） |
| P0 / P1 / P2 缺陷 | `4 / 13 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（真云建删用例均核验 resource 归零） |

---

## 三、状态汇总

### 3.1 设计级（102）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 82 | 有证据且通过 PASS 门禁 |
| FAIL | 15 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 3 | 契约漂移（D1-68 / D8-9 / D9-9） |
| NOT_RUN | 2 | D1-39（Windows 专属，本机 Linux）；D3-S7（真云复合交付未覆盖） |
| **合计** | **102** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 39 | 有证据且通过 PASS 门禁 |
| FAIL | 4 | EXP-C4-14 / EXP-C4-18 / EXP-E01 / EXP-E08 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **43** | |

---

## 四、缺陷清单（22 项，详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D2-4 | redactString 大小写敏感，小写 ak=/sk= 未脱敏 | safety-policy.mjs:46 | 待提单 |
| 2 | P0 | D4-3 | blockedSecretOperations 含 ShowSecret 过度封禁 | safety/policy.json:26 | 待提单 |
| 3 | P0 | D4-5 | writeOperationPrefixes 缺 Change* 系列动词 | policy.json（safety-policy.mjs/hook） | 待提单 |
| 4 | P0 | D9-12 | dispatch 无 initialize 状态机，非法时序未返 -32600 | mcp-protocol.mjs | 待提单 |
| 5 | P1 | D4-4 | 审批门仅拦普通 Create，Change* 漏放行 | policy.json | 待提单 |
| 6 | P1 | D4-8 | Python/Node 策略不一致，前置捕获组误判 | huaweicloud-safety.py:46 | 待提单 |
| 7 | P1 | D4-11 | extractHcloudSubcommand 未覆盖自然语言注入 | safety-policy.mjs:554-560 | 待提单 |
| 8 | P1 | D4-17 | hook 解析异常走 allow（fail-open） | huaweicloud-safety.mjs/.py | 待提单 |
| 9 | P1 | D4-27 | redactOutput 复用大小写敏感正则，双路径泄密 | safety-policy.mjs:46 | 待提单 |
| 10 | P1 | D9-2 | 无效/缺参 tools/call 未构造 -32602 | mcp-protocol.mjs | 待提单 |
| 11 | P1 | D9-9 | capabilities 未声明 notifications/cancellation | mcp-server.mjs | 待提单 |
| 12 | P1 | D3-S1 | routeMap 中文缺「云主机」，ECS 路由 miss | tools.mjs serviceCatalog | 待提单 |
| 13 | P1 | D3-S3 | 沙箱 deploy_check 公网预览 URL 链路未通 | sandbox（devbridge_tunnel） | 待提单 |
| 14 | P1 | EXP-C4-14 | DMS 聚合服务需二次路由 | tools.mjs list_operations | 待提单 |
| 15 | P1 | EXP-C4-18 | DEW 聚合服务需二次路由 | tools.mjs list_operations | 待提单 |
| 16 | P1 | EXP-E01 | routeMap 缺「云主机」，中文意图 MISS | tools.mjs routeMap | 待提单 |
| 17 | P1 | EXP-E08 | 诊断意图 explain_error 无 routeMap 映射 | tools.mjs serviceCatalog | 待提单 |
| 18 | P2 | D3-S5 | 分层关键词未命中 Sandbox | tools.mjs layered-route | 待提单 |
| 19 | P2 | D4-25 | 写操作落 cli:invoke 而非 cli:write | huaweicloud-safety.py:46 | 待提单 |
| 20 | P2 | D4-26 | findings 证据 redactEvidence 未覆盖 --ak 空格/小写 sk= | risk-rule-engine.mjs:19-25 | 待提单 |
| 21 | P2 | D1-68 | HW_REGION 优先于契约（SPEC-MISMATCH） | region-priority 逻辑 | 待提单 |
| 22 | P2 | D8-9 | sanitizeValue 未脱敏（SPEC-MISMATCH） | sanitizeValue 实现 | 待提单 |

> 完整根因（文件+行号+代码）见 `FINDINGS.md`，为 `file_issue.py` 的统一提单解析输入。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属升级检测链（EINVAL 语义），本机为 Linux；由展开级 EXP-NR3-10 代表覆盖，Linux 侧 P0 已覆盖 | OS 列已标注「专属」，无需改 |
| D3-S7 | 设计级 | P1 | NOT_RUN | 补环境 | 场景-跨服务交付（Web 应用 + RDS 并归零）：需一次性编排 RDS 实例（10+ 分钟按需计费）+ 沙箱部署 + 连接串注入 + 读写验证 + 归零，本轮未覆盖该复合真云交付场景 | 建议拆分为子用例（RDS 建删归零 / 沙箱部署出 URL / 连接串注入），单步可测；或标注需真云+时长计费配额 |

> 展开级「归本客户端/OS」用例已在 init_day 预筛后全量执行，无 NOT_RUN。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云凭证仅经 run-as-readonly.py 注入 env，不落盘）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针使用 REDACT 值，未落真实 AK/SK）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-S2） | 是 | 是 | 删除后 ListVpcs 不再含 vpcId=true |
| OBS 桶（D3-C13） | 是 | 是 | 删除后 status=204 |
| FunctionGraph 函数（D3-S6） | 是 | 是 | 删除后 ListFunctions 不再含=true |
| D4-13 只读建 VPC（被拒无资源） | 否 | — | write 被 IAM 拒绝，无残留 |

> 真云只删本次创建的、带 `hdk1-` 前缀时间戳资源；删除前全量 List* + 白名单，未触碰既有人/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC（契约漂移，需维护者定夺）：D9-9（notifications/cancellation 未声明）、D8-9（sanitizeValue 未脱敏）、D1-68（HW_REGION 优先级）。
- 本轮未覆盖（说明范围）：D3-S7 复合真云多服务交付（需 RDS+沙箱+时长计费配额）；多终端矩阵（非 Hermes 客户端已由 init_day 预筛剔除）。
- 较昨日变化：D4-13「最小权限凭证通过率」由 FAIL → PASS（只读子账号 test001 真机实测：只读可用 + 写被 IAM 拒），只读凭证链路已就绪。
- 建议：优先修复 P0 四项（D2-4 脱敏大小写、D4-3 ShowSecret 过度封禁、D4-5 Change* 写操作漏放行、D9-12 握手无状态机），其中 D2-4/D4-5/D9-12 属安全红线面。