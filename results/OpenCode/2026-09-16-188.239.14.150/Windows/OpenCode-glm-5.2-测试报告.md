# OpenCode-glm-5.2 每日测试报告

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-09-16 07:15:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-16-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL/SPEC-MISMATCH 缺陷，均为已知历史缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + glm-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.5（npm latest，gitHead `e7ed6f6`） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK，已配置） |
| 测试类型 | 源码级探针 / MCP 协议 / 真云只读 / eval harness |
| 设计真源 | 设计级 78 / 展开级 39 / 追踪表 183 |
| daily 基础用例 | 设计级 78 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + MCP 工具直接调用 + eval harness 路由评测，决策/结果落 `stdout.log`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 117（设计级 78 + 展开级 39） |
| 已执行 | 117 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 101 / 15 / 0 / 1 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 86.3% |
| P0 / P1 / P2 新增缺陷 | 0 / 0 / 0（均为已知历史缺陷） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（只读操作，无资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 74 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | D4-2(凭证env打印), D9-4(协议时序), D10-3(路由准确率) |
| BLOCKED | 0 | 无环境阻塞 |
| SPEC-MISMATCH | 1 | D9-9(cancellation能力未声明) |
| NOT_RUN | 0 | 无未执行 |
| **合计** | **78** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | 22服务list_operations + EXP-D5 + EXP-E06/E09/E15 |
| FAIL | 12 | EXP-E01~E05,E07,E08,E10~E14 路由MISS |
| BLOCKED | 0 | 无环境阻塞 |
| SPEC-MISMATCH | 0 | 无 |
| NOT_RUN | 0 | 无未执行 |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> **铁律**：缺陷必须真实执行后填写；未执行/推测的不得记为缺陷。字段完整到可让修复方直接定位。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow`，`HW_*` 前缀未拦截 | `safety-policy.mjs:335-336` | P | 已知历史缺陷 |
| 2 | P1 | `D9-4` | MCP server 未强制 initialize 握手时序 | initialize 前 tools/call 应返回错误 | 返回正常 result | `mcp-server.mjs:156-162` | P | 已知历史缺陷 |
| 3 | P1 | `D10-3` | serviceCatalog 中文路由准确率 21.4% | ≥90% | 21.4% (3/14 HIT) | `tools.mjs:1776-1882` | P | 已知历史缺陷 |
| 4 | P2 | `D9-9` | MCP server 无 cancellation 能力 | capabilities 含取消支持 | 仅 `{"tools":{}}` | `mcp-server.mjs:156-159` | P | 已知历史缺陷(SPEC-MISMATCH) |
| 5-16 | P1 | `EXP-E01~E14` | serviceCatalog 路由 MISS（12条中文prompt） | 各自期望服务命中 | 11 MISS + 1 N/A | `tools.mjs:1776-1882` | P | 同 #3 根因 |

### 根因详情（每个 P0/P1 缺陷附代码片段 + 复现证据）

```markdown
**#1 [P0] D4-2 凭证 env 打印拦截不完整**

- 期望：`printenv HW_ACCESS_KEY` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336`
  `classifyTextCommand()` 的 env-dump 正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀
- 证据：`evidence/D4-2/probe.mjs`（hook_check_command 返回 allow）
- 状态：已知历史缺陷 #561 #672 #674 #679 #681 #694，v1.1.5 复核确认仍存在

**#2 [P1] D9-4 MCP server 未强制 initialize 时序**

- 期望：initialize 前 tools/call → JSON-RPC error
- 实际：返回正常 result
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs:156-162` 无 initialization state guard
- 证据：`evidence/_probes/d9-protocol-probe.stdout.log` D9-4 section

**#3 [P1] D10-3 serviceCatalog 中文路由准确率 21.4%**

- 期望：准确率 ≥90%
- 实际：3/14=21.4% (HIT=3, MISS=11)
- 根因：`plugins/huaweicloud-core/src/tools.mjs:1776-1882` routeMap 关键词缺中文同义词
- 证据：`evidence/d8-d10-harness/eval-stdout.log`

**#4 [P2·SPEC-MISMATCH] D9-9 MCP server 无 cancellation 能力**

- 期望：capabilities 含取消支持
- 实际：`{"tools":{}}` 无取消字段
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs:156-159` 未处理 notifications/cancelled
- 证据：`evidence/_probes/d9-protocol-probe.stdout.log` D9-9 section
```

---

## 五、未执行用例与原因

无未执行用例。所有 78 条设计级 + 39 条展开级用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：0
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否（只读查询） | N/A | count=0 |
| 沙箱 | 否 | N/A | N/A |

> 本轮全部为只读操作和源码级测试，未创建任何云资源，无需释放。

---

## 八、遗留与建议

- 待裁决 SPEC：D9-9 cancellation 能力（设计期望 vs 实现未提供）
- 已知历史缺陷 4 项（D4-2, D9-4, D10-3, D9-9）均复核确认仍存在于 v1.1.5，未重复提单
- 建议：serviceCatalog 路由层需增加中文关键词映射，当前 78.6% MISS 严重影响中文用户体验
