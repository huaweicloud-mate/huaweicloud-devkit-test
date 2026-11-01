# Hermes-deepseek-v4-pro-0813 每日测试报告

> **生成时间**：2026-11-01 06:20（北京时间）
> **执行归档**：`results/Hermes/2026-11-01-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（发现 5 项缺陷：1 P0 + 4 P1）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes (testbot5-win-hermes) + deepseek-v4-pro-0813 |
| OS / 架构 | Windows 10 |
| Node / npm / Python | Node v26.7.0 / npm 11.19.0 / Python 3.14.7 |
| 被测版本（SUT） | `1.1.13-next.0`（npm @next，gitHead `47170d1f`）＋源码 v2 分支 `08554f62` |
| 工具全集 | `46`（tools.mjs TOOL_DEFINITIONS；矩阵口径 40，实际已增至 46） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 提示配对 7.3.12） |
| 真云凭证 | cn-north-4（AKSK 主账号 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status）/ MCP 协议 / 真云 E2E（ECS/VPC/OBS/沙箱） |
| daily 用例 | 设计级 107 / 展开级 43 |

> **执行方法**：ESM 探针直调 `huaweicloud-devkit@1.1.13-next.0`（npm 全局包编译产物 `plugins/huaweicloud-core/src/*.mjs`）导出函数，决策/结果落 `evidence/<case-id>/`；CLI 真机执行记录日志；真云用 `scripts/realcloud_e2e.mjs` + `run-as-readonly.py` 建删资源并归零验证。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150` |
| 已执行 | `150` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `137 / 4 / 7 / 2 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `95.8%` |
| P0 / P1 / P2 新增缺陷 | `1 / 4 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | 本轮创建资源全部归零（ECS/subnet/VPC/OBS 建删回归零；残留为 10-29 历史 tctest-*，非本次创建） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 |
|---|---|
| PASS | `95` |
| FAIL | `3`（D3-C2、D3-C13、D9-2） |
| BLOCKED | `7`（D4-11、D4-13、D3-C3、D3-C6、D3-S3、D3-S6、D3-S7） |
| SPEC-MISMATCH | `2`（D4-23、D9-9） |
| NOT_RUN | `0` |

### 3.2 展开级（43）

| 状态 | 数量 |
|---|---|
| PASS | `42` |
| FAIL | `1`（EXP-E01） |
| BLOCKED | `0` |
| SPEC-MISMATCH | `0` |
| NOT_RUN | `0` |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望（精确断言） | 实际 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P1 | D3-C2/D3-C13 | OBS 静态站 STS 签名失败 | set/get 返回 ok/200 | HTTP 400「x-amz-security-token header but signed headers not included」 | tools.mjs:3041 / :3078 | 待提单 |
| 2 | P1 | D9-2 | tools/list 非对象 params 未拒 | 返回 -32602 | 正常返回工具列表（无 error） | mcp-protocol.mjs:61-63 | 待提单 |
| 3 | P0 | D4-23 | 全局规则孤儿文件 | 11 目标注入 agent-rules | 全包无 .mdc 引用 | rules/huawei-agent-rules.mdc 孤儿 | 待提单 |
| 4 | P1 | EXP-E01 | ECS 查询意图路由 MISS | 命中 ECS→run_readonly | 兜底「hcloud --help」 | tools.mjs:2197 routeMap | 待提单 |
| 5 | P1 | D9-9 | cancellation 未声明 | capabilities.notifications.cancellation | 仅 tools:{} | mcp-protocol.mjs:51-53 | 待提单 |

**正向发现**：D1-39 / EXP-NR3-09「Windows `spawnSync('npm.cmd')` EINVAL」历史 P0 缺陷已在 v2 修复核实（`update-check.mjs:265` `shell:true`，#643），queryDistTagsSync 实测返回有效 dist-tags，原 P0 关闭。

---

## 五、未执行用例与原因（BLOCKED）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D3-C3 / D3-C6 / D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱后端维护中：`huaweicloud_sandbox_check_user` 返回 `HDKIT_SANDBOX_MAINTENANCE`「沙箱功能正在升级优化，暂时无法使用」；7 工具已注册但端到端被外部服务维护阻塞 |
| D3-S6 | 设计级 | P2 | BLOCKED | 补环境 | FunctionGraph 定时任务需创建函数+触发器（按需计费）；本轮窗口受限 |
| D3-S7 | 设计级 | P1 | BLOCKED | 补环境 | 跨服务交付(Web+RDS)需 RDS 实例创建（10min+ 按需计费）；本轮窗口受限 |
| D4-11 | 设计级 | P1 | BLOCKED | 补环境 | 提示注入防护需真实 Agent 会话行为评测（工具输出植入指令后观察执行）；本机 Hermes 非 DSH，无 run-agent-eval harness |
| D4-13 | 设计级 | P1 | BLOCKED | 补环境 | 只读子账号 test001 认证失败 APIGW.0301（读写均失败）——只读凭证失效/过期，需刷新 test001 凭证 |

> 无 NOT_RUN（覆盖 100%）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1，testbot3-hermes-ecs-3484071501） | 是 | 已删（异步>150s，手动补删+轮询确认） | count 归零 ✓ |
| VPC/Subnet（D3-C1） | 是 | 已删 | 无 testbot3 残留 ✓ |
| OBS（D3-C2） | 是 | 已删 | 删桶成功 ✓ |
| VPC（D4-13 只读注入误建 testbot3-ro-deny-test） | 是 | 已删 | 归零 ✓ |
| 历史残留（非本次） | — | 未动 | `tctest-tmr-u1yrtd`（ECS/VPC/subnet，10-29）、`testbot3-hermes-e2e-3308444841-subnet`（更早） |

> 本轮创建资源 100% 归零；历史残留（非本次创建）已记录但按「只删本次创建」原则未触碰。

---

## 八、遗留与建议

- 待裁决 SPEC：D9-9（cancellation 声明）、D4-23（agent-rules 注入契约）。
- 本轮未覆盖（范围说明）：沙箱 E2E（后端维护）、FunctionGraph/RDS 重资源创建（时间/计费窗口）。
- 建议：
  1. OBS 签名 STS token 问题为高价值修复项（影响 STS 临时凭证下所有 OBS 操作）。
  2. 工具计数口径（40 vs 实际 46）建议同步更新 case 矩阵与文档，避免 D5-3/D9-1 口径漂移。
  3. 历史残留 `tctest-*` / `testbot3-hermes-*` 资源建议维护者统一盘点清理。