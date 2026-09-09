# 测试全景图每日归档（panorama/）

> **用途**：WorkBuddy 生成的《huaweicloud-devkit-测试全景图》HTML+xlsx 每日快照统一归档到本目录，随仓库版本化、可追溯。
> **真源**：`C:\Users\Administrator\WorkBuddy\<时间戳>\huaweicloud-devkit-测试全景图.{html,xlsx}`（WorkBuddy 生成目录）
> **归档起点**：ITER-003-2026-09-09（用户要求新建目录专门存放，2026-09-09 起每天归档）

## 文件命名

```
huaweicloud-devkit-测试全景图-ITER-<NNN>-<YYYYMMDD>.html
huaweicloud-devkit-测试全景图-ITER-<NNN>-<YYYYMMDD>.xlsx
```

> `<NNN>-<YYYYMMDD>` 用 **Get-Date 真实执行日**（与 results/ITER-* 同规则）；当天多次更新则覆盖当日文件（git 保留历史）。

## 每日更新流程（收口时必做，参考技能 §四.4 全景图回流）

1. WorkBuddy 侧按既有流程更新生成全景图（HTML 快照定向替换 + xlsx 按 sheet 更新，备份 .bak-iter<NNN>）
2. 复制到本目录：`Copy-Item "<WorkBuddy>\huaweicloud-devkit-测试全景图.html" "panorama\huaweicloud-devkit-测试全景图-ITER-<NNN>-<今天>.html" -Force`（xlsx 同理）
3. 校验：grep 残留旧值（旧迭代号/旧覆盖率）+ section 开闭计数配平 + 浏览器可开
4. 与 results/ITER-*/ 收尾总结、LATEST.md 同步后一起 commit + pushm

## 归档清单

| 文件 | 迭代 | 日期 | 备注 |
|---|---|---|---|
| huaweicloud-devkit-测试全景图-ITER-003-2026-09-09.html | ITER-003 | 2026-09-09 | 首日归档（ITR-002 终版内容快照，ITER-003 验证结论回流后更新） |
| huaweicloud-devkit-测试全景图-ITER-003-2026-09-09.xlsx | ITER-003 | 2026-09-09 | 首日归档 |