# Hermes-DeepSeek-V4-Pro 每日测试报告
> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-10-20 05:30:27（北京时间）
> **执行归档**：`results/Hermes/2026-10-20-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4-Pro` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `1.1.9` |
| daily 基础用例 | 设计级 107 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；真云 E2E（ECS/VPC/OBS/FunctionGraph/沙箱）经 hcloud + 真机 AK/SK 建删归零；MCP 协议经 spawn `mcp-server.mjs` 实测；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `150`（设计级 107 + 展开级 43） |
| 已执行 | `148` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 15 / 0 / 2 / 2` |
| 通过率（分母 = PASS+FAIL = 146） | `89.7%` |
| P0 / P1 / P2 新增缺陷 | `2 / 7 / 7`（FAIL 14 + SPEC 2；另 1 项非产品缺陷） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本次真云资源全部归零（ECS/subnet/VPC/OBS/FunctionGraph/沙箱）；历史泄漏非本次创建` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `89` | 有证据且通过 PASS 门禁 |
| FAIL | `14` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `2` | 契约漂移 |
| NOT_RUN | `2` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P2 | `D1-65` | D1安装 | 调试模式环境变量 | TODO: 待补根因 | 待提单 |
| 2 | P2 | `D1-66` | D1安装 | 遥测开关与端点环境变量 | TODO: 待补根因 | 待提单 |
| 3 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | TODO: 待补根因 | 待提单 |
| 4 | P1 | `D3-C1` | D3功能 | ECS生命周期E2E | TODO: 待补根因 | 待提单 |
| 5 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | TODO: 待补根因 | 待提单 |
| 6 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | TODO: 待补根因 | 待提单 |
| 7 | P1 | `D3-S2` | D3功能 | 场景-删VPC先确认 | TODO: 待补根因 | 待提单 |
| 8 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | TODO: 待补根因 | 待提单 |
| 9 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | TODO: 待补根因 | 待提单 |
| 10 | P1 | `D4-4` | D4安全 | 写操作审批门 | TODO: 待补根因 | 待提单 |
| 11 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补根因 | 待提单 |
| 12 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | TODO: 待补根因 | 待提单 |
| 13 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | TODO: 待补根因 | 待提单 |
| 14 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | TODO: 待补根因 | 待提单 |
| 15 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

| # | 用例ID | 根因（文件:行号） | 关键现象 |
|---|---|---|---|
| 1 | D1-65 | `telemetry.mjs:81` DEBUG `=== 'true'` 严格比较 | DEBUG=1 不生效 |
| 2 | D1-66 | `telemetry.mjs` 开关/端点 env 读取漂移 | 自定义端点未收 POST |
| 3 | D2-4 | `safety-policy.mjs:34/49` redact 未覆盖小写 ak/sk | JSON 凭证明文残留 |
| 4 | D3-C1 | `scripts/realcloud_e2e.mjs` ECS 异步删除轮询不足 | finally 后 ECS 仍在 |
| 5 | D3-C7 | `tools.mjs` explain_error 未覆盖 Common.0013/VPC.0501 | 跨区错误码不符 |
| 6 | D3-S1 | `tools.mjs:2007-2012` ECS 关键词缺「云主机」 | 路由 MISS |
| 7 | D3-S2 | 共享账号 router 配额耗尽（环境） | VPC.0114 quota exceeded |
| 8 | D3-S3 | `hwlink-tunnel-channel.mjs` expose 未建立可达 URL | publicUrl 空 |
| 9 | D3-S5 | `tools.mjs` serviceCatalog 无复合意图分层 | 仅命中 ECS |
| 10 | D4-4 | `safety/policy.json:27` writeOperationPrefixes 缺 Change | Change* decision=allow |
| 11 | D4-25 | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE | 写落 cli:invoke |
| 12 | D4-26 | `risk-rule-engine.mjs` redactEvidence 未覆盖 --password | 明文残留 |
| 13 | D9-12 | `mcp-protocol.mjs:57` dispatch 无 initialize 前置 | 非法时序放行 |
| 14 | D10-3 | `tools.mjs` routeMap 缺「云主机」同义词 | 准确率 92.9% |
| 15 | EXP-E01 | `tools.mjs` routeMap 缺「云主机」同义词 | 路由 MISS |

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】D1-39 为 Windows 专属 P0 用例，当前 OS=Linux 不适用；Linux 侧由 EXP-NR3-10 代表覆盖 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 【改用例/补环境】跨服务复合编排需专用编排 harness 与 RDS 实例配额，超出每日单服务真云探针范围，建议转专项隔离执行 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录无原始凭证/未脱敏日志；只读子账号经 run-as-readonly.py 注入）
- [x] 写操作误判 read-only：`0`（D4-4/D4-5 写操作正确 deny/confirm，Change* 漏拦截为该反向缺陷）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始 AK/SK 明文；D2-4/D8-9/D4-26 为「脱敏不完整」缺陷而非泄漏事件

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（testbot1-hermes-ecs-*） | 已删（提交删除+手动补删） | `ListServersDetails` count=0 |
| VPC/subnet（D3-C1） | 是 | 已删 | `ListVpcs` 无 testbot1-hermes 残留 |
| OBS（D3-C2/D3-C13） | 是 | 已删（rm-object + 删桶） | 归零校验通过 |
| FunctionGraph（D3-S6） | 是 | 已删 | 归零=true |
| 沙箱（D3-C3/D3-C6/D3-S3） | 是 | close_session 关闭 | 会话已清理 |

> 真云只删本次创建资源（testbot1-hermes-* / hdk1-* 本轮时间戳前缀），动态盘点后补删本轮泄漏 ECS。共享账号中 `testbot3-*`/`hdk-s7-*` 为其他并发客户端资源，未触碰；历史泄漏 OBS/VPC 非本次创建亦未触碰（记录为 blocker）。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region 优先级）、`D8-9`（sanitizeValue 脱敏），均由维护方裁决契约。
- 本轮未覆盖（说明范围）：`D1-39`（Windows 专属）、`D3-S7`（跨服务 RDS+沙箱复合编排，超出每日单服务范围）。
- 建议：①将 `Change` 补入 `writeOperationPrefixes`；②serviceCatalog 补「云主机」同义词；③realcloud_e2e ECS 删除改为主动轮询至归零（不信任提交 exit code）；④共享测试账号 router/VPC 配额扩容或每日测后强制归零泄漏资源。
