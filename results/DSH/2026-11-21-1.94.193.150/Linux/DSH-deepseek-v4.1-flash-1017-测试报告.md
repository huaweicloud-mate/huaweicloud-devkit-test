# DSH-deepseek-v4.1-flash-1017 每日测试报告

> **报告名**：`DSH-deepseek-v4.1-flash-1017-测试报告.md`
> **生成时间**：2026-11-21 05:50（北京时间）
> **执行归档**：`results/DSH/2026-11-21-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4.1-flash-1017` |
| OS / 架构 | `Linux`（aarch64，Ubuntu，kernel 6.8.0-106-generic） |
| 被测版本（SUT） | `huaweicloud-devkit v1.1.15（npm latest，gitHead bf79b643，tag v1.1.15）` |
| daily 基础用例 | 设计级 107 / 展开级 39（共 146） |
| 执行日期 / 机器 | 2026-11-21 / `1.94.193.150` |

> **执行方法**
>
> 1. **装包**：`npm dist-tags` 确认 latest=`1.1.15`、next=`1.1.15-next.2`，`pick_sut_version.py` 判定正式版 `1.1.15`；在私有前缀（`sut/`）安装 `huaweicloud-devkit@1.1.15`，与全局包隔离，避免并行客户端覆盖。
> 2. **源码对照**：源码仓 `hdk` checkout tag `v1.1.15`（commit `bf79b643`）用于根因定位（文件:行号），未在源码仓跑单测。
> 3. **探针**：v1 归档探针 `_probe`（core.mjs / main.mjs / checks1-4.mjs）逐条直调 SUT 的 `plugins/huaweicloud-core/src/*.mjs`：安全引擎 `evaluateCommandRisk`/`evaluateArtifacts`、脱敏 `redactSecrets`、路由 `serviceCatalog`、MCP `handleMessage`/`tools/list`、认证与 KooCLI profile 解析等，每条用例独立 `evidence/<case-id>/`（`probe.mjs` + `stdout.log`）。
> 4. **MCP 真机**：stdio 客户端双实例握手 / `tools/list` / `tools/call` 冒烟（D9 维度）。
> 5. **真云 E2E**：`hcloud` KooCLI + 本机管理员凭证，真机创建→校验→删除→归零（ECS 生命周期、OBS 静态站/桶策略、VPC/子网/安全组），只删本轮创建资源。
> 6. **沙箱**：真实 hdkitservice `check_user → connect → upload → deploy_nginx → deploy_check → expose_tunnel` 全链路。
> 7. **增量提报**：`init_day` 建包后即拉起 `hourly_sync.py --interval 600`，全量执行期间 4 次增量提交/推送，最终统一 rebase + push。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 11 / 2 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 142） | `92.3%` |
| P0 / P1 / P2 缺陷 | `5 / 4 / 3`（12 项，含 1 项 SPEC-MISMATCH） |
| 红线（I 类）违规 | `4 项缺陷触发`（D4-3 写操作误判只读；D4-16 / D4-21 / D9-12 拦截失效），均已在本地测试账号复现并如实记录，**本轮未执行真实越权/攻击操作，未发生凭证泄漏事故** |
| 资源释放 | `全部归零`（ECS/VPC/子网/SG/OBS 均为 0，见第七节） |
| 缺陷单 | 历史合并单 [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) 复核评论（https://github.com/huaweicloud/huaweicloud-devkit/issues/1055#issuecomment-7051329430），12 项全部命中历史，不重复开单 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 93 | 有实测 + 证据落盘 + evidencePath 回填 |
| FAIL | 10 | D2-4 / D4-3 / D4-16 / D4-21 / D9-12（P0）；D4-17 / D3-S7 / D2-10（P1）；D8-9 / D3-C14（P2） |
| BLOCKED | 2 | D3-S3（沙箱 DevBridge 凭证缺失）、D3-C7（账号跨区项目范围限制），均已写 blockedReason 并真机尝试 |
| SPEC-MISMATCH | 1 | D1-68（region 环境变量优先级契约漂移，待裁决） |
| NOT_RUN | 1 | D1-39（Windows 专属，Linux 豁免） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有实测 + 证据落盘 |
| FAIL | 1 | EXP-E01（中文「云主机」路由 MISS） |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2 认证 | 凭证脱敏漏小写 `ak=`/`sk=`，明文残留 | `src/safety-policy.mjs:45` 正则 `(AK|SK)` 区分大小写 | 待修 |
| 2 | P0 | `D4-3` | D4 安全 | `kms DecryptData` 未被风险引擎拦截（allow） | `safety/policy.json:27-60` 写操作前缀表无 `Decrypt` | 待修 |
| 3 | P0 | `D4-16` | D4 安全 | `sh -c` 包裹的凭证 env dump 绕过命令风险引擎 | `safety/rules/cloud-risk-rules.json:26` 命令边界正则 | 待修 |
| 4 | P0 | `D4-21` | D4 安全 | HCL/Terraform `actions=["*"]` 宽授权判 allow | `safety/rules/cloud-risk-rules.json:196` 缺 HCL 分支 | 待修 |
| 5 | P0 | `D9-12` | D9 协议 | 未 initialize 直接 tools/list 未被拒绝（40 工具） | `src/mcp-protocol.mjs:70` 无会话状态守卫 | 待修 |
| 6 | P1 | `D4-17` | D4 安全 | 命令替换 `$(...)` fail-open（allow） | 规则表无 `$(` 模式；`src/risk-rule-engine.mjs` | 待修 |
| 7 | P1 | `D3-S7` | D3 沙箱/路由 | 中文复合意图「部署 Web 应用 + RDS」仅命中 RDS | `src/tools.mjs:2743-2771`、`:2816` | 待修 |
| 8 | P1 | `D2-10` | D2 认证 | KooCLI config 缺失错误消息拼接中文前缀 | `src/auth/guidance.mjs:71` | 待裁决（文案契约） |
| 9 | P1 | `EXP-E01` | D10 评测 | 中文「云主机」意图路由 MISS，回落 help | `src/tools.mjs:2578-2595` 关键字无「云主机」 | 待修 |
| 10 | P2 | `D8-9` | D8 遥测 | `sanitizeValue` 不脱敏凭证 | `src/telemetry/telemetry.mjs:190` | 待修 |
| 11 | P2 | `D3-C14` | D3 沙箱 | 无凭证抛中文文案，与英文契约断言不符 | `src/auth/guidance.mjs:55`、`service.mjs:134` | 待裁决（文案契约） |
| 12 | P2 | `D1-68` | D1 安装/配置 | region 环境变量优先级与契约相反（`HW_REGION` 优先） | `src/auth/credentials.mjs:225` | 待裁决 SPEC |

