# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-11-09（北京时间）
> **执行归档**：`results/Hermes/2026-11-09-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 4 个 P0 缺陷与多处 P1 产品缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro |
| OS / 架构 | Windows（`vector-zhangshuang-devkit-testbot5`，IP 120.46.2.198） |
| Node / npm / Python | Node v26.7.0 / npm 11.19.0 / Python 3.14.7 |
| 被测版本（SUT） | `1.1.14-next.0`（npm @next，Hermes 运行副本） |
| 工具全集 | `47`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 确认已配置） |
| 真云凭证 | cn-north-4（管理员 AKSK + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status/version）/ MCP 协议 / 真云 E2E（ECS/OBS/沙箱） |
| daily 用例 | 设计级 107 / 展开级 43 / 追踪表 216 / 使命 mission-001 9 |

> **执行方法**：探针脚本（.mjs）直调 `npm 全局包 plugins/huaweicloud-core/src/*` 编译产物导出函数（v2 TypeScript 化后 hdk 源码为 .ts，探针走 npm 包 .mjs），决策/结果落 `stdout.log`；MCP 协议用例 spawn 真实 mcp-server 走 JSON-RPC；真云用例 hcloud 真机建删资源归零。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 150（设计级 107 + 展开级 43，去重；使命 9 重叠） |
| 已执行 | 150 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 128 / 19 / 0 / 3 / 0 |
| 通过率（PASS/(PASS+FAIL+SPEC)，不含 BLOCKED/NOT_RUN） | 85.3% |
| P0 / P1 / P2 缺陷 | 4 / 16 / 2 |
| 红线（I 类）违规 | 0（全部真云资源测后归零） |
| 资源释放 | 全部归零（ECS/VPC/子网/OBS/沙箱 均确认 0 残留） |

---

## 三、状态汇总

### 3.1 设计级（107 条）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 88 | 有证据且通过 PASS 门禁 |
| FAIL | 16 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 3 | D4-23 / D8-9 / D9-9 |
| NOT_RUN | 0 | — |
| **合计** | **107** | |

### 3.2 展开级（43 条）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 40 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | EXP-C4-14 / EXP-C4-18 / EXP-E01 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **43** | |

### 3.3 P0 覆盖（22 条 P0，铁律全覆盖）

18 PASS / 3 FAIL（D2-4、D4-2、D4-21）/ 1 SPEC-MISMATCH（D4-23），无 NOT_RUN/空。

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 完整逐条见同目录 `FINDINGS.md`；此处为汇总表。产品缺陷共 16 项（另有 2 项非产品缺陷：#17 D4-13 只读子账号 IAM 过宽、#18 D3-C1 ECS 异步删除测试编排窗口）。

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏不完整（小写 ak/sk + JSON key 明文残留） | safety-policy.mjs:45 / :20 |
| 2 | P0 | D4-2 | 裸小写 access_key env 打印漏拦截 | safety-policy.mjs env-dump 正则 |
| 3 | P1 | D4-4 | Change* 变更动词未识别为写操作 | safety/policy.json:27 |
| 4 | P1 | D4-6 | admin_pass command 阶段漏告警 | cloud-risk-rules.json |
| 5 | P1 | D4-17 | 命令替换输入 fail-open | risk-rule-engine.mjs |
| 6 | P0 | D4-21 | HCL/托管策略宽权限漏拦截 | cloud-risk-rules.json hwc-iam-admin-policy |
| 7 | P0 | D4-23 | 全局规则未注入安装目标（SPEC） | setup-cli.mjs AGENT_RULES_FILE |
| 8 | P2 | D8-9 | 遥测 sanitizeValue 未脱敏（SPEC） | telemetry.mjs sanitizeValue |
| 9 | P1 | D9-2 | JSON-RPC invalid-params 错误码缺失 | mcp-server.mjs |
| 10 | P1 | D9-9 | 协议未声明 cancellation（SPEC） | mcp-server.mjs capabilities |
| 11 | P1 | D3-C2/D3-C13 | OBS 静态站配置签名缺 security-token | tools.mjs:3183 + :3220 |
| 12 | P1 | D3-C3/D3-S3 | 沙箱 upload_project tar Windows 路径失败 | session-manager.mjs:413-414 |
| 13 | P1 | D3-C4/EXP-C4-14/18 | list_operations DMS/DEW 无 command | tools.mjs listOperations |
| 14 | P2 | D3-S6 | FunctionGraph 参数名 func_name 错误 | hcloud-cli.mjs:784 |
| 15 | P1 | D3-S7 | RDS CreateInstance 最小参数集缺失 | hcloud-cli.mjs |
| 16 | P1 | EXP-E01 | serviceCatalog「查云主机」未命中 ECS | serviceCatalog 路由层 |

---

## 五、未执行用例与原因（供维护 agent 修改用例）

无（NOT_RUN=0、BLOCKED=0）。昨日 6 条 BLOCKED 已全部追测「能解必解」：
- 沙箱 4 条（D3-C3/D3-C6/D3-S3/D3-C14）昨日因「沙箱维护 HDKIT_SANDBOX_MAINTENANCE」BLOCKED，今日实测沙箱已恢复（check_user 返回 realnameVerified=true），D3-C6→PASS、D3-C14→PASS、D3-C3/D3-S3→FAIL（真·产品缺陷，见 #12）。
- D3-S6/D3-S7 由「需计费资源」BLOCKED 改为源码级直调，定位到真实缺陷（见 #14/#15）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针不落原始 AK/SK，仅脱敏断言）
- [x] 写操作误判 read-only：`1`（D4-4 Change* 未识别为写，已记缺陷）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（testbot5-hermes-e2e-*） | 是 | 二次 DeleteServers 后删 | ListServersDetails 0 前缀匹配 ✓ |
| VPC（964d6c6f-*） | 是 | 已删 | ListVpcs 0 匹配 ✓ |
| 子网（3b27f6f8-*） | 是 | 已删 | ListSubnets 0 匹配 ✓ |
| OBS（testbot5-hermes-obs-*） | 是 | 已删 | obs rm 成功 ✓ |
| 沙箱（workspace 71a94ace） | 是 | close_session ok | 会话关闭 ✓ |
| VPC（testbot5-hermes-ro-*，D4-13） | 是 | 已删 | del.rc=0 ✓ |

> 真云只删本次 `testbot5-hermes-*` 前缀创建资源；删除前全量盘点，未触碰他人/既有资源。

---

## 八、遗留与建议

- 待裁决 SPEC：D4-23（全局规则注入）、D8-9（遥测脱敏）、D9-9（cancellation 能力声明）——均已在 FINDINGS 记 SPEC-MISMATCH。
- 本轮未覆盖（说明范围）：真实 LLM Agent 会话评测（D10-1/2/5/9）需 dsh/CDP 会话自动化，本客户端（Hermes）无 dsh，按红线保留为外部依赖范围外（D10-3 确定性路由层已通过 harness 实测）。
- 建议：① 优先修 P0 三个安全类缺陷（D2-4/D4-2/D4-21）与 D4-23 全局规则注入；② OBS 签名 bug（#11）与沙箱 tar Windows bug（#12）为真机稳定性复现，建议排优先级复现修复。