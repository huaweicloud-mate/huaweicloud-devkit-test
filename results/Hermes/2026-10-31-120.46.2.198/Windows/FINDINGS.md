# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-10-31-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-10-31 05:55（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.13-next.0（npm `next`，gitHead `47170d1f`；官方 latest=1.1.12）
> **测试客户端**：Hermes (DeepSeek-V4-Pro) / Windows 10 (x64) / 120.46.2.198
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 43 + 追踪表 216 + 使命 mission-001）
> **汇总**：产品缺陷 12 项（FAIL 9 + SPEC-MISMATCH 3）。环境阻塞 3 项（D3-C1 VPC 配额超限、D3-C3/D3-C6 沙箱维护窗口）为外部依赖，不计入提单。

---

## #1【P0】D2-4 凭证脱敏正确性——小写 ak=/sk= 与 JSON 带引号 key 脱敏失效

- **现象**：`redactSecrets('ak=AK1234567890ABC sk=XYZ789...')` 与 JSON 形态 `{"ACCESS_KEY_ID":"AKJSON123456","SECRET_ACCESS_KEY":"SKJSON987654"}` 均原样明文残留；对照大写 `--cli-access-key=...`/`--cli-secret-key=...` 正常脱敏。
- **断言**：所有形态的 AK/SK（大写、小写 `ak=`/`sk=`、JSON 带引号 key）应统一脱敏为占位符，不得明文残留。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactSecrets` 内 `.replace(/(AK|SK)\s*[:=]\s*.../g)` 正则大小写敏感（无 `/i`），小写 `ak`/`sk` 不命中；`:20` `isSecretKeyName` 硬编码键名未含裸 `ak`/`sk`，JSON 带引号 key 漏脱敏。
- **影响**：AK/SK 可经日志/工具输出明文泄漏（小写 obsutilconfig 与 JSON 形态）。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D9-12 initialize 握手协议安全基线——非法时序未拒绝

- **现象**：spawn MCP server 后不发 `initialize` 直接 `tools/list`，直接返回 46 个工具清单（未拒绝）；`tools/call` 同样可绕过握手直接路由。
- **断言**：未 `initialize` 先 `tools/list`/`tools/call` 的非法时序应被拒绝并行返回 JSON-RPC 错误码。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:61` `dispatch` 的 `tools/list` 分支无「已 initialize」前置状态机校验，任何请求直接放行。
- **影响**：协议客户端可跳过握手直接枚举/调用工具，破坏 MCP 初始化时序契约。
- **证据**：`evidence/D9-12/stdout.log`

## #3【P1】D4-4 写操作审批门——Change* 变更类动词漏拦截

- **现象**：`hcloud ECS ChangeServerChargeType --server_id=test`、`ChangeServerSpec` 等判断 `decision=allow`（未识别为写/审批），对照 `DeleteServer` 正常拦截。
- **断言**：Change* 变更类写动词无审批不可执行（decision=deny / allow_with_approval）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:27` `writeOperationPrefixes` 数组缺 `Change` 前缀。
- **影响**：变更类写操作（换规格/计费模式等）可绕过审批门执行。
- **证据**：`evidence/D4-4/stdout.log`

## #4【P1】D3-S1 场景-只读查ECS——「云主机」口语意图路由 MISS

- **现象**：`huaweicloud_service_catalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 返回空（`recommendedServices=[]`），未命中 ECS。
- **断言**：中文口语「云主机」应路由命中 ECS 并返回实例清单，全程零写。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2197-2208` `routeMap` 的 ECS `keywords` 仅含「弹性云服务器/云服务器」等，缺「云主机」同义词。
- **影响**：口语化「云主机」查询无法路由到 ECS，落入通用帮助分支。
- **证据**：`evidence/D3-S1/stdout.log`

## #5【P1】EXP-E01 评测集「云主机」意图 MISS

- **现象**：`probe-eval.mjs` 直连 MCP server 跑 15 条中文评测集，EXP-E01「云主机」verdict=MISS（HIT=13 MISS=1 N/A=1，准确率 92.9%）。
- **断言**：评测集 EXP-E01 的「云主机」意图应 HIT 期望服务 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2197-2208` ECS keywords 缺「云主机」（与 D3-S1 同根因）。
- **影响**：评测集基线准确率被拉低到 92.9%，同义词缺口未收敛。
- **证据**：`evidence/EXP-E01/stdout.log`

## #6【P1】D3-C2 OBS 静态网站托管配置——x-amz-security-token 未纳入签名头

- **现象**：真机 OBS E2E：建桶成功，`huaweicloud_obs_set_website_config` set/get 均 HTTP 400 `Request has x-amz-security-token header but signed headers not included`；删桶归零成功。
- **断言**：set/get 静态网站托管配置应返回 200。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:3040-3041` `canonicalHeaders`/`signedHeaders` 仅 `host;x-amz-content-sha256;x-amz-date`，而 `:3078` 已加入 `x-amz-security-token` 头却未纳入 `signedHeaders`，AWS4 签名不覆盖该头 → OBS 拒绝 400。
- **影响**：OBS 静态网站托管（set/get）不可用。
- **证据**：`evidence/D3-C2/stdout.log`

## #7【P2】D3-S5 场景-复合意图分层路由——仅命中单一服务

- **现象**：复合意图「部署一个静态网站并把图片存到对象存储」返回 `recommendedServices` 未同时命中静态站(OBS/部署) + 对象存储多路服务，仅覆盖单一服务。
- **断言**：复合意图应正确拆分并命中多个对应 service，按预览/生产分层推荐。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` 的 `routeMap` + 匹配循环无多意图分解/合并规则，复合意图仅单一 route 命中。
- **影响**：复合请求（如「部署 Web 应用并配数据库」）只推荐一个服务，后续编排易漏步。
- **证据**：`evidence/D3-S5/stdout.log`

