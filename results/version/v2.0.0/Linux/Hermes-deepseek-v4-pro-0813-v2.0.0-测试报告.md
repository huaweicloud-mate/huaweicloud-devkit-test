# 版本测试报告 — v2.0.0（源仓库 v2 分支，干净重跑）

> **版本**：`v2.0.0`（源仓库 v2 分支；npm 未发布）
> 被测 commit `fcfe047f`（v2 分支）
> **测试周期**：2026-10-29（干净重跑，非 27 号首轮）
> **执行客户端**：Hermes / Linux（aarch64 ECS，机器 testbot2 / IP 1.94.193.150）
> **执行环境**：node v26.8.1 + 全局包 huaweicloud-devkit@2.0.0（无 27 号首轮「1.1.12 + node v22」环境瑕疵）
> Node/npm/Python：node v26.8.1 / npm / python3
> **工具全集**：56 个 MCP 工具
> **结论**：**不建议放行**（相对 1.x 测试契约存在 2 个 P0 漂移，与 27 号结论一致）

## 一、版本概述

v2 = 2.0.0 major 重构分支（相对 main 1.1.12）：
- 全面 TypeScript 化（.mjs→.ts）、tools 拆 packs、remote 依赖换 createDevkitMcpServer
- 新增 vendor gate（vendor-gate.ts）：厂商确认门 + 首次 challenge
- 安全规则集 16→19 条（纯新增 3 条 warn，无降级）

## 二、测试范围与执行

母版全量用例（设计级 212 + 展开级 57）下发，42 批探针执行（35 非真云批次 + 真云 E2E 实机）＋ 证据落盘 ＋ 源码根因定位（文件:行号）。本报告为第 2 轮重跑续跑收口，D9 协议探针已用新 shim 重跑，真云 E2E 已实机执行并归零。

| 维度 | 结论 |
|---|---|
| D1 安装 | 多数 PASS（检测语义/dismiss/预热/反向下发/凭证备份等单元探针 ALL PASS） |
| D2 认证 | PASS |
| D4 安全 | 多数 PASS；D4-5 plan_cli_command 被 vendor gate（#3） |
| D9 协议 | 新 shim 重跑：ws-tunnel 8/8、lifecycle 11/11、remote 6/6、delay-timeout 6/6、interop 9/12（3 FAIL 为真实契约漂移）；D9-12 dispatch 删除（#2） |
| D10 评测 | FAIL：serviceCatalog vendor gate 路由 0%（#1）、规则集 19 条（#7） |
| D3 功能/场景 | 多数 PASS；真云 D3-C1 归零时序缺陷（#8） |
| 真云 E2E | D3-B7/B8/C2 PASS；D3-C13（OBS 建桶/静态站/归零）PASS；D4-13 最小权限 PASS；D3-C1 建删核心 PASS + 归零缺陷已手动补删归零；D3-C6/C3 BLOCKED（沙箱维护） |

## 三、状态汇总（已回填）

设计级回填 85 条：**62 PASS / 18 FAIL / 4 BLOCKED / 1 SPEC-MISMATCH**。

展开级 57 条回填：**8 PASS / 15 FAIL / 34 NOT_RUN**（无 stdout 证据的展开用例据实标 NOT_RUN，未编造状态）。

> 说明：18 FAIL 中大部分是「测试侧契约未更新」（探针/用例断言仍是 1.x 老标准）或 vendor gate 连锁结果，非产品缺陷；精确的逐条 PASS/FAIL 判定需「测试设计 v2.0.0」更新用例契约后补测。

## 四、缺陷汇总（8 条漂移定性）

| 级别 | 数量 | 具体 |
|---|---|---|
| P0 | 2 | #1 vendor gate 路由 0%、#2 dispatch 删除 |
| P1 | 4 | #3 plan_cli_command、#4 remote 入口失配、#5 DEBUG 迁移、#6 telemetry 改名 |
| P2 | 1 | #7 规则集 16→19（增强） |
| 测试侧 | 1 | #8 真云归零时序 + 沙箱 BLOCKED |

（根因均落至源码文件:行号，见 FINDINGS.md。）

## 五、红线归零核查

| 资源 | 结果 |
|---|---|
| ECS / VPC / 子网 / EIP / OBS | ✅ 全 0 残留 |

（D3-C1 有残留靠手动补删归零，见 #8。）

## 六、结论与 27 号对比

- **结论一致**：不建议放行（vendor gate + dispatch 两个 P0 漂移未闭环）。
- **本次改进**：① 环境干净（2.0.0 + v26），消除了 27 号首轮「黑盒误测 1.1.12」的噪音；② D9 协议探针用新 shim 重跑，ws-tunnel/lifecycle/remote/delay-timeout 全 PASS，interop 9/12 的 3 FAIL 均为真实契约漂移；③ D10-4 根因已纠正为「纯新增 3 条 warn、无降级」；④ 真云 E2E 实机执行并归零（B7/B8/C2/C13、D4-13 PASS，C1 归零缺陷手动补救）。
- **核心漂移不变**：vendor gate、dispatch、规则集 19 条等 8 项漂移与 27 号完全一致，验证了 27 号结论的准确性（非环境误判）。

## 七、遗留

1. 真云 E2E 自动归零时序缺陷（#8）需测试侧修复（加长轮询/增强校验）。
2. 沙箱账号待实名后可补测 D3-C6/C3 与 D3-C14 hwlink 凭证链路。
3. 展开级 34 条 NOT_RUN、D3-C4 22 服务矩阵、D1-58 黑盒菜单流程、EXP-NR3-10 完整 54 条断言等，需「测试设计 v2.0.0」更新用例契约后精确补测。
4. 建议执行「测试设计 v2.0.0」更新用例契约（已产出候选设计 ITER-006）。