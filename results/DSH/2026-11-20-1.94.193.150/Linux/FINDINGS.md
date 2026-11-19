# FINDINGS — 缺陷发现清单（DSH-deepseek-v4.1-flash-1017）

> **落盘路径**：`results/DSH/2026-11-20-1.94.193.150/Linux/FINDINGS.md`
> **生成时间**：2026-11-20 05:25（北京时间）
> **被测版本**：`huaweicloud-devkit v2.0.0-next.4`（npm `@next`，gitHead `16a24814`，tag `v2.0.0-next.4`）
> **本轮结论**：10 项缺陷（4 P0 / 3 P1 / 3 P2，其中 2 项 SPEC-MISMATCH 待裁决）。146 例全部本轮实跑（未沿用旧证据），PASS 129 / FAIL 7 / BLOCKED 7 / SPEC 2 / NOT_RUN 1。
> **隔离执行说明**：本机全局 npm 包在 05:02 被并行客户端（CodeArtsAgent `prepare_env.py --update`）覆盖为 v1.1.13，因此本轮在 `~/devkit-test/DSH/sut` 私有前缀重装 `2.0.0-next.4` 作为 SUT，并补齐其**未声明**的运行时依赖（见 #1）；全部探针 import 该私有前缀 `plugins/huaweicloud-core/dist`，hdk 源码仓（`16a24814`）仅用于根因定位。

> **缺陷单**：合并单 #1158 复核评论 https://github.com/huaweicloud/huaweicloud-devkit/issues/1158#issuecomment-7022796533（历史 9 项复现 + 新增 P0 依赖漏声明，未重复开单）

## 汇总

| # | 级别 | 用例ID | 标题 | 状态 |
|---|---|---|---|---|
| 1 | P0 | `D4-12` | npm 包 `dependencies` 漏声明 zod / @modelcontextprotocol/sdk / ajv / ajv-formats，全新安装后 MCP 入口与 tool-schemas 无法加载 | 待提单 |
| 2 | P0 | `D4-16` | `sh -c` 包裹的凭证 env dump 绕过命令风险引擎 | 待提单 |
| 3 | P0 | `D4-21` | HCL/Terraform `actions=["*"]` 宽授权仅 warn 不 deny | 待提单 |
| 4 | P0 | `D9-12` | 未 initialize 直接 tools/list 未被拒绝（返回 58 工具） | 待提单 |
| 5 | P1 | `D9-6` | vendor gate 破坏第三方 MCP 客户端 tools/call 互通 | 待提单（历史复核） |
| 6 | P1 | `EXP-E01` | 中文「云主机」意图路由 MISS，回落 help 文案 | 待提单（历史复核） |
| 7 | P1 | `D2-10` | KooCLI config 缺失错误消息拼接中文前缀，精确断言失配 | 待提单 |
| 8 | P2 | `D8-9` | 遥测 sanitizeValue 在 v2 不再脱敏凭证（v1 回归） | 待提单 |
| 9 | P2 | `D1-68` | region 环境变量优先级与用例契约相反（HW_REGION 优先） | 待裁决 SPEC |
| 10 | P2 | `D4-12` | v2 安装器不再执行 npm install，`--omit=dev/--no-audit/--no-fund` 基线失效 | 待裁决 SPEC |

## #1【P0】D4-12 发布包漏声明运行时依赖（全新安装即不可用）

- **现象**：`npm install huaweicloud-devkit@2.0.0-next.4` 后 `node_modules` 只有 `huaweicloud-devkit` + `undici`；导入 `plugins/huaweicloud-core/dist/tool-schemas.js` 报 `ERR_MODULE_NOT_FOUND: Cannot find package 'zod'`；导入 `dist/mcp-protocol.js` 报 `Cannot find package '@modelcontextprotocol/sdk'`；`dist/validation/*` 还 import `ajv`、`ajv-formats`。
- **断言**：发布包应自带全部运行时依赖，`npm i` 后 MCP server 与工具 schema 可直接加载。
- **根因**：`package.json:61-63` 的 `dependencies` 仅 `{"undici":"^8.12.3"}`；而 dist 产物 `plugins/huaweicloud-core/dist/tool-schemas.js:1`、`dist/mcp-protocol.js:1`、`dist/validation/*.js` 硬依赖 `zod`、`@modelcontextprotocol/sdk`、`ajv`、`ajv-formats`——它们只出现在仓库 devDependencies（`package.json:66-84`），发布时未随 dependencies 下发。打包配置（esbuild 未 bundle 或依赖未列入 dependencies）需修复。
- **影响**：任何按官方说明 `npm i -g huaweicloud-devkit@next` 的用户，MCP server 启动即崩、工具 schema 无法 import；属发布阻断级 P0。
- **证据**：`evidence/D4-12/fresh-install-missing-deps.log`（05:19 全新前缀 `~/devkit-test/DSH/fresh` 复现，含 package.json deps、两次 ERR_MODULE_NOT_FOUND）。
- **本轮影响面**：为继续测其余用例，私有前缀补装 `ajv@8 ajv-formats@3 @modelcontextprotocol/sdk@1.32.1 zod@4.6.7`；因此本轮 D9/D2/D3 的 MCP/HCL 断言是在「补齐依赖后」的产物上执行，缺陷本身已单列本条。

