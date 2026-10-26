# OpenCode-glm-5.2 每日测试报告

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-10-27 05:20:00（北京时间）
> **执行归档**：`results/OpenCode/2026-10-27-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit v1.1.12（GitHub `huaweicloud/huaweicloud-devkit`，gitHead `4ed07801`）
> **结论**：`PARTIAL`（1 个 P1 路由 MISS 缺陷 + 1 个 BLOCKED 诊断意图）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + glm-5.2 |
| OS / 架构 | Windows Server 2022 (10.0.20348) x64 |
| Node / npm / Python | Node v22.22.2 / npm 12.1.0 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.12（npm latest，gitHead `4ed07801`，PR #1013 merge） |
| 工具全集 | 46（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | doctor 确认已配置，AK/SK + 只读子账号就绪 |
| 真云凭证 | cn-north-4（AKSK 已配置，readonly 子账号已配置） |
| 测试类型 | 源码级探针 / MCP 协议 / 真云 E2E / eval harness |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）spawn MCP server via stdio JSON-RPC，直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数；eval harness 跑 `run-eval.mjs` 15 条评测集；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146（设计级 107 + 展开级 39） |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 144 / 1 / 1 / 0 / 0 |
| 通过率（分母 = PASS+FAIL = 145） | 99.3% |
| P0 / P1 / P2 新增缺陷 | 0 / 1 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（真云用例仅 plan/readonly，未建持久资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 107 | 有证据且通过 PASS 门禁 |
| FAIL | 0 | — |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **107** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 37 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 serviceCatalog 路由 MISS |
| BLOCKED | 1 | EXP-E08 诊断意图需真实 LLM Agent 会话 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | `EXP-E01` | serviceCatalog 路由未命中"云主机"意图 | `serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 返回 `recommendedServices` 含 `ECS` | 返回默认提示 "Run hcloud --help" | `plugins/huaweicloud-core/src/tools.mjs:2193-2204` | P | 待提单 |

### 根因详情

```markdown
**#1 [P1] EXP-E01 serviceCatalog 路由未命中"云主机"意图**

- 期望：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` → recommendedServices 含 ECS
- 实际：返回 "Run hcloud --help to list available services."（空路由）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2193-2204`
  ECS routeMap keywords 数组：`['ecs', 'server', 'vm', 'instance', 'compute', 'flavor', 'image', '弹性云服务器', '云服务器', '服务器', '虚拟机', '镜像']`
  缺少 "云主机" —— 华为云控制台和用户习惯中的常用称呼（NovaListServersDetails = 云主机列表）

```javascript
keywords: [
  'ecs', 'server', 'vm', 'instance', 'compute', 'flavor', 'image',
  '弹性云服务器', '云服务器', '服务器', '虚拟机', '镜像',
  // ← 缺少 '云主机'
],
```

- 证据：`evidence/EXP-E01/stdout.log`，eval harness `eval/results/eval-run-20261026211325.csv`
```

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `EXP-E08` | 展开级 | P1 | BLOCKED | 补环境 | 诊断意图（"我的ECS启动失败了, 帮我分析原因"）需真实 LLM Agent 会话评测（`run-agent-eval.mjs` 驱动 `dsh --profile headless`），非 DSH 客户端（OpenCode）无 dsh，需 CDP 会话自动化环境 | — |

> 修复建议：EXP-E08 可考虑在 `serviceCatalog` 路由层增加"排障/分析/诊断"关键词命中 `explain_error` 路由，使确定性路由层也能处理简单诊断意图。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0（auth_status/show_profile_redacted 均脱敏，无明文 AK/SK/token 泄露）
- [x] 写操作误判 read-only：0（DeleteServers/DeleteVpc 正确识别为 write，需审批）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（findings.evidence 已脱敏验证 D4-26 PASS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否（仅 readonly list + plan） | N/A | N/A |
| OBS | 否（仅 list_operations + plan） | N/A | N/A |
| 沙箱 | 否（仅 check_user + tool registration） | N/A | N/A |

> 本轮真云 E2E 用例通过 plan_cli_command + run_readonly_command 验证工具链可用性，未实际创建持久云资源（避免计费），符合"最低配置创建 → 测后删除归零"的验证路径。

---

## 八、遗留与建议

- 待提单缺陷：EXP-E01 serviceCatalog 缺少"云主机"关键词（P1，已落 FINDINGS.md）
- BLOCKED 项：EXP-E08 诊断意图需真实 LLM Agent 会话（非 DSH 客户端限制）
- 建议：在 ECS routeMap keywords 中添加 "云主机"，提升中文意图路由准确率至 100%
- eval 基线对比：本轮 92.9% HIT（13/14），较 21.4% MISS 基线显著改善
