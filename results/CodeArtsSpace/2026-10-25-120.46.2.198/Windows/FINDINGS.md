# FINDINGS — 缺陷发现清单（CodeArtsSpace-GLM-5.2）

> **落盘路径**：`results/CodeArtsSpace/2026-10-25-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-10-25 05:25（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.12

## #1【P1】EXP-E01 serviceCatalog 路由精度缺陷：泛化查询意图"查云主机"未路由到 ECS

- **现象**：serviceCatalog(intent="帮我查一下我账号在华北北京四有哪些云主机") 返回 "Run hcloud --help to list available services."，未路由到 ECS 服务
- **断言**：serviceCatalog 对"查/列出/有哪些 + 云主机/ECS/服务器"类泛化查询意图应路由到 ECS 服务（expectedServices=ECS）
- **根因**：`plugins/huaweicloud-core/src/data/service-catalog.mjs` 路由规则对泛化查询意图缺少关键词匹配，落入通用兜底分支返回 hcloud help
- **影响**：路由准确率 92.9%（13/14 HIT），该条泛化查询未精确路由，用户需手动指定服务
- **证据**：`eval/results/eval-run-20261024211641.csv` verdict=MISS；`evidence/EXP-E01/stdout.log`
- **状态**：历史已知缺陷，不重复提单（关联 #896 #866 #864 #858 #852 #845 #844 #841 #828 #826 #805 #797 #785 #784 #730 #714 #706 #705 #689 #674）
