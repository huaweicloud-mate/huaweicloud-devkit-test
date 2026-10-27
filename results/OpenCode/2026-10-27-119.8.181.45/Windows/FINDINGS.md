# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-10-27-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-27 10:00:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**，否则自动提单解析失败/漏缺陷。

---

## #1【P1】EXP-E01 serviceCatalog 中文意图"查询ECS实例列表"路由未命中ECS

- **现象**：调用 `huaweicloud_service_catalog("查询ECS实例列表")` 返回 recommendedSkills=["Use huaweicloud-core to route intent."], recommendedServices=["Run hcloud --help to list available services."]，未路由到 ECS。
- **断言**：serviceCatalog("查询ECS实例列表") 的 recommendedServices 必须包含 "ECS"。
- **根因**：`tools.mjs:2417` — tokenization 使用 `it.split(/[\s,./-]+/)` 按空白/标点分词，中文意图"查询ECS实例列表"无空格，被切分为单个 token "查询ecs实例列表"；line 2421 对无空格/非CJK关键词（如 'ecs'）使用 `tokens.has(kw)` 精确匹配，单 token 无法命中。ECS 路由的 CJK 关键词（'云服务器'/'服务器'）也不在该意图文本中。
- **影响**：中文用户查询 ECS 实例时无法获得正确的服务路由和技能推荐，降级为泛化兜底，影响用户体验和自动化路由准确率。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #2【P1】EXP-E08 serviceCatalog 中文意图"诊断API错误 explain error"无诊断路由

- **现象**：调用 `huaweicloud_service_catalog("诊断API错误 explain error")` 返回 recommendedSkills=["Use huaweicloud-core to route intent."], recommendedServices=["Run hcloud --help to list available services."]，未路由到任何诊断/排障服务。
- **断言**：serviceCatalog("诊断API错误 explain error") 的 recommendedSkills 必须包含 troubleshooting 相关技能（如 "huaweicloud-troubleshooting"）。
- **根因**：`tools.mjs:2190-2415` — routeMap 中缺少诊断/排障路由条目。关键词 "诊断"/"错误"/"error"/"explain"/"troubleshoot" 未出现在任何路由的关键词列表中。虽然插件有 `huaweicloud-troubleshooting` 和 `huaweicloud_explain_error` 能力，但 serviceCatalog 的 routeMap 未为其建立路由。
- **影响**：用户描述排障意图时无法获得 troubleshooting 技能推荐和 explain_error 工具引导。
- **证据**：`evidence/EXP-E08/stdout.log`
- **状态**：待提单

## #3【P1】EXP-E09 serviceCatalog 中文意图"创建CCE集群"路由未命中CCE

- **现象**：调用 `huaweicloud_service_catalog("创建CCE集群")` 返回 recommendedSkills=["Use huaweicloud-core to route intent."], recommendedServices=["Run hcloud --help to list available services."]，未路由到 CCE。
- **断言**：serviceCatalog("创建CCE集群") 的 recommendedServices 必须包含 "CCE"。
- **根因**：`tools.mjs:2269` — CCE 路由关键词 `['cce', 'kubernetes', 'k8s', 'container', 'cluster', 'node pool', 'swr', 'docker', 'image registry']` 全部为英文，无 CJK 关键词（缺少 '集群'/'容器'/'容器集群'）。line 2417 分词后 "创建cce集群" 为单 token，line 2421 `tokens.has('cce')` 精确匹配失败。与 EXP-E01 同类根因（CJK 分词 + 缺少中文关键词）。
- **影响**：中文用户创建 CCE 集群时无法获得正确的服务路由和 huawei-cce 技能推荐。
- **证据**：`evidence/EXP-E09/stdout.log`
- **状态**：待提单

## #4【P2】D3-S5 serviceCatalog 复合意图"部署数据库和Web应用到华为云"未分层路由多服务

- **现象**：调用 `huaweicloud_service_catalog("部署数据库和Web应用到华为云")` 仅返回 recommendedSkills=["huawei-rds"], recommendedServices=["RDS"]，未同时推荐 Web 应用部署服务（ECS/sandbox）。
- **断言**：serviceCatalog("部署数据库和Web应用到华为云") 的 recommendedServices 必须同时包含 "RDS" 和部署类服务（如 "Sandbox"/"ECS"）。
- **根因**：`tools.mjs:2371-2388` — sandbox 路由关键词包含 'web app'/'webapp' 但缺少 CJK 关键词 'web应用'/'应用'。意图文本 "部署数据库和web应用到华为云" 中 "web应用" 既不匹配 'web app'（空格分隔，substring 不命中）也不匹配 'webapp'。此外 routeMap 为线性匹配，未实现复合意图拆分逻辑，无法将"数据库+Web应用"识别为两个独立子意图分别路由。
- **影响**：复合意图场景下用户仅获得部分服务推荐，缺少 Web 应用部署引导，影响多服务编排体验。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：待提单
