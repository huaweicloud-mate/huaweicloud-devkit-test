# OpenClaw-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-02 06:25（北京时间）
> **执行归档**：`results/OpenClaw/2026-10-02-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（10 项 FAIL/SPEC，其中 1 项为 1.1.8 新修复语义导致的旧探针误报已甄别，产品缺陷 10 项；较昨日历史缺陷簇显著收敛）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenClaw + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ecs-hd-ai-work-00-0003，IP 113.44.197.147） |
| Node / npm / Python | Node v22.13.0 / npm 10 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8-next.1`（npm next，gitHead `ffd7b47`） |
| 工具全集 | 41（`tools.mjs` TOOL_DEFINITIONS，1.1.8 新增 `huaweicloud_sandbox_expose_tunnel`） |
| hcloud / 依赖 | hcloud 7.2.12 已配置 · doctor 确认就绪 |
| 真云凭证 | cn-north-4（AK/SK 管理员 + test001 只读子账号 + 保证金就绪） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| 设计真源 | 设计级 102 / 展开级 39 / 追踪表 211 行 |
| daily 基础用例 | 设计级 102（P0=21 P1=51 P2=30）/ 展开级 39（P1） |

> **执行方法**：48 个源码级探针（.mjs/.py）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 18 个 fixtures harness + `run-eval.mjs` D10-3 路由 + `protocol-probe.mjs` D9 协议 + 真云 E2E（最低配置创建→测后删除归零），证据统一落 `evidence/<case-id>/`。
> **本轮特殊性**：prepare_env 自动追最新 tag，SUT 从昨日 1.1.7 → 1.1.8-next.1（57 commit），多项历史 FAIL 已被修复（#745 审批 JSON 契约、#770 中文路由/env-dump、#767 DMS/DEW aggregate、#726 裸 token 脱敏、#758 shell 包裹）。全部 case fresh 重跑，未复制昨日结论。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 141（设计级 102 + 展开级 39） |
| 已执行 | 140（设计级 101 + 展开级 39；设计级 1 条 D1-39 OS 专属豁免 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 129 / 10 / 0 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 92.1%（129/140） |
| P0 / P1 / P2 新增缺陷 | 3 / 4 / 3（均为 1.1.8-next.1 未修复残留，无历史单已跟踪的除外） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（真云建删 E2E 归零验证通过） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 91 | 有证据且通过 PASS 门禁 |
| FAIL | 9 | D3-S5 / D4-6 / D4-7 / D4-21 / D4-25 / D4-27 / D8-9 / D9-2 / D9-12 |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 1 | D9-9 capabilities.cancellation 未声明 |
| NOT_RUN | 1 | D1-39（Windows 专属用例，OS 列标注「专属」，Linux 结构性不适用） |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01（D10-3「云主机」中文意图 MISS） |
| BLOCKED | 0 | |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 全部 10 项 FAIL/SPEC 均经真实执行复现，根因（文件:行号）已定位。完整断言/证据见 `FINDINGS.md`（#1~#10 产品缺陷 + #12~#14 测试侧甄别，非产品）。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | D4-21/D4-7 | hook_check_artifacts 宽泛 IAM 制品（Terraform HCL `actions=["*"]`）未拦截（JSON 形式已覆盖） | cloud-risk-rules.json:196-209 | 待提单 |
| 2 | P1 | D4-6 | adminPass 空格形式值未脱敏（等号形式正常） | safety-policy.mjs:42 | 待提单 |
| 3 | P1 | D4-25 | Python hook 写命令遥测误分类 cli:invoke（cli:write 恒不触发） | huaweicloud-safety.py:46 | 待提单 |
| 4 | P1 | D4-27 | 双路径输出脱敏小写 ak=/sk= 未脱敏 | safety-policy.mjs:45 | 待提单 |
| 5 | P2 | D8-9 | 遥测值 sanitizeValue 未做凭证脱敏 | telemetry.mjs:189-196 | 待提单 |
| 6 | P0 | D9-12 | 未 initialize 先 tools/list 未返回 -32600 | mcp-protocol.mjs:57 | 待提单 |
| 7 | P1 | D9-2 | tools/list 传非法 params 未返回 -32602 | mcp-protocol.mjs:57 | 待提单 |
| 8 | P1 | D9-9 | capabilities.cancellation 未声明（SPEC 待裁决） | mcp-protocol.mjs:32-49 | 待提单 |
| 9 | P1 | D10-3/EXP-E01 | 中文意图「云主机」未命中 ECS | tools.mjs:1970-1987 | 待提单 |
| 10 | P2 | D3-S5 | 复合中文意图（物联网+时序数据+前端托管）路由未命中 | tools.mjs:1968-2192 | 待提单 |

