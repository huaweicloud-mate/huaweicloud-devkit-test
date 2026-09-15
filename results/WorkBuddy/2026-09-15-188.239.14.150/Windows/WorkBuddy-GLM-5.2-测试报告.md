# WorkBuddy-GLM-5.2 每日测试报告

> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-15 20:20:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-15-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 2 个 P0 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `GLM-5.2` |
| OS / 架构 | `Windows (win32)` |
| Node / npm / Python | `Node v22.22.2 / npm / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.4`（npm latest 正式版，gitHead `9b67256`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `gh 未登录（push 用 HDK_GH_TOKEN）；hcloud 已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置，credentials.json）` |
| 只读子账号 | `未配置（credentials.readonly.json 缺失，D4-13 BLOCKED）` |
| 测试类型 | 源码级探针 / MCP 协议 / CLI 真机 |
| 设计真源 | 设计级 77 / 展开级 17 / 追踪表 183 行 |
| daily 基础用例 | 设计级 77 / 展开级 17 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；MCP 协议测试通过 stdin/stdout 与 mcp-server.mjs 交互；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `94`（设计级 77 + 展开级 17） |
| 已执行 | `94` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `48 / 2 / 44 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 50） | `96.0%` |
| P0 / P1 / P2 新增缺陷 | `2 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `不涉及（本轮无真云资源创建/销毁）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `46` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单（D4-15, D4-16） |
| BLOCKED | `29` | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`77`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `2` | EXP-D5-5-1, EXP-D5-5-3 |
| FAIL | `0` | — |
| BLOCKED | `15` | EXP-E01~E15（需 LLM agent harness） |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`17`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> **铁律**：缺陷必须真实执行后填写；未执行/推测的不得记为缺陷。字段完整到可让修复方直接定位。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-15` | URL 编码命令绕过安全策略 | `classifyTextCommand('hcloud%20ecs%20DeleteServers...').decision === 'deny'` | 返回 `allow` | `safety-policy.mjs:345` | P | 待提单 |
| 2 | P0 | `D4-16` | Shell 包裹命令绕过安全策略 | `classifyTextCommand('bash -c "env \| grep HUAWEICLOUD"').decision === 'deny'` | 返回 `allow` | `safety-policy.mjs:335` | P | 待提单 |

### 根因详情（每个 P0 缺陷附代码片段 + 复现证据）

**#1 [P0] D4-15 URL 编码命令绕过安全策略检测**

- 期望：`classifyTextCommand('hcloud%20ecs%20DeleteServers%20--instance_ids=x').decision` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:345`
  `classifyTextCommand()` 的 hcloud 检测正则 `/(^|\s)hcloud(\.exe)?\s+/i` 未匹配 URL 编码空格 `%20`，且函数在分类前未调用 `decodeURIComponent` 解码输入。

```javascript
// safety-policy.mjs:345
if (/(^|\s)hcloud(\.exe)?\s+/i.test(text)) {   // ← %20 不匹配 \s
    return classifyHcloudArgs(splitSimpleCommand(text), ...);
}
```

- 证据：`evidence/D4-15/stdout.log`，`evidence/D4-15/probe.mjs`

**#2 [P0] D4-16 Shell 包裹命令绕过安全策略检测**

- 期望：`classifyTextCommand('bash -c "env | grep HUAWEICLOUD"').decision` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335`
  env-dump 检测正则 `/(^|\s)(env|printenv|...)/i` 要求 `env` 前是空白 `\s`，但 `bash -c "env..."` 中 `env` 前是引号 `"`，正则不匹配。函数未对 `sh -c`/`bash -c` 包裹命令进行解包再检测。

```javascript
// safety-policy.mjs:335
if (/(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i.test(text) &&
    /HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text)) {   // ← env 前是 " 不是 \s
```

- 证据：`evidence/D4-16/stdout.log`，`evidence/D4-16/probe.mjs`

---

## 五、未执行用例与原因（供维护 agent 修改用例）

