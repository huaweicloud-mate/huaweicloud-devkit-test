# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-29 21:30（北京时间）
> **执行归档**：`results/Hermes/2026-10-29-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（存在 FAIL 缺陷，通过率 86.3%）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux (aarch64) |
| Node / npm / Python | Node v22.13.0 / npm 10 / Python 3.12 |
| 被测版本（SUT） | `v1.1.12`（npm latest，gitHead `4ed07801`） |
| 工具全集 | 40 MCP 工具（huaweicloud_*）+ CLI |
| hcloud / 依赖 | hcloud 7.2.12（plug 配对 7.3.12，version_mismatch）/ doctor 已确认 |
| 真云凭证 | cn-north-4（AKSK 管理员 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 43 / 追踪表 216 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（file:// URL），决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云 E2E 建删资源归零；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily 设计级+展开级） | `150` |
| 已执行 | `150` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 17 / 3 / 3 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `86.3%` |
| P0 / P1 / P2 新增缺陷 | `5 / 10 / 5` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/OBS/EIP/VPC 建删归零，无残留）` |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 86 | 有证据且通过 PASS 门禁 |
| FAIL | 14 | 不符预期，根因见缺陷清单 |
| BLOCKED | 3 | 沙箱服务维护中（D3-C3/D3-C6/D3-S3） |
| SPEC-MISMATCH | 3 | D10-4 / D8-9 / D9-9 |
| NOT_RUN | 1 | D1-39 Windows 升级检测链专属（OS 列标注「专属」），Linux 侧由 EXP-NR3-10 覆盖 |
| **合计** | **107** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 40 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | EXP-E01 / EXP-C4-14 / EXP-C4-18 |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **43** | |

---

## 四、缺陷清单（详尽）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D2-4 | 小写 ak=/sk= 与 JSON 带引号 key 脱敏失效 | safety-policy.mjs:45 (`(AK\|SK)` 无 /i) + :20 (isSecretKeyName 不匹配裸 ak/sk) |
| 2 | P0 | D4-2 | 凭证 env 打印裸 access_key 漏拦截 | safety-policy.mjs env-dump 正则 |
| 3 | P0 | D4-21 | HCL/托管策略引用漏拦截 | cloud-risk-rules.json hwc-iam-admin-policy |
| 4 | P0 | D9-12 | initialize 非法时序未拒 + 版本检查缺失 | mcp-protocol.mjs |
| 5 | P0 | D10-4 | 规则计数契约滞后（16→19） | cloud-risk-rules.json (SPEC) |
| 6 | P1 | D4-4 | Change* 变更类动词漏拦截 | policy.json:27 writeOperationPrefixes 缺 Change |
| 7 | P1 | D4-6 | adminPass command 阶段未覆盖 | cloud-risk-rules.json stages |
| 8 | P1 | D4-17 | hook 模糊 fail-open | risk-rule-engine.mjs 默认 allow |
| 9 | P1 | D3-C4 | DMS/DEW list_operations 无路由 | tools.mjs list_operations |
| 10 | P1 | D3-S7 | RDS db.password 缺失 + 部署目标分解缺失 | tools.mjs |
| 11 | P1 | D10-3 | 路由准确率 92.9%（1 MISS） | tools.mjs routeMap 缺「云主机」 |
| 12 | P1 | EXP-E01 | 「云主机」意图 MISS | tools.mjs ECS keywords |
| 13 | P1 | EXP-C4-14 | DMS list_operations 无路由 | tools.mjs |
| 14 | P1 | EXP-C4-18 | DEW list_operations 无路由 | tools.mjs |
| 15 | P1 | D9-9 | cancellation 能力未声明 | mcp-protocol.mjs (SPEC) |
| 16 | P2 | D3-S5 | 复合意图多路命中失败 | tools.mjs routeMap |
| 17 | P2 | D3-S6 | FunctionGraph 缺函数代码 | tools.mjs |
| 18 | P2 | D4-25 | 写操作遥测分类 cli:invoke | huaweicloud-safety.py |
| 19 | P2 | D4-26 | findings.evidence JSON 带引号 key 明文残留 | risk-rule-engine.mjs |
| 20 | P2 | D8-9 | sanitizeValue 未脱敏 AK/SK/token | telemetry.mjs (SPEC) |

> 全部缺陷已历史查重：20 项产品缺陷均命中上游历史 issue（见 `HISTORY_LINKS.md`），本次不重复开单，仅在既有单上补复核结论。较昨日（10-28）D4-13「CES 只读被拒」已修复（今日 readPassRate=100%），不再作为缺陷。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属（OS 列标注「专属」），Linux 不适用 | —（Linux 侧由展开级 EXP-NR3-10 覆盖） |
| D3-C3 | 设计级 | P1 | BLOCKED | 补环境 | 华为云沙箱（DevStation）服务维护中（HDKIT_SANDBOX_MAINTENANCE），connect 无法建立会话 | —（解除条件=沙箱服务恢复） |
| D3-C6 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 7 隐式工具冒烟，check_user/connect 均返回 HDKIT_SANDBOX_MAINTENANCE | — |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱预览出 URL 场景，check_user 返回 realnameVerified=undefined（沙箱维护） | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无原始 AK/SK，均已脱敏）
- [x] 写操作误判 read-only：`0`（真云 E2E 建删资源均归零验证）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（c6.large.2 最小规格） | 已删 | cleanOk=true，VPC+子网已清理 |
| OBS 桶（D3-C2） | 是（tctest-hermes-obs-*） | 已删 | rm 清对象 + 删桶归零 |
| EIP（D3-C7） | 是 | 已释放 | DeletePublicip ok |
| VPC（D4-14） | 是（tctest-hermes-*） | 已删 | 归零验证含本次资源=false |
| 只读子账号 VPC（D4-13） | 否（写被 IAM 拒绝） | — | residualZero=true |

> 真云只删本次创建资源；删除前盘点 + 白名单，禁删既有/他人资源。残留即 FAIL（本次无残留）。

---

## 八、遗留与建议

- 待裁决 SPEC：D10-4（规则计数）、D8-9（sanitizeValue 脱敏）、D9-9（cancellation 未声明）。
- 本轮未覆盖：真实 Agent 会话行为评测需 LLM harness（非 DSH 客户端缺 dsh），走确定性路由层结论（D10-3 / EXP-E01）。
- 沙箱 3 项（D3-C3/D3-C6/D3-S3）为外部服务维护阻塞，解除后补测。
- 建议：D4-13 只读子账号 CES:ListMetrics 权限已放行，可持续观察是否稳定。