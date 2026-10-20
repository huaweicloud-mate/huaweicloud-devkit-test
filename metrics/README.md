# 度 量与趋势说明

跨迭代质量度量（§5.1）。趋势指标由 `scripts/trend_metrics.py` 从每日汇总自动生成，
其余为每迭代末维护记录。

## 文件

| 文件 | 内容 | 生成方式 |
|---|---|---|
| `trend.csv` | 每日一行：date / total(用例) / cells(用例×客户端) / done / pass / fail / spec / blocked / notrun / exec_rate / pass_rate | 自动（`npm run test:trend`，CI `trend-metrics.yml` 每日兜底） |
| `trend.md` | 跨日 Markdown 趋势报告（表 + 7 日均值 + 风险提示） | 同上 |
| `trend.svg` | 跨日趋势折线图（执行率 / 通过率双线 + 图例中位数），纯标准库手写 SVG、**确定性输出**（同 trend.csv 必得同文件） | 自动（`npm run test:trend-chart`，`trend-metrics.yml` 随趋势一并重生成） |
| `execution.csv` | 每轮手工记录：迭代 / 日期 / 范围 / 计划用例 / 已执行 / 通过 / 失败 / 阻塞 / 执行率 / 通过率 | 人工（维护者每轮；**ITER-001~009 已全量回填**，2026-10-20 补齐） |
| `defects.csv` | 缺陷存量台账：缺陷ID / 级别 / 首次发现日期 / 标题 / 关联上游issue / 状态 / 发现客户端 / 出现次数 / 来源FINDINGS路径。登记口径（R1 = 已被上游接单的存量；R2 = 无单号引用、P0/P1、且在 ≥3 个 FINDINGS 文件中复现的根因簇）与未覆盖部分写在**文件头注释行** | 半自动：`results/**/FINDINGS.md` 逐条解析 + `gh issue list --state all` 实时态回填（首版 2026-10-21，230 行） |
| `dashboard.md` | 质量仪表盘（总体状态 / 趋势引用 / 亮点与风险 / 下轮计划），每轮收口更新一页 | 人工（模板 `templates/dashboard.md`）；**已建**（首版 2026-10-21），数据源 = `trend.csv` + `execution.csv` + `defects.csv` + `skill-bench/`；取不到的项显式标「未取数（待补）」 |

## 迭代台账收官说明

- **ITER 系列收官**：`ITER-001-2026-09-05` ~ `ITER-009-20260912124913`，于 **2026-09-12** 结束；`execution.csv` 覆盖至 ITER-009，不再按迭代手工记录。
- **执行口径转移**：2026-09-12 起由「每日测试流水线」承接——日汇总 `results/Summary/用例矩阵-设计级-总执行结果-<日期>.csv`，跨日趋势本目录 `trend.csv`/`trend.md`（自动生成）。当前指针见 `results/LATEST.md`。

## 已建台账与口径（2026-10-21 起）

| 文件 | 状态 | 数据源 / 更新时机 |
|---|---|---|
| `defects.csv` | ✅ 已建（230 行；R1 71 + R2 159） | 源 = `results/**/FINDINGS.md`（结构化 `## #N【级别】标题` 段）+ `gh issue list -R huaweicloud/huaweicloud-devkit --state all` 实时态。状态只认两源：上游实时态（open/closed）或 FINDINGS 原文明确写「待提/未提」；两者皆无 → 未判定（不臆测）。**更新时机：每次提单/复核后** |
| `dashboard.md` | ✅ 已建（首版 2026-10-21 00:20） | 源 = `trend.csv` + `execution.csv` + `defects.csv` + `skill-bench/`。**更新时机：每轮收口** |

> 口径纪律（不变）：**未创建/未取数的度量项，不得以「已定义」论述趋势**；`defects.csv` 的存量口径是「台账登记行数」，不等于「上游未关闭缺陷数」，引用时必须写明。

## 指标口径

| 度量项 | 口径 |
|---|---|
| 用例执行率 | done / (cells - NOT_RUN)，done = PASS+FAIL+SPEC-MISMATCH |
| 用例通过率 | PASS / done（BLOCKED 与 NOT_RUN 不计入分母） |
| 缺陷密度 | (P0+P1) / 已执行用例 ×100 |
| D10 激活率 / 路由准确率 | 评测集跑分（固定模型+温度，见 ../eval/） |

> trend 度量基于 `results/Summary/用例矩阵-设计级-总执行结果-*.csv`（auto-summary 每日生成），
> 单元格粒度 = 用例行 × 客户端列，反映真实执行实例。

## 趋势可对比前提
用例 ID 永不复用 + 废弃用 OBSOLETE（见 ../test-cases/README.md）——度量数据跨版本可比。