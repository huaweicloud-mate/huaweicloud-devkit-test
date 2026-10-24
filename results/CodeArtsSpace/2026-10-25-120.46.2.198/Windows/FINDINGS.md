# FINDINGS

## EXP-E01 - 路由精度缺陷

- **级别**: P1
- **描述**: serviceCatalog 路由 MISS: 意图"帮我查一下我账号在华北北京四有哪些云主机"期望路由到 ECS，实际返回 "Run hcloud --help to list available services."
- **断言**: serviceCatalog(intent) 应路由到期望服务
- **根因**: plugins/huaweicloud-core/src/data/service-catalog.mjs: serviceCatalog 路由规则对泛化查询意图(查云主机)未匹配到 ECS
- **证据**: eval/results/eval-run-20261024211641.csv verdict=MISS

