# Hermes-deepseek-v4.1-flash 每日测试报告

> **报告名**：`Hermes-deepseek-v4.1-flash-测试报告.md`
> **生成时间**：2026-10-31 05:22（北京时间）
> **执行归档**：`results/Hermes/2026-10-31-120.46.176.133/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（存在 FAIL 缺陷，P0 2 项，通过率 91.7%）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4.1-flash` |
| OS / 架构 | `Linux` (aarch64) |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.13-next.0`（npm `next`，gitHead `47170d1f`；官方 registry latest 仍为 `1.1.12`） |
| 工具全集 | 46 个 MCP 工具（huaweicloud_*）+ CLI |
| 真云凭证 | cn-north-4（AKSK 管理员 hw018619646 + 只读子账号 test001） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 43 / 追踪表 216 |

> **执行方法**：`python scripts/prepare_env.py --update` 拉最新（测试仓 main + `hdk` checkout 到 SUT commit `47170d1f` + `npm i -g huaweicloud-devkit@next`），`init_day.py Hermes Linux` 建包；探针脚本（.mjs）以 `file://` 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，结论落 `evidence/<case-id>/stdout.log`；真云用例真机建删资源并在 `finally` 逐项复核归零；`backfill_daily.py --write` 一次性回填三份 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `148`（另 2 条 NOT_RUN 见第五节） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 9 / 4 / 3 / 2` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 144） | `91.7%` |
| P0 / P1 / P2 新增缺陷 | `2 / 4 / 3`（另 SPEC-MISMATCH 3） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `ECS=0 / VPC=0 / EIP=0 / OBS=0`（1 条云侧 UNKNOWN 状态残留子网为历史遗留，见第七节） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `90` | 有证据且通过 PASS 门禁 |
| FAIL | `8` | 不符预期，根因见缺陷清单 |
| BLOCKED | `4` | 沙箱维护 3 项 + 跨区凭证作用域 1 项 |
| SPEC-MISMATCH | `3` | D1-65 / D1-68 / D8-9 |
| NOT_RUN | `2` | D1-39（Windows 专属）、D3-S7（跨服务编排超范围） |
| **合计** | **`107`** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01「云主机」意图 MISS |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`43`** | |

### 3.3 门禁结果

- `verify_no_fake_pass.py Hermes Linux`：**通过**（所有 PASS 用例均有 evidencePath 且证据存在）。
- `verify_coverage.py Hermes Linux`：**通过**（设计级 NOT_RUN=1、空=0、BLOCKED=4 均有原因、NOT_RUN+空占比 0.9%；展开级 0.0%）。

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） |
|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（小写 ak=/sk= 与 JSON 带引号 key 失效） | `src/safety-policy.mjs:45`（`(AK\|SK)` 无 `/i`）+ `:20`（`isSecretKeyName` 未含裸 ak/sk） |
| 2 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线（非法时序未拒） | `src/mcp-protocol.mjs:61`（`tools/list` 无初始化状态机） |
| 3 | P1 | `D4-4` | D4安全 | 写操作审批门（Change* 变更类动词漏拦截） | `safety/policy.json:27`（`writeOperationPrefixes` 缺 `Change`） |
| 4 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS（「云主机」路由 MISS） | `src/tools.mjs:2199`（ECS keywords 缺「云主机」） |
| 5 | P1 | `D10-3` | D10评测 | 路由准确率 92.9%（1 MISS） | `src/tools.mjs:2199`（同上根因） |
| 6 | P1 | `EXP-E01` | D10评测 | 评测集「云主机」意图 MISS | `src/tools.mjs:2199`（同上根因） |
| 7 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由（仅命中单一服务） | `src/tools.mjs:2195`+`:2420`（无多意图分解/合并） |
| 8 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类错误 + 目录错位 | `hooks/huaweicloud-safety.py:46`（前置字符类致空格写动词不匹配）、`:24`（`parents[2]` 指向 plugins/） |
| 9 | P2 | `D4-26` | D4安全 | findings 证据脱敏（`--password 值` 明文残留） | `src/risk-rule-engine.mjs:19`（`redactEvidence` 不匹配空格分隔 CLI 形态） |
| 10 | SPEC-MISMATCH | `D1-65` | D1安装 | 调试模式环境变量（`DEBUG=1` 不生效） | `src/telemetry/telemetry.mjs:82`（仅接受字面量 `'true'`） |
| 11 | SPEC-MISMATCH | `D1-68` | D1安装 | 区域环境变量优先级相反 | `src/setup-cli.mjs:4969`（`HW_REGION \|\| HUAWEICLOUD_REGION`） |
| 12 | SPEC-MISMATCH | `D8-9` | D8遥测 | `sanitizeValue` 未脱敏 AK/SK/token | `src/telemetry/telemetry.mjs:190`（仅 trim/截断/去控制字符） |

