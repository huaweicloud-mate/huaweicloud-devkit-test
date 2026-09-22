# FINDINGS — Codex Windows 2026-09-23

## #1【P0】D4-16 `sh -c` 命令包裹穿透

- **现象**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `allow`。
- **断言**：shell 包裹内的凭证读取/环境变量打印必须返回 `deny`。
- **根因**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:70-181` 的 shell wrapper 解包路径未覆盖该 `sh -c` 输入形态。
- **影响**：敏感命令可能绕过执行前安全拦截。
- **证据**：`evidence/D4-16/stdout.log`。
- **状态**：待提单

## #2【P1】D2-4/D4-27 双路径输出脱敏不完整

- **现象**：`redactSecrets()` 对对象输出仍保留 `ak`、`sk`、`token` 字段值。
- **断言**：Node 与 CLI 两条输出路径都必须把敏感值替换为 `<redacted>`。
- **根因**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:49-68` 的对象递归脱敏规则未覆盖探针使用的字段形态。
- **影响**：认证信息可能出现在工具输出或诊断日志中。
- **证据**：`evidence/D2-4/stdout.log`、`evidence/D4-27/stdout.log`。
- **状态**：待提单

## #3【P1】D9-2 JSON-RPC 错误码契约失败

- **现象**：无效方法/参数场景的探针以非零退出，错误码断言未通过。
- **断言**：未知方法与无效参数必须返回 MCP 约定的 JSON-RPC 错误码，而不是通用内部错误。
- **根因**：`hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs:65-100` 的错误分支与探针预期错误码不一致。
- **影响**：客户端无法稳定区分协议错误与服务内部错误。
- **证据**：`evidence/D9-2/stdout.log`。
- **状态**：待提单

## #4【P1】D8-4 npm 包安装文档断言失败

- **现象**：安装包文档检查未满足用例断言。
- **断言**：正式/预发布 npm 包必须包含可执行的安装引导文档。
- **根因**：npm 包清单与源码仓库文档产物不一致，需核对 `hdk/package.json` 的 `files` 配置及打包结果。
- **影响**：用户安装后无法按包内文档完成配置。
- **证据**：`evidence/D8-4/stdout.log`。
- **状态**：待提单

## #5【P1】D9-9 `tools/call` 超时/取消语义规格偏差

- **现象**：探针标记为 SPEC-MISMATCH。
- **断言**：`tools/call` 的超时与取消行为必须符合 MCP 协议测试契约，并返回可区分的结果。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1093` 及 `mcp-protocol.mjs` 的调用选项/取消处理与当前测试规格不一致。
- **影响**：长耗时工具调用可能无法被客户端可靠取消或分类。
- **证据**：`evidence/D9-9/stdout.log`。
- **状态**：待规格裁决

## #6【P1】EXP-E 路由评测多项 MISS

- **现象**：`EXP-E01~E05`、`EXP-E07`、`EXP-E10~E14` 的 `serviceCatalog` 路由结果为 `MISS`，期望为 `HIT`。
- **断言**：评测集中的服务意图必须路由到对应 Huawei Cloud 服务。
- **根因**：需进一步定位 `hdk/plugins/huaweicloud-core/src` 的服务目录匹配规则与评测提示词映射。
- **影响**：用户意图可能无法进入正确服务工具链。
- **证据**：`evidence/EXP-E01/stdout.log` 至 `evidence/EXP-E14/stdout.log`。
- **状态**：待提单
