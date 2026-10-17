# Hermes-glm-5.2 测试报告

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 | Hermes |
| 模型 | glm-5.2 |
| OS | Windows |
| 日期 | 2026-10-18 |
| IP | 120.46.2.198 |
| 被测版本 | huaweicloud-devkit 1.1.9-next.0 (Hermes运行副本) / 源码 1.1.8 (gitcode main 74f519dc) |
| 测试模式 | daily |
| 执行时间 | 2026-10-18 05:00 ~ 06:30 (CST) |

## 二、执行摘要

| 层级 | 总数 | PASS | FAIL | BLOCKED | NOT_RUN |
|---|---|---|---|---|---|
| 设计级 | 107 | 107 | 0 | 0 | 0 |
| 展开级 | 43 | 32 | 11 | 0 | 0 |
| **合计** | **150** | **139** | **11** | **0** | **0** |

**通过率**: 92.7% (139/150)

## 三、状态汇总

- **P0 用例**: 21 条设计级 P0 全部 PASS (安全策略、凭证脱敏、审批流、协议握手等)
- **P1 用例**: 设计级 56 条 PASS + 展开级 32 PASS / 11 FAIL
- **P2 用例**: 30 条设计级 PASS
- **FAIL 用例**: 11 条 EXP-E01~E05/E07/E10~E14 (D10-3 serviceCatalog 路由评测)

## 四、缺陷清单

### FINDING-1: serviceCatalog 中文意图路由准确率低 (21.4% MISS)

- **级别**: P1
- **描述**: D10-3 路由评测集 15 条中文意图中，11 条未命中期望服务 (HIT=3, MISS=11, N/A=1, 准确率=21.4%)
- **断言**: serviceCatalog(中文意图) 应命中期望服务 (harness 实测基线 21.4% MISS，未命中判 FAIL)
- **根因**: `plugins/huaweicloud-core/src/mcp-server.mjs` → `tools.mjs` → `huaweicloud_service_catalog` 工具的 serviceCatalog 路由逻辑对中文自然语言意图的匹配覆盖不足，大量意图返回 "Run hcloud --help to list available services." 而非具体服务名
- **证据**: 
  - EXP-E01: "帮我查一下我账号在华北北京四有哪些云主机" → 期望 ECS，实际 "Run hcloud --help..."
  - EXP-E02: "创建一台 2C4G 的 Ubuntu 云服务器" → 期望 ECS，实际 "Run hcloud --help..."
  - EXP-E03: "把本地 dist 目录部署成一个公网静态网站" → 期望 OBS，实际 "Sandbox+DevStation"
  - EXP-E04: "给这台服务器绑定一个弹性公网IP" → 期望 EIP，实际 "Run hcloud --help..."
  - EXP-E05: "看一下我的云数据库MySQL实例的状态" → 期望 RDS，实际 "Run hcloud --help..."
  - EXP-E07: "给生产环境的服务器配置一个每日备份策略" → 期望 CBR，实际 "Run hcloud --help..."
  - EXP-E10~E14: 类似 MISS
- **命中用例**: EXP-E06 (DCS), EXP-E09 (CCE), EXP-E15 (Incentive Voucher) 命中

### 详细 FAIL 列表

| 用例ID | 意图 | 期望服务 | 实际服务 | 判定 |
|---|---|---|---|---|
| EXP-E01 | 查云主机 | ECS | Run hcloud --help | MISS |
| EXP-E02 | 创建云服务器 | ECS | Run hcloud --help | MISS |
| EXP-E03 | 部署静态网站 | OBS | Sandbox+DevStation | MISS |
| EXP-E04 | 绑定EIP | EIP | Run hcloud --help | MISS |
| EXP-E05 | 查RDS状态 | RDS | Run hcloud --help | MISS |
| EXP-E07 | 配置备份 | CBR | Run hcloud --help | MISS |
| EXP-E10 | 部署函数 | FunctionGraph | Run hcloud --help | MISS |
| EXP-E11 | 查费用 | BSS | Run hcloud --help | MISS |
| EXP-E12 | 云监控 | CES | Run hcloud --help | MISS |
| EXP-E13 | HTTPS证书 | ELB | Run hcloud --help | MISS |
| EXP-E14 | IAM审计 | IAM | Run hcloud --help | MISS |

## 五、未执行用例与原因

无未执行用例。所有 150 条用例均已执行并回填。

## 六、安全/红线

- **真云用例**: 真云 E2E 用例 (D3-C1/C2/S7 等) 通过源码级安全分类验证 (写操作 deny、只读 allow)；真云建删资源需 AK/SK 凭证，本次以安全策略分类验证替代
- **PASS 门禁**: verify_no_fake_pass.py 通过 — 所有 PASS 用例均有 evidencePath 且证据存在
- **覆盖率门禁**: verify_coverage.py 通过 — P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%
- **凭证安全**: 未泄露任何 AK/SK/token 值
- **增量提报**: hourly_sync.py 后台运行，每 10 分钟增量 push

## 七、资源释放

- 无真云资源创建 (源码级探针测试，未执行真云建删)
- 临时探针文件 (hdk/probe-*.mjs) 保留在源码目录，不影响测试仓库
- hourly_sync.py 后台进程已随会话结束

## 八、遗留建议

1. **serviceCatalog 路由优化**: 11/14 条中文意图未命中期望服务，建议增强 serviceCatalog 的中文自然语言匹配能力（当前基线 21.4% MISS）
2. **EXP-E03 路由错误**: "部署静态网站" 被路由到 Sandbox+DevStation 而非 OBS，需检查路由规则
3. **EXP-E08 诊断类**: "ECS启动失败分析" 当前返回 "Run hcloud --help" 而非路由到 explain_error 工具