### 根因详情

> 每个 FAIL/SPEC 的「现象 / 断言 / 根因（文件:行号）/ 影响 / 证据」见同目录 `FINDINGS.md`（`file_issue.py` 的解析输入）。

> **历史查重**：12 项均为既有语义类缺陷，`file_issue.py` 内置上游 open issues 按用例号+语义匹配；命中即不重复开单，生成 `HISTORY_LINKS.md` 关联清单。
>
> **较上一执行日（10-30）变化**：SUT 保持 `1.1.13-next.0`（gitHead `47170d1f`，未滚动），上述 12 项缺陷**全部复现、未修复**；10-30 记入缺陷单的 D3-C7「跨区凭证作用域」本次经复测归入 BLOCKED（外部凭证依赖，非产品缺陷），故本次提单缺陷数由 12 → 12（组成变化：D3-C7 出、无新增）。
>
> **环境说明**：本机 registry 指向官方 `registry.npmjs.org`；`prepare_env.py` 按「取最高」规则安装 `next=1.1.13-next.0`（> latest 1.1.12），报告口径以实际安装版本为准。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 层级 | 优先级 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | 调归属 | Windows 升级检测链 EINVAL 专属用例（OS 列标注「专属」），Linux 不适用 | 无需改；Linux 侧由展开级 `EXP-NR3-10` 覆盖（本次 PASS） |
| `D3-S7` | 设计级 | P2 | 改用例 | 场景-跨服务交付（Web 应用 + RDS + 连接串注入 + 归零）需专用编排 harness 与 RDS 实例配额，超出每日单服务真云探针范围，本次未执行 | 建议在用例中标注「专项隔离执行」并补充编排 harness 前置，或拆为单服务可判定子用例 |

### BLOCKED