### 4.1 根因详情

1. **D2-4（P0）**：期望 `ak=AK123456 sk=SKsecret` → `<redacted>`；实际原文返回。根因：`redactString` 的兜底正则 `/（AK|SK)…/g` 无 `i` 标志，小写键名不命中；`redactSecrets`（`src/safety-policy.mjs:49`）无小写分支。证据 `evidence/D2-4/stdout.log`。
2. **D4-3（P0）**：期望 KMS 解密类动作 `deny`；实际 `{"decision":"allow","findings":[]}`。根因：`writeOperationPrefixes`（`safety/policy.json:27-60`）与 19 条风险规则均无 `Decrypt`/`DecryptData`，被当作只读操作。证据 `evidence/D4-3/stdout.log`。
3. **D4-16（P0）**：期望 `deny`；实际 `allow`。根因：`hwc-command-env-dump` 规则（`cloud-risk-rules.json:26`）要求 `env` 处于行首/空白边界，`sh -c "env | …"` 中 `env` 前是双引号；文本规则链路不做 shell 解包。证据 `evidence/D4-16/stdout.log`。
4. **D4-21（P0）**：期望 HCL 与 JSON 均 `deny`；实际 `json=deny hcl=allow`。根因：`hwc-iam-admin-policy`（`:196`）依赖 `Effect`+`Allow` 语义，HCL 片段只有 `actions=["*"]`，无宽授权 deny 分支。证据 `evidence/D4-21/stdout.log`。
5. **D9-12（P0）**：期望未握手 `tools/list` 返回 `-32600`；实际返回 40 个工具。根因：`src/mcp-protocol.mjs:70` 直接返回工具定义，无「已 initialize」状态判断。证据 `evidence/D9-12/stdout.log`。
6. **D4-17（P1）**：期望 `deny`/`warn`；实际 `allow`。根因：19 条规则无命令替换模式，引擎无动态执行语法识别。证据 `evidence/D4-17/stdout.log`。
7. **D3-S7（P1）**：期望 RDS + 部署目标；实际仅 `RDS`。根因：沙箱路由关键字无中文「部署」（`src/tools.mjs:2743-2771`），`deploymentIntent` 重排（`:2816`）以已命中为前提。证据 `evidence/D3-S7/stdout.log`。
8. **D2-10（P1）**：期望精确 `KooCLI config not found`；实际中文前缀拼接（6 项子断言中 5 项 PASS）。根因：`guidance.mjs:71` 的 `messageZh` 被错误表拼接。证据 `evidence/D2-10/{stdout,detail}.log`。
9. **EXP-E01（P1）**：期望 ECS；实际 `Run hcloud --help to list available services.`。根因：ECS 路由关键字无「云主机」（全仓 grep 无该词），回落 help。证据 `evidence/EXP-E01/stdout.log`。
10. **D8-9（P2）**：期望脱敏；实际 `AK=AK123 secret_key=SECRET token=abc123` 原样。根因：`sanitizeValue` 只做换行归一/截断，未调用脱敏。证据 `evidence/D8-9/stdout.log`。
11. **D3-C14（P2）**：期望英文 `credentials not configured`；实际中文引导文案（9/10 子断言 PASS）。根因：`guidance.mjs:55`/`service.mjs:134` 中文文案取代英文契约。证据 `evidence/D3-C14/stdout.log`。
12. **D1-68（P2，SPEC-MISMATCH）**：期望 `HUAWEICLOUD_REGION` 优先；实际 `HW_REGION` 优先。根因：`credentials.mjs:225`（另 `:173`、`:339`）取值顺序旧变量在前。证据 `evidence/D1-68/stdout.log`。

