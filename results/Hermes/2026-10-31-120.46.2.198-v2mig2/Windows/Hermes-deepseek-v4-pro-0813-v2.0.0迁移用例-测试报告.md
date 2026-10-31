# Hermes Windows v2.0.0 迁移用例补测报告（v2mig2）

> **客户端**：Hermes（testbot5-win-hermes）｜**OS**：Windows 10｜**模型**：deepseek-v4-pro-0813
> **被测对象**：源仓库 v2 分支 `fcfe047f`（package.json 2.0.0）
> **补测性质**：上一轮 v2 迁移用例预演（Linux `2026-10-30-1.94.193.150-v2mig`）2 条 Windows 专属 NOT_RUN → 本机 Windows 补测回填（round 2 = `-v2mig2`）。

## 一、测试概述

2 条 P1 Windows 专属用例补测：
- **D5-6（D5客户端·Windows特有问题）**：Windows 安装 Hermes / 升级卸载 config 完整性 / 文件锁 / doctor 查 Python SDK。
- **D7-3（D7兼容·Windows better-sqlite3缺口）**：Windows 跑 `npm test` → 记录失败面 → better-sqlite3 原生模块安装/加载缺口人工补测。

## 二、执行摘要

| 用例 | 状态 | 关键结论 |
|---|---|---|
| D5-6 | **PASS** | Windows 已知问题（config 完整性/文件锁/MCP Python SDK）均 `docs/hermes-windows.md` 文档范围内可控；doctor 10 PASS 含 `[PASS] Hermes MCP Python SDK` |
| D7-3 | **FAIL** | better-sqlite3 原生模块缺口已由 node:sqlite 内置模块替代解决；但 Windows `npm test` 1101 用例 967 PASS / 107 FAIL / 27 SKIP，残留 107 条失败面（主导：Node crypto x509 断言+OOM、spawn UNKNOWN -4094、EPERM 文件锁、路径归一化） |

展开级：`EXP-D5-8-6`（Hermes·D5-6，OS=Windows/Linux）在 Windows 侧复核维持 PASS（对应设计级 D5-6 已回填）。

## 三、状态汇总（已回填）

- 设计级 212 条：继承 Linux 预演基数（154 PASS / 9 FAIL / 47 BLOCKED / 0 SPEC / 2 NOT_RUN），本轮补测 **D5-6 NOT_RUN→PASS、D7-3 NOT_RUN→FAIL**，终态 **155 PASS / 10 FAIL / 47 BLOCKED / 0 SPEC / 0 NOT_RUN**。
- 展开级 57 条：EXP-D5-8-6 维持 PASS（Windows 复核）。

## 四、缺陷清单

详见 `FINDINGS.md`：
- `#1 D5-6` 官方已知问题文档范围可控 → PASS（无缺陷）。
- `#2 D7-3` better-sqlite3 已解决 + 107 条 Windows 失败面（环境 OOM / spawn -4094 / EPERM / 路径归一化 / real-agent win32 空洞），根因含 `文件:行号` 定位。

## 五、证据

- `evidence/D5-6/`：doctor.log、python-sdk.log、probe.mjs、results.json、stdout.log
- `evidence/D7-3/`：npm-test-output.txt（全量 1101 条）、sqlite-gap.log、probe.mjs、results.json、stdout.log

## 六、遗留建议

1. D7-3 残留 107 失败：环境 OOM（共享机内存）重试可解；`spawn UNKNOWN -4094`（`hcloud-run-once.ts:66`）与 real-agent `win32 out of scope` 建议作为 v2 Windows 兼容专项跟进。
2. better-sqlite3 缺口本体已随 node:sqlite 替换关闭，无需提单。