| 用例ID | 层级 | 优先级 | 阻塞原因（四要素） |
|---|---|---|---|
| `D3-C3` | 设计级 | P1 | 2026-10-31 05:12 实测：沙箱服务端处于维护窗口，调用返回 `HDKIT_SANDBOX_MAINTENANCE`（『沙箱功能正在升级优化，暂时无法使用』），connect 无 workspace（上层报 `workspace_id is required. No sandbox connected`）。缺：可用的华为云沙箱工作区（云端维护中，非本机可解，非凭证/权限问题）。影响：connect/upload_project/deploy/清理 5 个断言全部无法执行。解除条件：维护窗口结束后 `HDKIT_SANDBOX_MAINTENANCE` 消失且 connect 返回 workspace_id，恢复后 24h 内补测。 |
| `D3-C6` | 设计级 | P1 | 2026-10-31 05:12 实测：`check_user` 直报 `HDKIT_SANDBOX_MAINTENANCE`，connect 无 workspace。缺：可用的华为云沙箱工作区。影响：7 隐式工具具名冒烟不可执行。解除条件：维护结束、`check_user` 返回 realnameVerified 并可 connect。 |
| `D3-S3` | 设计级 | P1 | 2026-10-31 05:12 实测：`probe_d3s3.mjs` 调沙箱接口直报 `HDKIT_SANDBOX_MAINTENANCE`（trace 0157728b…）。缺：可用的华为云沙箱工作区。影响：沙箱预览出 URL 场景无法执行。解除条件：维护结束且 `check_user/connect` 恢复正常。 |
| `D3-C7` | 设计级 | P1 | 2026-10-31 05:12 实测：跨区断言被凭证作用域阻塞——`hcloud ECS/VPC` 调 `ap-southeast-3` 返回 `Common.0013`（token 的 project 为 cn-north-4，region 不匹配）与 `VPC.0501`。缺：绑定 ap-southeast-3 project 作用域的 AK/SK。影响：5 条断言中 2 条（不存在资源精确错误码 Ecs.0200、跨区建 EIP）无法执行；其余 3 条（`--cli-region` 规划、region 可用性查询、跨区只读调用）已实测通过。解除条件：提供 ap-southeast-3 作用域凭证后重跑。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（evidence 目录内 JSON 输出经 evidencePath 校验，无新增原始 AK/SK 落盘）
- [x] 写操作误判 read-only：`0`（真云 E2E 建删全过程记录，未出现只读工具执行写操作）
- [x] 红线（I 类）违规：`无`（未 mock 真云、未以无凭证标 BLOCKED；真云用例均真机建删）
- [x] 脱敏复核：发现 3 项脱敏相关缺陷（#1 D2-4、#9 D4-26、#12 D8-9），已如实标 FAIL/SPEC-MISMATCH，未虚报 PASS

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（`testbot3-hermes-ecs-3394171553`、`testbot3-hermes-ecs-3394739390`） | D3-C1 真云 E2E（05:03 / 05:12 两次执行） | `DeleteServers`（delete_publicip/volume=true）提交并轮询 | `ECS ListServersDetails` → `count=1`（仅剩非本次 `tctest-tmr-u1yrtd-srv`） |
| VPC（`testbot3-hermes-e2e-3394171553`、`testbot3-hermes-e2e-3394739390`） | 同上 | 先 `DeleteSubnet` 后 `DeleteVpc` | `VPC ListVpcs` → `total=1`（仅剩非本次 `tctest-tmr-u1yrtd`） |
| 子网（`…-3394171553-subnet`、`…-3394739390-subnet`） | 同上 | `DeleteSubnet` | `VPC ListSubnets` → 仅剩 1 条历史 UNKNOWN 残留（见下）+ 非本次 tctest |
| EIP | 跨区用例创建被 IAM 拒绝（`VPC.0501`），未产生 | — | `EIP ListPublicips` → `total=0` |
| OBS 桶（`testbot3-hermes-obs-3394776262`） | D3-C2 真云 E2E | 删桶成功 | 删后 `Check fs status` 报不存在 = 归零 |
| FunctionGraph 函数（`probe_s6` 创建） | D3-S6 真云 E2E | `DeleteFunction` | 探针 `归零=true` |

> **残留说明（如实记录）**：`VPC ListSubnets` 仍返回 1 条 `testbot3-hermes-e2e-3308444841-subnet`（id `4cdf1dce…`，status=`UNKNOWN`），为**历史执行遗留**（其父 VPC 已不存在，API 层无法删除，属华为云侧 Neutron 残留，需控制台/工单清理），非本次创建。本次创建资源已全部删除并复核归零。

---

## 八、遗留与建议

1. **P0 缺陷优先修复**：`D2-4`（小写/JSON 形态 AK/SK 不脱敏，直接导致凭证明文泄漏）与 `D9-12`（未 initialize 即可枚举 46 个工具）为安全基线问题，建议下个补丁版本修复。
2. **路由同义词缺口**：`D3-S1`、`D10-3`、`EXP-E01` 同根因（`routeMap` 缺「云主机」）。建议在 `src/tools.mjs` ECS keywords 增加口语别名，并把「同义词覆盖」纳入评测集回归。
3. **审批门覆盖不全**：`D4-4` 的 `Change*` 前缀缺失建议直接在 `policy.json` 补齐并加单测防止再次漂移。
4. **SPEC 口径统一**：`D1-65`（DEBUG=1）、`D1-68`（region 优先级）、`D8-9`（sanitizeValue 脱敏）属实现与设计契约漂移，建议裁决后同步更新用例或实现。
5. **沙箱依赖**：`D3-C3/D3-C6/D3-S3` 连续多日受 `HDKIT_SANDBOX_MAINTENANCE` 阻塞，建议维护窗口结束后安排一次补测。
6. **跨区凭证**：`D3-C7` 需绑定 `ap-southeast-3` project 作用的 AK/SK 才能闭环，建议在测试机凭证下发中补充跨区子账号。
