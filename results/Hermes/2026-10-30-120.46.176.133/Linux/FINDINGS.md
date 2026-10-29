# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4.1-flash）

> **落盘路径**：`results/Hermes/2026-10-30-120.46.176.133/Linux/FINDINGS.md`
> **生成时间**：2026-10-30 05:20（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.13-next.0（npm `next`，gitHead `47170d1f`；对照 latest=1.1.12）
> **测试客户端**：Hermes (deepseek-v4.1-flash) / Linux (aarch64) / 120.46.176.133
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 43）
> **汇总**：产品缺陷 12 项（FAIL 9 + SPEC-MISMATCH 3）。沙箱相关 4 项（D3-C3/D3-C6/D3-S3 沙箱维护、D3-C7 跨区凭证作用域）为外部依赖阻塞，不计入提单。

---

## #1【P0】D2-4 凭证脱敏正确性——小写 ak=/sk= 与 JSON 带引号 key 脱敏失效

- **现象**：`redactSecrets('ak=AKIDTEST12345678 sk=SKTEST1234567890abcdef1234')` 与 `redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}')` 均原样明文返回（actual 含完整 AK/SK）；对照大写 `AK=... SK=...` 与对象键 `accessKeyId/secretAccessKey` 正常脱敏。
- **断言**：所有形态的 AK/SK（大写、小写 `ak=`/`sk=`、JSON 带引号 key `{"ak":...}`、对象键）应统一脱敏为占位符，不得明文残留。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactString` 第三个 `.replace` 的 `(AK|SK)` 正则大小写敏感（无 `/i`），小写 `ak=`/`sk=` 不匹配；`safety-policy.mjs:20` `isSecretKeyName` 硬编码键名正则未含裸 `ak`/`sk`（虽然 `safety/policy.json` 的 `secretKeyNamePatterns` 已列 `ak`/`sk`，但函数未使用该列表），JSON 带引号 key 漏脱敏。
- **影响**：AK/SK 可经日志/工具输出明文泄漏（小写 obsutilconfig 与 JSON 形态）。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D9-12 initialize 握手协议安全基线——非法时序未拒绝

- **现象**：`initialize` 返回 protocolVersion/capabilities/serverInfo 正常、tools=46、decorate=true；但 spawn 后不发 `initialize` 直接 `tools/list`，服务端正常返回工具列表（`threw=false, code=listed:46`），未按 JSON-RPC 拒绝。
- **断言**：未 `initialize` 先 `tools/list`/`tools/call` 的非法时序应被拒并返回 JSON-RPC 错误码 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` `dispatch` 的 `tools/list` 分支无「已 initialize」前置状态机校验，任何请求直接放行。
- **影响**：协议客户端可跳过握手直接枚举工具，破坏 MCP 初始化时序契约。
- **证据**：`evidence/D9-12/stdout.log`

## #3【P1】D4-4 写操作审批门——Change* 变更类动词漏拦截

- **现象**：`ChangeServerOs/ChangeServer/ChangeVpc/ChangeInstanceConfiguration/ChangeVolumeType` 5/5 判定 `decision=allow isWrite=undefined`，对照 `CreateServers`/`DeleteVpc` 正常 deny。
- **断言**：Change* 变更类写动词无审批不可执行（decision=deny/confirm）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:27` `writeOperationPrefixes`（Create/BatchCreate/Delete/.../Deploy 共 33 项）缺 `Change` 前缀。
- **影响**：变更类写操作（换 OS/换 VPC/改配置/改卷类型）可无审批执行。
- **证据**：`evidence/D4-4/stdout.log`

## #4【P1】D3-S1 场景-只读查ECS——「云主机」口语意图路由 MISS

- **现象**：`huaweicloud_service_catalog(intent="帮我查一下我账号有哪些云主机")` 返回 `recommendedServices=["Run hcloud --help to list available services."]`，未命中 ECS；只读命令本身可执行（readOk=true，零写）。
- **断言**：中文口语「云主机」应路由命中 ECS 并返回实例清单，全程零写。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2197` `routeMap` 的 ECS `keywords` 仅含 `弹性云服务器/云服务器/服务器/虚拟机` 等，缺「云主机」（全文件 `云主机` 出现 0 次）。
- **影响**：口语化「云主机」查询请求无法路由到 ECS，Agent 落入通用帮助分支。
- **证据**：`evidence/D3-S1/stdout.log`

## #5【P1】D10-3 路由准确率+混淆矩阵——92.9% 未达 100%

