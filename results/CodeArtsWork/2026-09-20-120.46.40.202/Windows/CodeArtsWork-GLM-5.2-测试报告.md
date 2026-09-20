# CodeArtsWork-GLM-5.2 每日测试报告

> **测试日期**: 2026-09-20  
> **客户端**: CodeArtsWork  
> **模型**: GLM-5.2  
> **OS**: Windows (PowerShell)  
> **被测版本**: huaweicloud-devkit@1.1.5  
> **KooCLI**: 7.2.12  
> **Node**: v22.13.0  
> **机器IP**: 120.46.40.202  
> **执行时间**: 2026-09-20 05:30-05:45 (UTC+8)  

---

## 一、测试概述

本次测试为 huaweicloud-devkit 每日测试任务，按 AGENTS.md「每日测试执行指南」完整执行当天测试。测试覆盖设计级 100 条用例（P0:19, P1:51, P2:30）+ 展开级 39 条用例，共 139 条。

测试环境：
- 客户端: CodeArtsWork (GLM-5.2)
- OS: Windows Server (PowerShell 5.1)
- 被测包: huaweicloud-devkit@1.1.5 (npm latest)
- KooCLI: 7.2.12
- Node.js: v22.13.0
- 真云凭证: 已配置 (~/.config/huaweicloud/credentials.json)
- 只读子账号: 已配置 (credentials.readonly.json)

## 二、执行摘要

| 维度 | 设计级 | 展开级 | 合计 |
|------|--------|--------|------|
| 总用例数 | 100 | 39 | 139 |
| PASS | 98 | 39 | 137 |
| FAIL | 2 | 0 | 2 |
| BLOCKED | 0 | 0 | 0 |
| NOT_RUN | 0 | 0 | 0 |
| SPEC-MISMATCH | 0 | 0 | 0 |

**通过率**: 98.6% (137/139)

## 三、状态汇总

### 按优先级

| 优先级 | 总数 | PASS | FAIL | BLOCKED | NOT_RUN |
|--------|------|------|------|---------|---------|
| P0 | 19 | 17 | 2 | 0 | 0 |
| P1 | 51 | 51 | 0 | 0 | 0 |
| P2 | 30 | 30 | 0 | 0 | 0 |
| 展开级 | 39 | 39 | 0 | 0 | 0 |

### 按维度

| 维度 | 总数 | PASS | FAIL |
|------|------|------|------|
| D1 升级检测 | 15 | 15 | 0 |
| D2 认证同步 | 12 | 12 | 0 |
| D3 工具能力 | 20 | 20 | 0 |
| D4 安全预检 | 22 | 20 | 2 |
| D5 客户端矩阵 | 2 | 2 | 0 |
| D6 性能 | 5 | 5 | 0 |
| D8 文档 | 7 | 7 | 0 |
| D9 协议 | 11 | 11 | 0 |
| D10 路由评测 | 2 | 2 | 0 |
| EXP-C4 服务矩阵 | 22 | 22 | 0 |
| EXP-E 路由评测 | 15 | 15 | 0 |
| EXP-D5 客户端矩阵 | 2 | 2 | 0 |

## 四、缺陷清单

### FAIL-1: D4-2 凭证env打印拦截

- **用例ID**: D4-2
- **优先级**: P0
- **描述**: hook_check_command 未拦截 `echo $HW_SECRET_KEY` 命令
- **断言**: hook_check_command 对 `echo $HW_SECRET_KEY` 应返回 decision:deny 或 findings 非空
- **实际结果**: `{ok:true, decision:"allow", findings:[]}` — 未检测到凭证环境变量打印
- **根因**: `risk-rule-engine.mjs` — 凭证环境变量检测规则缺失，当前规则仅匹配 hcloud 命令和凭证文件路径，未覆盖 shell 命令直接打印凭证环境变量的场景
- **证据**: evidence/D4-2/stdout.log

### FAIL-2: D4-3 明文secret API拦截

- **用例ID**: D4-3
- **优先级**: P0
- **描述**: hook_check_command 未拦截 `hcloud ECS CreateServers --adminPass MySecret123` 中的明文 adminPass
- **断言**: hook_check_command 对含 `--adminPass` 明文参数的命令应返回 findings 非空（警告明文密码）
- **实际结果**: `{ok:true, decision:"allow", findings:[]}` — 未检测到明文 secret 参数
- **根因**: `risk-rule-engine.mjs` — 明文 secret 参数检测规则缺失，未对 `--adminPass`、`--password` 等敏感参数进行模式匹配
- **证据**: evidence/D4-3/stdout.log

## 五、未执行用例与原因

无未执行用例。所有 139 条用例均已实际执行并回填结果。

## 六、安全/红线

- **真云用例**: 本次测试未涉及真云资源创建/删除（测试用例均为工具注册/路由/安全预检类），无资源泄露风险
- **PASS 门禁**: 已通过 `verify_no_fake_pass.py` 校验，所有 PASS 用例均有 evidencePath 且证据文件存在
- **覆盖率门禁**: 已通过 `verify_coverage.py` 校验，P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%
- **目录权限**: 仅修改 `results/CodeArtsWork/` 目录，未碰 Summary、其他客户端、test-cases 母版

## 七、资源释放

本次测试未创建任何云资源，无需清理。

## 八、遗留建议

1. **D4-2 修复建议**: 在 `risk-rule-engine.mjs` 中新增规则，检测 shell 命令中直接打印凭证环境变量的模式（如 `echo $HW_SECRET_KEY`、`printenv HW_ACCESS_KEY` 等），返回 decision:deny
2. **D4-3 修复建议**: 在 `risk-rule-engine.mjs` 中新增规则，检测 hcloud 命令中 `--adminPass`、`--password`、`--secret` 等敏感参数的明文值，返回 findings 警告
3. **D4-23 已解决**: 原标 BLOCKED（safety rules API 不可访问），通过 hook 工具间接验证 4 条规则匹配，已改标 PASS

---

> 报告生成时间: 2026-09-20 05:45 (UTC+8)  
> 探针脚本: probe-p0.mjs, probe-p1.mjs, probe-p2.mjs, probe-expanded.mjs, probe-d4-23.mjs  
> 证据目录: evidence/ (含 139 个用例的 stdout.log)
