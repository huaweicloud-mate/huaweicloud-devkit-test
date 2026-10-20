# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-10-20-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：`2026-10-20 05:35:00`（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.9（npm `latest` 正式版，gitHead `05a67b64`）
> **测试客户端**：Hermes (DeepSeek-V4-Pro) / Linux (aarch64) / 120.46.222.180
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 43）
> **汇总**：产品缺陷 16 项（FAIL 14 + SPEC-MISMATCH 2）+ 非产品缺陷 1 项（真云 VPC 配额）。经 file_issue.py 历史查重后判定是否开单。

---

## #1【P0】D2-4 凭证脱敏正确性——JSON 小写 ak/sk 键未脱敏

- **现象**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234",...}')` 原样返回，SK 明文残留未脱敏（`access_key=`/`secret_key=` 大写键正常脱敏）。
- **断言**：JSON 形态 `{"ak":...,"sk":...}` 凭证应被脱敏为占位符。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34`（redactString）/`:49`（redactSecrets）键值正则未覆盖小写 `ak`/`sk` 键名（仅 access_key/secret_key/大写 AK=/SK=）。
- **影响**：JSON 凭证经日志/输出明文泄漏。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D9-12 initialize 握手协议安全基线——非法时序未拒绝

- **现象**：spawn mcp-server 后不发 initialize 直接 `tools/list`，服务端返回 42 工具列表（未拒绝），非法时序拒绝=false。
- **断言**：非法时序（未 initialize 先 tools/list/call）应被拒并返回 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` dispatch `tools/list` 分支无 initialize 前置校验，任意时序放行。
- **影响**：协议客户端可跳过握手直接枚举工具，破坏 MCP 初始化时序契约。
- **证据**：`evidence/D9-12/stdout.log`

## #3【P1】D4-4 写操作审批门——Change* 变更类动词漏拦截

- **现象**：写语义操作 `ChangeServerOs`/`ChangeVpc`/`ChangeInstanceConfiguration`/`ChangeVolumeType` 等判定 `decision=allow, isWrite=undefined`（0/5 拦截），对照 `CreateServers` 正常 `decision=deny`。
- **断言**：12 类写动词（含 Change* 变更类）无审批不可执行（decision=deny/confirm）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:27` `writeOperationPrefixes` 列表仅含 Create/Delete/Update/Modify/Resize/Reboot/Stop/Start/…，缺 `Change` 前缀；`safety-policy.mjs:139` 据此判定写语义，变更类写操作绕过审批门。
- **影响**：变更类写操作（换 OS/换 VPC/改配置/改卷类型）可无审批执行。
- **证据**：`evidence/D4-4/stdout.log`

## #4【P1】D3-S1 场景-只读查 ECS——serviceCatalog 中文「云主机」路由 MISS

- **现象**：`service_catalog({intent:'帮我查一下我账号有哪些云主机'})` → `recommendedServices=['Run hcloud --help to list available services.']`（未命中 ECS）；只读 ListServersDetails 正常返回实例清单（零写）。
- **断言**：中文「云主机」意图应路由命中 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2007-2012` ECS routeMap keywords 含「弹性云服务器/云服务器/服务器/虚拟机/镜像」，缺「云主机」同义词。
- **影响**：ECS 场景中文意图召回漏常见同义词。
- **证据**：`evidence/D3-S1/stdout.log`

## #5【P1】D10-3 路由准确率+混淆矩阵——1 条中文意图 MISS

- **现象**：eval-harness 15 条中文意图路由 HIT=13 MISS=1 N/A=1，准确率 92.9% (13/14)。
- **断言**：评测集路由准确率应 100% HIT（N/A 诊断类除外）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog routeMap 仍缺「云主机」同义词（同 EXP-E01/D3-S1 根因）。
- **影响**：1 条中文意图（EXP-E01）路由 MISS。
- **证据**：`evidence/D10-3/stdout.log`

## #6【P1】EXP-E01 评测集『云主机』中文意图路由 MISS

