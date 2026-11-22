# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-11-23 05:19:00`（北京时间）
> **执行归档**：`results/OpenCode/2026-11-23-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 5 个 P0 缺陷：D2-4 / D4-3 / D4-16 / D4-21 / D9-12）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.20.0 / npm 10.9.3 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.15`（npm latest，gitHead `bf79b643`，PR #1166 release-1.1.15） |
| 工具全集 | `49`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud CLI 已配置（`~/.config/huaweicloud/credentials.json`） |
| 真云凭证 | `cn-north-4`（AK/SK 管理员 + 只读子账号 test001） |
| 测试类型 | 源码级探针直调 / MCP 协议 / 真机 CLI / 真云 E2E（建删资源归零） |
| daily 用例 | 设计级 107 / 展开级 39（展开级已按 OpenCode+Linux 预筛）/ mission-001(9) |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；真云 E2E 经 `hcloud` 真机建删；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39；mission-001 9 条与设计级重叠） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 9 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `92.96%`（132/142） |
| P0 / P1 / P2 新增缺陷 | `5 / 3 / 2` |
| 红线（I 类）违规 | `5`（P0 安全拦截漏网：D2-4/D4-3/D4-16/D4-21/D9-12） |
| 资源释放 | `全部归零`（VPC/子网/安全组/OBS/EIP 实测创建→删除→归零验证通过） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 真·外部依赖阻塞（billing/多region/沙箱隧道凭证），见 §五 |
| SPEC-MISMATCH | `1` | D1-68 region 优先级契约漂移 |
| NOT_RUN | `1` | D1-39 Windows 专属用例在 Linux 不适用（唯一 P0 例外） |
| **合计** | **`107`** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 云主机路由 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏漏小写 ak=/sk= | 小写 `ak=`/`sk=` 也应脱敏 | 小写形态明文残留 | `safety-policy.mjs:45` | P | 待提单 |
| 2 | P0 | `D4-3` | kms DecryptData 明文解密未拦截 | 应返回 `deny` | `decision:allow` | `cloud-risk-rules.json:56` | P | 待提单 |
| 3 | P0 | `D4-16` | sh -c 包裹内层 env 凭证泄露未拦截 | 应返回 `deny` | `decision:allow` | `risk-rule-engine.mjs:143` | P | 待提单 |
| 4 | P0 | `D4-21` | HCL/Terraform broad IAM 制品仅 allow | JSON/HCL 均 `deny` | HCL 形态 `allow` | `cloud-risk-rules.json:213` | P | 待提单 |
| 5 | P0 | `D9-12` | initialize 握手未 enforce 时序 | 未 init 先 list 应 `-32600` | 返回 40 工具列表 | `mcp-protocol.mjs:70` | P | 待提单 |
| 6 | P1 | `D3-S7` | 复合部署意图仅命中 RDS | 应同命中部署目标 | 仅 `["RDS"]` | `tools.mjs:2757` | P | 待提单 |
| 7 | P1 | `D4-17` | 命令替换 $(...) 模糊输入 fail-open | 不应 `allow` | `decision:allow` | `risk-rule-engine.mjs:106` | P | 待提单 |
| 8 | P1 | `EXP-E01` | 「云主机」词路由 MISS | ECS 查询意图应命中 ECS | 兜底 help 文本 | `tools.mjs:2578` | P | 待提单 |
| 9 | P2 | `D8-9` | 遥测 sanitizeValue 不脱敏 | AK/SK/token 应脱敏 | 明文原样返回 | `telemetry.mjs:190` | P | 待提单 |
| 10 | P2 | `D1-68` | region env 优先级契约漂移 | HUAWEICLOUD_REGION 优先 | HW_REGION 优先 | `credentials.mjs:225` | P | SPEC-MISMATCH 待裁决 |

### 根因详情

