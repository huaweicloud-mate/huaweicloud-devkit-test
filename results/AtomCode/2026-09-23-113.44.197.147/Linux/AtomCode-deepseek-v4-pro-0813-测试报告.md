# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-23 17:15（北京时间）
> **执行归档**：`results/AtomCode/2026-09-23-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 5 个 P0 缺陷 + 多个 P1/P2 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux x64（ecs-hd-ai-work-00-0003） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.7-next.0`（npm @next，gitHead `0790e92a`） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已配置（~/.local/bin/hcloud），doctor 确认就绪 |
| 真云凭证 | cn-north-4（AKSK 管理员 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71（本机预筛后 设计级 100 / 展开级 39） |

> **执行方法**：grouped 探针（d4-security/d2-auth/d1-upgrade/mcp-tools/c4-service-matrix）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数；补充探针（probe-supplement/supplement2）覆盖 D6/D3-S/D4-25/D4-28；D9 协议探针（protocol-probe 语义）驱动 MCP server 帧协议；D10 路由评测 harness 调 `huaweicloud_service_catalog`；真云 E2E（probe-realcloud）实机建删归零。证据统一落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 139（设计级 100 + 展开级 39） |
| 已执行 | 139 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 109 / 25 / 3 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 80.7%（109/135） |
| P0 / P1 / P2 新增缺陷 | 5 / 6 / 3（另 1 条 SPEC-MISMATCH，11 条展开级 FAIL 归入 D10-3 同根因） |
| 红线（I 类）违规 | `0`（凭证脱敏缺陷为代码缺陷，非测试侧泄漏事件） |
| 资源释放 | 全部归零（真云安全组 tctest-d3c4- 剩余 0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 81 | 有证据且通过 PASS 门禁 |
| FAIL | 14 | 不符预期，根因见缺陷清单 |
| BLOCKED | 3 | 环境阻塞（D1-67/D3-S7/D9-6），见 §五 |
| SPEC-MISMATCH | 1 | D9-9 capabilities 未声明 cancellation（契约漂移待裁决） |
| NOT_RUN | 1 | D1-39 Windows 专属升级检测链（Linux 结构化不适用） |
| **合计** | **100** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 28 | 服务矩阵 22 + 客户端矩阵 2 + 评测集 4（E06/E08/E09/E15） |
| FAIL | 11 | D10-3 路由 MISS 展开（EXP-E01~E14 中 11 条） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏 JSON 场景漏脱敏 | JSON ak/sk/token 值应 `<redacted>` | 原样泄漏 | `safety-policy.mjs:34-42` | P | 待提单 |
| 2 | P0 | `D4-2` | env 管道 HW_SECRET_KEY 漏拦 | `env \| grep HW_SECRET_KEY` → deny | 返回 allow | `safety-policy.mjs:398-399` | P | 待提单 |
| 3 | P0 | `D4-16` | sh -c 命令包裹穿透 | `sh -c "printenv …"` → deny | 返回 allow | `safety-policy.mjs:384` | P | 待提单 |
| 4 | P0 | `D4-21` | 制品预检未检出 broad IAM | `actions:["*"]` → findings>0 | findings=[] | `risk-rule-engine.mjs:150` | P | 待提单 |
| 5 | P0 | `D4-23` | 全局规则注入链路缺失 | rules/ 随包注入 11 目标 | files 白名单缺 rules/ | `package.json:8` | P | 待提单 |
| 6 | P1 | `D4-6` | adminPass 空格形式未脱敏 | `adminPass <v>` 脱敏 | 值泄漏 | `safety-policy.mjs:42` | P | 待提单 |
| 7 | P1 | `D4-27` | 裸 token=/小写 ak=/sk= 未脱敏 | token=/ak=/sk= 脱敏 | 三例均泄漏 | `safety-policy.mjs:42` | P | 待提单 |
| 8 | P1 | `D3-S8` | 排障路由缺失 | 诊断意图 → explain_error | 落入服务目录 | `tools.mjs:1817` | P | 待提单 |
| 9 | P1 | `D9-2` | JSON-RPC 错误码不规范 | 非法 params → -32602 | 返回正常 result | `mcp-protocol.mjs` dispatch | P | 待提单 |
| 10 | P1 | `D9-4` | 协议生命周期未强制 | 未 initialize 先 tools/list 应拒绝 | 正常返回列表 | `mcp-protocol.mjs` dispatch | P | 待提单 |
| 11 | P1 | `D10-3` | 路由准确率 21.4% | 中文意图命中对应服务 | HIT=3 MISS=11 | `tools.mjs:1817-1946` | P | 待提单 |
| 12 | P2 | `D4-25` | Python hook 写命令未分类 cli:write | 写命令 → cli:write 事件 | cli:write 缺失 | Python hook 分类正则 | P | 待提单 |
| 13 | P2 | `D8-9` | sanitizeValue 未脱敏 | 遥测值须脱敏 | 原样上报 | `telemetry.mjs:189` | P | 待提单 |
| 14 | P2 | `D9-7` | 协议版本协商降级未实现 | 支持版本协商降级 | 仅透传版本 | `mcp-protocol.mjs:46` | P | 待提单 |
| 15 | SPEC | `D9-9` | capabilities 未声明 cancellation | 声明 cancellation | capabilities={tools:{}} | `mcp-protocol.mjs:46` | G | 待裁决 |

> 展开级 11 条 FAIL（EXP-E01/02/03/04/05/07/10/11/12/13/14）同 #11 D10-3 根因（serviceCatalog 关键词覆盖不足），不重复列缺陷。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议（分类=`改用例` 时必填） |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL/npm.cmd 专属；Linux 结构化不适用（OS 列已标注「专属」，属 OS 专属 P0 唯一豁免） | — |
| `D1-67` | 设计级 | P2 | BLOCKED | 补环境 | 需真实 DSH 插件安装/跳过验证（破坏性全局安装，run-only 不执行）；AGENT_TOOLKIT_MODE/SKIP_DSH 注入需实装 DSH 客户端 | — |
| `D3-S7` | 设计级 | P1 | BLOCKED | 补环境 | 需真实 RDS+沙箱多服务编排会话自动化（建库→部署→连接串注入→读写验证→归零）；本客户端无 dsh/CDP agent 会话 harness | 展开规则可改为「分服务单步抽样」或 `requiredEvidence` 明确多服务编排需会话自动化 |
| `D9-6` | 设计级 | P1 | BLOCKED | 补环境 | 需官方 MCP Inspector 校验 + ≥2 客户端互通冒烟环境；本客户端无 Inspector 集成/多客户端会话自动化 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（发现为代码缺陷 D2-4/D4-2/D4-6/D4-27 的脱敏盲区，非测试侧泄漏）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始 AK/SK，仅探针断言输出

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 安全组（tctest-d3c4-*，D3-C4 真云） | 是 | 已删 | 剩余 0（计数 +1 后删除归零） |
| 只读子账号 test001 | 否（复用预置） | — | — |

> 真云只删除本次创建的 `tctest-` 前缀资源；删除前全量盘点，未触碰既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities 未声明 cancellation）
- 本轮未覆盖：`D1-39`（Windows 专属升级检测链）、`D1-67`（DSH 实装验证）、`D3-S7`（多服务编排会话）、`D9-6`（多客户端互通冒烟）
- 建议：优先修复 5 个 P0（D2-4/D4-2/D4-16/D4-21/D4-23）安全缺陷；D4-2/D4-6/D4-27 三处均为 `safety-policy.mjs` 同一脱敏正则家族盲区，可合并统一增强正则覆盖。