## #2【P0】D4-16 sh -c 命令包裹穿透

- **现象**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `{"decision":"allow","findings":[]}`。
- **断言**：应 `deny`（credential 类）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:26-45` 的 `hwc-command-env-dump` 命令边界正则要求 `env` 前为 `(^|\s)`，`sh -c "env | …"` 中 `env` 前是双引号 → 不匹配；同一判定在 `src/safety/classify-text.ts:997-1007` 可命中，但 `evaluateCommandRisk` 走规则引擎，两条链路结论不一致。
- **影响**：攻击者可用 shell 包裹绕过命令风险引擎读取凭证 env。
- **证据**：`evidence/D4-16/stdout.log`

## #3【P0】D4-21 HCL broad IAM 未拦截

- **现象**：JSON `Action:"*"`+`Effect:"Allow"` 判 `deny`；HCL `resource "huaweicloud_iam_policy" "p" { actions = ["*"] }` 判 `warn`。
- **断言**：两种形态均 `deny`。
- **根因**：`safety/rules/cloud-risk-rules.json:270-313` 的 broad-admin deny 规则要求同时出现 `Effect … Allow`；HCL 片段只有 `actions=["*"]` 无 `Effect` 字段，仅命中 `:314-335` 的 `hwc-iam-wildcard-action`（`severity:"warn"`）；HCL/Terraform 形态缺独立 deny 分支。
- **影响**：IaC 宽权限策略以 warn 放行，Terraform 代码 fail-closed 缺失。
- **证据**：`evidence/D4-21/stdout.log`（why: `HCL IAM 未拦截: json=deny hcl=warn`）

## #4【P0】D9-12 未 initialize 直接 tools/list 未被拒绝

- **现象**：stdio 客户端不发 `initialize`、直接 `tools/list`，服务端返回 58 个工具，无 -32600/协议时序错误。
- **断言**：未握手请求应返回协议错误（-32600 或等价）。
- **根因**：`plugins/huaweicloud-core/src/mcp-stdio-transport.ts:194-216` 的 `handleMessage` 仅对 `initialize` 做副作用，没有「会话是否已 initialize」的状态判断，任何带 id 的请求都原样转给 MCP SDK；`src/mcp-protocol.ts` 也未维护 pre-initialize 守卫（SDK 不替业务层拒绝 `tools/list`）。
- **影响**：MCP 协议状态机合规缺口，未握手客户端可枚举全量工具并继续调用。
- **证据**：`evidence/D9-12/stdout.log`（why: `握手=true 非法时序拒绝=undefined (未init先list 返回 58 工具)`）

## #5【P1】D9-6 vendor gate 破坏第三方 MCP 客户端互通

- **现象**：双 stdio 客户端冒烟：`initialize`/`tools/list`（58 工具，A/B 一致）通过；客户端 A `tools/call` 返回 `isError:true`（vendor gate 要求 `vendorConfirmed`）；`resources/list` 空（v2 仅声明 tools 能力）。
- **断言**：第三方 MCP 客户端 tools/call、resources/list 应可互通。
- **根因**：`src/mcp-protocol.ts:118-121,151,181` 的 `VENDOR_BOUNDARY_RULE` 要求云端面的工具必须携带 `vendorConfirmed`（`src/tool-schemas.ts:8`），第三方客户端无法提供 vendor 上下文 → 一律 isError；v2 capabilities 不再声明 resources。
- **影响**：非 DSH 生态的 MCP 客户端（Claude Desktop/Inspector 等）调用云端工具一律失败。
- **证据**：`evidence/D9-6/stdout.log`

## #6【P1】EXP-E01 中文「云主机」意图路由 MISS

- **现象**：`serviceCatalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 期望命中 ECS 查询，实际回落 `Run hcloud --help to list available services.`
- **断言**：中文意图命中 ECS。
- **根因**：`src/capability-catalog.ts` 的服务关键词/路由表未收录中文「云主机」（全仓 grep 无该词），回落分支在 `src/capability-catalog.ts:407` 输出 help 文案；评测基线 harness 21.4% MISS。
- **影响**：中文自然语言入口首选能力推荐失效。
- **证据**：`evidence/EXP-E01/stdout.log`（detail: got=[`Run hcloud --help ...`] expect=[ECS]）

## #7【P1】D2-10 KooCLI config 缺失错误消息拼接中文前缀

