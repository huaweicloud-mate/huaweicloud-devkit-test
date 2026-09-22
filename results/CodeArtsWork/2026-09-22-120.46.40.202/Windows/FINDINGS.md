# FINDINGS — 缺陷发现清单（CodeArtsWork-GLM-5.2）

> **落盘路径**：`results/CodeArtsWork/2026-09-22-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-09-22 15:10:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 解析标题与「根因」字段。

---

## #1【P1】D10-3 serviceCatalog 中文意图路由准确率仅 21.4%

- **现象**：`node eval/harness/run-eval.mjs` 跑 15 条中文评测集，路由准确率 21.4%（3 HIT / 11 MISS / 1 N/A），11 条中文自然语言意图未命中正确服务，返回 fallback `"Run hcloud --help to list available services."`
- **断言**：serviceCatalog 路由准确率 ≥90%（D10-3 预期）；11 条意图应命中对应服务（ECS/ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1817-1947` routeMap keywords 中文关键词覆盖不足。serviceCatalog 在 1922-1929 行按 `route.keywords.some(kw => ... it.includes(kw) ...)` 匹配，未命中的在 1945-1947 行返回 fallback。routeMap 缺少"云主机/云服务器/云数据库/弹性公网IP/备份策略/费用/监控告警/证书/权限审计"等中文模式
- **影响**：用户用中文自然语言描述云服务需求时，serviceCatalog 无法正确路由到对应服务，Agent 无法激活正确 skill，严重影响中文用户体验
- **证据**：`evidence/D10-3/stdout.log` + `eval/results/eval-run-20260922070047.csv`
- **状态**：待提单

## #2【P1】EXP-E01 ECS查询意图"帮我查一下我账号在华北北京四有哪些云主机"未命中

- **现象**：serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机") 返回 `["Run hcloud --help to list available services."]`，未命中 ECS
- **断言**：recommendedServices 包含 "ECS"
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1947` fallback 分支；routeMap 缺少"云主机"关键词
- **证据**：`evidence/EXP-E01/stdout.log`

## #3【P1】EXP-E02 ECS创建意图"创建一台 2C4G 的 Ubuntu 云服务器"未命中

- **现象**：serviceCatalog("创建一台 2C4G 的 Ubuntu 云服务器 规格通用型") 返回 fallback，未命中 ECS
- **断言**：recommendedServices 包含 "ECS"
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1947` fallback；routeMap 缺少"云服务器"关键词
- **证据**：`evidence/EXP-E02/stdout.log`

## #4【P1】EXP-E03 OBS静态站意图"把本地 dist 目录部署成一个公网静态网站"路由到 Sandbox 而非 OBS

- **现象**：serviceCatalog 返回 `["Sandbox","DevStation"]`，未命中 OBS
- **断言**：recommendedServices 包含 "OBS"
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1935-1939` deploymentIntent 逻辑将"部署/网站"意图优先路由到 sandbox，覆盖了 OBS 静态站路由
- **证据**：`evidence/EXP-E03/stdout.log`

## #5【P1】EXP-E04 EIP意图"给这台服务器绑定一个弹性公网IP"未命中

- **现象**：serviceCatalog 返回 fallback，未命中 EIP
- **断言**：recommendedServices 包含 "EIP"
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1947` fallback；routeMap 缺少"弹性公网IP"关键词
- **证据**：`evidence/EXP-E04/stdout.log`

## #6【P1】EXP-E05 RDS查询意图"看一下我的云数据库MySQL实例的状态"未命中

- **现象**：serviceCatalog 返回 fallback，未命中 RDS
- **断言**：recommendedServices 包含 "RDS"
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1947` fallback；routeMap 缺少"云数据库"关键词
- **证据**：`evidence/EXP-E05/stdout.log`

## #7【P1】EXP-E07 CBR意图"给生产环境的服务器配置一个每日备份策略"未命中

- **现象**：serviceCatalog 返回 fallback，未命中 CBR
- **断言**：recommendedServices 包含 "CBR"
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1947` fallback；routeMap 缺少"备份策略"关键词
- **证据**：`evidence/EXP-E07/stdout.log`

## #8【P1】EXP-E10 FunctionGraph意图"部署一个函数处理图片自动压缩"未命中

- **现象**：serviceCatalog 返回 fallback，未命中 FunctionGraph
- **断言**：recommendedServices 包含 "FunctionGraph"
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1947` fallback；routeMap 缺少"函数"中文关键词（有英文"function"但中文"函数"未匹配）
- **证据**：`evidence/EXP-E10/stdout.log`

## #9【P1】EXP-E11 BSS费用查询意图"查一下我账号这个月的费用情况"未命中

- **现象**：serviceCatalog 返回 fallback，未命中 BSS
- **断言**：recommendedServices 包含 "BSS"
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1947` fallback；routeMap 缺少"费用/账单"关键词
- **证据**：`evidence/EXP-E11/stdout.log`

## #10【P1】EXP-E12 CES意图"把应用日志指标推送到云监控告警"未命中

- **现象**：serviceCatalog 返回 fallback，未命中 CES
- **断言**：recommendedServices 包含 "CES"
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1947` fallback；routeMap 缺少"监控告警"关键词
- **证据**：`evidence/EXP-E12/stdout.log`

## #11【P1】EXP-E13 ELB证书意图"申请HTTPS证书并配置到我的域名"未命中

- **现象**：serviceCatalog 返回 fallback，未命中 ELB
- **断言**：recommendedServices 包含 "ELB"
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1947` fallback；routeMap 缺少"证书"关键词
- **证据**：`evidence/EXP-E13/stdout.log`

## #12【P1】EXP-E14 IAM审计意图"我账号下的用户都有哪些权限, 帮我审计一下"未命中

- **现象**：serviceCatalog 返回 fallback，未命中 IAM
- **断言**：recommendedServices 包含 "IAM"
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1947` fallback；routeMap 缺少"权限审计"关键词
- **证据**：`evidence/EXP-E14/stdout.log`
