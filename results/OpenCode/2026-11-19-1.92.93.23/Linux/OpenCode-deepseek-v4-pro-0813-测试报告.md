# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-19 05:40:49（北京时间）
> **执行归档**：`results/OpenCode/2026-11-19-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `2.0.0-next.4` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：v2.0.0-next.4 已 TypeScript 化（`.mjs`→`.ts`），探针 harness 改为 `node --experimental-strip-types` 直调 `hdk/plugins/huaweicloud-core/src/**/*.ts`（vendor gate 统一注入 `vendorConfirmed` + `HUAWEICLOUD_VENDOR_CHALLENGE=off`）；MCP 协议/工具黑盒经 spawn 已编译 `dist/mcp-server.js`（JSON-RPC over stdio）；真云 E2E 经 `hcloud` CLI 直调（建删资源归零）；源仓库 hdk checkout `16a24814`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 7 / 6 / 2 / 1` |
| 通过率（分母 = PASS+FAIL = 137） | `94.9%` |
| P0 / P1 / P2 新增缺陷 | `3 / 3 / 1`（另有 1 项 SPEC 契约漂移 + 1 项账号侧非产品缺陷） |
| 红线（I 类）违规 | `0`（4 项 P0 安全缺陷均为 devkit 防线缺口，未发生实际凭证泄露/越权写） |
| 资源释放 | `全部归零`（真云建删资源均删除并核验无残留，见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `6` | 不符预期，根因见缺陷清单 |
| BLOCKED | `6` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `2` | 契约漂移 |
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

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D3-S1` / `EXP-E01` | D3功能 / D10 | 场景-只读查ECS；评测集路由 E01 | `capability-catalog.ts:24-36`（ECS keywords 缺「云主机」） | 待提单 |
| 2 | P1 | `D4-13` | D4安全 | 最小权限凭证通过率 | 账号侧（test001 IAM 未配置只读，非 devkit 缺陷） | 非产品缺陷 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety/rules/cloud-risk-rules.json`（hwc-command-env-dump `(^\|\s)(env…)` 不覆盖 `sh -c`） | 待提单 |
| 4 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归 | `cloud-risk-rules.json`（hwc-iam-admin-policy 需显式 Effect Allow，HCL 隐式不命中→降级 warn） | 待提单 |
| 5 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry-values.ts:27`（sanitizeValue 不脱敏） | 待提单 |
| 6 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-protocol.ts:356`（McpServer SDK 无 pre-initialize 守卫） | 待提单 |
| 7 | P1 | `D1-68` | D1安装 | 图标离线与区域环境变量 | `auth/credential-resolver.ts:32`（HW_REGION 优先，契约相反） | SPEC |
| 8 | P2 | `D9-9` | D9协议 | tools/call 超时协议语义与取消 | `mcp-protocol.ts`（未声明 notifications.cancellation） | SPEC |

### 根因详情