> 逐条列出本轮 **NOT_RUN / BLOCKED** 用例（展开级「不涉及本客户端/OS」的建包时已剔除，不在此列）。

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-1` | 设计级 | P1 | BLOCKED | 补环境 | 无法在活跃 WorkBuddy 会话中重置到全新未安装状态 | — |
| `D1-5` | 设计级 | P1 | BLOCKED | 补环境 | 无法在活跃测试会话中执行卸载操作 | — |
| `D1-41` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP server 配合 mock 结果注入 | — |
| `D1-42` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP server 生命周期管理 | — |
| `D1-45` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP server 启动时序控制 | — |
| `D1-58` | 设计级 | P1 | BLOCKED | 补环境 | 需要隔离 HOME 目录 + 全新安装 | — |
| `D2-1` | 设计级 | P1 | BLOCKED | 补环境 | 需要真云凭证初始化 E2E 流程 | — |
| `D2-5` | 设计级 | P1 | BLOCKED | 补环境 | 需要凭证移除 + 真 auth init | — |
| `D3-B3` | 设计级 | P1 | BLOCKED | 补环境 | 需要真实 MCP server tool call | — |
| `D3-C4` | 设计级 | P1 | BLOCKED | 补环境 | 需要真云资源 E2E 测试 | — |
| `D4-11` | 设计级 | P1 | BLOCKED | 补环境 | 需要 LLM agent 行为测试 | — |
| `D4-13` | 设计级 | P1 | BLOCKED | 补环境 | 需要只读 IAM 子账号（credentials.readonly.json 未配置） | — |
| `D4-20` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP server 审批流 | — |
| `D4-24` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP server confirm token 生命周期 | — |
| `D6-4` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP server 并发测试 harness | — |
| `D9-2` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP Inspector | — |
| `D9-3` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP Inspector | — |
| `D9-4` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP Inspector | — |
| `D9-5` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP Inspector | — |
| `D9-6` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP Inspector | — |
| `D9-9` | 设计级 | P1 | BLOCKED | 补环境 | 需要 MCP Inspector | — |
| `D10-1` | 设计级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness | — |
| `D10-2` | 设计级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness | — |
| `D10-3` | 设计级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness | — |
| `D10-5` | 设计级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness | — |
| `D3-B1` | 设计级 | P2 | BLOCKED | 补环境 | 需要真实 MCP server tool calls | — |
| `D3-B5` | 设计级 | P2 | BLOCKED | 补环境 | 需要真实 MCP server tool calls | — |
| `D4-12` | 设计级 | P2 | BLOCKED | 补环境 | 需要全新安装 + 恶意包测试 | — |
| `D4-14` | 设计级 | P2 | BLOCKED | 补环境 | 需要真云审计日志访问 | — |
| `D6-1` | 设计级 | P2 | BLOCKED | 补环境 | 需要性能基准测试 | — |
| `D6-3` | 设计级 | P2 | BLOCKED | 补环境 | 需要性能基准测试 | — |
| `D9-7` | 设计级 | P2 | BLOCKED | 补环境 | 需要 MCP Inspector | — |
| `D9-8` | 设计级 | P2 | BLOCKED | 补环境 | 需要 MCP Inspector | — |
| `EXP-E01` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试 ECS 查询路由 | — |
| `EXP-E02` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试 ECS 创建路由 | — |
| `EXP-E03` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试 OBS 部署路由 | — |
| `EXP-E04` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试 EIP 路由 | — |
| `EXP-E05` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试 RDS 查询路由 | — |
| `EXP-E06` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试 DCS 创建路由 | — |
| `EXP-E07` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试 CBR 路由 | — |
| `EXP-E08` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试 explain_error 路由 | — |
| `EXP-E09` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试 CCE 创建路由 | — |
| `EXP-E10` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试 FunctionGraph 路由 | — |
| `EXP-E11` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试费用查询路由 | — |
| `EXP-E12` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试 CES 路由 | — |
| `EXP-E13` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试证书/ELB 路由 | — |
| `EXP-E14` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试 IAM 审计路由 | — |
| `EXP-E15` | 展开级 | P1 | BLOCKED | 补环境 | 需要 LLM agent harness 测试 voucher_claim 路由 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

> **注意**：本轮发现 2 个 P0 安全缺陷（D4-15, D4-16），均为安全策略绕过类问题，已记入 FINDINGS.md 待提单。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无真云资源 | 否 | — | 不涉及 |

> 本轮测试为源码级探针 + MCP 协议测试，未创建真云资源，无需释放。

---

## 八、遗留与建议

- **待提单缺陷**：D4-15（URL 编码绕过）、D4-16（Shell 包裹绕过）— 均为 P0 安全策略绕过，需在 `classifyTextCommand` 中增加 URL 解码 + shell 包裹解包逻辑
- **本轮未覆盖**：真云 E2E（D3-C4）、MCP Inspector（D9-2~D9-9, D9-7~D9-8）、LLM agent harness 路由测试（D10-1~D10-5, EXP-E01~E15）、MCP server 审批流（D4-20, D4-24）、性能基准（D6-1, D6-3, D6-4）、只读子账号（D4-13）
- **建议**：在 `classifyTextCommand` 入口处增加 `decodeURIComponent` 预处理 + `sh -c`/`bash -c` 包裹命令提取逻辑，确保编码/包裹的危险命令无法绕过安全策略