- **现象**：fixture 断言 `error message === "KooCLI config not found"`，实际 `"KooCLI(hcloud)未安装或未就绪。(KooCLI config not found)"` → fixture exit=1。
- **断言**：错误消息应精确等于 `KooCLI config not found`。
- **根因**：`plugins/huaweicloud-core/src/auth/error-table.ts:84` 的 `messageZh: 'KooCLI(hcloud)未安装或未就绪。'` 由 `src/auth/reconcile.ts:122` 以 `errorFromTable('HDKIT_KOOCLI_NOT_READY', 'KooCLI config not found')` 拼接为「前缀 + 括号细节」，与用例精确断言冲突；若产品保留中文前缀，需用例侧放宽（待裁决方向见报告第八节）。
- **影响**：调用方按精确文本判断错误类型的逻辑失效。
- **证据**：`evidence/D2-10/stdout.log`

## #8【P2】D8-9 遥测 sanitizeValue 在 v2 不再脱敏凭证（v1 回归）

- **现象**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 原样返回，未遮蔽任何凭证值。
- **断言**：`AK123`/`SECRET`/`abc123` 不应出现在返回值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry-values.ts:27-34` 的 `sanitizeValue` 只做换行/空白归一化与 255 字符截断，没有 v1 的 `AK=***`/secret/token 遮蔽逻辑（v2 重构丢失）。
- **影响**：遥测事件 value 可能携带明文凭证上报。
- **证据**：`evidence/D8-9/stdout.log`（why: `sanitizeValue 未脱敏: AK=AK123 secret_key=SECRET token=abc123`）

## #9【P2】D1-68 region 环境变量优先级契约漂移（SPEC-MISMATCH）

- **现象**：实现优先 `HW_REGION`，用例期望优先 `HUAWEICLOUD_REGION`。
- **根因**：`plugins/huaweicloud-core/src/auth/credential-resolver.ts:32`（`process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`），`src/auth/init-cli.ts:44`、`src/auth/codearts-context.ts:53,106` 同序。
- **影响**：同时设置两变量时实际 region 与用例文档相反；需产品/用例二选一裁决。
- **证据**：`evidence/D1-68/stdout.log`（idxHR=1211, idxHW=1186）

## #10【P2】D4-12 v2 安装器不再 npm install（SPEC-MISMATCH）

- **现象**：`--omit=dev` / `--no-audit` / `--no-fund` 三条断言全部 false：v2 安装器改为 `npx` 拉取 + 自带 `postinstall`（`node ./bin/dsh-postinstall.cjs`），不再执行 `npm install`。
- **根因**：`bin/setup.cjs` / `bin/dsh-postinstall.cjs` 安装链重构，用例基线断言失效；供应链其余断言（postinstall 指向自有 bin、无 preinstall、依赖可枚举且版本固定、无已知高危包）通过。
- **影响**：用例需按 v2 安装模型更新断言（非产品缺陷）。
- **证据**：`evidence/D4-12/stdout.log`

## 附：BLOCKED / NOT_RUN 与补测记录（非缺陷，详见测试报告第五节）

| 用例 | 状态 | 阻塞点 | 补测（本轮实际执行） |
|---|---|---|---|
| D3-C3 / D3-C6 / D3-S3 / D3-C13 | BLOCKED | v2 审批门 `USER_CONFIRMATION_REQUIRED`：门禁要求用户在交互终端执行 `npx huaweicloud-devkit approve <token>`；本会话无 TTY | ①`evidence/<id>/retest.log`：带 `approvedByUser:true` 重试 → 仍返回 `USER_CONFIRMATION_REQUIRED` + approvalToken；②执行 `bin/setup.cjs approve <token>`（D3-C6 token `ee7665a6-…`）→ 输出「Approvals must be confirmed in your own interactive terminal.」拒绝。四件套记录齐全，非假阻塞（沙箱维护类阻塞本轮未出现） |
| D3-C7 | BLOCKED | 账号 project 仅 cn-north-4，`ap-southeast-3` 无项目：ECS `Common.0013`、EIP `VPC.0501` | 已实测通过项：`list_regions` 含 ap-southeast-3、`plan_cli_command` 含 `--cli-region` |
| D3-C14 | BLOCKED | v2 移除 sandbox/hwlink-api 模块（改 devbridge），夹具断言无实现可测 | 源码核对 `src/` 无 hwlink-api 模块，属用例待迁移 |
| D9-9 | BLOCKED | v2 移除 `mcp-protocol` dispatch 导出，夹具自定义延迟 server 无法构造 | 源码核对 `mcp-protocol.ts` 仅导出 `createDevkitMcpServer` 等，无 dispatch |
| D1-39 | NOT_RUN | Windows 专属（升级检测链），本机 Linux | OS 专属豁免，覆盖率门禁允许 |
