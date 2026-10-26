# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-27 05:10:30（北京时间）
> **执行归档**：`results/AtomCode/2026-10-27-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.12`（hdk gitHead `4ed07801`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：① 源码级探针直调（`safety-policy.mjs`/`tools.mjs`/`risk-rule-engine.mjs` 等函数 + 断言，落 `evidence/<case-id>/probe.mjs` + `stdout.log`）；② MCP 协议探针（`mcp-protocol.mjs` 协议握手/工具枚举）；③ 真云 E2E（`hcloud` 真机建删资源 + 归零验证，D3-C1/C2/C3/C6/C7）；④ D10 评测集 routing harness（`serviceCatalog` 中文意图路由）。全部 `node` 真实重跑，产物机器可读落盘。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 14 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `90.3%` |
| P0 / P1 / P2 新增缺陷 | `1 / 10 / 3` |
| 红线（I 类）违规 | `无 I 类红线违规（脱敏缺陷已被凭证脱敏路径截获，未泄入 agent 上下文；详见 §六）` |
| 资源释放 | `本轮 1 台 ECS 已删除归零（含人工复核）；VPC/子网/OBS 已删；详见 §七` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | TODO: 待补根因 | 待提单 |
| 2 | P1 | `D3-C1` | D3功能 | ECS生命周期E2E | TODO: 待补根因 | 待提单 |
| 3 | P1 | `D3-C2` | D3功能 | OBS静态站部署E2E | TODO: 待补根因 | 待提单 |
| 4 | P1 | `D3-C3` | D3功能 | 沙箱部署E2E | TODO: 待补根因 | 待提单 |
| 5 | P1 | `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | TODO: 待补根因 | 待提单 |
| 6 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | TODO: 待补根因 | 待提单 |
| 7 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | TODO: 待补根因 | 待提单 |
| 8 | P1 | `D3-S2` | D3功能 | 场景-删VPC先确认 | TODO: 待补根因 | 待提单 |
| 9 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | TODO: 待补根因 | 待提单 |
| 10 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 11 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补根因 | 待提单 |
| 12 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | TODO: 待补根因 | 待提单 |
| 13 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | TODO: 待补根因 | 待提单 |
| 14 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

| # | 用例ID | 期望 | 实际/根因（文件:行号） | 证据 |
|---|---|---|---|---|
| 1 | `D2-4` | ak/sk/token 均脱敏 | `safety-policy.mjs:20-31,57` 短键 ak/sk 未收录 | `evidence/D2-4/stdout.log` |
| 2 | `D3-C1` | ECS 建删归零 | 真机建删成功，异步删除超探针轮询窗（已人工核删归零） | `evidence/D3-C1/stdout.log` |
| 3 | `D3-C2` | OBS 静态站建删 | OBS CLI 非零退出码探针误判（实际建/删成功） | `evidence/D3-C2/stdout.log` |
| 4 | `D3-C3` | 沙箱部署 E2E | 沙箱未连接 workspace_id required（环境） | `evidence/D3-C3/stdout.log` |
| 5 | `D3-C6` | 沙箱 7 工具冒烟 | 沙箱升级维护中 HDKIT_SANDBOX_MAINTENANCE（环境） | `evidence/D3-C6/stdout.log` |
| 6 | `D3-C7` | 跨区域 E2E | IAM token 区域绑定 VPC.0501（环境） | `evidence/D3-C7/stdout.log` |
| 7 | `D3-S1` | serviceCatalog 路由到 ECS | `tools.mjs:2188,2441-2443` 回落 help | `evidence/D3-S1/stdout.log` |
| 8 | `D3-S2` | 删 VPC 先确认路由 | `tools.mjs:2188,2441-2443` 回落 help | `evidence/D3-S2/stdout.log` |
| 9 | `D3-S3` | 沙箱预览路由 | `tools.mjs:2188,2441-2443` 回落 help | `evidence/D3-S3/stdout.log` |
| 10 | `D3-S5` | 复合意图分层路由 | `tools.mjs:2188,2441-2443` 回落 help | `evidence/D3-S5/stdout.log` |
| 11 | `D4-25` | 写命令归 cli:write | `hooks/huaweicloud-safety.py:46,112` 边界失配→cli:invoke | `evidence/D4-25/stdout.log` |
| 12 | `D4-27` | 双路径脱敏 | `safety-policy.mjs:42-45` 小写 ak=/sk= 未命中 | `evidence/D4-27/stdout.log` |
| 13 | `D9-9` | 声明 cancellation | `mcp-protocol.mjs:47` 未声明（SPEC-MISMATCH） | `evidence/D9-9/stdout.log` |
| 14 | `D8-9` | sanitizeValue 脱敏凭证 | `telemetry/telemetry.mjs:189-197` 无脱敏 | `evidence/D8-9/stdout.log` |
| 15 | `EXP-E01` | ECS查询→run_readonly | `tools.mjs:2188,2441-2443` 回落 help | `evidence/EXP-E01/stdout.log` |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属/OS专属】OS 列标注「Windows 专属」，Linux 无法执行 EINVAL 升级检测链语义，由 Linux 侧 d1-upgrade 代表覆盖 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`未发生凭证落盘/外发；D2-4/D4-27 脱敏缺陷已验证仅 probing 输入中的测试占位 AK/SK，非真实凭证，且被脱敏路径截获`
- [x] 写操作误判 read-only：`无；D4 系列（D4-5/D4-9/D4-15/D4-16/D4-18/D4-19/D4-20）均正确 deny/read-only/allow 分类`
- [x] 红线（I 类）违规：`无；真云用例均走审批分类 allow + 最低配置 + 测后删除归零`
- [x] 脱敏复核：`D2-4（ak/sk 短键）、D4-27（小写 ak=/sk=）、D8-9（sanitizeValue）三处脱敏缺陷已记入 FINDINGS #1/#2/#5`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS `c2dee9e3…`（本轮 `testbot3-hermes-ecs-3048814184`） | 是（D3-C1 CreateServers） | 探针提交删除 + 人工复核删除 | ✅ `ListServersDetails` 复核不再含该 ID |
| VPC `336223d7…`（本轮 `testbot3-hermes-e2e-3048814184`） | 是（D3-C1 CreateVpc） | finally 反序删除 | ✅ `vpc:OK` |
| Subnet `f0582c47…` | 是（D3-C1 CreateSubnet） | finally 反序删除 | ✅ `subnet:OK` |
| OBS bucket `testbot3-hermes-obs-3048814184` | 是（D3-C2 建桶） | `OBS rm -f` 删桶 | ✅ `Delete bucket ... successfully` |
| EIP / 系统盘 | 未绑定 EIP；系统盘随 ECS 删除 | — | ✅ 无残留 |