- **#1 [P0] D2-4**：`redactString()` 的 AK/SK 正则 `/(AK|SK)\s*[:=].../g` 无 `/i`，小写 `ak=`/`sk=` 漏脱敏。证据 `evidence/D2-4/stdout.log`。
- **#2 [P0] D4-3**：`hwc-command-secret-value-read` 规则正则仅含 `ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue`，未覆盖 KMS `DecryptData`。证据 `evidence/D4-3/stdout.log`。
- **#3 [P0] D4-16**：`evaluateCommandRisk()` 直接送原始命令文本，未做 `sh -c` 解包；env-dump 正则要求 `env` 前为行首/空白，双引号包裹形态不命中。证据 `evidence/D4-16/stdout.log`。
- **#4 [P0] D4-21**：`hwc-iam-admin-policy` deny 第三条件要求显式 `Effect: Allow`，HCL 隐式 Allow 三条件不全命中。证据 `evidence/D4-21/stdout.log`。
- **#5 [P0] D9-12**：`dispatch()` 的 `tools/list` 分支无条件返回工具清单，无 pre-initialize 状态守卫。证据 `evidence/D9-12/stdout.log`。
- **#6 [P1] D3-S7**：Sandbox 路由 keywords 缺「部署/Web 应用」token；`deploymentIntent` 仅对已命中 sandbox 做 reorder。证据 `evidence/D3-S7/stdout.log`。
- **#7 [P1] D4-17**：`evaluate()` 无规则命中默认 `allow`（fail-open），`$(...)` 未 fail-closed 兜底。证据 `evidence/D4-17/stdout.log`。
- **#8 [P1] EXP-E01**：ECS routeMap `keywords` 缺「云主机」高频口语词。证据 `evidence/EXP-E01/stdout.log`。
- **#9 [P2] D8-9**：`sanitizeValue()` 仅去换行/截断，未调用 `redactSecrets`。证据 `evidence/D8-9/stdout.log`。
- **#10 [P2] D1-68（SPEC-MISMATCH）**：region 默认 `HW_REGION || HUAWEICLOUD_REGION`，与契约（HUAWEICLOUD_REGION 优先）相反。证据 `evidence/D1-68/stdout.log`。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标注专属），本机为 Linux，不适用；Linux 侧由展开级覆盖 | — |
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | 真机实测：VPC/子网/安全组 创建→删除→归零 全部成功，ECS 到达订单提交层被 billing 拒绝 `Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射）。2026-11-23 05:04 实测 | — |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读 `Common.0013`、EIP 创建 `VPC.0501`。已实测通过：list_regions 含 ap-southeast-3、plan 含 --cli-region | — |
| `D3-S3` | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 DevBridge 隧道凭证过期（devbridge create 返回 "API key expired"）；connect/upload/deploy_nginx 均实测通过（nginx_serving=HTTP 200），仅 tunnel 暴露 URL 步骤受阻 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无明文 AK/SK 残留，探针输出均走 `redactSecrets`/脱敏）
- [x] 写操作误判 read-only：`0`（D4-5 实测写操作判 `allow` 未误判为只读）
- [x] 红线（I 类）违规：本轮发现 `5 处`（D2-4/D4-3/D4-16/D4-21/D9-12 均为安全拦截漏网，已入缺陷清单）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-C1） | 是 | 已删 | 归零（ListVpcs 无本次创建） |
| 子网（D3-C1） | 是 | 已删 | 归零 |
| 安全组（D3-C1） | 是 | 已删 | 归零 |
| OBS 桶（D3-C2/D3-C13/D4 系列） | 是 | 已删 | 归零（OBS ls 无本次创建桶，curl 200→删除后 404） |
| EIP（D3-C7 只读 + 创建失败已释放） | 尝试 | 未残留 | `total_count=0` |
| 沙箱（D3-C3/C6/S3） | 复用/已 close | 未新建实例 | 复用现有实例，无新增残留 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留 0 项。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region env 优先级契约漂移，需维护者裁决契约权威定义）。
- 阻塞待补测：`D3-C1`（账号开通 ECS 按需产品/billing）、`D3-C7`（开通 ap-southeast-3 项目）、`D3-S3`（沙箱刷新 devbridge API key）后复测。
- 建议：P0 安全拦截漏网达 5 处，建议优先修复 `safety-policy.mjs` 脱敏（/i）、`risk-rule-engine.mjs` 包裹解包+fail-closed、`cloud-risk-rules.json` 补 DecryptData/HCL IAM、`mcp-protocol.mjs` 握手时序守卫。