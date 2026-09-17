# Codex-GPT-5 每日测试报告

> 生成时间：2026-09-17（北京时间）  
> 执行归档：`results/Codex/2026-09-17-192.168.0.102/Windows/`  
> 被测版本：`huaweicloud-devkit@1.1.5`，源码 `e7ed6f6`  
> 结论：`FAIL`

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Codex / GPT-5 |
| OS / 架构 | Windows / Node v22.23.2 |
| npm / Python | npm 10.9.8 / Python 3.11.15 |
| 工具全集 | 40 |
| hcloud / 凭证 | 环境检查通过；管理员与只读凭证已配置 |
| 测试类型 | 源码级探针、MCP 协议探针、D10 路由 harness |

## 二、执行摘要

| 项 | 值 |
|---|---|
| 设计级计划用例 | 78 |
| 设计级状态 | PASS 72 / FAIL 4 / SPEC-MISMATCH 1 / BLOCKED 1 |
| 展开级状态 | PASS 5 / FAIL 11 / BLOCKED 23 |
| 真实执行证据 | d1-upgrade、d2-auth、d4-security、mcp-tools、c4-service-matrix、D9 协议、D10 路由 |
| P0 产品缺陷 | 2：D2-4、D4-16 |
| P1 产品缺陷/契约漂移 | D8-4、D9-2、D9-9 |
| 资源释放 | 本轮未创建真云资源，残留 0 |

## 三、状态汇总

### 3.1 设计级

PASS 72；FAIL 4；SPEC-MISMATCH 1；BLOCKED 1；合计 78。所有 P0 均已回填，覆盖率门禁通过。

### 3.2 展开级

PASS 5；FAIL 11；BLOCKED 23；合计 39。`EXP-C4-01` 至 `EXP-C4-22` 的 `agent` 为 Hermes，误进入 Codex 包，均按【调归属】BLOCKED 记录。

## 四、缺陷清单

详见同目录 `FINDINGS.md`。本轮确认：

1. `D2-4` P0：JSON 字符串形式的 `ak`/`sk` 未脱敏。
2. `D4-16` P0：`sh -c "hcloud ..."` 包裹命令被判定为 allow。
3. `D8-4` P1：npm 包未包含根目录 `INSTALL.md`。
4. `D9-2` P1：非法 `tools/list` 参数未返回 JSON-RPC `-32602`。
5. `D9-9` P1：initialize capabilities 未声明 `notifications.cancellation`，标 SPEC-MISMATCH。
6. `EXP-E01~E15` 路由 harness：HIT 3、MISS 11、N/A 1，准确率 21.4%；除 E06/E09/E15 外可判定项均 FAIL。

## 五、未执行/阻塞用例与原因

| 用例 | 状态 | 分类 | 原因 |
|---|---|---|---|
| `D9-5` | BLOCKED | 补环境 | 当前包没有覆盖大 payload、超长输出、并发、断连恢复五种长时序的专用 Windows stdio 压测探针；需补探针后复测。 |
| `EXP-E08` | BLOCKED | 补环境 | 当前 harness 只验证 serviceCatalog；该项要求真实 Codex Agent 将故障意图路由到 explain_error，需真实 Agent 会话评测 harness。 |
| `EXP-C4-01` 至 `EXP-C4-22` | BLOCKED | 调归属 | 用例 agent 列为 Hermes，非 Codex；需维护者修正 init_day 过滤或母版归属。 |

## 六、安全与红线

- 凭证泄漏事件：0。
- 写操作误判为 read-only：0。
- PASS 门禁：通过。
- 覆盖率门禁：通过。
- 证据日志未包含本机真实 AK/SK。

## 七、资源释放

本轮未创建真云资源，无待删除资源。

## 八、遗留与建议

- 优先修复 P0：D2-4、D4-16。
- 修复 D9-2 协议参数校验并决定 D9-9 是否纳入实现契约。
- 补 Windows stdio 压测探针和真实 Agent 会话评测 harness。
- 修正 `EXP-C4-*` 的客户端归属，避免每日包污染。