## #8【P2】D4-25 Python hook 事件遥测分类——空格前置写动词误分类

- **现象**：Python hook 的 `WRITE_OPERATION_RE` 对 CLI 常规形态「空格前置写动词」（如 `hcloud ECS DeleteServer`）不命中，写操作落 `cli:invoke` 而非 `cli:write`。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置字符类 `(^|[A-Za-z0-9])` 使空格分隔的写动词不匹配；`:24` `parents[2]` 目录错位（事件落地与 Node 侧读取目录不一致）。
- **影响**：Python hook 遥测写操作分类丢失，与 Node 侧统计口径断裂。
- **证据**：`evidence/D4-25/stdout.log`

## #9【P2】D4-26 findings 证据脱敏——空格分隔命令行密码明文残留

- **现象**：`--password <value>` 空格分隔 CLI 形态的密码不被 `redactEvidence` 脱敏，`findings.evidence` 明文残留。
- **断言**：findings.evidence 中 AK/SK/token/password 均替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19-22` `redactEvidence` 键值分隔正则仅 `[:=]`，不匹配 `--password <value>` 空格分隔 CLI 形态。
- **影响**：安全告警自身的证据字段把密码原样写进告警/日志，脱敏被绕过。
- **证据**：`evidence/D4-26/stdout.log`

## #10【SPEC-MISMATCH】D1-65 调试模式环境变量——仅接受字面量 "true"

- **现象**：`DEBUG=1` 不开启调试日志（仅 `HUAWEICLOUD_DEVKIT_DEBUG=true` 生效）。
- **断言**：`DEBUG===1/true` 时开启调试日志；未设/其他值不开启。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:82` `DEBUG = process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true'` 仅接受字面量 `true`，`1` 不生效（契约漂移）。
- **影响**：按用例契约传 `DEBUG=1` 的用户拿不到调试日志。
- **证据**：`evidence/D1-65/stdout.log`

## #11【SPEC-MISMATCH】D1-68 区域环境变量优先级——HW_REGION 反压 HUAWEICLOUD_REGION

- **现象**：同时设 `HW_REGION` 与 `HUAWEICLOUD_REGION` 时取 `HW_REGION`（旧变量胜出）。
- **断言**：`HUAWEICLOUD_REGION` 优先于 `HW_REGION` 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs:4969` `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`，顺序与契约相反。
- **影响**：双变量共存时按文档配置 `HUAWEICLOUD_REGION` 的用户被旧变量覆盖。
- **证据**：`evidence/D1-68/stdout.log`

## #12【SPEC-MISMATCH】D8-9 安装 ID 与遥测值脱敏——sanitizeValue 不脱敏凭证

- **现象**：`sanitizeValue('AK=AKLIVE1234567890')` 原样返回明文；installId 稳定持久正常。
- **断言**：`sanitizeValue` 移除 AK/SK/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-196` `sanitizeValue` 仅 trim/截断/去控制字符，未做凭证脱敏。
- **影响**：遥测字段若携带凭证片段将明文上报。
- **证据**：`evidence/D8-9/stdout.log`

## #13【非产品缺陷】D3-C1 ECS 生命周期 E2E——VPC 配额超限（环境阻塞）

- **现象**：真机执行 CreateVpc 返回 `VPC.0114 Quota exceeded for resources`；账号现有 5 个 VPC（均为其他客户端/historical 遗留、非本机 testbot3-hermes-*，按红线只删本次创建故不可删），CreateSubnet/CreateServers 随之无法执行；finally 归零确认「无资源需清理」。
- **说明**：外部配额依赖，非产品缺陷；不在本次统一提单范围，解除条件=其他客户端清理 VPC 释放配额后复测。

## #14【非产品缺陷】D3-C3 沙箱部署 E2E——沙箱维护窗口（环境阻塞）

- **现象**：真机执行 `sandbox_connect` 未返回 connected、workspace_id 为空，upload_project/deploy_nginx/deploy_check/close_session 全部依赖 connect 失败（`workspace_id is required. No sandbox connected`）。
- **说明**：外部依赖（HDKIT_SANDBOX_MAINTENANCE 沙箱维护），非产品缺陷；解除条件=沙箱维护结束、sandbox_connect 返回 connected。

## #15【非产品缺陷】D3-C6 沙箱隐式工具冒烟——沙箱维护窗口（环境阻塞）

- **现象**：真机执行 `check_user` 返回「沙箱功能正在升级优化，暂时无法使用」（trace 1eb6d8633c4b47609694094a7022a60b），connect/credentials/exec_one_shot/close_session 全部失败。
- **说明**：外部依赖（沙箱维护），非产品缺陷；解除条件=沙箱维护结束、check_user/connect 恢复。