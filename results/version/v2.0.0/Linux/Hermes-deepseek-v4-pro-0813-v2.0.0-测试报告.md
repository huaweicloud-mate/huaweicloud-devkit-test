# 版本测试报告 — v2.0.0（源仓库 v2 分支）

> **版本**：`v2.0.0`（源仓库 v2 分支，Merge PR #1037；npm 未发布，registry 最高 1.1.12）
> 被测 commit fcfe047f (v2 分支)
> **被测对象**：源仓库 v2 分支最新代码（hdk `dist/` build 产物 + 本地打包全局安装 2.0.0）
> **测试周期**：2026-10-27
> **执行客户端**：Hermes / Linux（aarch64 ECS，IP 1.94.193.150-v2full）
> **模型**：deepseek-v4-pro-0813
> **结论**：**不建议放行**（相对 1.x 测试契约存在 2 个 P0 漂移；真云 E2E 待执行）

## 一、版本概述

- **变更内容**：v2 = 2.0.0 major 重构分支，相对 main（1.1.12）共 389 提交 / 442 文件变动：
  - 全面 TypeScript 化：`.mjs` → `.ts`（`mcp-server.mjs→.ts`、`tools.mjs→tools.ts` 等），源码拆分为 8+ 个细粒度模块（update-check 拆 8 文件、telemetry 拆多文件）
  - 工具面扩展：MCP 工具 43 → 56 个（`tools.ts` 拆为 `packs/*/tools.ts`）
  - 远程执行改 WebSocket：`mcp-server-remote.mjs` → `ws-exec/` 架构
  - 安全模型增强：风险规则库 16 → 19 条（9 deny + 10 warn）
  - 新增 vendor gate（`vendor-gate.ts`）：厂商确认门

## 二、测试范围与执行

本次执行覆盖母版全量用例（设计级 212 + 展开级 137 → 预筛下发 269 条），以 **42 批探针**（非真云部分）批量执行+证据落盘 + 源码级根因定位。因 v2 与 1.x 架构差异，白盒探针已做两轮适配（`src→dist`、`.mjs→.js`、`sandbox→lib/hdkit` 等）。

| 维度 | 结论 | 说明 |
|---|---|---|
| D1 安装 | 多数 PASS | d1 安装域 16 step 通过；D1-65/66 因模块拆分 FAIL（见 FINDINGS #5/#6）|
| D2 认证 | PASS | auth 3 cases 全部通过 |
| D4 安全 | 多数 PASS | classify/hook/wrap/hcl/d4-8 通过；D4-5 plan_cli_command 结构漂移 FAIL（#3）|
| D9 协议 | 部分 PASS | protocol 8 cases 通过；**D9-12 dispatch 删除（P0，#2）**、D9-10/11 remote 入口移除（#4）|
| D10 评测 | **FAIL** | **serviceCatalog vendor gate 致路由 0%（P0，#1）**；D10-4 规则集 16→19（#7）|
| D3 功能/场景 | 部分 PASS | 非真云场景（merge/routing/D1-40/42/45/D4-6/27/D2-26/new-config/new-cli 等）通过；真云 E2E 待执行（#8）|
| D5 客户端 | PASS | D5-1 清单发现 ALL PASS（工具 56 个）|
| D6 性能 / D7 兼容 / D8 质量 | 多数 PASS | supplement/d8 等通过 |
| **真云 E2E** | **待执行** | D3-S2/C13/C14/S3/S6/S7、D2-1/D3-C4/D4-13/14/18/19/20 需真云批次 |

> 说明：本次为「批次探针」维度级执行；「逐条 269 用例回填 + evidencePath」为后续收尾步骤（见 §六）。

## 三、缺陷汇总

| 级别 | 数量 | 具体 |
|---|---|---|
| P0 | 2 | #1 vendor gate 路由 0%、#2 dispatch API 删除 |
| P1 | 4 | #3 plan_cli_command 结构、#4 remote 入口、#5 update-check DEBUG、#6 telemetry 重构 |
| P2 | 1 | #7 安全规则集 16→19（增强，契约更新）|
| 测试侧 | 1 | #8 真云 E2E 待执行 |

## 四、退出标准核对

- [ ] P0 清零：**否**（2 个 P0 漂移未闭环）
- [ ] P1 清零：**否**（4 个 P1）
- [ ] P2 遗留 ≤3 且有排期：**是**（1 个，属契约更新）
- [ ] 资源归零（真云 E2E）：**待执行**（真云批次未跑）

## 五、结论

**不建议放行。** v2 (2.0.0) 核心功能链路大体可用（安装/认证/安全 hook/协议大部分/脱敏/合并/客户端清单均 PASS，工具面扩展至 56 个、安全规则增强至 19 条），但存在 2 个 P0 级契约漂移：

1. **vendor gate（#1）**：`huaweicloud_service_catalog` 需 `vendorConfirmed` 才返回路由，导致评测集准确率从 78.6% 跌至 0%——这是 v2 有意的安全增强，但需要「测试设计 v2.0.0」按新契约更新 eval 集与场景用例。
2. **mcp-protocol `dispatch` 删除（#2）**：协议层重构为工厂函数，P0 安全基线探针需按新 API 改写。

其余 P1 漂移（plan_cli_command 结构、remote transport 形态、update-check/telemetry 拆分）同样属「1.x 用例契约未跟上 v2 重构」。**建议：先执行「测试设计 v2.0.0」更新用例契约与探针，再复测；真云 E2E 单独批次补齐。**

## 六、遗留与后续步骤

1. **真云 E2E 批次**（红线，需真云 AK/SK + 只读子账号，测后归零）：D3-S2/C13/C14/S3/S6/S7、D2-1/D3-C4/D4-13/14/18/19/20。
2. **逐条回填**：把 42 批探针结论分发到 `evidence/<case-id>/` 并 `backfill_daily.py --write` 回填 3 份 CSV，产生精确 PASS/FAIL/BLOCKED 计数。
3. **归档**：报告 + CSV + FINDINGS 归档 `results/version/v2.0.0/Linux/`，跑 `gen_version_readme.py v2.0.0` 生成收口 README。
4. **提单**：FINDINGS #1~#6 经历史查重后向源码仓库 `huaweicloud/huaweicloud-devkit` 开合并单。