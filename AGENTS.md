# AGENTS — huaweicloud-devkit 每日测试执行指南

> 每个客户端 agent（OpenCode/Codex/CodeArtsAgent/CodeArtsWork/WorkBuddy/DSH/OfficeAce/Hermes/OpenClaw/AtomCode）读本文件即开始执行当天测试。**不要处理任何 GitHub issue，本任务只做测试执行。**

## 0. 自我识别 + 前置准备

1. 确定你的身份：**客户端名**（10 选一）+ **OS**（Windows/Linux）。
2. 前置（`python scripts/prepare_env.py --update` 一键完成）：
   - 测试仓库 pull main 最新
   - 源码仓库 `hdk` checkout 到 npm `@next` 对应 commit（源码检查用）
   - `npm install -g huaweicloud-devkit@next` 安装最新被测包（黑盒测试用）

## 1. 建当日执行包

```bash
python scripts/init_day.py <客户端> <OS>
# 例：python scripts/init_day.py OpenCode Windows
```
生成 `results/<客户端>/<日期>/<OS>/`，复制 3 份用例 CSV。

## 2. 执行

按 **P0 → P1 → P2** 逐条执行副本 CSV 用例，证据（probe 脚本 + stdout.log）落盘 `results/<客户端>/<日期>/<OS>/evidence/<case-id>/`。

## 3. 回填执行状态

结果直接回填副本 CSV 的「执行状态」列，枚举：
`PASS`（有证据）/ `FAIL`（不符预期，记根因）/ `BLOCKED`（环境阻塞，记 blockedReason）/ `SPEC-MISMATCH`（契约漂移）/ `NOT_RUN`。

## 4. 出测试报告

`results/<客户端>/<日期>/<OS>/<客户端>-<模型>-测试报告.md`，含：概述、执行结果、缺陷清单（根因+证据）、阻塞项、资源清理声明。

## 5. 汇总 + 每小时提报

```bash
python scripts/gen_summary.py                          # 首次生成当天 Summary 总矩阵
python scripts/update_summary.py <客户端> <OS>          # 填自己那一列
# 长时执行时，每小时跑一次防丢失：
python scripts/hourly_sync.py <客户端> <OS>
```

## 6. 统一提单 + 提交（全量测完后）

```bash
python scripts/file_issue.py <缺陷汇总.md> <版本>       # 统一提交 1 个合并单
git add -A && git commit && git pushm origin main
```

## 红线（违反即作废重来）

1. **真云**：最低配置创建 → 测后删除并归零验证 → 只删本次创建资源。
2. **缺陷**：先记根因（文件+行号），全量测完统一提单，勿拆单/勿未测完就提。
3. **证据链**：证据路径回填 `evidencePath` 列，禁止无证据自报通过。
4. **环境阻塞**：标 BLOCKED + 写 blockedReason，不得假装 PASS。
5. **目录权限**：只改 `results/<你的客户端>/` 和 Summary 中自己那一列，禁改他人目录、test-cases 真源。

## 状态口径

| 状态 | 含义 |
|---|---|
| PASS | 通过，有证据 |
| FAIL | 不符预期 |
| BLOCKED | 环境/权限阻塞 |
| SPEC-MISMATCH | 实现与设计契约漂移 |
| NOT_RUN | 未执行 |

## 脚本清单（本仓库 scripts/）

`prepare_env.py` 环境准备 · `init_day.py` 建包 · `gen_summary.py` 生成矩阵 · `update_summary.py` 汇总 · `hourly_sync.py` 每小时提报 · `file_issue.py` 统一提单