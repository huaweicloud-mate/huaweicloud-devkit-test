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

所有 BLOCKED 均已在 CSV 的 `blockedReason` 逐条回填，分类均为 `补环境`，没有用 BLOCKED 代替 NOT_RUN。具体原因如下：

| 用例 | 逐条原因 |
|---|---|
| D1-4 | 缺少隔离 HOME、自定义 config 和两次 update 字节对比。 |
| D1-6 | 本机已有 KooCLI，无法验证无 KooCLI 的 install-hcloud 分支。 |
| D2-10 | 未构造隔离的多 KooCLI profile/current=deploy 场景。 |
| D2-1 | 未建立 KooCLI、OBS、沙箱三端真实落位闭环。 |
| D3-A1 | 未完成约 30 个 SKILL.md 的逐项检索和完整性核对。 |
| D3-B1 | 未执行 list_operations 与官方元数据的逐项比对。 |
| D3-B3 | 未发起真云只读命令并核对脱敏、无写入和审计结果。 |
| D3-C5 | 未对四个指定 MCP 工具执行逐项 tools/call。 |
| D4-11 | 缺少标准客户端提示注入的真实消息拼接路径。 |
| D4-12 | 未执行 npm pack、安装期行为扫描和 SBOM 检查。 |
| D4-13 | 未用 test001 只读子账号执行最小权限矩阵。 |
| D4-14 | 未产生可关联 CTS 事件，无法验证 agent/人工来源。 |
| D4-18 | 缺少标准客户端 confirm UI 和真云确认/拒绝路径。 |
| D4-19 | 未在真实确认流中验证 preflight 时序。 |
| D4-20 | 未执行真实拒绝并核对资源状态无变化。 |
| D4-23 | 只有 Codex 环境，无法覆盖 11 个 Agent 的规则注入。 |
| D4-24 | 缺少审批令牌、可注入时钟和过期/重复确认夹具。 |
| D5-1 | Codex 插件未安装，无法验证客户端清单发现和加载。 |
| D6-1 | 未运行延迟采样，无法计算 search/retrieve 的 p95。 |
| D6-3 | 只启动了一次 MCP，无法形成冷启动 p95。 |
| D6-4 | 未运行并发请求，无法验证调度无死锁、错序和串线。 |
| D7-4 | 未切换并记录华为云 npm 镜像的干净安装结果。 |
| D8-4 | 缺少全部 SKILL.md 的逐项机械执行记录。 |
| D8-6 | 未完成 README 与 README.zh-CN 的逐项差异扫描。 |
| D8-7 | 缺少 7 个 meta/通用技能的逐项最小路径证据。 |
| D9-2 | 未发送无效 JSON-RPC 方法/参数验证错误码。 |
| D9-3 | 未执行 tools/call 并核对响应结构。 |
| D9-4 | 未记录完整 initialize 至 shutdown 生命周期。 |
| D9-5 | 未覆盖 stdio 半包、异常 stderr 和退出行为。 |
| D9-6 | 当前只有 Codex，无法完成至少三个真实客户端互通。 |
| D9-7 | 未发送老协议版本 initialize 验证协商降级。 |
| D9-9 | 未注入延迟验证超时、取消和 capabilities 时序。 |
| D10-3 | 缺少真实 Agent+插件评测 harness、模型参数和评测集。 |
| D10-4 | 缺少真实 Agent 高危意图到 plan→审批的行为入口。 |
| EXP-E01 至 EXP-E15 | 每条分别需要对应真实 Agent 服务路由行为；当前无 harness，不能用源码或 tools/list 替代。 |

上述每条 CSV 记录还包含具体解除条件；EXP-E01 至 EXP-E15 在展开级 CSV 中逐条记录。

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
