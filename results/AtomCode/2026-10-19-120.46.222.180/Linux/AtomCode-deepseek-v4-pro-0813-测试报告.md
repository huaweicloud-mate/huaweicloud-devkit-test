# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-19 05:29:52（北京时间）
> **执行归档**：`results/AtomCode/2026-10-19-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `v1.1.9 (gitHead 05a67b64)` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级探针 `.mjs` 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（结论落 `stdout.log`）；CLI 真机（install/doctor/status/hcloud）记录日志；真云 E2E 走 `scripts/realcloud_e2e.mjs`（D3-C1/C2/C3/C6 建删资源归零）；MCP 协议探针（D9-*）stdio 直调；证据统一落 `evidence/<case-id>/`（每用例独立 probe.mjs + stdout.log）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 9 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 141） | `93.6%` |
| P0 / P1 / P2 新增缺陷 | `1 / 5 / 3` |
| 红线（I 类）违规 | `2`（D2-4 JSON 凭证脱敏、D4-27 小写 ak/sk 脱敏） |
| 资源释放 | 真云资源全部归零（D3-C6 沙箱 5/5 通过；D3-C3 deploy_nginx 瞬态端口冲突重跑后 PASS；D3-C1 VPC/子网创建后已删归零，ECS 因余额不足未建成；D3-C2 OBS 受限未建成；D3-C7 EIP total_count=0） |

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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（JSON 键值漏脱敏） | `safety-policy.mjs:34-62` | 待提单 |
| 2 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS（中文未路由） | `tools.mjs:1997-2252` | 待提单 |
| 3 | P1 | `D3-S2` | D3功能 | 场景-删VPC先确认（中文未路由） | `tools.mjs:1997-2252` | 待提单 |
| 4 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL（中文未路由） | `tools.mjs:1997-2252` | 待提单 |
| 5 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | `tools.mjs:1997-2252` | 待提单 |
| 6 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `huaweicloud-safety.py:46,111-112` | 待提单 |
| 7 | P1 | `D4-27` | D4安全 | 双路径输出脱敏（小写 ak/sk） | `safety-policy.mjs:45` | 待提单 |
| 8 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry.mjs:189-195` | 待提单 |
| 9 | P1 | `D9-9` | D9协议 | tools/call 超时取消能力未声明 | `mcp-protocol.mjs:47-49` | SPEC |
| 10 | P1 | `EXP-E01` | D10评测 | 中文「云主机」未路由 | `tools.mjs:1997-2252` | 待提单 |

### 根因详情（关键缺陷）

**#1 [P0] D2-4**：`redactSecrets('{"ak":"AKID123456",...}')` 原样返回明文，`safety-policy.mjs:45` 正则 `/(AK|SK)/` 不匹配带引号 JSON 键且 `redactString()` 不做 JSON.parse（I 类红线）。

**#2-#5/#10 [P1/P2] 中文意图路由**：D3-S1/S2/S3/S5 与 EXP-E01 五处 MISS 同根因——`serviceCatalog()`（`tools.mjs:1997`）中文分词粘连成单 token，无英文字符命中，回落 `tools.mjs:2252` `Run hcloud --help`。

**#6 [P2] D4-25**：`huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 边界要求前导字母/数字，空格分隔写命令首词未命中，回落 `:111-112` `cli:invoke`。

**#7 [P1] D4-27**：`safety-policy.mjs:45` `/(AK|SK)/` 仅匹配大写，小写 `ak=/sk=` 明文残留（I 类红线）。

**#8 [P2] D8-9**：`telemetry.mjs:189-195` `sanitizeValue()` 缺敏感键名/值过滤。

**#9 [P1] D9-9 SPEC**：`mcp-protocol.mjs:47-49` `initialize` 仅声明 `capabilities.tools`，未声明 `notifications.cancellation`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 列标注「Windows 专属（升级检测链 EINVAL 专属）」，本机 Linux 结构性不适用，由 NR3 展开级代表覆盖，无需改。 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C1` | D3功能 | ECS生命周期E2E | 真云实机执行：CreateVpc/CreateSubnet 成功（昨日 VPC 配额已恢复），ECS CreateServers 命中 Ecs.0067「Your account is insufficient balance」账户余额不足，E2E 提前终止；finally 已删 subnet+pc 归零无泄漏。账户级环境阻塞，非 devkit 产品缺陷。解除条件=账户充值/余额恢复。 |
| `D3-C2` | D3功能 | OBS静态站部署E2E | 真云实机执行：OBS 建桶命中 403 UserRestricted「This operation is forbidden for restricted users」，账户级受限无法建桶，E2E 提前终止；未产生资源无泄漏。账户级环境阻塞，非 devkit 产品缺陷。解除条件=账户 OBS 受限状态解除。 |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | 真云实机执行：只读规划/引导 4/5 通过；最小 EIP 创建命中 VPC.0502「Tenant status is op_restricted」账户租户状态受限，且只读查询 region ap-southeast-3 与 project cn-north-4 不匹配。账户级环境阻塞，非 devkit 产品缺陷。EIP 归零 total_count=0。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [ ] 红线（I 类）违规：`2`（D2-4 JSON 键值形态凭证脱敏、D4-27 小写 ak/sk 脱敏——均已在缺陷清单）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云 E2E 均用 hcloud 凭证文件，未落盘明文）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 沙箱会话（D3-C6） | 是 | 已关闭 | check_user→connect→credentials→exec→close_session 全 PASS |
| 沙箱部署（D3-C3） | 是 | 已关闭 | connect→upload→deploy_nginx(8080)→deploy_check PASS→close_session ok（首跑端口冲突瞬态，重跑 5/5 PASS） |
| VPC/子网/ECS（D3-C1） | VPC/子网创建成功，ECS 未建成（余额不足） | 已删 | `subnet:OK vpc:OK`，finally 归零无泄漏 |
| OBS 桶（D3-C2） | 否（账户受限 403） | — | 未产生资源无泄漏 |
| EIP（D3-C7） | 否（租户 op_restricted） | — | `total_count=0` |

> 真云只删本次创建资源（唯一时间戳命名），删除前全量盘点 + 归零验证，禁删既有/他人资源。残留即 FAIL：本轮无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（tools/call 超时取消能力未声明，`mcp-protocol.mjs:47-49`）。
- 本轮新变化：昨日 VPC 配额已恢复（D3-C1 VPC/子网可建），但账户转入「余额不足/受限租户」状态，阻断 ECS/EIP/OBS 三项真云建删（`Ecs.0067` / `VPC.0502 op_restricted` / OBS `403 UserRestricted`），为账户级环境阻塞，非 devkit 产品缺陷，需维护者充值/解除受限后复测。
- 本轮未覆盖（说明范围）：真实 Agent 会话行为评测（D10 真实端侧会话需 CDP 自动化，非 DSH 客户端）；UI/终端矩阵多客户端联动（单机仅能量证本客户端）。
- 建议：`serviceCatalog()` 增加 CJK 同义词表（云主机→ECS、删VPC→VPC 等）可一次性收敛 D3-S1/S2/S3/S5 与 EXP-E01 五处 MISS；凭证脱敏建议 `JSON.parse` 后递归脱敏，统一收敛 D2-4/D4-27 两处 I 类红线。
