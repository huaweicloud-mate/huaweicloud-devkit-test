# 测试全景图每日归档（panorama/）

> **用途**：《huaweicloud-devkit-测试全景图》HTML+xlsx 每日快照统一归档到本目录，随仓库版本化、可追溯。
> **真源（2026-09-10 迁移）**：`C:\Users\Administrator\devkit-test\test manage\huaweicloud-devkit-测试全景图.{html,xlsx}`——**全景图唯一工作源目录**（原 `C:\Users\Administrator\WorkBuddy\<时间戳>\` 已废弃，不再使用/更新）。
> **归档起点**：ITER-003-2026-09-09（用户要求新建目录专门存放，2026-09-09 起每天归档）
> **工作源迁移**：2026-09-10 由 WorkBuddy 生成目录整体迁移至 `test manage\`（含全部 .bak 历史备份）；全景图更新脚本（test-cases/panorama-*.py）路径已同步指向新目录。

## 文件命名

文档正文和表格中的时间统一使用北京时间时间戳 `YYYY-MM-DD HH:mm:ss`（如 `2026-09-10 19:35:00`）；Windows 文件名使用紧凑时间戳 `YYYYMMDDHHmmss`。

```
huaweicloud-devkit-测试全景图-ITER-<NNN>-<YYYYMMDDHHmmss>.html
huaweicloud-devkit-测试全景图-ITER-<NNN>-<YYYYMMDDHHmmss>.xlsx
```

> `<NNN>-<YYYYMMDDHHmmss>` 用 **Get-Date 真实执行时间**（时区在文档正文中记录）；每次生成保留独立快照，不覆盖同一时间戳文件。

> **命名口径变更**：ITER 系列（ITER-001~009）于 **2026-09-12 收官**，此后测试改为「每日测试流水线」，**归档命名改用日期而非 ITER-NNN**：
>
> ```
> huaweicloud-devkit-测试全景图-<YYYY-MM-DD>-<YYYYMMDDHHmmss>.html
> huaweicloud-devkit-测试全景图-<YYYY-MM-DD>-<YYYYMMDDHHmmss>.xlsx
> ```
>
> 旧 `-ITER-<NNN>-` 命名仅适用于 2026-09-12 之前的归档快照（见下表 ITER-003/004 行）。

## 每日更新流程（收口时必做，参考技能 §四.4 全景图回流）

1. 在 **`test manage\`** 目录更新工作版全景图。**口径变更时的回流脚本 = `test-cases/panorama-refresh-latest.py`**（从真源重算：设计级/展开级/体验级母版 CSV 条数、`D1~D10` 维度分布、`results/Summary/用例矩阵-设计级-总执行结果-<日期>.csv` 当日执行表、`metrics/trend.csv` 趋势；HTML 精确子串回流 + xlsx 矩阵 upsert，自带 `.bak-<YYYYMMDD>` 备份与非预期命中即中止保护）。
   ⚠️ **实测（2026-10-20）：该脚本不是幂等可复跑**——其 HTML 锚点基于回流**前**的旧文本（205 / 138 等），首次运行后即被消耗；复跑会命中 `got=0 expected=1` 并中止（**未落盘，工作源不受影响**：实测复跑前后 HTML 归一化 md5 与 xlsx md5 完全一致）。**下次口径变更需按当时的实际文本重指锚点**（或改写为真源驱动的整体生成），勿直接复跑。
   旧的一次性脚本 `panorama-update-iter003.py` / `panorama-update-iter004.py` / `panorama-case-status-iter004.py` / `panorama-xlsx-iter004.py` 为 ITER 时代快照替换，旧串同样已消耗，**勿再直接复跑**。
2. 复制到本目录（用 Python/`Copy-Item` 均可，中文文件名勿走 PowerShell `Get-Content`/`sed` 直接改写）：`huaweicloud-devkit-测试全景图-<YYYY-MM-DD>-<YYYYMMDDHHmmss>.html`（xlsx 同理）
3. 校验：grep 残留旧值（旧迭代号/旧覆盖率/过时条数 179·205·316·230·245·138·342）+ section/div 开闭计数配平 + 文件 > 60KB + `openpyxl` 重开核对设计级/展开级 sheet 行数 = 母版条数（212 / 137）
4. 与 results/Summary 当日汇总、LATEST.md 同步后一起 commit + push（本仓日常由维护者提交；`main` 禁强推）

## 归档清单

| 文件 | 迭代 | 日期 | 备注 |
|---|---|---|---|
| huaweicloud-devkit-测试全景图-ITER-003-2026-09-09.html | ITER-003 | 2026-09-09 | 首日归档（ITR-002 终版内容快照，ITER-003 验证结论回流后更新） |
| huaweicloud-devkit-测试全景图-ITER-003-2026-09-09.xlsx | ITER-003 | 2026-09-09 | 首日归档 |
| huaweicloud-devkit-测试全景图-ITER-004-2026-09-10.html / .xlsx | ITER-004 | 2026-09-10 | NR3 15 新用例入矩阵（138 条）；工作源已迁至 test manage\ |
| huaweicloud-devkit-测试全景图-2026-10-20-20261020212222.html / .xlsx | ITER 收官后（每日流水线口径） | 2026-10-20 | 真源回流到当日口径：设计级 212 + 展开级 137 + 体验级 43（用例库 349）；维度分布按母版重算（D1 63 / D2 27 / D3 38 / D4 29 / D5 8 / D6 9 / D7 6 / D8 10 / D9 13 / D10 9）；当日执行真源 results/Summary/用例矩阵-设计级-总执行结果-2026-10-20.csv（107 条 × 11 机位 = 1177 单元格，执行率 87.1% / 通过率 90.6%）；xlsx「测试矩阵-设计级」/「测试矩阵-展开级」upsert 至 212 / 137 行（新增 7 条标「待执行」，保留「执行状态/测试结果」列）；生成器 test-cases/panorama-refresh-latest.py |

> 命名口径说明：ITER 系列（ITER-001~009）于 **2026-09-12 收官**后，测试改为「每日测试流水线」，归档命名**改用日期而非 ITER-NNN**（即 `huaweicloud-devkit-测试全景图-<YYYY-MM-DD>-<YYYYMMDDHHmmss>.*`）；上表 ITER-003/004 行为收官前的历史快照。
