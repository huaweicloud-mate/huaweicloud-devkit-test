# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-28 05:10:05（北京时间）
> **执行归档**：`results/OpenCode/2026-11-28-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `2.0.1-next.1` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级探针（.mjs 直调 npm 全局包 `huaweicloud-devkit@2.0.1-next.1` 编译产物 `plugins/huaweicloud-core/dist/*.js`，含 tools 工具层、risk-rule-engine/safety-policy 安全层、auth/reconcile/credentials 认证层、update-check 升级层、telemetry 遥测层、mcp-protocol/mcp-stdio-transport 协议层、ws-exec 隧道层）+ MCP 协议真机（spawn `mcp-server.js` 收发 JSON-RPC）+ 真云 E2E（hcloud 建删 ECS/VPC/OBS，测后归零）+ 沙箱真机（connect/upload/deploy）。vendor gate 通过注入合法 `vendorConfirmed` 文案、审批门通过 ask 态 `approvedByUser:true` 完成确认后实测。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `134 / 5 / 5 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 139） | `96.4%` |
| P0 / P1 / P2 新增缺陷 | `3 / 1 / 1` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（ECS 未创建成功、VPC/安全组/子网/OBS 桶均建删归零） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `96` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞 |
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

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | D4安全 | 命令包裹穿透（sh -c 内层凭证 dump 未拦截） | `risk-rule-engine.js:200`（未解壳 sh -c） | 待提单 |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 对 HCL broad IAM 制品降级 warn | `safety/rules/cloud-risk-rules.json:289`（hwc-iam-admin-policy 仅匹配 JSON 形态） | 待提单 |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线（未 init 先 tools/list 不拒绝） | `mcp-stdio-transport.js:168`（无初始化状态门） | 待提单 |
| 4 | P1 | `EXP-E01` | D10评测 | service_catalog 路由「查询云主机」意图 MISS | `capability-catalog.js:391`（兜底 help，未命中 ECS 关键词） | 待提单 |
| 5 | P2 | `D8-9` | D8质量 | 遥测 sanitizeValue 不再脱敏 AK/SK/token | `telemetry/telemetry-values.js:21`（未接 redact） | 待提单 |
| 6 | P2·SPEC | `D1-68` | D1安装 | region 优先级与契约相反（HW_REGION 优先） | `auth/credential-resolver.js:20`（HW_REGION 优先） | 待提单 |

### 根因详情

1. **D4-16 / P0**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` → `{decision:'allow',findings:[]}`；裸形式 `env | grep HW_ACCESS_KEY` → `deny`。根因：`evaluateCommandRisk`（risk-rule-engine.js:200）不对 `sh -c` 包裹做解壳，内层未命中 `hwc-command-env-dump`。
2. **D4-21 / P0**：HCL `resource "huaweicloud_iam_policy" { actions=["*"] }` → `warn`（命中 hwc-iam-wildcard-action），同语义 JSON `{"Action":"*","Resource":"*"}` → `deny`（hwc-iam-admin-policy）。根因：`hwc-iam-admin-policy`(deny) 条件（cloud-risk-rules.json:289）仅覆盖 JSON IAM 形态。
3. **D9-12 / P0**：未 `initialize` 直接 `tools/list` 返回 40 工具而非 `-32600`。根因：`mcp-stdio-transport.js:168` 仅对 `initialize` 分支做副作用处理，`tools/list` 无「已初始化」门，未建立 handshake 状态门。
4. **EXP-E01 / P1**：`serviceCatalog('帮我查…有哪些云主机')` → `['Run hcloud --help …']`，未命中 ECS。根因：`capability-catalog.js` 关键词路由未覆盖「云主机」，落到 `:391` 兜底 help。
5. **D8-9 / P2**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 原样返回。根因：`telemetry-values.js:21` 仅换行/截断，未接 `safety/redact.js`。
6. **D1-68 / P2·SPEC**：默认 region 取 `HW_REGION || HUAWEICLOUD_REGION`，与契约「HUAWEICLOUD_REGION 优先」相反。根因：`auth/credential-resolver.js:20`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属用例（OS 列标注「Windows 专属」），本机为 Linux，不适用；Linux 侧由展开级 EXP-NR3 代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单提交被 billing 拒绝：Ecs.0707 "Can not find product"（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组创建→删除→归零 全部成功，ECS 到达订单提交层。解除条件：账号开通 ECS 购买产品/开启按需计费（补环境·billing 产品配额） |
| `D3-C3` | D3功能 | 沙箱部署E2E | 沙箱 connect 未返回 workspace id |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 沙箱 connect 未返回 workspace id（ASK_CONFIRMATION_REQUIRED ）——沙箱免费资源/服务侧不可用，7 个隐式工具中依赖 workspace 的 credentials/upload_file/exec_one_shot/deploy_check/close_session 无法执行。已实测 check_user={"realnameVerified":true,"agreementSigned":true} sign_agreement={"status":"rejected","code":"ASK_CONFIRMATION_REQUIRED","userConfirmation":{"needed":true,"mode":"chat","summary":"huaweicloud_sandbox_sign_agreement: sign all unsigned or outdated Huawei Cloud developer service agreements for the current user","instruction":"Show this exact request to the user in chat and wait for their answer. If they approve, retry the same call with approvedByUser: true. That retry is model-relayed posture trust: it is the user's word as you report it, not a mechanically verified answer."},"argsHash":"44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a","nextStep":"Retry with approvedByUser: true only after the user explicitly approves the request above."} 通过。解除条件：沙箱服务/容量恢复可用后复测（补环境·沙箱容量） |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013（region 与 tk 项目不符）、EIP 创建返回 VPC.0501，无法建删跨区资源。已实测通过项：list_regions 含 ap-southeast-3=true、plan_cli_command 含 --cli-region=true。解除条件：账号开通 ap-southeast-3 项目/region 权限（补环境·真云多region权限） |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱 connect 未返回 workspace id，无法预览出 URL |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-11 STS persist 拒绝落盘、D2-4 小写 ak=/sk= 脱敏、D4-26/27 证据脱敏均通过）
- [x] 写操作误判 read-only：`0`（plan_cli_command 写操作 classification.decision=allow，未误判只读）
- [x] 红线（I 类）违规：`0`（真云建删归零，未 mock/未虚标 PASS）
- [x] 脱敏复核：凭证/secret/adminPass 脱敏链路均 PASS（D8-9 sanitizeValue 例外，已列缺陷）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 静态站桶（D3-C2） | 建桶+上传+公网 curl200 | OBS rm -r -f | `OBS ls` 无残留 |
| OBS 静态网站桶（D3-C13） | 建桶+set/get website | OBS rm -f | `OBS ls` 无残留 |
| VPC（D3-S2） | CreateVpc | DeleteVpc | 列表不含本次 name |
| ECS+VPC+子网+安全组（D3-C1） | VPC/子网/安全组创建成功 | 全部删除 | ECS 因 billing Ecs.0707 未下单成功，无残留 |

> 真云用例均真机执行并测后删除归零；D3-C1 ECS 到达订单提交层被 billing 拒绝（Ecs.0707），VPC/子网/安全组已建删归零，无本次资源残留。

---

## 八、遗留与建议

- **SPEC 裁决**：D1-68 region 优先级（HW_REGION vs HUAWEICLOUD_REGION）需维护方裁决采用哪种，并回改用例或实现。
- **2.0.x 重大变更观察（非缺陷）**：① vendor gate（`vendorConfirmed` 必须为引文形式，`HUAWEICLOUD_VENDOR_CHALLENGE=off` 关闭确定性层反弹）；② 审批门从 plan mint token 迁移到 ask 态 run 层（`ASK_CONFIRMATION_REQUIRED`，`approvedByUser:true` 重试执行）；③ 工具 schema 经 `getToolSchema` 可达且结构统一（59 工具）。
- **BLOCKED 追溯结论**：5 项 BLOCKED 均为真·外部依赖（billing 产品配额 Ecs.0707 / 沙箱 connect 无 workspace id / 跨 region 无项目权限），非假阻塞；沙箱 sign_agreement 已实测走 ASK_CONFIRMATION_REQUIRED，check_user 返回 realnameVerified=true。
- **修复建议**：D4-16（接入 `safety/unwrap.js` 对 sh -c 解壳）、D4-21（cloud-risk-rules.json 增补 HCL IAM 形态映射）、D9-12（mcp-stdio-transport 增加 pre-initialize 状态门）、D8-9（sanitizeValue 接入 redact）、EXP-E01（serviceCatalog 增补「云主机→ECS」关键词）。
