# FINDINGS — 缺陷发现清单（CodeArtsSpace-GLM-5.2）

> **落盘路径**：`results/CodeArtsSpace/2026-09-23-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-09-23 16:47（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.7-next.0
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。

---

## #1【P1】D10-3 serviceCatalog 中文意图路由准确率仅 21.4%，远低于 90% 阈值

- **现象**：eval harness 实测 15 条中文意图，仅 3 条 HIT（DCS/CCE/Voucher），11 条 MISS，1 条 N/A。路由准确率 21.4%，远低于用例断言要求的 ≥90%。
- **断言**：serviceCatalog 中/英文意图均命中对应服务；评测级路由准确率 ≥90%，错路由可定位
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1926` — serviceCatalog 匹配逻辑对 ASCII 关键词使用精确 token 匹配（`tokens.has(kw)`），但中文意图无空格分词，"查询ecs实例列表" 被拆为单 token "查询ecs实例列表"，`tokens.has("ecs")` 为 false。仅含空格/CJK 的关键词才走 `it.includes(kw)` 子串匹配，纯 ASCII 服务名（ecs/vpc/rds/obs/iam/ces/cts/cbr 等）在中文意图中全部漏匹配。
- **影响**：中文用户意图无法正确路由到对应华为云服务，MCP 工具推荐失效，影响所有中文场景的 serviceCatalog 路由
- **证据**：`evidence/D10-3/stdout.log`
- **状态**：待提单

## #2【P1】EXP-E01 serviceCatalog 未命中 ECS（查询ECS实例列表）

- **现象**：意图"查询ECS实例列表"经 serviceCatalog 路由后 recommendedServices=["Run hcloud --help to list available services."]，未命中 ECS
- **断言**：serviceCatalog 中文意图"查询ECS实例列表"命中 ECS→run_readonly 对应服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1926` — token 匹配 `tokens.has("ecs")` 失败（中文无空格分词，"查询ecs实例列表"为单 token）
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #3【P1】EXP-E02 serviceCatalog 未命中 ECS（创建云服务器）

- **现象**：意图"创建一台 2C4G 的 Ubuntu 云服务器"经 serviceCatalog 路由后未命中 ECS
- **断言**：serviceCatalog 中文意图命中 ECS 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1926` — 中文意图无 "ecs"/"server"/"vm" 等 ASCII token，token 匹配失败
- **证据**：`evidence/EXP-E02/stdout.log`
- **状态**：待提单

## #4【P1】EXP-E03 serviceCatalog 未命中 OBS（部署静态网站）

- **现象**：意图"把本地 dist 目录部署成一个公网静态网站"经 serviceCatalog 路由后命中 Sandbox+DevStation 而非 OBS
- **断言**：serviceCatalog 中文意图命中 OBS 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1935` — deploymentIntent 优先路由至 sandbox，OBS 静态网站托管意图被 sandbox 抢占
- **证据**：`evidence/EXP-E03/stdout.log`
- **状态**：待提单

## #5【P1】EXP-E04 serviceCatalog 未命中 EIP（绑定弹性公网IP）

- **现象**：意图"给这台服务器绑定一个弹性公网IP"经 serviceCatalog 路由后未命中 EIP
- **断言**：serviceCatalog 中文意图命中 EIP 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1926` — "弹性公网ip" 中文无 "eip" token，token 匹配失败
- **证据**：`evidence/EXP-E04/stdout.log`
- **状态**：待提单

## #6【P1】EXP-E05 serviceCatalog 未命中 RDS（查看MySQL实例状态）

- **现象**：意图"看一下我的数据库MySQL实例的状态"经 serviceCatalog 路由后未命中 RDS
- **断言**：serviceCatalog 中文意图命中 RDS 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1926` — "mysql" 在 "数据库mysql实例" 中为子串但非独立 token（无空格分隔），`tokens.has("mysql")` 失败
- **证据**：`evidence/EXP-E05/stdout.log`
- **状态**：待提单

## #7【P1】EXP-E07 serviceCatalog 未命中 CBR（配置每日备份策略）

- **现象**：意图"给生产环境的服务器配置一个每日备份策略"经 serviceCatalog 路由后未命中 CBR
- **断言**：serviceCatalog 中文意图命中 CBR 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1926` — 中文意图无 "cbr"/"backup"/"vault" 等 ASCII token，token 匹配失败
- **证据**：`evidence/EXP-E07/stdout.log`
- **状态**：待提单

## #8【P1】EXP-E10 serviceCatalog 未命中 FunctionGraph（部署函数处理图片）

- **现象**：意图"部署一个函数处理图片自动压缩"经 serviceCatalog 路由后未命中 FunctionGraph
- **断言**：serviceCatalog 中文意图命中 FunctionGraph 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1926` — 中文意图无 "functiongraph"/"function"/"lambda" 等 token，token 匹配失败
- **证据**：`evidence/EXP-E10/stdout.log`
- **状态**：待提单

## #9【P1】EXP-E11 serviceCatalog 未命中 BSS（查看账单费用）

- **现象**：意图"查看一下我账号这个月的费用情况"经 serviceCatalog 路由后未命中 BSS
- **断言**：serviceCatalog 中文意图命中 BSS 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1926` — 中文意图无 "billing"/"bill"/"bss" 等 token，token 匹配失败
- **证据**：`evidence/EXP-E11/stdout.log`
- **状态**：待提单

## #10【P1】EXP-E12 serviceCatalog 未命中 CES（推送监控指标）

- **现象**：意图"把应用日志指标推送到云监控告警"经 serviceCatalog 路由后未命中 CES
- **断言**：serviceCatalog 中文意图命中 CES 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1926` — 中文意图无 "ces"/"monitor"/"alarm" 等 token，token 匹配失败
- **证据**：`evidence/EXP-E12/stdout.log`
- **状态**：待提单

## #11【P1】EXP-E13 serviceCatalog 未命中 ELB（申请HTTPS证书）

- **现象**：意图"申请HTTPS证书并配置到我的域名"经 serviceCatalog 路由后未命中 ELB
- **断言**：serviceCatalog 中文意图命中 ELB 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1817` — routeMap 中无 ELB 服务路由条目，ELB/证书相关意图无匹配规则
- **证据**：`evidence/EXP-E13/stdout.log`
- **状态**：待提单

## #12【P1】EXP-E14 serviceCatalog 未命中 IAM（审计用户权限）

- **现象**：意图"我账号下的用户都有哪些权限，帮我审计一下"经 serviceCatalog 路由后未命中 IAM
- **断言**：serviceCatalog 中文意图命中 IAM 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1926` — 中文意图无 "iam"/"permission"/"policy" 等 token，token 匹配失败
- **证据**：`evidence/EXP-E14/stdout.log`
- **状态**：待提单
