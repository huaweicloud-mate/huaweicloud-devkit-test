# Codex-GPT-5 每日测试报告

> **生成时间**：2026-10-04 05:09:37（北京时间）
> **执行归档**：`results/Codex/2026-10-04-192.168.0.102/Windows/`
> **被测对象**：`huaweicloud-devkit@1.1.8-next.1`，源码 `ffd7b47`
> **结论**：`PARTIAL`，141 条全部执行，128 PASS / 13 FAIL / 0 BLOCKED / 0 NOT_RUN。

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Codex` + `GPT-5` |
| OS | `Windows` |
| 执行包 | 设计级 102 + 展开级 39 |
| 执行方法 | 复用并重跑 Codex/参考探针；按用例拆分 `stdout.log`；执行 `backfill_daily.py` 回填 |
| 真云资源 | 本轮未执行会创建云资源的写入型操作；相关场景以规划/安全 hook/协议探针验证，未产生待释放资源 |

## 二、执行摘要

| 指标 | 值 |
|---|---:|
| 计划用例 | 141 |
| 已执行 | 141 |
| PASS | 128 |
| FAIL | 13 |
| BLOCKED / NOT_RUN | 0 / 0 |
| 通过率 | 90.8% |
| P0 / P1 / P2 缺陷 | 1 / 12 / 0 |

## 三、状态汇总

| 层级 | PASS | FAIL | BLOCKED | NOT_RUN | 合计 |
|---|---:|---:|---:|---:|---:|
| 设计级 | 100 | 2 | 0 | 0 | 102 |
| 展开级 | 28 | 11 | 0 | 0 | 39 |
| 合计 | 128 | 13 | 0 | 0 | 141 |

## 四、缺陷清单

| 级别 | 用例 | 现象 | 根因 |
|---|---|---|---|
| P0 | `D4-16` | MCP hook 对包装命令返回 allow，未拦截内层风险命令 | `plugins/huaweicloud-core/src/safety-policy.mjs:411` / `:493` / `:555` |
| P1 | `D4-27` | 双路径输出中 AK/SK/token 未完全脱敏 | `plugins/huaweicloud-core/src/safety-policy.mjs:49` / `:57` / `:61` |
| P1 | `EXP-E01,E02,E03,E04,E05,E07,E10,E11,E12,E13,E14` | service catalog 路由返回 MISS | `plugins/huaweicloud-core/src/tools.mjs:1966` / `:2195` / `:2214` |

详细提单输入见 `FINDINGS.md`。

## 五、未执行用例与原因

无。全部用例均已执行并回填；无 BLOCKED、无 NOT_RUN。

## 六、安全与红线合规

- 凭证泄漏：发现产品侧脱敏缺陷 `D4-27`，已记录为 P1 缺陷；测试产物未提交真实 AK/SK。
- 写操作误判：发现 `D4-16` 包装命令绕过风险，已记录为 P0 缺陷。
- PASS 门禁：`verify_no_fake_pass.py Codex Windows` 通过。
- 覆盖率门禁：`verify_coverage.py Codex Windows` 通过。

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---:|---:|---|
| 云资源 | 0 | 0 | 本轮探针未创建真实云资源 |
| 本地临时监听 | 1 次 D9-10 remote transport | 已由探针关闭 | stdout 记录 remote transport 测试完成 |

## 八、遗留与建议

优先修复 `D4-16`，它是 P0 安全门缺口；随后修复脱敏递归覆盖和 service catalog 中文/场景意图词覆盖。修复后建议按本次失败用例集合做定向回归。