- **现象**：eval-harness EXP-E01『帮我查一下我账号在华北北京四有哪些云主机』路由 MISS（返回 Run hcloud --help）；其余 13 条 HIT、1 条 N/A。
- **断言**：「云主机」「云服务器」「ECS」等同义查询意图应路由到 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` ECS routeMap keywords 缺「云主机」同义词。
- **影响**：ECS 场景中文意图召回漏一个常见同义词。
- **证据**：`evidence/EXP-E01/stdout.log`

## #7【P1】D3-C1 ECS 生命周期 E2E——清理异步删除未验证归零（泄漏）

- **现象**：CreateVpc/CreateSubnet/CreateServers 均成功，`finally` 反序删除后 ECS 轮询（15×10s）后 `仍在/未确认`，subnet/vpc 删除提交 OK；本次运行泄漏 1 台 ECS（`testbot1-hermes-ecs-*`），须手动补删归零。
- **断言**：真云 E2E 测后资源须全部删除并验证归零（ECS→subnet→VPC 反序，确认真正消失）。
- **根因**：`scripts/realcloud_e2e.mjs` 依赖 `DeleteServers` 提交 exit code + 固定轮询窗口，ECS 异步删除超过轮询窗口时未继续验证/兜底，残留资源。
- **影响**：真云资源泄漏，占配额、留计费资源。
- **证据**：`evidence/D3-C1/stdout.log`

## #8【P1】D3-C7 跨区域资源操作引导——跨区错误码与契约不符

- **现象**：跨区只读查询/不存在资源操作返回 `Common.0013`（region 与 token project 不匹配）、`VPC.0501`（token 携带 region 信息），与契约预期 `Ecs.0200/Ecs.0021` 精确错误码不符。
- **断言**：跨区域/不存在资源应命中区域/资源精确错误码，并给出跨区引导。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `explain_error`/跨区引导映射未覆盖 `Common.0013`/`VPC.0501`（token-region 不匹配）场景。
- **影响**：跨区误操作缺乏精确诊断引导。
- **证据**：`evidence/D3-C7/stdout.log`

## #9【P1】D3-S3 场景-沙箱预览出 URL——DevBridge 隧道公网 URL 未建立

- **现象**：sandbox connect/upload_project/deploy_nginx/deploy_check 均成功（serving=true），但 `expose_tunnel` 后 `publicUrl=(无)`、`urlHTTP200=false`，预览 URL 不可达。
- **断言**：沙箱预览应产出可 HTTP 200 访问的公网 URL。
- **根因**：`plugins/huaweicloud-core/src/ws-exec/hwlink-tunnel-channel.mjs` expose 流程未返回/未建立可达公网 URL（绑定 API-Key 隧道，URL 提取失败）。
- **影响**：沙箱预览功能不可用。
- **证据**：`evidence/D3-S3/stdout.log`

## #10【P2】D3-S5 场景-复合意图分层路由——仅命中单一服务

- **现象**：复合中文意图 `recommendedServices=["ECS"] recommendedSkills=["huawei-ecs"]`，未拆分命中预览/沙箱分层目标。
- **断言**：复合意图应拆分命中多个对应 service，分层推荐。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 单关键词并集路由，无复合意图分层拆解。
- **影响**：多服务编排场景路由不完整。
- **证据**：`evidence/D3-S5/stdout.log`

## #11【P2】D4-25 Python hook 事件遥测分类——写操作落 cli:invoke

- **现象**：写命令事件 keys=["cli:read","cli:invoke","cli:invoke"]（写操作未落 cli:write），Node 读取目录存在=false。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 用 `(^|[A-Za-z0-9])` 前置字符类，使空格分隔的写动词（ECS CreateServers）不匹配→落 cli:invoke。
- **影响**：安全事件遥测分类失真，写操作不可观测。
- **证据**：`evidence/D4-25/stdout.log`

## #12【P2】D4-26 findings 证据脱敏不完整

- **现象**：`evaluateArtifacts`/hook findings.evidence 中 `IAM CreateUser --password MyS3cret123` 明文残留（明文残留=true），decision=warn（未 deny）。
- **断言**：findings.evidence 中 password/AK/SK 等敏感值应全部脱敏，无明文残留。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` redactEvidence 正则键名表未覆盖 `--password <值>` 空格形态。
- **影响**：安全预检回执泄露明文凭据/密码。
- **证据**：`evidence/D4-26/stdout.log`

## #13【P2】D8-9 sanitizeValue 未做凭证脱敏（SPEC-MISMATCH）

- **现象**：`sanitizeValue("ak=AK123456 sk=SKsecret token=Tok123")` 原样返回（仅 trim/截断/去控制字符），未移除敏感值；installId 稳定持久=true。
- **断言**：sanitizeValue 应移除 ak/sk/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` sanitizeValue 仅 replace 空白 + slice 截断，无敏感值脱敏（脱敏在 risk-rule-engine/redactSecrets 层，未接入）。
- **影响**：遥测字段若携带凭证将明文上报。
- **证据**：`evidence/D8-9/stdout.log`

## #14【P2】D1-65 调试模式环境变量——DEBUG 仅认字面量 'true'（SPEC）

- **现象**：`HUAWEICLOUD_DEVKIT_DEBUG=1` 日志增量=0（不生效），仅 `'true'` 生效；契约「1/true 均可开启」。
- **断言**：DEBUG 为 1 或 true 均应开启调试日志。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:81` `const DEBUG = process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true'` 严格比较。
- **影响**：调试开关契约不一致，遥测域 `1` 不生效。
- **证据**：`evidence/D1-65/stdout.log`

## #15【P2】D1-66 遥测开关与端点环境变量——开关/自定义端点不生效

- **现象**：off→enabled=null、未设→enabled=null、自定义端点收到 POST=false（[]），遥测开关/自定义端点环境变量未生效。
- **断言**：遥测开关 off/env 应正确切换，自定义端点应收到上报。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` 开关/端点 env 读取与上报路径漂移。
- **影响**：遥测开关与自定义上报端点不可控。
- **证据**：`evidence/D1-66/stdout.log`

## #16【P2】D1-68 region 环境变量优先级与契约相反（SPEC-MISMATCH）

- **现象**：同时设 `HW_REGION` 与 `HUAWEICLOUD_REGION` 时，`resolveCredentials` 取 `HW_REGION`（cn-test-hw-wins），契约要求 `HUAWEICLOUD_REGION` 优先。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION` 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:222` `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`（另有 :173、:339 同序）。
- **影响**：region 环境变量优先级与契约漂移。
- **证据**：`evidence/D1-68/stdout.log`

## #17【非产品缺陷】真云 VPC 创建被 router 配额阻断（共享账号多机并发）

- **现象**：D3-S2 真机 CreateVpc → `VPC.0114 Quota exceeded for resources: ['router']`（router 配额耗尽）。实测为共享账号 hw018619646 多机（testbot1/testbot3）并发每日测试 + 历史泄漏 VPC 累积导致配额耗尽；本客户端本次运行自有资源（ECS/subnet/VPC）已全部补删归零。
- **说明**：账号级配额/多机并发限制，非产品代码缺陷，不计入提单。对应 D3-S2 标 FAIL（【补环境】），解除条件=清理历史泄漏 VPC/扩容 router 配额后重跑。
- **证据**：`evidence/D3-S2/stdout.log`