# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-10-22-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：`2026-10-22 05:20:00`（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.10（npm `latest` 正式版，gitHead `b0e9f026`）
> **测试客户端**：Hermes (DeepSeek-V4-Pro) / Linux (aarch64) / 120.46.222.180
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 43）
> **汇总**：产品缺陷 15 项（FAIL 13 + SPEC-MISMATCH 2）+ 非产品缺陷 1 项（真云 VPC 配额）。较 v1.1.9 上一轮：D3-S3 沙箱预览出 URL 已在 1.1.10 修复（publicUrl+HTTP200 实测通过，不再提单）。本版本与 2026-10-21 同类缺陷重合，file_issue.py 历史查重将匹配既有单、生成 HISTORY_LINKS.md 而非重复开单。较昨日变化：D3-S2（VPC 配额非产品缺陷）今日实测已恢复 PASS；D3-C1 今日由「资源泄漏」转为「VPC.0114 配额阻断（非产品缺陷）」，资源泄漏路径因配额未复现。

---

## #1【P0】D2-4 凭证脱敏正确性——JSON 小写 ak/sk 键未脱敏

- **现象**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234",...}')` 原样返回，SK 明文残留未脱敏（`access_key=`/`secret_key=` 等键正常脱敏）。
- **断言**：JSON 形态 `{"ak":...,"sk":...}` 凭证应被脱敏为占位符。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34`（redactString）/`:49`（redactSecrets）键名正则未覆盖小写 `ak`/`sk` 键（仅 access_key/secret_key/大写 AK=/SK=）。
- **影响**：JSON 凭证经日志/输出明文泄漏。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D9-12 initialize 握手协议安全基线——非法时序未拒绝

- **现象**：spawn mcp-server 后不发 initialize 直接 `tools/list`，服务端返回 43 工具列表（未拒绝），非法时序拒绝=false。
- **断言**：非法时序（未 initialize 先 tools/list/call）应被拒并返回 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` dispatch `tools/list` 分支无 initialize 前置校验，任意时序放行。
- **影响**：协议客户端可跳过握手直接枚举工具，破坏 MCP 初始化时序契约。
- **证据**：`evidence/D9-12/stdout.log`

## #3【P1】D4-4 写操作审批门——Change* 变更类动词漏拦截

- **现象**：写语义操作 `ChangeServerOs`/`ChangeServer`/`ChangeVpc`/`ChangeInstanceConfiguration`/`ChangeVolumeType` 判定 `decision=allow, isWrite=undefined`（0/5 拦截），对照 `CreateServers` 正常 `decision=deny`。
- **断言**：12 类写动词（含 Change* 变更类）无审批不可执行（decision=deny/confirm）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:27` `writeOperationPrefixes` 列表仅含 Create/BatchCreate/Delete/BatchDelete/Update/Modify/Resize/Reboot/Stop/Start 等，缺 `Change` 前缀；据此判定写语义，变更类写操作绕过审批门。
- **影响**：变更类写操作（换 OS/换 VPC/改配置/改卷类型）可无审批执行。
- **证据**：`evidence/D4-4/stdout.log`

## #4【P1】D3-C7 跨区域资源操作引导——跨区错误码与契约不符

- **现象**：跨区只读查询返回 `Common.0013`（region 与 token project 不匹配）、跨区创建 EIP 返回 `VPC.0501`，与契约预期 `Ecs.0200/Ecs.0021` 精确错误码不符。
- **断言**：跨区域/不存在资源应命中区域/资源精确错误码，并给出跨区引导。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `explain_error` 错误码映射未覆盖 `Common.0013`/`VPC.0501`（token-region 不匹配）场景（1.1.10 仅补了 Ecs.0019/0319/0044/0067、Kps.9004）。
- **影响**：跨区误操作缺乏精确诊断引导。
- **证据**：`evidence/D3-C7/stdout.log`

## #5【P1】D3-S1 场景-只读查 ECS——serviceCatalog 中文「云主机」路由 MISS

- **现象**：`service_catalog({intent:'帮我查一下我账号有哪些云主机'})` → `recommendedServices=['Run hcloud --help to list available services.']`（未命中 ECS）；只读 ListServersDetails 正常返回实例清单（零写）。
- **断言**：中文「云主机」意图应路由命中 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2025-2042` ECS routeMap keywords 含「弹性云服务器/云服务器/服务器/虚拟机/镜像」，缺「云主机」同义词。
- **影响**：ECS 场景中文意图召回漏常见同义词。
- **证据**：`evidence/D3-S1/stdout.log`

## #6【P1】D10-3 路由准确率+混淆矩阵——1 条中文意图 MISS

- **现象**：eval-harness 15 条中文意图路由 HIT=13 MISS=1 N/A=1，准确率 92.9% (13/14)。
- **断言**：评测集路由准确率应 100% HIT（N/A 诊断类除外）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog routeMap 仍缺「云主机」同义词（同 EXP-E01/D3-S1 根因）。
- **影响**：1 条中文意图（EXP-E01）路由 MISS。
- **证据**：`evidence/D10-3/stdout.log`

## #7【P1】EXP-E01 评测集『云主机』中文意图路由 MISS

