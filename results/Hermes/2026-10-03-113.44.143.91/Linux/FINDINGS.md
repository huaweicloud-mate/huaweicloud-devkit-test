# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-10-03-113.44.143.91/Linux/FINDINGS.md`
> **生成时间**：2026-10-03 05:30（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.8-next.1（gitHead `ffd7b474`）
> **本清单是统一提单脚本 file_issue.py 的解析输入**。

---

## #1【P0】D2-4 凭证脱敏正确性——redactString 大小写敏感导致小写 ak=/sk= 明文泄漏

- **现象**：对 `{"ak":"AKIDTEST...","sk":"SKTEST..."}` 做 redactSecrets 脱敏时，小写 `ak=`/`sk=` 形态不脱敏，凭证明文泄漏。
- **断言**：redactString 对 AK/SK 脱敏应大小写不敏感，任意大小写 `ak=`/`sk=` 均替换为 `<redacted>`，输出不含真实 sk。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:46` `redactString` 的 `(AK|SK)` 正则无 `/i` 标志，小写 `ak=`/`sk=` 未命中。
- **影响**：凭证脱敏链路核心缺陷，多处复用（redactOutput/redactSecrets），导致密钥明文外泄到日志/findings。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D4-3 明文 secret API 拦截——blockedSecretOperations 含 ShowSecret 导致元数据查询过度封禁

- **现象**：`blockedSecretOperations` 白名单包含 `ShowSecret`，导致本应放行的元数据查询类操作被一并封禁，误拦截。
- **断言**：只读元数据查询（ShowSecretVersion 等）应放行，仅真正读取明文 secret 的操作被拦截。
- **根因**：`plugins/huaweicloud-core/safety/policy.json` `blockedSecretOperations` 含 `ShowSecret`（关联 #773），误伤元数据查询。
- **影响**：越权封禁造成正常操作误 blocked，用户体验与功能可用性受损。
- **证据**：`evidence/D4-3/stdout.log`

## #3【P0】D4-5 写操作误判检测——writeOperationPrefixes 缺 Change* 系列动词

- **现象**：`ChangeServerOsWithoutCloudInit`（ECS）、`ChangeVpc`（VPC）、`ChangeInstanceConfiguration`（RDS）等 Change* 写操作未被识别为写，漏过审批门。
- **断言**：所有 `Change*` 系写操作应命中 write 分类，plan 阶段返回 write 风险。
- **根因**：`plugins/huaweicloud-core/safety/policy.json` `writeOperationPrefixes` 缺 `Change` 前缀；line 见 `hooks/huaweicloud-safety.py` 与 `safety-policy.mjs` 的 WRITE 判定。
- **影响**：高危配置变更类写操作漏放行，绕开审批与安全门。
- **证据**：`evidence/D4-5/stdout.log`

## #4【P0】D9-12 initialize 握手协议安全基线——dispatch 无 initialize 状态机

- **现象**：未 `initialize` 即发起 `tools/list` 的非法时序未返回 `-32600`，而是正常返回工具列表。
- **断言**：未完成 initialize 握手前调用 tools/list 应返回 JSON-RPC `-32600`（Invalid Request）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` `dispatch` 无 initialize 状态机，不校验握手前置时序。
- **影响**：协议握手安全基线缺失，非法客户端可跳过握手直接调用工具。
- **证据**：`evidence/D9-12/stdout.log`

## #5【P1】D4-4 写操作审批门——审批门仅拦截普通 Create，Change* 写操作漏放行

- **现象**：审批门对 `Change*` 开头写操作不触发审批，仅普通 `Create*` 触发。
- **断言**：所有写操作（含 Change*）统一走审批门，未确认前零执行。
- **根因**：`plugins/huaweicloud-core/safety/policy.json` `writeOperationPrefixes` 缺 `Change` 前缀（与 D4-5 同源）。
- **影响**：审批门覆盖不全，Change* 类操作可绕过审批直写。
- **证据**：`evidence/D4-4/stdout.log`

## #6【P1】D4-8 Python/Node 策略一致——WRITE_OPERATION_RE 前置捕获组不匹配空格分隔操作名

