# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-10-14-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-10-14 15:40:00（北京时间）
> **版本全量测试 v1.1.8**（gitHead `74f519d`，npm 1.1.8）

---

## #1【P0】D9-12 initialize 握手协议安全基线——tools/list 无 initialize 前置状态机，非法时序未返回 -32600

- **现象**：不先发 `initialize` 直接 `tools/list`，服务端照常返回工具列表，未按 JSON-RPC/MCP 协议拒绝非法时序返回 -32600。
- **断言**：未 initialize 即 tools/list 应返回 error=-32600（Invalid request）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` dispatch 对 tools/list 无 initialize 前置状态机校验，直接转发。
- **影响**：协议安全基线被绕过，客户端可跳过握手直连工具面，存在凭证/权限校验前置缺失风险。
- **证据**：`evidence/D9-12/stdout.log`

## #2【P0】D2-4/D4-26 凭证脱敏缺口——redactString 大小写敏感，小写 ak/sk 与 --password 明文不脱敏

- **现象**：`redactString('{"ak":"AKIDTEST...","sk":"SKTEST..."}')` 返回原文未脱敏；`findings.evidence` 中 `--password MyS3cret123` 明文残留（D4-26 实测 decision=warn evidence 明文=true）。
- **断言**：凭证值（ak/sk/token/password）一律替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 第三条正则 `/(AK|SK)\s*[:=]\s*.../g` 大小写敏感、仅匹配大写 AK/SK 且仅 `:`/`=` 分隔符；小写 `ak`/`sk` JSON 键、`--password <值>` CLI 形态均不命中（对象路径经 isSecretKeyName+policy 正常，字符串路径漏网）。
- **影响**：凭证明文泄露，安全脱敏保障存在缺口。
- **证据**：`evidence/D4-26/stdout.log`、`evidence/d2-auth/stdout.log`（redact-json 项）

## #3【P1】D4-4 写操作审批门——Change* 高危写操作判 allow 且 isWrite=undefined

- **现象**：ChangeServerOs / ChangeServer / ChangeVpc / ChangeInstanceConfiguration / ChangeVolumeType 等变更类操作被判 `decision=allow isWrite=undefined`，未强制审批/确认。
- **断言**：高危写（Change*）应判 deny/confirm（强制审批）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 写操作识别规则未覆盖 Change* 前缀（对照 CreateServers 能正确 deny，Change* 漏判）。
- **影响**：危险变更操作可绕过审批门直发云端，存在误删/误改风险。
- **证据**：`evidence/D4-4/stdout.log`

## #4【P1】D9-2 JSON-RPC 错误码——invalid params 未返回 -32602

- **现象**：`tools/list` 传 `params='not-an-object'`（string 而非 object），服务端无 error 对象，未返回 -32602 Invalid params。
- **断言**：非法 params 类型应返回 error.code=-32602。
- **根因**：mcp-protocol 派发层对 tools/list 未做 params 类型校验，-32601（method not found）正常但 -32602 缺失。
- **影响**：协议错误语义不完整，客户端无法按标准错误码诊断。
- **证据**：`evidence/D9-2/stdout.log`

## #5【P1】D10-3 / EXP-E01 / D3-S1 / D3-S5 服务目录路由——中文意图 MISS

- **现象**：`huaweicloud_service_catalog` 对「帮我查一下我账号在华北北京四有哪些云主机」路由返回 "Run hcloud --help"（未命中 ECS）；「只读查ECS」场景 route 亦未命中；复合中文意图仅命中单一服务。路由准确率 13/14=92.9%，1 MISS。
- **断言**：中文意图应精确命中目标服务（ECS 查询→ECS）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog routeMap 中文关键词/别名缺失（华北北京四=cn-north-4、云主机/ECS 别名未覆盖）。
- **影响**：服务路由准确率未达 100%，影响 Agent 免训练路由体验。
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log`、`evidence/D3-S1/stdout.log`

## #6【P1】D3-C1 真云 E2E——异步资源删除归零不可靠（ECS/VPC 泄漏）

- **现象**：ECS 创建成功，但 finally 删除后 150s 轮询仍 ACTIVE；subnet/VPC 删除为异步提交，DeleteVpc 报 VPC.0104「Router contains subnets」；实测 ECS e79d4b3e…、VPC f359605f…、subnet f295dc3f… 三资源残留，需人工二次删除才归零。
- **断言**：测后创建资源 100% 归零，仅删本次创建。
- **根因**：`scripts/realcloud_e2e.mjs` D3-C1 finally 清理对 ECS/subnet/VPC 异步删除未做充分归零校验（ECS 轮询 150s 不够、删 VPC 前未确认 subnet 已删）。
- **影响**：真云资源泄漏，成本与安全风险。
- **证据**：`evidence/D3-C1/stdout.log`（本次残留已人工清理归零）

## #7【P1】D9-9 tools/call 超时协议语义与取消——capabilities.cancellation 未声明（SPEC-MISMATCH）