- **现象**：eval-harness EXP-E01『帮我查一下我账号在华北北京四有哪些云主机』路由 MISS（返回 Run hcloud --help）；其余 13 条 HIT、1 条 N/A。
- **断言**：「云主机」「云服务器」「ECS」等同义查询意图应路由到 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` ECS routeMap keywords 缺「云主机」同义词。
- **影响**：ECS 场景中文意图召回漏一个常见同义词。
- **证据**：`evidence/EXP-E01/stdout.log`

## #8【P1】D3-C3 沙箱 deploy_nginx——端口冲突自动递增后 ok=false（假失败）

- **现象**：sandbox connect/upload_project/deploy_check/close_session 均成功，但 `deploy_nginx` 返回 `ok=false`（端口 8080 被占自动递增到 8088），而 `deploy_check` 判定 nginx serving PASS——部署实际成功却报 ok=false。
- **断言**：deploy_nginx 端口冲突自动递增后应返回 ok=true（并带最终端口），不得在部署实际可用时返回 ok=false。
- **根因**：`plugins/huaweicloud-core/src/sandbox/session-manager.mjs:~1014` deployNginx 写校验/端口递增路径在冲突递增时返回 ok:false（残留 .conf 占用 8080-808x 端口，与端口耗尽关联）。
- **影响**：沙箱部署链路假失败，agent 误判部署未完成，重复部署进一步加剧端口耗尽。
- **证据**：`evidence/D3-C3/stdout.log`

## #9【P2】D3-S5 场景-复合意图分层路由——仅命中单一服务

- **现象**：复合中文意图 `recommendedServices=["ECS"] recommendedSkills=["huawei-ecs"]`，未拆分命中预览/沙箱分层目标。
- **断言**：复合意图应拆分命中多个对应 service，分层推荐。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 单关键词并集路由，无复合意图分层拆解。
- **影响**：多服务编排场景路由不完整。
- **证据**：`evidence/D3-S5/stdout.log`

## #10【P2】D4-25 Python hook 事件遥测分类——写操作落 cli:invoke

- **现象**：写命令事件 keys=["cli:read","cli:invoke","cli:invoke"]（写操作未落 cli:write），Node 读取目录存在=false。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 用 `(^|[A-Za-z0-9])` 前置字符类，使空格分隔的写动词（ECS CreateServers）不匹配→落 cli:invoke。
- **影响**：安全事件遥测分类失真，写操作不可观测。
- **证据**：`evidence/D4-25/stdout.log`

## #11【P2】D4-26 findings 证据脱敏不完整

- **现象**：`evaluateArtifacts`/hook findings.evidence 中 `IAM CreateUser --password MyS3cret123` 明文残留（明文残留=true），decision=warn（未 deny）。
- **断言**：findings.evidence 中 password/AK/SK 等敏感值应全部脱敏，无明文残留。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19-22` redactEvidence 正则键名表仅匹配 `password[:=]` 形态，未覆盖 `--password <值>` 空格形态。
- **影响**：安全预检回执泄露明文凭据/密码。
- **证据**：`evidence/D4-26/stdout.log`

## #12【P2】D1-65 调试模式环境变量——DEBUG 仅认字面量 'true'（SPEC）

- **现象**：`HUAWEICLOUD_DEVKIT_DEBUG=1` 日志增量=0（不生效），仅 `'true'` 生效；契约「1/true 均可开启」。
- **断言**：DEBUG 为 1 或 true 均应开启调试日志。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:81` `const DEBUG = process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true'` 严格比较。
- **影响**：调试开关契约不一致，遥测域 `1` 不生效。
- **证据**：`evidence/D1-65/stdout.log`

## #13【P2】D1-66 遥测开关与端点环境变量——开关/自定义端点不生效

- **现象**：off→enabled=null、未设→enabled=null、自定义端点收到 POST=false（[]），遥测开关/自定义端点环境变量未生效。
- **断言**：遥测开关 off/env 应正确切换，自定义端点应收到上报。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:176-180` 开关/端点 env 读取与上报路径漂移。
- **影响**：遥测开关与自定义上报端点不可控。
- **证据**：`evidence/D1-66/stdout.log`

## #14【P2】D8-9 sanitizeValue 未做凭证脱敏（SPEC-MISMATCH）

- **现象**：`sanitizeValue("ak=AK123456 sk=SKsecret token=Tok123")` 原样返回（仅 trim/截断/去控制字符），未移除敏感值；installId 稳定持久=true。
- **断言**：sanitizeValue 应移除 ak/sk/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` sanitizeValue 仅 replace 空白 + slice 截断，无敏感值脱敏。
- **影响**：遥测字段若携带凭证将明文上报。
- **证据**：`evidence/D8-9/stdout.log`

## #15【P2】D1-68 region 环境变量优先级与契约相反（SPEC-MISMATCH）

- **现象**：同时设 `HW_REGION` 与 `HUAWEICLOUD_REGION` 时，`resolveCredentials` 取 `HW_REGION`（cn-test-hw-wins），契约要求 `HUAWEICLOUD_REGION` 优先。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION` 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:225` `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`（另有 :173、:339 同序）。
- **影响**：region 环境变量优先级与契约漂移。
- **证据**：`evidence/D1-68/stdout.log`

## #16【非产品缺陷】D3-C1 真云 ECS 生命周期 E2E——VPC 创建被 router 配额阻断

- **现象**：D3-C1 真机 CreateVpc → `VPC.0114 Quota exceeded for resources: ['router']`（router 配额耗尽），CreateSubnet 因 VPC 未建成返回 `VPC.0201`。finally 归零校验「无资源需清理」通过。
- **说明**：账号级配额/多机并发限制，非产品代码缺陷，不计入提单。共享账号 hw018619646 多机（Hermes 3 IP + AtomCode 等）并发每日测试，router 配额在边缘耗尽；本客户端本次运行自有资源（ECS/subnet/VPC/OBS/FunctionGraph/sandbox）已全部补删归零，无泄漏。解除条件=清理历史泄漏 VPC/扩容 router 配额后重跑（同昨日 D3-S2 配额非产品缺陷，今日 D3-S2 已恢复 PASS）。
- **证据**：`evidence/D3-C1/stdout.log`