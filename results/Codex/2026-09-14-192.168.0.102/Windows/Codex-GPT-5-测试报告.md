# Codex-GPT-5 每日测试报告

> **报告名**：`Codex-GPT-5-测试报告.md`
> **生成时间**：2026-09-14（北京时间）
> **执行归档**：`results/Codex/2026-09-14-192.168.0.102/Windows/`
> **被测对象**：huaweicloud-devkit `1.1.4-next.3`，commit `3b6290b`
> **结论**：`PARTIAL`

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Codex + GPT-5 |
| OS / 架构 | Windows / x64 |
| Node / npm / Python | Node v22.23.2 / npm 10.9.8 / Python 3.11.15 |
| 被测版本（SUT） | `1.1.4-next.3`，gitHead `3b6290b` |
| 工具全集 | 39（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `huaweicloud-devkit@next` 已安装；真云调用未执行 |
| 真云凭证 | `cn-north-4` 已检测到，未创建资源 |
| 测试类型 | 源码 Node 测试、工具枚举探针、隔离清理探针 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：真实运行源码 `npm test`（442 tests）和 `tools-enum.py`（39 工具检查）；stdout 与探针落盘到 `evidence/<case-id>/`。无法在当前 Codex 会话中提供真实 Hook/PTY/真云资源生命周期的用例标记为 `BLOCKED`。

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152 |
| 已执行 | 17 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 15 / 2 / 135 / 0 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 88.2% |
| P0 / P1 / P2 新增缺陷 | 0 / 2 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 未创建真云资源，无残留 |

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---:|---|
| PASS | 15 | 有真实源码/枚举证据 |
| FAIL | 2 | 详见 FINDINGS.md |
| BLOCKED | 64 | 缺真实 Hook/PTY/客户端或真云执行条件 |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---:|---|
| PASS | 0 | 当前会话未声称完成客户端/服务展开验证 |
| FAIL | 0 | |
| BLOCKED | 71 | 缺对应客户端、Hook/PTY 或真云生命周期环境 |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **71** | |

## 四、缺陷清单（详尽，每个缺陷一栏）

详见同目录 `FINDINGS.md`。本轮两项 P1 缺陷均有真实源码测试失败输出、唯一断言、源码文件行号和证据路径。

## 五、阻塞项

| 用例范围 | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| Hook 相关 D4、D10-4 | Codex 当前会话未提供被测客户端 Hook 生命周期 | Hook-capable 客户端 | 在对应 Hook 客户端执行并保存事件证据 |
| MCP 协议 D9 真实交互 | 未启动独立 inspector/stdio 会话 | MCP inspector 或 PTY | 建立真实 stdio 会话后补跑 |
| 真云 D2/D3/D4/D5 展开 | 本轮未执行资源创建/审批/删除 | AK/SK + 最小规格资源 | 按白名单创建、立即删除并归零验证 |
| 多客户端矩阵 D5 | 当前仅为 Codex 客户端 | OpenCode 等其他客户端 | 在各客户端专属环境补跑 |

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录未写入原始 AK/SK

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 华为云 ECS/OBS/其他资源 | 否 | 不适用 | 无本轮资源残留 |
| 临时 HOME / 清理探针资产 | 是（临时） | 已由探针 finally 清理 | 清理测试通过 |

## 八、遗留与建议

- 待提单：`FINDINGS.md` 中两项 P1 缺陷。
- 本轮未覆盖：真实 Codex MCP tools/call 生命周期、Hook 审批流、真云资源 E2E、其他客户端矩阵。
- 建议：先修复安装自动探测集合与 session ID 安全后缀过滤，再重跑 Windows 安装/升级回归。