> 完整「现象/断言/根因/影响/证据」见同目录 `FINDINGS.md`；历史查重关联见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1 安装 | Windows 专属安装路径/注册表用例 | OS 专属用例，Linux 环境不适用（规则豁免） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-S3` | D3 沙箱 | 沙箱部署 + 公网预览 URL | 前置链路全部通过（route/check_user/connect/upload/nginx 8085 HTTP 200/deploy_check），`expose_tunnel` 失败：`DevBridge authentication failed: no usable credential in the sandbox.`（`authMode=NO_CREDENTIAL`），沙箱内无 DevBridge 凭证，无法签发公网 URL。解除条件：宿主向沙箱注入 DevBridge keyring/`/tmp/hw_api_key` 后复测。 |
| `D3-C7` | D3 沙箱 | 跨区域 project scope 校验 | 账号项目范围仅 `cn-north-4`：`ap-southeast-3` 的 ECS 只读返回 `Common.0013`（region 与 tk 项目不符）、EIP 创建返回 `VPC.0501`，无法建删跨区资源。已实测 `list_regions` 含该区、plan 链路正常。解除条件：账号开通目标 region 项目后复测。 |

---

## 六、安全与红线合规

| 检查项 | 结论 |
|---|---|
| 凭证泄漏事件 | **无实际泄漏事故**。潜在通道 2 项：D2-4（日志/回显小写 `ak=/sk=` 未脱敏）、D8-9（遥测值未脱敏），已列缺陷。stderr/stdout 均未出现真实 AK/SK 明文（测试夹具使用 `AKDEPLOY`/`SKDEPLOY` 等假值）。 |
| 写操作误判 read-only | **1 项**：D4-3（`kms DecryptData` 未列入写操作前缀表 → 判 allow，绕过确认流）。 |
| 红线（I 类）违规 | **3 项拦截失效**：D4-16（shell 包裹 env dump）、D4-21（HCL 宽授权）、D9-12（未握手枚举工具），均为安全引擎/MCP 协议缺口；本轮仅在本地测试账号做判定级复现，未执行真实攻击或越权调用。建议修复前对上述形态默认 `deny`。 |
| 脱敏复核 | 大写 `AK=`/`SK=`、`secret_key`/`password`/`token` 键值可正常脱敏（D4-26、D4-27 PASS）；小写 `ak=`/`sk=` 漏脱敏（D2-4 FAIL）；遥测通道不脱敏（D8-9 FAIL）。 |
| 最小权限 | 只读子账号（test001）通过 `run-as-readonly.py` 临时注入执行，D4-13 最小权限通过率实测 PASS；未替换主凭证、未落盘。 |
| 审批流 | D4-24 审批令牌一次性消费 PASS（首次返回 entry、二次 null）；D4-18 确认语义 PASS；未发现绕过审批的真实写操作。 |
| 资源合规 | 真云资源仅创建于 `cn-north-4`，命名统一 `testbot2-dsh-*`，测后全部删除并归零；未触碰非本轮创建的资源。 |

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（kc1.small.1，ARM 1c1g） | 1（D3-C1） | 1 | ✅ `ListServersDetails` 无 `testbot2-dsh` 实例 |
| VPC | 2（D3-C1 两轮） | 2（含首轮残留 1 个手工删除） | ✅ `ListVpcs` 计数 0 |
| 子网 | 2 | 2 | ✅ `ListSubnets` 计数 0 |
| 安全组 | 2 | 2 | ✅ `ListSecurityGroups` 计数 0 |
| OBS 桶 | 2（D3-C2 静态站 / D3-C13 桶策略） | 2 | ✅ `hcloud OBS ls` 无 `testbot2-dsh` 桶 |
| EIP | 0（D3-C7 跨区创建被拒 `VPC.0501`） | — | ✅ 无残留 |
| 沙箱实例 | 复用池内既有实例（D3-S3），未新建 | 保持原状（未删除他人实例） | ✅ 无新增残留 |

> **首轮 D3-C1 残留说明**：首跑时 `hcloud` 对 API 错误（`VPC.0105 ConcurrentUpdateConflict`）仍返回 exit 0，探针据 exit 码误判 `DeleteVpc` 成功而停止重试，残留 VPC `testbot2-dsh-vpc-5209845658`；已在复跑前手工删除，并修正探针成功判定（exit 码 + 响应体错误码双校验），复跑通过且全量归零。该问题属探针工程缺陷，不计入产品缺陷单。
>
> **终态清扫**（报告生成前实测）：ECS / VPC / Subnet / SecurityGroup / OBS 前缀 `testbot2-dsh` 计数均为 0。

---

## 八、遗留与建议

1. **SPEC 裁决（D1-68）**：建议统一为 `HUAWEICLOUD_REGION` 优先，`HW_REGION` 仅作兼容回退并输出一次告警；同时同步用例契约，避免长期挂账。
2. **稳定线 backport（重要）**：对比 2026-11-20 `v2.0.0-next.4` 轮次，D2-4 / D4-3 / D4-17 / D3-S7 已在 next 线修复，但 **v1.1.15 稳定线仍全部复现**，建议回合到 1.x；D4-16 / D4-21 / D8-9 / D9-12 / EXP-E01 两条线均存在，需在主线统一修复。
3. **规则引擎健壮性**：D4-16 / D4-17 / D4-21 同属「语法形态变形绕过」，建议命令文本先做 shell 解析/归一（去引号、拆分管道、识别 `$(...)`），制品预检引入 HCL/Terraform 结构解析，再匹配规则，避免逐形态补正则。
4. **文案契约（D2-10 / D3-C14）**：建议错误对象提供稳定 `code` 字段（如 `HDKIT_KOOCLI_NOT_READY`）供程序判定，`messageZh` 仅作展示；用例断言语义改为「code 匹配 + 文案允许本地化」。当前两例因精确文案断言失配，方向需产品与测试共同裁决。
5. **MCP 协议（D9-12）**：`handleMessage` 增加会话状态机，`tools/list`/`tools/call` 在未 `initialize` 时返回 `-32600`；补充协议时序用例。
6. **路由能力（D3-S7 / EXP-E01）**：`serviceCatalog` 中文关键字补「云主机」「部署/应用部署」等同义词，复合意图改为多路由聚合而非首个命中。
7. **遥测脱敏（D8-9）**：`sanitizeValue` 复用 `redactSecrets` 的键名策略，避免遥测成为第二条泄漏通道。
8. **环境待办**：D3-C7 需账号开通跨区项目；D3-S3 需沙箱 DevBridge 凭证注入（keyring 或 `/tmp/hw_api_key`）。
9. **测试工程改进（已在本轮落地）**：`hcloud` API 错误不体现于 exit code，后续探针统一按响应体 `code` 字段判定成功；审批类用例需可写 `HUAWEICLOUD_HOME`，否则 landlock 沙箱下令牌持久化静默失败会被误判为产品缺陷。
10. **提单**：12 项经查重全部命中 v1 稳定线历史合并单 #1055，已追加 v1.1.15 复核评论（含根因行号与证据索引），不重复开单；本轮未处理/关闭任何 GitHub issue。