> 真云已归零：本轮 6 项真云用例（D3-C1/C2/C3/C6/C7）所有本次创建资源均已删除归零（ECS 经人工复核确认），仅删除本次（TS=3048814184）创建资源；未触碰其他客户端同名前缀（`testbot3-hermes`，硬编码）下的历史资源。

---

## 八、遗留与建议

- `D2-4`/`D4-27`/`D8-9` 三处凭证脱敏缺陷（`safety-policy.mjs` / `telemetry/telemetry.mjs`）为 I 类安全风险，建议优先修复 `secretKeyNamePatterns` 补 `ak`/`sk` 短键 + 小写 `ak=`/`sk=` 正则 + `sanitizeValue` 脱敏。
- `serviceCatalog`（`tools.mjs`）中文意图路由覆盖率低（D3-S1/S2/S3/S5、EXP-E01 回落 help），建议扩充 routeMap 关键词与服务映射。
- 测试侧推论：`scripts/realcloud_e2e.mjs` 资源名前缀**硬编码 `testbot3-hermes`**，未按执行客户端命名，导致多客户端（AtomCode 等）真云资源被统一打上 `hermes` 标签、清理时易与 Hermes 客户端资源混淆，建议改为按客户端名动态取名。
- `D3-C1` 真云 E2E 的 ECS 异步删除 150s 轮询窗口偏短（ECS 删除可能超过窗口），建议放宽轮询窗口或改轮询为任务状态查询。