- **现象**：Python 与 Node 两套 hook 对空格分隔的写操作名判定不一致，Python 侧漏 `configure show` 拦截分支。
- **断言**：Python/Node hook 对同一命令分类结果一致，写操作均被识别。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置捕获组 `(^|[A-Za-z0-9])` 不匹配空格分隔操作名，且缺 `configure`/`show` 拦截分支。
- **影响**：多客户端安全策略不一致，Python hook 漏拦导致防护绕过。
- **证据**：`evidence/D4-8/stdout.log`

## #7【P1】D4-11 提示注入防护——extractHcloudSubcommand 未覆盖自然语言注入动词

- **现象**：中英文自然语言形式注入（如「帮我删除服务器」）未被识别为写操作；`extractHcloudSubcommand("请帮我 hcloud VPC DeleteVpc")` 返回 null。
- **断言**：自然语言注入动词语境应被 extractHcloudSubcommand 识别并分类为写。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:481` `extractHcloudSubcommand` 未覆盖中英文自然语言注入动词语境。
- **影响**：提示注入防护存在缺口，暴露于间接注入攻击。
- **证据**：`evidence/D4-11/stdout.log`

## #8【P1】D4-17 hook 模糊 fail-closed——JSON 解析异常走 allow（fail-open）

- **现象**：hook 对 JSON 解析异常直接 `return` 不输出 deny，空 tool_input 走 allow 放行，不符合 fail-closed 原则。
- **断言**：畸形/空输入应默认拒绝（fail-closed），而非放行。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs:47-49` `catch { return; }`（JSON 解析异常走 allow），空 tool_input 由 commandText 落入 `{}` 归类 allow。
- **影响**：击穿式输入可绕过安全 hook，安全兜底失效。
- **证据**：`evidence/D4-17/stdout.log`

## #9【P1】D4-27 双路径输出脱敏——redactOutput 文本路径复用大小写敏感正则

- **现象**：redactOutput 文本输出路径复用 `(AK|SK)` 正则（无 /i），小写形态不脱敏。
- **断言**：双路径（结果/输出）脱敏均需大小写不敏感，任意大小写 ak=/sk= 均脱敏。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:46` `(AK|SK)` 无 `/i`，redactOutput 复用同一正则。
- **影响**：输出侧明文密钥泄漏。
- **证据**：`evidence/D4-27/stdout.log`

## #10【P1】D9-9 tools/call 超时协议语义——initialize capabilities 未声明 notifications/cancellation

- **现象**：initialize 返回的 capabilities 未声明 `notifications`/`cancellation`，超时/取消协议语义缺失。
- **断言**：initialize capabilities 应声明 notifications 与 cancellation，支持取消语义。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` initialize 返回 `capabilities` 仅 `{tools:{}}`，未声明 `notifications`/`cancellation`。
- **影响**：协议契约漂移，客户端无法实现取消/通知。
- **证据**：`evidence/D9-9/stdout.log`

## #11【P1】D3-S1 场景-只读查 ECS——serviceCatalog routeMap 中文关键词缺「云主机」

- **现象**：中文意图「云主机」未映射到 ECS，serviceCatalog 返回通用 help。
- **断言**：「云主机」意图应命中 ECS 只读查询路由。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog `routeMap` 的 ECS 中文关键词缺「云主机」。
- **影响**：中文自然语言路由不完整，只读查询场景路由 miss。
- **证据**：`evidence/D3-S1/stdout.log`

## #12【P1】D3-S3 场景-沙箱预览 URL——deploy_check devbridge_tunnel 公网预览未通

- **现象**：沙箱 deploy_check 的 devbridge_tunnel/tunnel_url_accessible=FAIL，publicUrl 缺失，公网预览 URL 链路未通。
- **断言**：沙箱部署后应返回可访问公网 URL（HTTP 200）。
- **根因**：沙箱 deploy_check 隧道层（devbridge_tunnel）未建立，publicUrl 缺失。
- **影响**：沙箱预览核心能力不可用。
- **证据**：`evidence/D3-S3/stdout.log`

## #13【P1】EXP-C4-14 DMS 只读规划冒烟——聚合服务需二次路由