1. **D3-S1 / EXP-E01（FAIL）**：期望 `service_catalog` 对「…有哪些云主机」返回 `recommendedServices` 含 `ECS`；实际返回 `["Run hcloud --help to list available services."]` 兜底。根因 `capability-catalog.ts:24-36` ECS `keywords` 缺失「云主机」。证据 `evidence/D3-S1/stdout.log`、`evidence/EXP-E01/stdout.log`。
2. **D4-13（FAIL，非产品缺陷）**：临时 hcloud profile 下 `ListVpcs` 读成功，但 `CreateVpc` 也真机创建成功（`ro-perm-test`，已即时删除归零），说明 test001 子账号 IAM 未配置只读（账号侧）。
3. **D4-16（FAIL，P0）**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` → allow；`classifyTextCommand` 同命令 → deny。根因 `cloud-risk-rules.json` 的 `hwc-command-env-dump` regex 不覆盖包裹形态，evaluateCommandRisk 路径无 `sh -c` 解包。
4. **D4-21（FAIL，P0）**：HCL broad IAM `actions=["*"]` → warn；JSON → deny。根因 `hwc-iam-admin-policy` 第三条要求显式 `Effect: Allow`，HCL 隐式 Allow 不命中。
5. **D8-9（FAIL，P2）**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 原样返回，v1 脱敏在 v2 丢弃（`telemetry-values.ts:27`）。
6. **D9-12（FAIL，P0）**：未 init 先 `tools/list` 返回 58 工具而非 `-32600`；SDK 化后无 pre-initialize 守卫（`mcp-protocol.ts:356`）。
7. **D1-68（SPEC-MISMATCH）**：region 默认值 `HW_REGION || HUAWEICLOUD_REGION`（HW 优先），契约期望 HUAWEICLOUD_REGION 优先。
8. **D9-9（SPEC-MISMATCH）**：initialize 未声明 `notifications.cancellation`，取消能力不可协商。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】OS 专属用例（OS 列标注专属），本机 Linux 不适用，D1-39 为 Windows 升级检测链；Linux 侧由展开级 EXP-NR3 代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单提交被 billing 拒绝：Ecs.0707 "Can not find product"（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组创建→删除→归零 全部成功，ECS 到达订单提交层。解除条件：账号开通 ECS 购买产品/开启按需计费（补环境·billing 产品配额） |
| `D3-C3` | D3功能 | 沙箱部署E2E | v2 审批门：沙箱 connect 需真人确认(USER_CONFIRMATION_REQUIRED)——headless 无法自动确认。解除条件：人工 approve 或提供自动确认 seam（补环境·审批门真人确认） |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | v2 审批门：huaweicloud_sandbox_connect 需真人确认(USER_CONFIRMATION_REQUIRED/DEVKIT_APPROVAL_MODE)，headless 无法自动确认。check_user/sign_agreement 已实测通过(realnameVerified/agreementSigned=true)。解除条件：置 DEVKIT_APPROVAL_MODE 并人工 approve，或提供可自动确认的审批 seam（补环境·审批门真人确认） |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013（region 与 tk 项目不符）、EIP 创建返回 VPC.0501，无法建删跨区资源。已实测通过项：list_regions 含 ap-southeast-3=true、plan_cli_command 含 --cli-region=true。解除条件：账号开通 ap-southeast-3 项目/region 权限（补环境·真云多region权限） |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | v2 审批门：huaweicloud_obs_set_website_config(set) 需真人确认(USER_CONFIRMATION_REQUIRED)——headless 无法自动确认。OBS mb(建桶)/rm(归零) 已实测通过。解除条件：人工 approve 或提供自动确认 seam（补环境·审批门真人确认） |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | v2 审批门：沙箱 connect 需真人确认(USER_CONFIRMATION_REQUIRED)——headless 无法自动确认。解除条件：人工 approve 或提供自动确认 seam（补环境·审批门真人确认） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D4-16 env 泄露、D8-9 遥测脱敏为防线缺口，未发生真实明文外泄；D2-4 小写 ak=/sk= 脱敏 v2 已修复 PASS）
- [x] 写操作误判 read-only：`无`（D4-5 写操作未误判只读 PASS）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：D4-6 adminPass、D4-26 findings evidence、D4-27 双路径均脱敏 PASS；D8-9 遥测 sanitizeValue 不脱敏为 P2 缺口（已提单）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2/C13） | `hcloud OBS mb` | `OBS rm -r -f` | 已核验 `OBS ls` 无残留 `testbot2-opencode-obs*` |
| VPC（D3-S2/D3-S1） | `hcloud VPC CreateVpc` | `VPC DeleteVpc` | 已核验 `ListVpcs` 无残留 `testbot2-opencode-vpc*` |
| VPC（D4-13 只读账号越权写） | `CreateVpc ro-perm-test` | 即时 `DeleteVpc` | 已核验 `ListVpcs` 无 `ro-perm-test` |
| ECS（D3-C1） | billing 拒绝未创建 | — | `ListServersDetails` 无残留 ECS |
| 跨区域 EIP（D3-C7） | 区域无权限未创建 | — | 无残留 |
| 沙箱（D3-C3/C6/S3） | 审批门拒绝，connect 未建立 | — | 无云端资源产生 |

> 真云资源全部归零，无遗留。

---

## 八、遗留与建议

- **v2 审批门（DEVKIT_APPROVAL_MODE）**：v2 引入 approval-gate + vendor-gate，`huaweicloud_sandbox_connect`/`obs_set_website_config` 等写/连接类工具需真人确认（USER_CONFIRMATION_REQUIRED），headless 每日测试无法自动确认 → D3-C3/C6/C13/S3 BLOCKED。建议测试基建提供可自动确认的 seam（如测试专用 approval 后端/enabled seam），以恢复 headless 全自动真云 E2E。
- **vendor gate 契约**：v2 对 14 个云工具强制 `vendorConfirmed` 引用（每调用必附用户原话），是对 v1 契约的破坏性变更，建议产品侧明确迁移文档。
- **工具数 40→58**：v2 工具集从 40 增至 58（packs 化新增工具），D5-3/D9-1 等「全量枚举」用例的硬编码数字需随版本更新基线。
- **SPEC 裁决**：D1-68 region 优先级（HW_REGION vs HUAWEICLOUD_REGION）、D9-9 cancellation 声明，需产品确认是「有意变更」还是「回归」，并以新契约回改 test-cases 母版。
