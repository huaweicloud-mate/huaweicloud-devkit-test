# Codex-GPT-5 每日测试报告

> **生成时间**：2026-09-14 23:29（北京时间，补测）
> **执行归档**：`results/Codex/2026-09-14-192.168.0.102/Windows/`
> **被测对象**：huaweicloud-devkit `1.1.4-next.6`，commit `69ac7279`
> **结论**：`PARTIAL`

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Codex + GPT-5 |
| OS / 架构 | Windows / x64 |
| Node / npm / Python | Node v22.23.2 / npm 10.9.8 / Python 3.11.15 |
| 被测版本（SUT） | `1.1.4-next.6`，gitHead `69ac7279` |
| 工具全集 | 39（`tools.mjs`） |
| hcloud / 依赖 | `huaweicloud-devkit@next` 已安装；未执行真云资源操作 |
| 真云凭证 | 已检测到，未使用 |
| 测试类型 | 源码 Node 测试、工具枚举、隔离 fixture |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：先运行默认 `npm test`，因 Windows 并发资源压力出现 OOM；随后使用同一测试集 `node --test --test-concurrency=1 test/*.test.mjs` 单并发重跑，最终结果以单并发为准。所有 PASS 证据均落在 `evidence/<case-id>/`。

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 152 |
| 已执行的 daily 映射用例 | 18 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 15 / 3 / 134 / 0 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 83.3% |
| P0 / P1 / P2 新增缺陷 | 0 / 3 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 未创建真云资源，无残留 |

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---:|---|
| PASS | 15 | 有真实单并发源码测试或工具枚举证据 |
| FAIL | 3 | 均为既有 #654 的重复问题 |
| BLOCKED | 63 | 缺真实 Hook/PTY/真云或未被本机探针直接覆盖 |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---:|---|
| PASS | 0 | 未声称完成跨客户端/服务展开验证 |
| FAIL | 0 | |
| BLOCKED | 71 | 缺对应客户端、Hook/PTY 或真云生命周期环境 |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **71** | |

## 四、缺陷清单

详见同目录 `FINDINGS.md`。三项 FAIL 均已确认与既有 #654 重复，已按统一流程合并提单 #670。

## 五、阻塞项

| 用例范围 | 阻塞原因 | 解除条件 |
|---|---|---|
| D4、D10-4 Hook 流程 | 当前 Codex 会话没有被测客户端 Hook 生命周期 | 在 Hook-capable 客户端补跑 |
| D9 真实交互 | 未建立独立 inspector/PTY 会话 | 补跑真实 stdio/PTY MCP 会话 |
| D2/D3/D4/D5 真云 E2E | 未执行资源创建、审批、删除闭环 | 按白名单创建并归零验证 |
| 展开级客户端矩阵 | 当前仅有 Codex 环境 | 在各客户端专属环境补跑 |

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：无
- [x] 证据目录未写入原始 AK/SK
- [x] 未处理、修改或关闭现有 GitHub issue

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 华为云 ECS/OBS/其他资源 | 否 | 不适用 | 无本轮资源残留 |
| 测试临时 HOME / fixture | 是 | 已由测试清理 | 单并发测试完成 |

## 八、遗留与建议

- 已知重复问题：#654 的安装自动探测和 Windows session 后缀过滤仍在本轮复现。
- 补测记录：`evidence/final-suite-20260914.log`，Node 单并发源码测试 473 项，454 通过、5 失败、14 跳过。
- 默认并发测试受本机资源限制，单并发测试成功排除 OOM 连带失败；建议 CI 采用受控并发。
- 真实 Hook、PTY、跨客户端矩阵和真云资源生命周期仍需专门环境补测。
