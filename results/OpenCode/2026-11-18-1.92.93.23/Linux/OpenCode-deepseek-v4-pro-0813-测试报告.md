# OpenCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`OpenCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-11-18 05:09:30`（北京时间）
> **执行归档**：`results/OpenCode/2026-11-18-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 10 + SPEC-MISMATCH 1 项，P0 5 项；后续统一走历史查重提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.15-next.1`（npm next，gitHead `df6bea57`） |
| 工具全集 | `47`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `KooCLI 7.2.12` |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，真机执行） |
| 测试类型 | 源码级探针直调 / CLI 真机 / MCP 协议 / 真云 E2E（建删归零）/ 沙箱真机 |
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
| P0 / P1 / P2 新增缺陷 | `5 / 4 / 1`（另有 SPEC-MISMATCH 1 项） |
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

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏漏小写 `ak=`/`sk=` | 小写与大写 `AK=`/`SK=` 均应 `<redacted>` | `ak=AK123456` 明文残留 | `safety-policy.mjs:45` | P | 待查重提单 |
| 2 | P0 | `D4-3` | KMS DecryptData 明文 secret API 未拦截 | 应返回 `deny` | 返回 `allow` | `safety/rules/cloud-risk-rules.json:56` | P | 待查重提单 |
| 3 | P0 | `D4-16` | `sh -c "env"` 命令包裹穿透 | 应返回 `deny` | 返回 `allow` | `cloud-risk-rules.json:35` | P | 待查重提单 |
| 4 | P0 | `D4-21` | HCL/Terraform broad IAM 制品未拦截 | HCL `actions=["*"]` 应 `deny` | HCL 返回 `allow` | `cloud-risk-rules.json:209,213` | P | 待查重提单 |
| 5 | P0 | `D9-12` | initialize 握手未 enforce 时序 | 未 init 先 tools/list 应 `-32600` | 返回 47 工具 | `mcp-protocol.mjs:70-71` | P | 待查重提单 |
| 6 | P1 | `D3-S3` | 沙箱预览 URL 未完成（403 + 无 live host） | `complete=true` + 可访问 URL | `complete=false` | `sandbox/session-manager.mjs:1071-1080` | G | 待查重提单 |
| 7 | P1 | `D4-17` | 模糊输入 fail-closed 失效 | 应 `deny`/`warn`（fail-closed） | 命令替换 `allow` | `risk-rule-engine.mjs:106` | P | 待查重提单 |
| 8 | P1 | `EXP-E01` | 「云主机」意图未路由 ECS | 应命中 ECS | 落入 help fallback | `tools.mjs:2366-2373` | G | 待查重提单 |
| 9 | P1 | `D3-S7` | 复合意图「部署」漏路由部署侧 | 应命中 RDS + 部署目标 | 仅命中 RDS | `tools.mjs:2541-2560` | G | 待查重提单 |
| 10 | P2 | `D8-9` | 遥测 sanitizeValue 未脱敏 | 凭证值应被脱敏 | 明文残留 | `telemetry/telemetry.mjs:190-196` | P | 待查重提单 |
| 11 | P2 | `D1-68` | region 优先级契约漂移 | `HUAWEICLOUD_REGION` 优先 | `HW_REGION` 优先 | `auth/credentials.mjs:225,173,339` | G | SPEC 待裁决 |

### 根因详情（P0 缺陷附代码片段 + 复现证据）

```markdown
**#1 [P0] D2-4 凭证脱敏漏小写 ak=/sk=**

- 期望：`redactSecrets('ak=AK123456 sk=SKsecret')` → `<redacted>`
- 实际：原样返回 `ak=AK123456 sk=SKsecret`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45`
  `redactString()` 的 `(AK|SK)\s*[:=]…` 正则仅带 `g` 不带 `i`，前段不含裸 `ak`/`sk` 短名
- 证据：`evidence/D2-4/stdout.log`

**#5 [P0] D9-12 initialize 握手未 enforce 时序**

- 期望：未 init 先 tools/list → `-32600`
- 实际：返回完整 47 工具列表
- 根因：`plugins/huaweicloud-core/src/mcp-protocol.mjs:70-71`
  `dispatch()` 的 `tools/list` 分支无条件 `return { tools: TOOL_DEFINITIONS }`
- 证据：`evidence/D9-12/stdout.log`
```

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | OS 列标注 Windows 专属（升级检测链），本机 Linux 不适用；Linux 侧由展开级 EXP-NR3 代表覆盖 | 归属列已标注 Windows 专属，无需改；Linux 侧继续由 NR3 展开级覆盖 |
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | ECS CreateServers 订单提交被 billing 拒绝（`Ecs.0707 Can not find product`）——账号 BSS 产品目录无该镜像产品映射；已实测 VPC/子网/安全组创建→删除→归零全部成功，ECS 到达订单提交层 | 补环境：账号开通 ECS 购买产品/按需计费 |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 跨区域 `ap-southeast-3` 不在账号项目范围（project 仅 cn-north-4）：ECS 只读返回 `Common.0013`、EIP 创建返回 `VPC.0501`，无法建删跨区资源；已实测 list_regions 含该 region、plan_cli_command 含 `--cli-region` | 补环境：账号开通 ap-southeast-3 项目/region 权限 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（findings.evidence 已脱敏）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（订单被拒，未建成） | 否（未产生实例） | 无残留实例 |
| VPC/子网/安全组（D3-C1） | 是 | 已删 | 归零 |
| OBS 桶（D3-C2/D3-C13/D3-S2） | 是 | 已删 | mb/del 闭环归零 |
| 沙箱实例（D3-C3/D3-S3 等） | 是 | 复用/关闭 | 无本次新建残留 |

> 真云只删本次创建资源；删除前盘点 + 白名单，未触碰既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region 优先级契约漂移）——实现 HW_REGION 优先 vs 契约 HUAWEICLOUD_REGION 优先，需维护者裁决以哪个为准。
- 本轮未覆盖（说明范围）：`D1-39` Windows 专属升级链（Linux 不适用，由 NR3 展开级代表覆盖）。
- 建议：本日 10 FAIL + 1 SPEC 均为历史已知缺陷（与 2026-11-17 一致），建议优先修复 5 项 P0 安全类（凭证脱敏/命令包裹/IaC 预检/协议时序）。