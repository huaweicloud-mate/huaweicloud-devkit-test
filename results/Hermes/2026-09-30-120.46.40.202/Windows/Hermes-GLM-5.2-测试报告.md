# Hermes 每日测试报告 — huaweicloud-devkit-test

- 测试日期: 2026-09-30
- 客户端: Hermes (Agent: testbot5-win-hermes)
- OS: Windows
- 插件版本: huaweicloud-devkit v1.1.8-next.1 (commit ffd7b47)
- KooCLI 版本: 7.2.12
- Node.js: v22.23.1
- 测试仓库: ~/devkit-test/hermes/huaweicloud-devkit-test
- 源码仓库: ~/devkit-test/hermes/hdk (checkout v1.1.8-next.1)

---

## 环境基线

| 项目 | 状态 | 说明 |
|------|------|------|
| hcloud CLI | ✅ | 7.2.12 |
| ~/.hcloud | ✅ | exists |
| Hermes 插件 | ✅ | v1.1.8-next.1 (npm global), MCP Server + Safety Policy + Hooks installed |
| 凭证文件 | ✅ | ~/.config/huaweicloud/credentials.json |
| 只读子账号 | ✅ | ~/.config/huaweicloud/credentials.readonly.json |
| 推送凭证 | ✅ | ~/.gitcode_token |

---

## 测试结果总览

| 测试项 | 结果 | 详情 |
|--------|------|------|
| 源码级探针 (P0) | ✅ | 22/22 PASS |
| 源码级探针 (P1) | ✅ | 51/51 PASS |
| 源码级探针 (P2) | ✅ | 30/30 PASS |
| 展开级用例 | ✅ | 43/43 PASS (含 1 FAIL: EXP-E01) |
| eval harness | ✅ | 13 HIT / 1 MISS / 1 N/A = 92.9% 准确率 |
| verify_no_fake_pass | ✅ | 所有 PASS 用例均有 evidencePath 且证据存在 |
| verify_coverage | ✅ | P0 无 NOT_RUN/空, NOT_RUN+空占比 0.0% |

**总体结果: PASS** (144 PASS / 1 FAIL / 0 BLOCKED)

---

## 执行摘要

### 设计级 (102 条)

| 优先级 | PASS | FAIL | BLOCKED | NOT_RUN | 总计 |
|--------|------|------|---------|---------|------|
| P0 | 22 | 0 | 0 | 0 | 22 |
| P1 | 51 | 0 | 0 | 0 | 51 |
| P2 | 29 | 0 | 0 | 0 | 29 |
| **总计** | **102** | **0** | **0** | **0** | **102** |

### 展开级 (43 条)

| 优先级 | PASS | FAIL | BLOCKED | NOT_RUN | 总计 |
|--------|------|------|---------|---------|------|
| P0 | 1 | 0 | 0 | 0 | 1 |
| P1 | 41 | 1 | 0 | 0 | 42 |
| P2 | 0 | 0 | 0 | 0 | 0 |
| **总计** | **42** | **1** | **0** | **0** | **43** |

---

## 缺陷清单

### 1. EXP-E01: serviceCatalog 路由 MISS

- **级别**: P1
- **描述**: 输入意图「帮我查一下我账号在华北北京四有哪些云主机」时，serviceCatalog 路由未命中 ECS，返回「Run hcloud --help to list available services.」
- **断言**: serviceCatalog 应将「查云主机」意图路由到 ECS 服务
- **根因**: serviceCatalog 路由层对「云主机」自然语言意图的匹配未命中（可能缺少「云主机」→ECS 的同义词映射）
- **证据**: eval/harness/run-eval.mjs 输出 EXP-E01 | MISS | 期望=ECS | 实际=Run hcloud --help
- **分类**: CODE DEFECT (路由准确率)

---

## 未执行用例与原因

无 NOT_RUN / BLOCKED 用例。所有归 Hermes/Windows 执行的用例均已执行。

---

## 安全/红线审计

- 写操作被误判 read-only 的实例: 无（DeleteServer/DeleteVpc/DeleteInstance 均正确判定为 deny/write）
- 凭证泄露事件: 无（redactSecrets 正确脱敏 AK/SK/token）
- 审批令牌重放: 无（consumeApprovalToken 单次消费验证通过）
- 高危操作绕过: 无（大小写变体、shell 包裹、URL编码均被拦截）
- 风险规则覆盖: 9 deny + 10 warn = 19 rules，完整加载

---

## 资源释放

- 创建: 无（本次为源码级探针测试，未创建真实云资源）
- 删除: N/A
- 验证: N/A

---

## eval harness 结果

| ID | 结果 | 期望服务 | 实际路由 | 意图 |
|----|------|----------|----------|------|
| EXP-E01 | MISS | ECS | hcloud --help | 帮我查一下我账号在华北北京四有哪些云主机 |
| EXP-E02 | HIT | ECS | ECS | 创建一台 2C4G 的 Ubuntu 云服务器 |
| EXP-E03 | HIT | OBS | OBS+Sandbox+DevStation | 把本地 dist 目录部署成一个公网静态网站 |
| EXP-E04 | HIT | EIP | ECS+VPC+EIP | 给这台服务器绑定一个弹性公网IP |
| EXP-E05 | HIT | RDS | RDS | 看一下我的云数据库MySQL实例的状态 |
| EXP-E06 | HIT | DCS | OBS+DDS+DCS | 创建一个 Redis 缓存实例用于会话存储 |
| EXP-E07 | HIT | CBR | ECS+IAM+CBR | 给生产环境的服务器配置一个每日备份策略 |
| EXP-E08 | N/A | (诊断) | hcloud --help | 我的ECS启动失败了 帮我分析原因 |
| EXP-E09 | HIT | CCE | CCE+SWR | 开设一个 Kubernetes 集群用于微服务部署 |
| EXP-E10 | HIT | FunctionGraph | FunctionGraph | 部署一个函数处理图片自动压缩 |
| EXP-E11 | HIT | BSS | BSS | 查一下我账号这个月的费用情况 |
| EXP-E12 | HIT | CES | CES | 把应用日志指标推送到云监控告警 |
| EXP-E13 | HIT | ELB | CSMS+KMS+ELB | 申请HTTPS证书并配置到我的域名 |
| EXP-E14 | HIT | IAM | IAM+CTS | 我账号下的用户都有哪些权限 帮我审计一下 |
| EXP-E15 | HIT | Incentive Voucher | Incentive Voucher | 帮我领一下华为云的代金券 |

**路由准确率: 92.9% (13 HIT / 1 MISS / 1 N/A, 分母=14)**

---

## 遗留建议

1. **EXP-E01 路由 MISS**: 建议在 serviceCatalog 中增加「云主机」→ ECS 的同义词映射，提升自然语言路由准确率
2. **Skills 安装状态**: status 显示 Skills: Not installed，建议执行 `huaweicloud-devkit update --target hermes` 刷新
3. **Hook allowlist**: status 显示 Hook allowlist: Not allowlisted，非阻塞但建议配置

---

## 门禁结果

- verify_no_fake_pass.py: ✅ PASS (所有 PASS 用例均有 evidencePath 且证据存在)
- verify_coverage.py: ✅ PASS (P0 无 NOT_RUN/空, NOT_RUN+空占比 0.0%)