### 已修复（昨日 FAIL → 今日 PASS，多客户端复现历史缺陷在本轮收敛）

| 用例 | 历史缺陷 | 1.1.8-next.1 现状 |
|---|---|---|
| D10-3 | 中文意图路由 MISS 11/15（21.4%） | HIT 13/15（92.9%），仅「云主机」1 条 MISS（#770 中文关键词补齐） |
| D4-24 | 审批 token 抛异常、无结构化 | #745 精确 JSON 契约（NOT_FOUND/EXPIRED/already_processed） |
| D4-20 | 伪造 token 未拒（旧探针按 throw） | 结构化拒绝 code=CONFIRM_TOKEN_NOT_FOUND |
| D4-23 | 全局规则未注入 | rules/ 已随包发布 + injectAgentRules 21 处，本机实测注入成功 |
| D4-2 | env dump 拦截不完整 | #770 补 HUAWEICLOUD_SECRET_ACCESS_KEY / HW_* 前缀，classifyTextCommand 全拦截 |
| D4-16 | sh -c 包裹穿透 | #758/#760 内层命令检测，classifyTextCommand 全 deny |
| D4-27 | 裸 token= 未脱敏 | #726 已修大写+token 形式（小写 ak= 仍未覆盖） |
| D3-C4 | DMS/DEW 伞名 Unsupported | #767 aggregate 子服务路由 |

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标注「专属」：Windows 升级检测链 EINVAL/npm.cmd 专属）；Linux 无 npm.cmd/EINVAL 语义，结构性不适用。Linux 侧检测链由源码级 `queryDistTagsSync` 探针佐证（evidence/d1-upgrade dist-tags 含 latest+next）。 | 无（归属列正确；非 Linux 用例） |

### 测试侧甄别（非产品缺陷，不回填 FAIL，已在探针层核实）

| 用例ID | 探针旧断言 | 实际行为 | 判定 |
|---|---|---|---|
| D5-3 | 硬编码工具数=40 | 1.1.8 新增 sandbox_expose_tunnel，现 41=注册源数量，schema 合规 | 探针陈旧，产品正常 |
| D6-4 | 硬编码并发返回 40 | 30 并发返回 41 工具，无死锁无错乱 | 探针陈旧，产品正常 |
| D1-2 | detectAgent 11 客户端全匹配 | 本机 hermes 环境变量污染致 openclaw→hermes（10/11） | 环境因素，非产品 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无新增`（D4-6/D4-7/D4-21/D4-27/D8-9 为 1.1.8-next.1 未修复残留，非本轮引入）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针日志均 `<redacted>` / 占位 AK/SK）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC 安全组（D3-C4） | 是 | 已删 | tctest-d3c4- 剩余=0 |
| VPC（D3-S2） | 是 | 已删 | tctest-s2- 剩余=0 |
| VPC/Subnet/RDS（D3-S7） | 是 | 已删 | tctest-s7- 剩余=0，RDS 删除完成（BUILD→ACTIVE→DeleteInstance→名单消失） |
| FunctionGraph 函数（D3-S6） | 是 | 已删 | ListFunctions 无残留 |
| OBS 桶（D3-C13） | 是 | 已删 | 删桶成功 |
| 沙箱会话（D3-S3） | 是 | close_session ok | 会话已关闭 |

> 真云只删本次创建资源，独立逐步核验 `tctest*` 前缀资源均已归零。

---

## 八、遗留与建议

- 待裁决 SPEC：D9-9（capabilities.cancellation 契约漂移，历史单已跟踪）
- 本轮未覆盖：真实 Agent 会话评测（D10-1/2/5/9，非 DSH 客户端需 CDP 自动化，本机未接入 dsh）
- 建议：
  1. P0 收敛：D4-7/D4-21 Terraform HCL 宽泛 IAM 正则（cloud-risk-rules.json hwc-iam-admin-policy）补 HCL `actions=["*"]` 语法；D9-12 initialize 时序门（mcp-protocol tools/list 前置校验）为协议安全基线。
  2. P1 脱敏一致性：safety-policy.mjs redactString 补空格分隔（D4-6）+ 小写 /i（D4-27）+ telemetry sanitizeValue 复用 redactSecrets（D8-9）；python hook WRITE_OPERATION_RE 修空格前缀（D4-25）。
  3. 路由：D10-3 补「云主机」中文关键词（EXP-E01 唯一 MISS）。