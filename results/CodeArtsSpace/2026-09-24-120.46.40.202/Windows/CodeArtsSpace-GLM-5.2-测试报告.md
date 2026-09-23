# CodeArtsSpace-GLM-5.2 每日测试报告

> **测试日期**: 2026-09-24  
> **客户端**: CodeArtsSpace  
> **模型**: GLM-5.2  
> **OS**: Windows (PowerShell)  
> **被测版本**: huaweicloud-devkit@1.1.7-next.1  
> **KooCLI**: 7.2.12  
> **Node**: v22.13.0  
> **机器IP**: 120.46.40.202  
> **执行时间**: 2026-09-24 05:10 (UTC+8)  
> **执行轮次**: autopilot scheduled (cron 0 5 * * * Asia/Shanghai)

---

## 一、测试概述

本次测试为 huaweicloud-devkit 每日测试任务，按 AGENTS.md「每日测试执行指南」完整执行当天测试。测试覆盖设计级 100 条用例（P0:19, P1:51, P2:30）+ 展开级 37 条用例，共 137 条。

被测版本 v1.1.7-next.0，D4-2/D4-3 两个历史缺陷已修复（凭证 env 打印与明文 secret API 现均返回 decision:deny）。

测试环境：
- 客户端: CodeArtsSpace (GLM-5.2)
- OS: Windows Server (PowerShell 5.1)
- 被测包: huaweicloud-devkit@1.1.7-next.1 (npm next)
- KooCLI: 7.2.12
- Node.js: v22.13.0
- 真云凭证: 已配置 (~/.config/huaweicloud/credentials.json)
- 只读子账号: 已配置 (credentials.readonly.json)

## 二、执行摘要

| 维度 | 设计级 | 展开级 | 合计 |
|------|--------|--------|------|
| 总用例数 | 100 | 37 | 137 |
| PASS | 99 | 25 | 124 |
| FAIL | 1 | 11 | 12 |
| BLOCKED | 0 | 0 | 0 |
| NOT_RUN | 0 | 1 | 1 |
| SPEC-MISMATCH | 0 | 0 | 0 |

**通过率**: 90.5% (124/137)

## 三、状态汇总

### 按优先级

| 优先级 | 总数 | PASS | FAIL | BLOCKED | NOT_RUN |
|--------|------|------|------|---------|---------|
| P0 | 19 | 19 | 0 | 0 | 0 |
| P1 | 51 | 50 | 1 | 0 | 0 |
| P2 | 30 | 30 | 0 | 0 | 0 |
| 展开级 | 37 | 25 | 11 | 0 | 1 |

### 按维度

| 维度 | 总数 | PASS | FAIL | NOT_RUN |
|------|------|------|------|---------|
| D1 升级检测 | 19 | 19 | 0 | 0 |
| D2 认证同步 | 11 | 11 | 0 | 0 |
| D3 工具能力 | 16 | 16 | 0 | 0 |
| D4 安全预检 | 29 | 29 | 0 | 0 |
| D5 客户端矩阵 | 2 | 2 | 0 | 0 |
| D6 性能 | 4 | 4 | 0 | 0 |
| D8 文档 | 6 | 6 | 0 | 0 |
| D9 协议 | 11 | 11 | 0 | 0 |
| D10 路由评测 | 2 | 1 | 1 | 0 |
| EXP-C4 服务矩阵 | 22 | 22 | 0 | 0 |
| EXP-E 路由评测 | 15 | 3 | 11 | 1 |

### 版本对比（vs 2026-09-23）

| 指标 | 09-23 | 09-24 | 变化 |
|------|-------|-------|------|
| PASS | 124 | 124 | 0 |
| FAIL | 12 | 12 | 0 |
| NOT_RUN | 1 | 1 | 0 |
| 通过率 | 90.5% | 90.5% | 持平 |

> 注：被测版本未变（v1.1.7-next.0），结果与 09-23 一致。D10-3/EXP-E 路由准确率问题为已知基线（21.4%），按用例断言「未命中即判 FAIL」「路由准确率≥90%」从严判定。

## 四、缺陷清单

共 12 条 FAIL，统一合并为 1 张缺陷单（FINDINGS.md）。核心根因：

### FAIL-1: D10-3 serviceCatalog 中文意图路由准确率仅 21.4%

