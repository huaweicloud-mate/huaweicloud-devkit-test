# Codex-GPT-5.6 每日测试报告

> 生成时间：2026-09-15 18:22:00（北京时间）
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
| 工具全集 | 40，全部含 name/description/inputSchema |
| hcloud / 依赖 | KooCLI 7.2.12；prepare_env 凭证检查通过 |
| 真云凭证 | cn-north-4 凭证可读；本轮未创建资源 |
| 测试类型 | 源码 Node 单并发、CLI、MCP stdio、模块级探针 |
| daily 基础用例 | 当前包设计级 77 / Codex-Windows 展开级 17 |

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 94 |
| 已执行或明确阻塞 | 94 / 94 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 43 / 1 / 49 / 1 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 95.6% |
| P0 / P1 / P2 新增缺陷 | 0 / 0 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 未创建真云资源，无残留 |

补充实测：源码单并发套件 487 项，467 PASS、6 FAIL、14 SKIP；更新检测 31/31、安全与 Hook 69/69、凭证相关 45/45 通过；安装相关套件 91 PASS、4 FAIL、13 SKIP。MCP stdio 独立探针通过。

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 |
|---|---:|
| PASS | 42 |
| FAIL | 1 |
| BLOCKED | 34 |
| SPEC-MISMATCH | 0 |
| NOT_RUN | 0 |
| **合计** | **77** |

### 3.2 展开级

| 状态 | 数量 |
|---|---:|
| PASS | 1 |
| FAIL | 0 |
| BLOCKED | 15 |
| SPEC-MISMATCH | 1 |
| NOT_RUN | 0 |
| **合计** | **17** |

## 四、缺陷清单

详见同目录 `FINDINGS.md`。当前有 1 项 P2 产品缺陷、1 项工具数量契约漂移；另记录 1 项测试侧 MCP 夹具超时，不作为产品缺陷提单。

## 五、未执行用例与原因

所有 BLOCKED 均已在 CSV 的 `blockedReason` 逐条回填，分类均为 `补环境`，没有用 BLOCKED 代替 NOT_RUN：

| 范围 | 详细原因与解除条件 |
|---|---|
| D1-4、D1-6 | 需要 Codex 之外的安装布局或真实交互闭环；提供隔离客户端配置并复测。 |
| D2 系列、D3-B3 | 需要真云/多端凭证状态闭环；提供最小白名单资源并执行归零验证。 |
| D4 系列 | 当前会话没有标准客户端 confirm UI、Hook 生命周期或 11 客户端安装矩阵；提供等价夹具或对应客户端环境。 |
| D8-4、D8-7 | 需要独立标准客户端逐技能交互验证；提供可运行的客户端入口后复测。 |
| D9 系列、D6 系列 | 需要独立 MCP Inspector/PTY 或多客户端夹具；提供可重复会话入口后复测。 |
| D10-3、D10-4、EXP-E01 至 EXP-E15 | 需要真实 Agent+插件行为评测 harness、评测集和模型参数；提供 harness 后逐条复测。 |

## 六、安全与红线合规

- 凭证泄漏事件：0
- 写操作误判只读：0
- 红线（I 类）违规：无
- 证据目录未写入原始 AK/SK；日志均为脱敏结果

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/OBS/其他真云资源 | 否 | 不适用 | 本轮仅模块级/只读验证 |
| 临时测试 HOME/fixture | 是 | 已由测试 finally 清理 | 源码测试结束 |

## 八、遗留与建议

- D1-2：修正 Windows `detectAgents()` 对 OfficeAce 的无条件探测，并补跑安装套件。
- 工具全集基线：维护者裁决 39/40 契约后更新母版或版本说明。
- 补做标准客户端审批、Inspector/PTY、多端路由和真云创建-删除闭环。
