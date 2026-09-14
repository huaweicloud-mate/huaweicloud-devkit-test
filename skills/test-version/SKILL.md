---
name: test-version
description: "huaweicloud-devkit 版本全量测试能力：init_day --full（母版全量 316 条）或 --version <版本>（冻结快照）建全量包 → P0→P1→P2 全量执行+证据落盘 → 回填+门禁 → 出报告 → 归档 results/version/<版本>。Use when: 收到「版本全量测试 <版本>」提示语，对某版本跑全量用例集。"
version: 1.0.0
tags: [testing, huaweicloud, devkit, version, full-test]
---

# huaweicloud-devkit 版本全量测试能力

针对某个版本跑**全量用例集**（母版 316 条），区别于「每日测试」的 daily 精选（152 条）。

## 触发语

```
版本全量测试 <版本>       # 例：版本全量测试 v1.1.4
全量测试 <版本>
```

出现「版本全量测试」/「全量测试」+「版本号」即触发本能力。

## 与「每日测试」的区别

| | 每日测试 | 版本全量测试（本能力） |
|---|---|---|
| 用例源 | daily 精选 152（设计级 81 + 展开级 71） | 母版全量 316（179 + 137）或版本快照 |
| 场景 | 每天回归盯防 | 版本发布前/后的完整验证 |
| 建包 | `init_day ... `（默认） | `init_day ... --full` 或 `--version <版本>` |

## 前置（统一见根 AGENTS.md §0）

clone 两仓库、自我识别客户端/OS、凭证、`prepare_env.py --update` 拉最新，见仓库根 `AGENTS.md`「专属目录」「0. 自我识别 + 前置准备」节，此处不重复展开。

## 流程

### Step 1 建全量包
```bash
python scripts/init_day.py <客户端> <OS> --full            # 母版全量 316（当前最新）
python scripts/init_day.py <客户端> <OS> --version <版本>   # 版本冻结快照（锁定该版本用例）
```
- `--full`：当前最新母版（`test-cases/design/` 179 + `expanded/` 137）。
- `--version <版本>`：`test-cases/versions/<版本>/` 冻结快照（**发版本全量验证优先用这个**，锁定版本用例）。
- 结果落 `results/<客户端>/<日期>-<IP>/<OS>/`（与 daily 同结构，靠日期错开）。

### Step 2 全量执行
按 **P0 → P1 → P2** 逐条执行全量用例，证据（probe + stdout.log）落盘 `evidence/<case-id>/`。**持续输出进度**（全量 316 条耗时更长，无输出会被调度器判 idle 杀掉）。

### Step 3 回填 + 门禁
- 回填「执行状态」+「执行时间」，NOT_RUN/PASS 纪律同「每日测试」。
- 跑 `python scripts/verify_no_fake_pass.py <客户端> <OS>` + `python scripts/verify_coverage.py <客户端> <OS>`。

### Step 4 出报告 + 归档
- 报告标题含 `Agent+模型名`，文件名/正文标注版本：如 `<客户端>-<模型>-v1.1.4-测试报告.md`，正文注明「版本全量测试 v1.1.4」。
- FINDINGS.md 记缺陷（file_issue.py 的解析输入）。
- **维护者汇总各客户端结论 → 归档 `results/version/<版本>/`**（测试报告 + 执行结果 + 缺陷清单）。

## 红线

1. 真云纪律 / 缺陷合并单 / PASS 门禁 / 完成门禁，同「每日测试」（见 `skills/test-execution`）。
2. 版本快照是**冻结用例**，勿改 `test-cases/versions/` 下快照；改用例只能走母版生成器（gen_matrix 等）。

## 命令速查

| 用途 | 命令 |
|---|---|
| 建全量包（母版 316） | `python scripts/init_day.py <客户端> <OS> --full` |
| 建全量包（版本快照） | `python scripts/init_day.py <客户端> <OS> --version <版本>` |
| PASS 门禁 | `python scripts/verify_no_fake_pass.py <客户端> <OS>` |
| 覆盖率门禁 | `python scripts/verify_coverage.py <客户端> <OS>` |
| 每 10 分钟提报 | `python scripts/hourly_sync.py <客户端> <OS> --interval 600` |
| 统一提单 | `python scripts/file_issue.py <FINDINGS.md> <版本>` |

## 陷阱

- `--full` 是母版**当前最新**（用例会随新需求增加），`--version` 才是**锁定某版本**；发版本全量验证优先 `--version`，避免"测到一半母版又变了"。
- 全量 316 条执行时间比 daily 长得多，务必每 10 分钟 `hourly_sync` 提报防丢失。
- 结果目录与 daily 共用 `<日期>-<IP>`，同一天同一客户端别既跑 daily 又跑全量（会相互覆盖）；维护者调度时错开日期。
- 版本快照不含追踪表，建包时追踪表统一用母版 `test-cases/tracing/`（以最新追踪为准）。