- **现象**：list_operations(DMS) 返回聚合服务，无法直接规划。
- **断言**：DMS 服务应有规范路由且 list_operations 直接可执行。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` list_operations 对 DMS 聚合服务需二次路由，未一次性返回规范操作。
- **影响**：服务创建类回归中 DMS 只读规划冒烟失败。
- **证据**：`evidence/EXP-C4-14/stdout.log`

## #14【P1】EXP-C4-18 DEW 只读规划冒烟——聚合服务需二次路由

- **现象**：list_operations(DEW) 返回聚合服务，无法直接规划。
- **断言**：DEW 服务应有规范路由且 list_operations 直接可执行。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` list_operations 对 DEW 聚合服务需二次路由。
- **影响**：服务创建类回归中 DEW 只读规划冒烟失败。
- **证据**：`evidence/EXP-C4-18/stdout.log`

## #15【P1】EXP-E01 ECS 中文意图路由——routeMap 缺「云主机」导致 MISS

- **现象**：eval harness 实测「华北北京四云主机」意图 MISS。
- **断言**：「云主机」意图应命中 ECS（read）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap 缺「云主机」关键词，中文意图未映射 ECS。
- **影响**：评测集准确率未达 100%，ECS 查询场景漏路由。
- **证据**：`evidence/EXP-E01/stdout.log`

## #16【P1】EXP-E08 诊断意图路由——explain_error 无 routeMap 映射

- **现象**：eval harness 实测「ECS 启动失败分析」诊断意图返回通用 help，未能路由到诊断能力。
- **断言**：诊断意图（explain_error）应有确定性路由到排障能力。
- **根因**：serviceCatalog routeMap 无 `explain_error` 诊断意图映射，返回「Run hcloud --help」通用兜底。
- **影响**：诊断类意图无法路由，排障场景失效。
- **证据**：`evidence/EXP-E08/stdout.log`

## #17【P2】D3-S5 复合意图分层路由——分层关键词未命中 Sandbox

- **现象**：复合意图中分层关键词未命中 Sandbox 路由。
- **断言**：复合意图应命中 Sandbox（layered-route）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` 分层路由关键词缺 Sandbox 关联。
- **影响**：复合意图分层路由不完整。
- **证据**：`evidence/D3-S5/stdout.log`

## #18【P2】D4-25 Python hook 事件遥测分类——写操作落 cli:invoke 而非 cli:write

- **现象**：Python hook 将写操作分类为 cli:invoke 而非 cli:write。
- **断言**：写操作应统一分类为 cli:write。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置捕获组导致分类错误。
- **影响**：遥测分类不准，安全事件归类丢失。
- **证据**：`evidence/D4-25/stdout.log`

## #19【P2】D4-26 findings 证据脱敏——redactEvidence 未覆盖 --ak 空格 + 小写 sk=

- **现象**：findings.evidence 中 `--ak AK...`（空格分隔）与小写 `sk=` 形态未脱敏，明文泄漏。
- **断言**：findings.evidence 中 AK/SK/token/password 应全部 <redacted>。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19-25` redactEvidence 未覆盖 `--ak` 空格分隔 + 小写 `sk=`。
- **影响**：安全 findings 证据本身二次泄密。
- **证据**：`evidence/D4-26/stdout.log`

## #20【P2】D1-68 图标离线与区域环境变量——HW_REGION 优先于契约

- **现象**：`HW_REGION` 环境变量优先于契约约定，区域解析行为漂移。
- **断言**：区域解析应遵循契约优先级顺序。
- **根因**：region-priority 逻辑中 `HW_REGION` 优先于契约（SPEC-MISMATCH）。
- **影响**：区域配置契约漂移。
- **证据**：`evidence/D1-68/stdout.log`

## #21【P2】D8-9 安装 ID 与遥测值脱敏——sanitizeValue 未脱敏

- **现象**：安装 ID/遥测值的 sanitizeValue 未实际脱敏。
- **断言**：安装 ID 与遥测值应被 sanitizeValue 脱敏。
- **根因**：sanitizeValue 实现未覆盖安装 ID/遥测值脱敏（SPEC-MISMATCH）。
- **影响**：遥测数据脱敏缺失。
- **证据**：`evidence/D8-9/stdout.log`