- **现象**：initialize 返回 capabilities 中 notifications 缺失，未声明 `notifications.cancellation`。
- **断言**：应声明 capabilities.notifications.cancellation=true。
- **根因**：mcp-protocol initialize 响应未注入 cancellation 能力声明。
- **影响**：客户端无法得知服务端支持取消，超时语义无法协商。
- **证据**：`evidence/D9-9/stdout.log`

## #8【P1】D3-C7 跨区域资源操作引导——不存在资源错误码不精确

- **现象**：对不存在资源操作，未返回精确错误码 Ecs.0200（资源不存在）/ Ecs.0021（区域不可用）。
- **断言**：资源不存在→Ecs.0200；区域不可用→Ecs.0021。
- **根因**：错误引导层未映射精确区域/资源错误码。
- **影响**：排障引导粒度不足。
- **证据**：`evidence/D3-C7/stdout.log`

## #9【P2】D4-25 安全钩子——Python hook 写操作正则漏匹配 + 遥测路径错位

- **现象**：空格分隔写动词（ECS CreateServers）不匹配写操作正则，落 cli:invoke；Python hook 事件落 plugins/telemetry 而 Node 读 plugins/huaweicloud-core/telemetry。
- **断言**：写操作动词应被 WRITE_OPERATION_RE 匹配；hook 事件应被 Node 遥测消费。
- **根因**：`hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前导字符类使空格分隔写动词不匹配；`hooks/huaweicloud-safety.py:24` PLUGIN_DIR=parents[2] 误指向 plugins/。
- **影响**：写操作可能漏拦、遥测事件不被消费。
- **证据**：`evidence/D4-25/stdout.log`

## #10【P2】D1-65/D1-66 环境变量契约漂移——DEBUG=1 与 TELEMETRY=off 不生效

- **现象**：`HUAWEICLOUD_DEVKIT_DEBUG=1` 不开启调试（日志增量 0）；`TELEMETRY=off` 不关闭遥测（enabled=null）、自定义端未收到 POST。
- **断言**：DEBUG===1/true 均开调试；TELEMETRY=off 关闭、未设开启。
- **根因**：`telemetry.mjs:81` 仅 `=== 'true'` 字面量判断；遥测开关未读 OFF 语义。
- **影响**：调试/遥测开关契约漂移。
- **证据**：`evidence/D1-65/stdout.log`、`evidence/D1-66/stdout.log`

## #11【P2】D8-9 安装 ID 与遥测值脱敏——sanitizeValue 未做凭证脱敏（SPEC-MISMATCH）

- **现象**：telemetry sanitizeValue 仅 trim/截断/去控制字符，未脱敏凭证（脱敏依赖 risk-rule-engine/redactSecrets 层）。
- **断言**：遥测值应在写入前脱敏。
- **根因**：`telemetry.mjs:189` sanitizeValue 分层单一，未耦合 redactSecrets。
- **影响**：遥测上报可能携带敏感值。
- **证据**：`evidence/D8-9/stdout.log`

## #12【P2】D1-60 HTTP 查询路径与自定义 registry——慢响应超时未按边界收敛

- **现象**：慢响应查询超时后返回 [object Object]、未抛异常；timeout-bounded 实测 10007ms（未按 5s 边界收敛）。
- **断言**：超时边界内返回、超时返回 null/明确错误且不抛未捕获异常。
- **根因**：update-check fetch 版查询超时/错误处理未收敛。
- **证据**：`evidence/D1-60/stdout.log`

## #13【非产品缺陷】D1-68/D3-C14 探针凭证注入缺失（测试侧）

- **现象**：探针报 "Huawei Cloud credentials are not configured"，实际 ~/.config/huaweicloud/credentials.json 已配置。
- **根因**：探针未注入 HW_ACCESS_KEY/HW_SECRET_KEY env（真云凭据在 credentials.json，探针直调未走 auth 初始化）。
- **状态**：测试侧修正，非产品缺陷，不提单。

## #14【非产品缺陷】D3-C2 OBS建桶检测误报（测试侧）

- **现象**：OBS 桶实际创建成功（set静态站/get静态站均 200），但「OBS建桶」检查因 /success/i 正则未匹配实际输出文本而误报 FAIL；删桶归零已确认。
- **根因**：realcloud_e2e.mjs OBS 建桶断言正则与实际 CLI 输出文案不匹配。
- **状态**：测试侧修正，非产品缺陷，不提单。

## #15【非产品缺陷】D3-C3 sandbox_deploy_nginx 响应契约（产品侧轻微）

- **现象**：sandbox_deploy_nginx 返回 nginxType/port 为 undefined，但 deploy_check 确认 nginx 已 serving（PASS）。
- **根因**：sandbox_deploy_nginx 返回体字段名与探针读取字段不一致。
- **状态**：nginx 部署功能正常，返回契约需核对；轻微问题。

## #16【非产品缺陷】D3-S3 沙箱端口耗尽（环境）

- **现象**：sandbox deploy nginx 报 "all ports 8080-8089 are in use"，无法部署。
- **根因**：沙箱 8080-8089 端口被占（环境资源）。
- **状态**：环境阻塞，非产品缺陷，不提单。