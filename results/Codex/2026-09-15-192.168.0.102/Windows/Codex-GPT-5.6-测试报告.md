# Codex-GPT-5.6 每日测试报告

> 生成时间：2026-09-15 09:36:07（北京时间）
> 执行归档：`results/Codex/2026-09-15-192.168.0.102/Windows/`
> 被测对象：huaweicloud-devkit 1.1.4，源码 commit 9b67256e
> 结论：`PARTIAL`

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Codex + GPT-5.6 |
| OS / 架构 | Windows / x64 |
| Node / npm / Python | Node v22.23.2 / npm 10.9.8 / Python 3.11.15 |
| 被测版本（SUT） | 1.1.4，gitHead 9b67256e |
| 工具全集 | 实测 40，全部含完整 schema |
| hcloud / 依赖 | KooCLI 7.2.12；doctor 10/10 通过 |
| 真云凭证 | 已配置 cn-north-4；本轮未执行写入 |
| 测试类型 | 源码 Node 单并发、CLI、MCP stdio |
| daily 基础用例 | 设计级 81 / 展开级 39（按 Codex/Windows 预筛） |

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 120 |
| 已回填 | 120 / 120 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 15 / 1 / 103 / 1 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 88.2% |
| P0 / P1 / P2 新增缺陷 | 0 / 1 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本轮未创建真云资源，临时测试目录由测试清理 |

源码测试：487 项，468 通过、5 失败、14 跳过；失败含 1 项测试侧依赖阻塞，产品侧发现见 `FINDINGS.md`。

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 |
|---|---:|
| PASS | 14 |
| FAIL | 1 |
| BLOCKED | 66 |
| SPEC-MISMATCH | 0 |
| NOT_RUN | 0 |
| **合计** | **81** |

### 3.2 展开级

| 状态 | 数量 |
|---|---:|
| PASS | 1 |
| FAIL | 0 |
| BLOCKED | 37 |
| SPEC-MISMATCH | 1 |
| NOT_RUN | 0 |
| **合计** | **39** |

## 四、缺陷清单

详见同目录 `FINDINGS.md`。产品侧 1 项 P1 待统一提单，另有 1 项工具数量契约漂移待裁决。

## 五、阻塞项

| 范围 | 原因 | 解除条件 |
|---|---|---|
| D4 Hook | 当前 Codex 会话不提供被测客户端 Hook 生命周期 | 在 Hook-capable 客户端补测 |
| D9 真实交互 | 未建立独立 MCP Inspector/PTY 会话 | 建立 PTY 后补测 |
| D2/D3 真云写入 | 本轮只读，未执行创建/审批/删除闭环 | 走白名单最低配置并归零 |
| 非 Codex 展开矩阵 | init_day 已按客户端过滤，当前包不下发其他客户端用例 | 在对应客户端环境补测 |

## 六、安全与红线合规

- 凭证泄漏事件：0
- 写操作误判 read-only：0
- 红线（I 类）违规：无
- 证据目录未写入原始 AK/SK

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/OBS/其他真云资源 | 否 | 不适用 | 只读测试无本轮资源 |
| 临时 HOME/fixture | 是 | 测试 finally 清理 | 源码测试完成 |

## 八、遗留与建议

- 统一提单前需维护者确认 P1 自动探测问题是否与已有 issue 重复。
- 工具全集测试基线应更新为 40，或明确新增 OBS website config 工具的版本契约。
- 补做 Hook、PTY、审批和真云写入生命周期；P0 已按本轮可执行范围全部给出结果。
