# 度 量与趋势说明

跨迭代质量度量（§5.1）。趋势指标由 `scripts/trend_metrics.py` 从每日汇总自动生成，
其余为每迭代末维护记录。

## 文件

| 文件 | 内容 | 生成方式 |
|---|---|---|
| `trend.csv` | 每日一行：date / total(用例) / cells(用例×客户端) / done / pass / fail / spec / blocked / notrun / exec_rate / pass_rate | 自动（`npm run test:trend`，CI `trend-metrics.yml` 每日兜底） |
| `trend.md` | 跨日 Markdown 趋势报告（表 + 7 日均值 + 风险提示） | 同上 |
| `execution.csv` | 每轮手工记录：时间戳 / 迭代 / 计划用例 / 已执行 / 通过 / 阻塞 / 执行率 / 通过率 | 人工（维护者每迭代） |
| `dashboard.md` | 质量仪表盘（每迭代末更新一页，随 T6 报告呈报） | 人工 |

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