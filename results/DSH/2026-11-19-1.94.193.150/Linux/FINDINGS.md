# FINDINGS — 缺陷发现清单（DSH-deepseek-v4.1-flash-1017）

> **落盘路径**：`results/DSH/2026-11-19-1.94.193.150/Linux/FINDINGS.md`
> **生成时间**：2026-11-19 15:10（北京时间）
> **被测版本**：`huaweicloud-devkit v2.0.0-next.4`（npm @next，gitHead `16a24814`，tag `v2.0.0-next.4`）
> **本轮结论**：9 项缺陷（3 P0 / 2 P1 / 4 P2，含 2 项 SPEC-MISMATCH 待裁决）。其中 6 项为 v1 历史遗留并在 v2 复现（D4-16、D4-21、D8-9、D1-68、D2-10、EXP-E01、D9-12 中的 7 项），2 项为 v2 重构新增（D9-6 跨客户端互通、D4-12 安装器基线），1 项为既有错误消息契约漂移。
>
> **v2 背景**：hdk 源码由 `.mjs` 迁至 `.ts`，安装包以 `plugins/huaweicloud-core/dist/*.js` 形式分发；全部探针直接 import 已安装 `dist` 产物，根因定位回写到 `src/*.ts` / `safety/rules/*.json`。本轮 146 例全部重执行（未沿用旧证据）。

## 汇总

| # | 级别 | 用例ID | 标题 | 状态 |
|---|---|---|---|---|
| 1 | P0 | `D4-16` | `sh -c` 包裹的凭证 env dump 绕过命令风险引擎 | 待提单 |
| 2 | P0 | `D4-21` | HCL/Terraform `actions=["*"]` 宽授权仅 warn 不 deny | 待提单 |
| 3 | P0 | `D9-12` | 未 initialize 直接 tools/list 未被拒绝（返回 58 工具） | 待提单 |
| 4 | P1 | `D9-6` | vendor gate + resources 能力移除破坏第三方 MCP 客户端互通 | 待提单 |
| 5 | P1 | `D8-9` | 遥测 sanitizeValue 未脱敏凭证 | 待提单 |
| 6 | P2 | `EXP-E01` | 中文「云主机」意图路由 MISS，回落 help 文案 | 待提单 |
| 7 | P2 | `D1-68` | region 环境变量优先级与用例契约相反（HW_REGION 优先） | 待裁决 SPEC |
| 8 | P2 | `D2-10` | KooCLI 缺失错误消息拼接中文前缀，精确断言失配 | 待提单 |
| 9 | P2 | `D4-12` | v2 安装器不再 npm install，--omit=dev/--no-audit/--no-fund 基线失效 | 待裁决 SPEC |

## #1【P0】D4-16 sh -c 命令包裹穿透

- **现象**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `{"decision":"allow","findings":[]}`。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应返回 `deny`（credential 类）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:27-39` 的 `hwc-command-env-dump` 规则要求 env 命令前是 `(^|\s)`，而 `sh -c "env | …"` 中 `env` 前是双引号，规则不匹配；同文件的 key 正则本身可命中 `HUAWEICLOUD_ACCESS_KEY`，故漏拦只发生在命令边界。`src/safety/classify-text.ts:997-1007` 的同一类判定能命中，但 `evaluateCommandRisk` 走规则引擎，两条链路结论不一致。
- **影响**：攻击者可用 `sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 绕过命令风险引擎泄露凭证 env。
- **证据**：`evidence/D4-16/stdout.log`（17:26:53 实跑，why 即引擎原始返回）

## #2【P0】D4-21 HCL broad IAM 未拦截

- **现象**：JSON `Action:"*"` + `Effect:"Allow"` 判定 `deny`，但 HCL `resource "huaweicloud_iam_policy" "p" { actions = ["*"] }` 判定 `warn`。
- **断言**：JSON 与 HCL 两种形态的 `*` 宽授权均应 `deny`。
- **根因**：`safety/rules/cloud-risk-rules.json:277-311` 的 broad-admin deny 规则要求同时出现 `Effect … Allow`；HCL 片段只有 `actions = ["*"]` 没有 `Effect` 字段，只命中 `:312-335` 的 `hwc-iam-wildcard-action`（`severity:"warn"`）。HCL/Terraform 形态缺独立的 deny 分支。
- **影响**：IaC 宽权限策略以 warn 放行，安全引擎对 Terraform 代码的 fail-closed 缺失。
- **证据**：`evidence/D4-21/stdout.log`（why: `HCL IAM 未拦截: json=deny hcl=warn`）

## #3【P0】D9-12 MCP 非法时序未拒绝

- **现象**：未发送 `initialize`，直接发 `tools/list`，服务端返回全量 58 个工具；客户端未收到协议时序错误。
- **断言**：未 initialize 的请求应返回协议错误（-32600 或等价），不得返回工具列表。
- **根因**：`src/mcp-protocol.ts` 的 `createDevkitMcpServer` 直接在 MCP SDK `McpServer` 上注册工具并连接 transport，未维护「initialize 之前拒绝请求」的状态机守卫；SDK 默认不替业务层拒绝 `tools/list`。
- **影响**：MCP 协议状态机合规缺口，未握手客户端可枚举全量工具并继续调用。
- **证据**：`evidence/D9-12/stdout.log`（why: `握手=true 非法时序拒绝=undefined (未init先list 返回 58 工具)`）

## #4【P1】D9-6 vendor gate 破坏第三方 MCP 客户端互通

