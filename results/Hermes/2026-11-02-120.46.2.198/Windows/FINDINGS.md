# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-11-02-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-11-02 05:30:00（北京时间）
> **被测版本**：huaweicloud-devkit @1.1.13-next.0（v2，npm global）
> **本清单是统一提单脚本 `scripts/file_issue.py` 的解析输入。**

---

## #1【P1】D3-C2/D3-C13 OBS 静态网站托管配置 AWS4 签名错误（STS 凭证下 HTTP 400）

- **现象**：`huaweicloud_obs_set_website_config`（set/get）在 OBS 桶上返回 HTTP 400 `Request has x-amz-security-token header but signed headers not [included]`；建桶/删桶本身成功。
- **断言**：带 securityToken 的凭证下，`obs_set_website_config` 应返回 `{ok:true,status:200}`，静态站配置可落地。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:3040-3041`（`signedHeaders = 'host;x-amz-content-sha256;x-amz-date'` 未含 `x-amz-security-token`）与 `tools.mjs:3078`（`if (creds.securityToken) headers['x-amz-security-token'] = creds.securityToken;` 签名后才追加 header）——签名规范未涵盖实际发送的 header，OBS 拒绝。
- **影响**：OBS 静态站部署（D3-C2）与 OBS 静态网站托管配置（D3-C13）在 STS/临时凭证下不可用。
- **证据**：`evidence/D3-C2/stdout.log`、`evidence/D3-C13/stdout.log`
- **状态**：待提单

## #2【P2】D9-2 tools/list 对非法参数不返回 -32602（JSON-RPC 错误码缺项）

- **现象**：`tools/list` 传入 `params: "not-an-object"`（字符串）时，服务端未返回 `-32602 Invalid params`，而是正常返回完整工具列表（`TOOL_DEFINITIONS` 直接返回）。
- **断言**：`tools/list` 收到类型非法的 params 应返回 `error.code === -32602`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:61-63`（`tools/list` 分支 `return { tools: TOOL_DEFINITIONS }` 未校验 params 类型；相对地 `tools/call` 在 :65-98 已正确返回 -32602）。
- **影响**：JSON-RPC 2.0 错误码合规性缺口（未知 method 已修，但 invalid params 对 tools/list 仍缺失）。
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：待提单

## #3【P1】D10-3/EXP-E01 serviceCatalog 路由未命中「查云主机」类 ECS 意图

- **现象**：评测集 EXP-E01「帮我查一下我账号在华北北京四有哪些云主机」经 serviceCatalog 路由返回 `Run hcloud --help to list available services.`（MISS），期望 ECS。
- **断言**：该意图应路由到 ECS（命中 ECS 服务目录），ERROR 为 0 MISS。
- **根因**：`plugins/huaweicloud-core/src` 服务目录路由层（`serviceCatalog`/`huaweicloud_service_catalog`）对「查云主机/华北北京四」犬酸短语缺 ECS 意图映射；基线 HIT=13 MISS=1（准确率 92.9%）。
- **影响**：服务目录路由准确率达标（≥90%）但存在单点 MISS，影响该类查询意图的自动服务路由。
- **证据**：`evidence/EXP-E01/stdout.log`、`evidence/D10-3/stdout.log`（run-eval 基线）
- **状态**：待提单

## #4【P2】D4-23 全局规则 huawei-agent-rules.mdc 孤儿文件未注入安装目标（SPEC-MISMATCH）

- **现象**：`rules/huawei-agent-rules.mdc` 存在，但 `bin/setup.cjs` 无任何 `agent-rules` 引用（grep=0），11 个安装目标均未收到该全局规则。
- **断言**：全局安全规则应被 `bin/setup.cjs` 引用并注入至少一个安装目标；存在则 `refs>0`。
- **根因**：`bin/setup.cjs`（无 `agent-rules` 引用），`rules/huawei-agent-rules.mdc`（存在但孤儿）。
- **影响**：全局规则 huawei-agent-rules 未生效，安全规则注入链断裂（SPEC 契约漂移）。
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：待提单

## #5【P2】D9-9 initialize capabilities 未声明 notifications.cancellation（SPEC-MISMATCH）

- **现象**：`initialize` 返回的 `capabilities` 缺 `notifications` 对象（`notifications.cancellation` 未声明）。
- **断言**：`initialize.result.capabilities.notifications.cancellation === true`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:50-53`（initialize 的 `capabilities: { tools: {} }` 未声明 `notifications.cancellation`）。
- **影响**：tools/call 超时取消协议语义无法被客户端发现（MCP 契约漂移）。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：待提单

## #6【非产品缺陷】D4-13 只读子账号 test001 具备写权限（最小权限未强制）

- **现象**：`python scripts/run-as-readonly.py hcloud VPC CreateVpc` 用只读子账号 test001 成功创建 VPC（`id=f6c0b77e...`，后已删除归零）；语义为「只读」的凭证可执行写操作。
- **说明**：非产品代码缺陷——只读 IAM 子账号 test001 的云侧 IAM 策略过宽（授予了 VPC 写权限），或凭证归属标定错误。不计入提单，转环境侧修正（收窄 test001 只读策略后复测 D4-13）。
- **证据**：`evidence/D4-13/stdout.log`
- **状态**：【环境侧】需收窄 test001 只读策略