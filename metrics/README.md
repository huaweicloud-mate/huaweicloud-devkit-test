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
| `dashboard.md` | 质量仪表盘（每迭代末更新一页，随 T6 报告呈报） | 人工（模板 `templates/dashboard.md`）；**尚未建立，见下方「未建台账」** |

## 迭代台账收官说明

- **ITER 系列收官**：`ITER-001-2026-09-05` ~ `ITER-009-20260912124913`，于 **2026-09-12** 结束；`execution.csv` 覆盖至 ITER-009，不再按迭代手工记录。
- **执行口径转移**：2026-09-12 起由「每日测试流水线」承接——日汇总 `results/Summary/用例矩阵-设计级-总执行结果-<日期>.csv`，跨日趋势本目录 `trend.csv`/`trend.md`（自动生成）。当前指针见 `results/LATEST.md`。

## 未建台账（口径声明，避免「定义完整 ≠ 已兑现」）

| 文件 | 状态 | 含义 / 补法 |
|---|---|---|
| `defects.csv` | ⚠️ 未建（README/目录规划已定义） | 缺陷存量趋势：ID / 级别 / 新增迭代 / 状态。建表数据源 = 各轮 `FINDINGS.md` + 上游 issue 实时状态（`scripts/file_issue.py` 提交记录）。**未建有据可考之前，不得以「已定义」论述缺陷趋势** |
| `dashboard.md` | ⚠️ 未建（模板已备） | 质量仪表盘：复制 `templates/dashboard.md` 填写，数据源 `execution.csv` + `trend.csv` + 未建中的 `defects.csv`（故依赖项未清前只能部分填） |

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