- **现象**：`node eval/harness/run-eval.mjs` 15 条中文意图路由 HIT=13 MISS=1 N/A=1，准确率 92.9%。
- **断言**：15 条评测集意图应 100% 命中期望服务（HIT=15）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2197` `routeMap` 缺「云主机」同义词；miss 条目即「云主机」类口语意图。
- **影响**：路由层对口语化同义词覆盖不全，用户意图识别成功率下降。
- **证据**：`evidence/D10-3/stdout.log`

## #6【P1】EXP-E01 评测集「云主机」意图 MISS

- **现象**：harness verdict=MISS（HIT/MISS 二值判定）。
- **断言**：评测集 EXP-E01 的「云主机」意图应 HIT 期望服务 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2197` ECS keywords 缺「云主机」（与 D3-S1/D10-3 同根因）。
- **影响**：评测集基线准确率被拉低（21.4%→92.9% 区间内仍存在同义词缺口）。
- **证据**：`evidence/EXP-E01/stdout.log`

## #7【P2】D3-S5 场景-复合意图分层路由——仅命中单一服务

- **现象**：复合中文意图返回 `recommendedServices=["ECS"] recommendedSkills=["huawei-ecs"]`，未同时命中预览/沙箱分层目标。
- **断言**：复合意图应拆分并多路命中（ECS + 存储/托管等服务），按预览/生产分层推荐。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2426` `serviceCatalog` 对 `routeMap` 为单轮首个命中即返回，无多意图分解与多服务合并逻辑。
- **影响**：复合请求（如「部署 Web 应用并配数据库」）只推荐一个服务，后续编排易漏步。
- **证据**：`evidence/D3-S5/stdout.log`

## #8【P2】D4-25 Python hook 事件遥测分类——写动词误分类 + 目录错位

- **现象**：写命令事件被写成 `cli:invoke`（expected `cli:write`）；keys=`["cli:read","cli:invoke","cli:invoke"]`；Node 侧 telemetry 读取目录不存在（`Node 读取目录存在=false`）。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`，且事件写到 Node telemetry 实际读取目录。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置字符类 `(^|[A-Za-z0-9])` 使空格分隔的写动词（`ECS CreateServers`）不匹配 → 落 `cli:invoke`；`hooks/huaweicloud-safety.py:24` `PLUGIN_DIR = parents[2]` 指向 `plugins/`，事件落 `plugins/telemetry`，而 Node `src/telemetry/telemetry.mjs` 读 `plugins/huaweicloud-core/telemetry`，事件不被消费。
- **影响**：Python hook 遥测与 Node 侧统计口径断裂，写操作遥测丢失。
- **证据**：`evidence/D4-25/stdout.log`

## #9【P2】D4-26 findings 证据脱敏——命令行明文密码残留

- **现象**：`hcloud IAM CreateUser --password MyS3cret123 --cli-region=cn-north-4` 触发 `decision=warn findings=1`，但 `findings.evidence` 保留明文 `--password MyS3cret123`。
- **断言**：findings.evidence 中 AK/SK/token/password 均替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19` `redactEvidence` 的键值正则仅匹配 `password:`/`password=` 形态，不匹配 `--password <value>` 空格分隔 CLI 形态。
- **影响**：安全告警自身的证据字段把密码原样写进告警/日志，脱敏反被绕过。
- **证据**：`evidence/D4-26/stdout.log`

## #10【SPEC-MISMATCH】D1-65 调试模式环境变量——仅接受字面量 "true"

- **现象**：`HUAWEICLOUD_DEVKIT_DEBUG=true` 日志增量 1248；`DEBUG=1` 增量 0（未开启）。
- **断言**：`DEBUG===1/true` 时开启调试日志；未设/其他值不开启。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:82` `DEBUG = process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true'` 仅接受字面量 `true`，`1` 不生效（契约漂移）。
- **影响**：按用例契约传 `DEBUG=1` 的用户拿不到调试日志。
- **证据**：`evidence/D1-65/stdout.log`

## #11【SPEC-MISMATCH】D1-68 区域环境变量优先级——HW_REGION 反压 HUAWEICLOUD_REGION

- **现象**：同时设 `HW_REGION=cn-test-hw-wins` 与 `HUAWEICLOUD_REGION`，`resolveCredentials` 取 `cn-test-hw-wins`（HW_REGION 胜出）。
- **断言**：`HUAWEICLOUD_REGION` 优先于 `HW_REGION` 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs:4969` `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`，顺序与契约相反（`isSecretKeyName` 同理的旧式 env 优先）。
- **影响**：双变量共存时按文档配置 `HUAWEICLOUD_REGION` 的用户被旧变量覆盖，操作落到非预期 region。
- **证据**：`evidence/D1-68/stdout.log`

## #12【SPEC-MISMATCH】D8-9 安装 ID 与遥测值脱敏——sanitizeValue 不脱敏凭证

- **现象**：`sanitizeValue('ak=AK123456 sk=SKsecret token=Tok123')` 原样返回明文；installId 稳定持久=true 正常。
- **断言**：`sanitizeValue` 移除 AK/SK/token 等敏感值与非法字符。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190` `sanitizeValue` 仅 trim/截断/去控制字符，未做凭证脱敏（脱敏只在 `risk-rule-engine`/`redactSecrets` 层）。
- **影响**：遥测字段若携带凭证片段将明文上报。
- **证据**：`evidence/D8-9/stdout.log`