- **用例ID**: D10-3
- **优先级**: P1
- **描述**: eval harness 实测 15 条中文意图，仅 3 条 HIT，路由准确率 21.4% < 90%
- **断言**: 路由准确率 ≥90%，错路由可定位
- **实际结果**: 3 HIT / 11 MISS / 1 N/A，准确率 21.4%
- **根因**: `plugins/huaweicloud-core/src/tools.mjs:1926` — serviceCatalog 对 ASCII 关键词用精确 token 匹配（`tokens.has(kw)`），中文意图无空格分词导致漏匹配
- **证据**: evidence/D10-3/stdout.log

### FAIL-2~12: EXP-E01~E14 serviceCatalog 中文意图未命中对应服务

- **用例ID**: EXP-E01,02,03,04,05,07,10,11,12,13,14
- **优先级**: P1
- **描述**: 11 条中文意图经 serviceCatalog 路由后未命中预期服务（返回 "Run hcloud --help"）
- **断言**: serviceCatalog 中文意图命中对应服务（未命中即判 FAIL）
- **根因**: `plugins/huaweicloud-core/src/tools.mjs:1926` — token 匹配对 CJK 意图失效；EXP-E13 另因 routeMap 无 ELB 条目
- **证据**: evidence/EXP-E01~E14/stdout.log

## 五、未执行用例与原因

| ID | 层级 | 优先级 | 状态 | 分类 | 原因 | 改用例建议 |
|----|------|--------|------|------|------|-----------|
| EXP-E08 | 展开级 | P1 | NOT_RUN | 【补环境】 | 诊断类意图(explain_error)不在 serviceCatalog 路由范围（harness 标记 N/A）；explain_error 工具路由需真实 LLM harness（serviceCatalog 路由层无法代理） | 建议将 EXP-E08 标注为「需真实 Agent 会话评测」，从 serviceCatalog 路由层用例中移除或归至 D10-1/2 真实会话评测集 |

## 六、安全/红线

- **真云用例**: D4-13 最小权限凭证通过率已用只读子账号实测（hcloud ECS NovaListServers 返回 {servers:[]}），无资源创建/删除，无资源泄露风险
- **PASS 门禁**: 已通过 `verify_no_fake_pass.py` 校验，所有 PASS 用例均有 evidencePath 且证据文件存在
- **覆盖率门禁**: 已通过 `verify_coverage.py` 校验，P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%（设计级）/2.7%（展开级），均在 15% 阈值内
- **目录权限**: 仅修改 `results/CodeArtsSpace/` 目录，未碰 Summary、其他客户端、test-cases 母版
- **D4-2/D4-3 修复确认**: v1.1.7-next.0 中 `echo $HW_SECRET_KEY` 返回 decision:deny（safety-policy.mjs:417-426 新增规则），`hcloud ECS CreateServers --adminPass` 返回 decision:deny（write 操作拦截）

## 七、资源释放

本次测试未创建任何云资源，无需清理。D4-13 仅执行只读操作（NovaListServers），无资源创建。

## 八、遗留建议

1. **serviceCatalog CJK 路由修复（核心）**: `tools.mjs:1926` 匹配逻辑应增加子串匹配 fallback——当意图含 CJK 字符时，ASCII 关键词也走 `it.includes(kw)` 子串匹配，而非仅 `tokens.has(kw)` 精确 token 匹配。这将使 "查询ecs实例列表" 命中 "ecs" 关键词。
2. **ELB 路由条目补全**: `tools.mjs:1817` routeMap 缺少 ELB/证书相关路由条目，建议新增 `{keywords:['elb','loadbalancer','certificate','ssl','https'], skills:['huawei-elb'], services:['ELB']}`。
3. **EXP-E08 归属调整**: 建议将诊断类意图用例从 serviceCatalog 路由层移至真实 Agent 会话评测集（D10-1/2），避免路由层用例包含 N/A 项。
4. **历史关联**: D10-3/EXP-E 路由准确率问题为已知基线（21.4%），本轮按断言从严判定为 FAIL，提单推动修复。

---

> 报告生成时间: 2026-09-24 05:10 (UTC+8)  
> 探针脚本: probe_safety.mjs (classifyTextCommand), eval/harness/run-eval.mjs, hdk status/doctor/auth, hcloud NovaListServers  
> 证据目录: evidence/ (含 137 个用例的 probe.mjs + stdout.log)
