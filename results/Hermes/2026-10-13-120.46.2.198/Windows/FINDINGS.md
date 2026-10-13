# FINDINGS — huaweicloud-devkit 每日测试缺陷清单

> 生成时间: 2026-10-13
> 客户端: Hermes (glm-5.2) / Windows
> 被测版本: 1.1.8
> 缺陷总数: 1 (合并单)

---

## #1【P1】serviceCatalog 中文意图"云主机"路由未命中 (D3-S1/EXP-E01)

### 现象
`huaweicloud_service_catalog` 工具的 `serviceCatalog()` 函数在处理中文自然语言意图"帮我查一下我账号在华北北京四有哪些云主机"时，未命中预期 ECS 服务路由，返回 fallback "Run hcloud --help to list available services."。

### 断言 (唯一可判定)
- `serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 应返回 `recommendedServices: ['ECS']`，实际返回 fallback
- eval harness (run-eval.mjs) 实测 15 条评测集，14 条 HIT (准确率 92.9%)，仅 EXP-E01 MISS
- v1.1.8 相比 v1.1.7 (21.4% HIT) 大幅改善，但"云主机"关键词仍缺失

### 根因 (文件:行号)
`plugins/huaweicloud-core/src/tools.mjs` — `serviceCatalog()` 函数的 ECS 路由 `routeMap` 关键字列表中缺少中文关键词"云主机"：
- ECS 路由 keywords 包含 'ecs', 'server', 'vm', 'instance', 'compute', 'flavor', 'image', '云服务器', '弹性云服务器'
- 但缺少"云主机"（华为云控制台常用术语，等同于 ECS 实例）

### 影响
- D3-S1 (FAIL): 只读查ECS场景路由未命中
- EXP-E01 (FAIL): 评测集路由未命中

### 证据
- eval harness 结果: `eval/results/eval-run-20261012211922.csv` (13 HIT / 1 MISS / 1 N/A = 92.9%)
- 源码: `tools.mjs` routeMap ECS 关键词列表
- 影响用例: D3-S1(FAIL), EXP-E01(FAIL)

### 修复建议
在 ECS 路由的 keywords 列表中添加"云主机"：
```js
// tools.mjs serviceCatalog routeMap
{ service: 'ECS', keywords: ['ecs', 'server', 'vm', 'instance', 'compute', 'flavor', 'image', '云主机', '云服务器', '弹性云服务器'] }
```
