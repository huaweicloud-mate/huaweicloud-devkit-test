# FINDINGS - Codex GPT-5-Codex

## #1【P0】D2-4 凭证 JSON 脱敏不完整

- **现象**：真实执行 `redactSecrets()` 处理包含 `ak`/`sk` 的 JSON 时，测试值仍出现在输出中。
- **断言**：`redactSecrets(JSON.stringify({ak, sk}))` 的结果不得包含原始 secret。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:49-64` 的对象路径仅按 `isSecretKeyName()` 判断字段，`ak`/`sk` 未被该字段规则覆盖。
- **影响**：配置对象可能在日志或工具结果中泄露短 AK/SK 字段。
- **证据**：`evidence/D2-4/stdout.log`、`evidence/d2-auth/probe.mjs`
- **状态**：待提单

## #2【P0】D4-16 MCP shell 包裹命令可绕过拦截

- **现象**：MCP `hook_check_command` 对 `sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 返回 `decision=allow`。
- **断言**：shell wrapper 内的凭证读取/打印命令必须返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:493-497` 只提取有限的 shell 内层命令，MCP 入口传入的 wrapper 形态未被完整展开后再分类。
- **影响**：通过 shell 包裹可绕过凭证环境变量保护。
- **证据**：`evidence/D4-16/stdout.log`、`evidence/mcp-tools/stdout.log`
- **状态**：待提单

## #3【P1】D4-27 双路径输出脱敏不完整

- **现象**：真实执行双路径脱敏断言时，`ak`、`sk` 与 token 测试值仍出现在结果中。
- **断言**：结构化对象与字符串路径均不得保留原始凭证值。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:53-63` 的结构化字段脱敏与 `redactString()` 的字段名集合不一致。
- **影响**：不同调用路径产生不一致的凭证保护结果。
- **证据**：`evidence/D4-27/stdout.log`、`evidence/d2-auth/stdout.log`
- **状态**：待提单

## #4【P1】D8-4 安装包引导文档断言失败

- **现象**：D8-4 机械执行检查报告 `INSTALL.md` 未包含在 npm 包验证结果中。
- **断言**：正式包安装后应能读取安装引导文档，或测试契约应明确文档不随包发布。
- **根因**：`package.json:1-60` 的发布文件清单未保证 `INSTALL.md` 被打包。
- **影响**：用户安装后无法按包内引导完成故障恢复。
- **证据**：`evidence/D8-4/stdout.log`、`evidence/d2-auth/stdout.log`
- **状态**：待提单

## #5【P1】D9-2 tools/call 非法参数错误码不符合契约

- **现象**：协议探针中非法 `tools/call` 参数未返回 `-32602`，结果为无 error 对象。
- **断言**：缺少必填参数的 `tools/call` 必须返回 JSON-RPC `-32602`.
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:70-78` 创建了带 code 的异常，但 `plugins/huaweicloud-core/src/mcp-server.mjs:187-197` 的协议适配路径未在该请求形态下稳定序列化该错误。
- **影响**：客户端无法按标准错误码区分非法参数与内部错误。
- **证据**：`evidence/D9-2/stdout.log`、`eval/results/protocol-probe-20261013210703.json`
- **状态**：待提单

## #6【P1】EXP-E01 ECS 查询路由 MISS

- **现象**：D10 harness 对“查询华北北京四云主机”返回 `Run hcloud --help to list available services`，未路由到 ECS。
- **断言**：该意图必须命中 ECS service catalog。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` 的 `serviceCatalog` 路由规则未将该查询意图稳定映射到 ECS。
- **影响**：用户的只读 ECS 查询无法进入正确服务路径。
- **证据**：`evidence/EXP-E01/stdout.log`、`eval/results/eval-run-20261013210514.csv`
- **状态**：待提单

## #7【P1】D9-9 cancellation capability 与设计契约漂移

- **现象**：协议初始化返回 `capabilities.tools`，未声明 `notifications.cancellation`。
- **断言**：D9-9 设计要求声明 cancellation capability。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47-49` 的 initialize capabilities 未包含 cancellation 声明。
- **影响**：客户端无法依据初始化结果判断取消能力。
- **证据**：`evidence/D9-9/stdout.log`、`eval/results/protocol-probe-20261013210703.json`
- **状态**：待提单