- **现象**：双 stdio 客户端冒烟中，`initialize`、`tools/list`（58 工具）均通过；客户端 A 调 `huaweicloud_service_catalog`（只读目录工具，参数仅 `intent`）返回 `isError:true`，文本为 Vendor gate 要求 `vendorConfirmed` 的整段说明；`resources/list` 返回 -32601（v2 capabilities 仅声明 tools）。
- **断言**：跨客户端互通用例要求 `tools/call` 对通用 MCP 客户端返回非错误结果、`resources/list` 互通。
- **根因**：`src/vendor-gate.ts:38-52` 将只读的 `huaweicloud_service_catalog`、`huaweicloud_list_regions`、`huaweicloud_check_cli` 等一并列入 `VENDOR_GATED_TOOLS`，调用必须携带用户原话 `vendorConfirmed`；`src/mcp-protocol.ts` 的 server capabilities 只声明 `tools.listChanged`，移除了 v1 的 resources 能力。第三方客户端（Inspector/自研）不知道需要 quote，表现为「工具全坏」。
- **影响**：v2 对外 MCP 契约与 v1 不兼容：任何未集成 vendor 语义的客户端无法调用被 gate 的 14 个工具；resources 消费方直接 -32601。
- **证据**：`evidence/D9-6/stdout.log`（7 断言 5 通过 2 失败，原始 JSON 见 detail）

## #5【P1】D8-9 遥测 sanitizeValue 未脱敏

- **现象**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 原样返回，凭证未替换为 `<redacted>`。
- **断言**：AK/SK/token 等凭证样式值应脱敏。
- **根因**：`src/telemetry/telemetry-values.ts:27-34` 仅做 `[\r\n\t]` 折叠、trim 与 255 字符截断，无任何 secret 形态匹配。
- **影响**：遥测事件可将 AK/SK/token 明文上报/落盘。
- **证据**：`evidence/D8-9/stdout.log`（why: `sanitizeValue 未脱敏: AK=AK123 secret_key=SECRET token=abc123`）

## #6【P2】EXP-E01 中文「云主机」意图路由 MISS

- **现象**：意图「帮我查一下我账号在华北北京四有哪些云主机」的 `recommendedServices` 返回 `["Run hcloud --help to list available services."]`，期望命中 `ECS`；同批 EXP-E02（创建 ECS）等命中。
- **断言**：查询类 ECS 意图应路由到 `ECS`。
- **根因**：`src/capability-catalog.ts:400-408` 的服务匹配只按英文服务名/别名打分，中文「云主机」未进入 ECS 关键词表，`recommendedServices` 为空即回落 help 文案。
- **影响**：中文自然语言查询类意图路由质量下降，Agent 需二次探测才能选 ECS。
- **证据**：`evidence/EXP-E01/stdout.log`（detail 含完整 rec 记录）

## #7【P2】D1-68 region 环境变量优先级契约漂移（SPEC-MISMATCH）

- **现象**：同时设置 `HW_REGION` 与 `HUAWEICLOUD_REGION` 时，实现取 `HW_REGION`；用例期望 `HUAWEICLOUD_REGION` 优先。
- **根因**：`src/auth/credential-resolver.ts:32` `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`。
- **裁决建议**：若 v2 有意以短变量 `HW_REGION` 优先（与 hcloud 生态一致），应修正用例期望并在迁移说明中声明；否则调整实现优先级。

## #8【P2】D2-10 KooCLI 缺失错误消息拼接前缀

- **现象**：缺失 config 时返回 `KooCLI(hcloud)未安装或未就绪。(KooCLI config not found)`，用例精确断言 `KooCLI config not found` 失配。
- **根因**：`src/auth/error-table.ts:84` 的 `messageZh` 与 `src/auth/reconcile.ts:122` 传入的 detail 被拼接输出；`errorFromTable` 生成的消息格式在 v2 变更。
- **影响**：依赖错误文案做分支判断的下游（含测试夹具）失配；分类属消息契约漂移，非功能失败。

## #9【P2】D4-12 v2 安装器不再执行 npm install（SPEC-MISMATCH）

- **现象**：`npm install --omit=dev --no-audit --no-fund` 三个安装参数断言在 v2 安装路径上不再出现（v2 改为 npx 拉取 + 包自带 postinstall）。
- **根因**：`package.json`/`bin` 安装器逻辑在 v2 重构（`plugin.json`/`mcp.json` 自带安装流程），原用例的「npm install 参数」基线失效。
- **裁决建议**：改用例为「安装后 `hdk doctor`/`hdk status` 可用且 dist 完整」，或在 v2 安装脚本中保留等价参数透传。

---

## 附：本轮 BLOCKED / NOT_RUN（非缺陷，详见测试报告第五节）

- `D3-C3`、`D3-C6`、`D3-C13`、`D3-S3`：v2 审批门（`USER_CONFIRMATION_REQUIRED`）在无交互终端下无法完成沙箱/OBS 写链路；`approve` 拒绝非 TTY。
- `D3-C14`、`D9-9`：v2 移除 `sandbox/hwlink-api`、`mcp-protocol.dispatch` 导出，旧夹具无对应构造入口（测试基线需重写）。
- `D3-C7`：账号 project 仅 cn-north-4，跨区域 ap-southeast-3 不可用（环境）。
- `D1-39`：Windows 专属用例，Linux 不适用。

---

> 本单已统一提报：https://github.com/huaweicloud/huaweicloud-devkit/issues/1158
