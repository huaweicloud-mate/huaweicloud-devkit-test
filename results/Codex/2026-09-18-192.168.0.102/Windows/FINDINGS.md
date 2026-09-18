# FINDINGS - Codex-测试缺陷清单

生成时间：2026-09-18 15:45:00（北京时间）

## #1【P0】D4-16 shell 包裹命令未拦截

- **现象**：`sh -c "hcloud ECS CreateServers ..."` 在源码级与 MCP 级探针中均返回 `allow`。
- **断言**：包含写操作的 shell 包裹命令必须返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:67-90,156-181` 的 shell 解包与 hcloud 分段识别未覆盖本次 Windows 输入形态。
- **影响**：攻击者可通过 `sh` 包装绕过写操作安全门禁。
- **证据**：`evidence/d4-security/stdout.log`、`evidence/mcp-tools/stdout.log`（D4-16）。
- **状态**：待提单

## #2【P0】D2-4 JSON 凭证字符串未完整脱敏

- **现象**：`redactSecrets` 对 JSON 字符串保留 `ak`、`sk` 等明文值。
- **断言**：凭证 JSON 的 AK/SK/token/password 字段不得在返回字符串中出现明文。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-63` 的 `redactString` 只匹配键值分隔符文本，未解析 JSON 字符串后递归脱敏。
- **影响**：认证诊断输出可能泄露长期凭证。
- **证据**：`evidence/d2-auth/stdout.log`（D2-4）。
- **状态**：待提单

## #3【P0】D9-2 非法参数未返回 JSON-RPC -32602

- **现象**：协议探针对非法参数请求得到无 `error` 对象的响应。
- **断言**：非法参数必须返回 `error.code === -32602`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:77-85` 的 `tools/call` 分支未做参数校验并直接调用工具。
- **影响**：客户端无法按 JSON-RPC 标准区分参数错误。
- **证据**：`evidence/D9-9/protocol-probe.json`（D9-2b-invalid-params）。
- **状态**：待提单

## #4【P1】D4-27 双路径脱敏不完整

- **现象**：`redactSecrets`/`redactOutput` 双路径测试仍输出 AK/SK/token 明文。
- **断言**：两条输出路径均不得包含 AK/SK/token/password/adminPass 明文。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-63` 的字符串脱敏路径未覆盖 JSON 编码字段。
- **证据**：`evidence/d2-auth/stdout.log`（D4-27）。
- **状态**：待提单

## #5【P1】D8-4 安装文档机械执行检查失败

- **现象**：安装文档检查探针未满足预期的可机械执行断言。
- **断言**：安装文档必须包含可执行、无歧义且与当前命令一致的步骤。
- **根因**：当前证据显示 npm 包文档校验未满足该断言，需维护者核对打包文档内容。
- **证据**：`evidence/d2-auth/stdout.log`（D8-4）。
- **状态**：待提单

## #6【P1】D10 路由准确率低于门槛

- **现象**：14 条可判定中文意图仅命中 3 条、未命中 11 条，准确率 21.4%。
- **断言**：D10-3 路由准确率应达到 90% 以上。
- **根因**：`plugins/huaweicloud-core/src/service-catalog.mjs` 路由规则对多类中文意图返回通用帮助文本或错误服务集合，需维护者按 harness 结果定位具体映射。
- **证据**：`evidence/D10-3/stdout.log`、`evidence/D10-3/eval-run.csv`。
- **状态**：待提单

## #7【P1】D3-B7 只读真云执行返回空结果

- **现象**：真云 VPC 只读计划分类为 `allow`，但批准执行结果为 `undefined/undefined`。
- **断言**：批准后的只读命令必须返回明确成功结果或结构化错误。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs` 的批准执行结果适配未提供脚本预期的 `ok`/`exitCode` 字段。
- **证据**：`evidence/realcloud/D3-B7/stdout.log`。
- **状态**：待提单

## #8【P1】D3-C3 沙箱部署检查失败

- **现象**：沙箱连接、上传、Nginx 部署和关闭通过，但 `deploy_check` 返回 `FAIL`。
- **断言**：部署检查必须返回 `checks.nginx_serving.status === 'PASS'`。
- **根因**：`plugins/huaweicloud-core/src/sandbox/session-manager.mjs` 的部署检查链未满足实际沙箱部署状态断言，需结合远端检查响应定位。
- **证据**：`evidence/realcloud/D3-C3/stdout.log`。
- **状态**：待提单

## #9【P2】D3-B5 框架探测返回空值

- **现象**：框架探针得到 `null`，未得到预期框架对象。
- **断言**：对有效测试项目调用 `detectFramework` 应返回框架识别对象。
- **根因**：`plugins/huaweicloud-core/src/detect-framework.mjs:254` 的 `detectFramework` 在本次 fixture 下未识别项目。
- **证据**：`evidence/d2-auth/stdout.log`（D3-B5）。
- **状态**：待提单

## #10【SPEC-MISMATCH】D9-9 cancellation capability 未声明

- **现象**：initialize 返回的 capabilities 未声明 `notifications.cancellation`。
- **断言**：若产品契约要求取消能力，initialize 必须声明该 capability；当前实现未声明，故标记契约漂移。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:64-68` 仅返回 `capabilities.tools`。
- **证据**：`evidence/D9-9/protocol-probe.json`。
- **状态**：待规格裁决

