# token 降本实验：按需下发工具 schema（差距 #10）

- 日期：2026-10-19
- 结论：按需下发对简单只读任务省 **56.5%** input token，成功率 / 步数均不变

## 实验设计

背景：技能评测差距清单 #10「token 降本实验未做」。当前 harness 每轮把全部 37 个工具的 schema 塞进 prompt（input token 占 95%+，已上报上游 #926）。本实验验证「按需下发」——只下发任务历史实际用到的工具——的降本效果。

机制：新增 `BENCH_TOOLS_FILTER=1` 开关（`harness/run-bench.mjs`）。开启后，按 `results/summary.json` 里每个任务的 `tools` 字段（历史实际用到的工具集）裁剪工具 schema，只下发白名单内的工具；开关默认关闭，不影响现有基线。

## 实验组与对照组（同版本对照）

| 组 | 工具下发 | SUT 版本 | 采样 |
|---|---|---|---|
| 对照组（全量） | 37 工具 | 1.1.1-next.15 | 3（`summary.json` `tasks[].t04` 基线）|
| 实验组（按需） | 4 工具（`check_cli` / `list_operations` / `list_regions` / `run_readonly_command`）| 1.1.1-next.15 | 3（本次 `BENCH_TOOLS_FILTER=1`）|

任务：**t04 查询 ECS 实例列表**（只读，真值 0 台）。

## 结果

| 指标 | 全量 37 工具 | 按需 4 工具 | 差异 |
|---|---|---|---|
| 成功率 | 3/3 | 3/3 | 不变 |
| token IN 中位 | 39,551 | 17,224 | **省 56.5%（−22,327）** |
| token OUT 中位 | 951 | 1,119 | +168（占总量 ~2%，绝对量可忽略）|
| 步数中位 | 5 | 5 | 不变 |

单 run IN：28,010 / 17,224 / 12,788（中位 17,224）。run 记录带 `toolFilter: true` 标记，runid 前缀 `20261019054813-t04-*`。

## 结论

1. 按需下发对简单只读任务省 **56.5%** input token，成功率 / 步数均不变。
2. 省的是「37 个工具 schema 每轮重发」的开销（与 #926 上报根因一致），验证「按需下发」是有效降本落点。
3. 局限：本次只测了 t04（只读、工具面窄）。写任务（t15 ECS / t17 RDS）工具面宽，节省比例预计不同，且需验证「按需下发是否削弱复杂任务的探索空间」——建议后续用便宜写任务补验。
4. 开关默认关（`BENCH_TOOLS_FILTER=1` 才启用）；若后续决定默认开启，需重跑全量采样并更新 summary/rebaseline 基线口径。

## 复跑

```bash
BENCH_TOOLS_FILTER=1 node harness/run-bench.mjs t04-list-ecs --runs 3
```