# FINDINGS — huaweicloud-devkit 每日测试缺陷清单

> 生成时间: 2026-10-12
> 客户端: Hermes (glm-5.2) / Windows
> 被测版本: 1.1.7
> 缺陷总数: 1 (合并单)

---

## FINDING-001: serviceCatalog 中文意图路由大面积未命中

### 级别
P1 (功能缺陷)

### 描述 (现象)
`huaweicloud_service_catalog` 工具的 `serviceCatalog()` 函数在处理中文自然语言意图时，大面积未命中预期服务路由。eval harness (run-eval.mjs) 实测 15 条评测集，仅 3 条 HIT (准确率 21.4%)，远低于用例预期的 ≥90%。

### 断言 (唯一可判定)
- `serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 应返回 `recommendedServices: ['ECS']`，实际返回 fallback `"Run hcloud --help to list available services."`
- `serviceCatalog('创建一台 2C4G 的 Ubuntu 云服务器')` 应返回 `recommendedServices: ['ECS']`，实际返回 fallback
- `serviceCatalog('看一下我的云数据库MySQL实例的状态')` 应返回 `recommendedServices: ['RDS']`，实际返回 fallback
- 路由准确率 = 3/14 = 21.4% (分母=HIT+MISS)，预期 ≥90%

### 根因 (文件:行号)
`plugins/huaweicloud-core/src/tools.mjs:1815` — `serviceCatalog()` 函数的 `routeMap` 关键字列表缺少中文关键词：

- ECS 路由 (`tools.mjs:1818`): `keywords: ['ecs', 'server', 'vm', 'instance', 'compute', 'flavor', 'image']` — 无中文词如「云主机」「云服务器」「弹性云服务器」
- RDS 路由: `keywords: ['rds', 'mysql', 'postgresql', 'database', 'db']` — 无中文词如「云数据库」「数据库实例」
- OBS/EIP/CBR/FunctionGraph/BSS/CES/ELB/IAM 同样缺少中文关键词
- 唯一有中文关键词的是 voucher 路由: `keywords: ['voucher', 'coupon', 'incentive', 'credit', '领券', '代金券', '优惠券', '激励金', '领取']` — 因此 EXP-E15 HIT
- DCS 路由有 'redis' 英文关键词，但意图中包含 'Redis'，因此 EXP-E06 HIT
- CCE 路由有 'kubernetes'/'k8s' 英文关键词，因此 EXP-E09 HIT

### 证据
- eval harness 结果: `eval/results/eval-run-20261011213513.csv`
- 源码: `tools.mjs:1815-1900` routeMap 定义
- 影响用例: D3-S1(FAIL), D10-3(FAIL), EXP-E01(FAIL), EXP-E02(FAIL), EXP-E03(FAIL), EXP-E04(FAIL), EXP-E05(FAIL), EXP-E07(FAIL), EXP-E10(FAIL), EXP-E11(FAIL), EXP-E12(FAIL), EXP-E13(FAIL), EXP-E14(FAIL)

### 修复建议
为每个服务的 routeMap 关键字列表添加中文关键词，例如：
- ECS: 添加「云主机」「云服务器」「弹性云服务器」「实例」
- RDS: 添加「云数据库」「数据库实例」
- OBS: 添加「对象存储」「桶」「静态网站」
- EIP: 添加「弹性公网IP」「弹性IP」
- CBR: 添加「备份」「备份策略」
- FunctionGraph: 添加「函数」「无服务器」
- BSS: 添加「费用」「账单」
- CES: 添加「云监控」「告警」
- ELB: 添加「证书」「负载均衡」
- IAM: 添加「权限」「审计」「用户」
