# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-17 05:24:00（北京时间）
> **执行归档**：`results/AtomCode/2026-11-17-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项产品缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64） |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.14`（npm latest，gitHead `bd985051`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：①源码级探针直调（`node <case>/probe.mjs`，导入 `plugins/huaweicloud-core/src/*.mjs` 直调 `redactString`/`serviceCatalog`/`sanitizeValue`/`getRegionalAvailability` 等函数 + `spawnSync` 跑 CLI `doctor`/`status`/MCP 协议握手）；②真云 E2E 用 `scripts/realcloud_e2e.mjs` 真机执行（ECS/VPC/子网/OBS/沙箱 建删资源归零）；③评测集 EXP-E01~E15 用 `eval/harness/run-eval.mjs` 跑 `huaweicloud_service_catalog` 15 条中文意图路由。P0 全部执行为 PASS/FAIL，无 NOT_RUN（唯一例外 D1-39 为 Windows 专属 P0）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（D1-39 Windows 专属在 Linux 侧 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 12 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `91.7%` |
| P0 / P1 / P2 新增缺陷 | `1 / 8 / 3`（含 2 项测试侧 D3-C1/D3-C2；实际产品缺陷 P0=1、P1=6、P2=3，另 SPEC-MISMATCH 1 项） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本轮创建 ECS/VPC/子网/OBS 全部删除归零` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单（含 2 项测试侧） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | 未执行（D1-39 Windows 专属） |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:34-45` 正则仅大写 AK/SK | 待提单 |
| 2 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS(带不改约束) | `tools.mjs:2587,2611-2613` 中文意图路由 miss | 待提单 |
| 3 | P1 | `D3-S2` | D3功能 | 场景-删VPC先确认 | 同上（serviceCatalog 分词缺陷） | 待提单 |
| 4 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL | 同上 | 待提单 |
| 5 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | 同上 | 待提单 |
| 6 | P1 | `D3-C7` | D3功能 | 跨区域资源操作引导 | `tools.mjs:2925` 静态可用性未做 IAM 项目预检 | 待提单 |
| 7 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:34-45` 同 #1 | 待提单 |
| 8 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 边界 | 待提单 |
| 9 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry/telemetry.mjs:190-197` sanitizeValue 未脱敏 | 待提单 |
| 10 | P1 | `EXP-E01` | 评测集 | 中文意图路由（ECS查询） | `tools.mjs:2587` 同 #2 | 待提单 |
| 11 | P1 | `D9-9` | D9协议 | tools/call 超时协议语义 | `mcp-protocol.mjs:60-61` capabilities 未声明取消 | SPEC-MISMATCH 待裁决 |
| 12 | P1 | `D3-C1` | D3功能 | ECS生命周期E2E | 【测试侧】ECS 异步删除轮询窗 150s 过短 | 非产品缺陷 |
| 13 | P1 | `D3-C2` | D3功能 | OBS静态站部署E2E | 【测试侧】realcloud_e2e.mjs 建桶断言误判 | 非产品缺陷 |

### 根因详情

1. **D2-4 / D4-27（P0，凭证脱敏）**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-45` `redactString()` 仅覆盖大写 `(AK|SK)\s*[:=]` 与全称键，小写 `ak=`/`sk=` 及 JSON `"ak":"value"` 形态未脱敏。
2. **D3-S1/S2/S3/S5/EXP-E01（serviceCatalog 路由 miss）**：`plugins/huaweicloud-core/src/tools.mjs:2587` `it.split(/[\s,./-]+/)` 对「中文+英文无空格」不切分，英文服务名走 `tokens.has(kw)` 全等匹配 → 命中空 → fallback `tools.mjs:2611-2613`。
3. **D3-C7（跨区域引导）**：`plugins/huaweicloud-core/src/tools.mjs:2925` 静态 `available=true` 未对目标区域 IAM token 项目绑定预检，写操作 `VPC.0501` 失败。
4. **D4-25（Python hook 分类）**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 边界 `(^|[A-Za-z0-9])` 使空格分隔写命令未命中 → `cli:invoke`。
5. **D8-9（遥测脱敏）**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-197` `sanitizeValue()` 未实现 AK/SK 脱敏。
6. **D9-9（SPEC-MISMATCH）**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:60-61` `capabilities:{tools:{}}` 未声明 cancellation。
7. **D3-C1/D3-C2（测试侧）**：非产品缺陷，见 FINDINGS #7/#8；产品 CreateServers/DeleteServers/OBS 建删行为正确，资源已归零。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属用例（Windows 升级检测链 EINVAL 专属）；本机为 Linux，Linux 侧由展开级 NR3 终端矩阵按负面/环境验证覆盖，故标 NOT_RUN（P0 唯一授权例外） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无可疑运行时凭证泄露；但发现 P0 脱敏缺陷 D2-4/D4-27（redactString 漏脱敏 ak/sk/token），已记 FINDINGS #1`
- [x] 写操作误判 read-only：`无写操作被误判为只读；D4-25 为反向（写操作被误判为 cli:invoke），已记 FINDINGS #4`
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：`D2-4/D4-27/D8-9 三项脱敏用例均 FAIL，如实回填未虚标 PASS；其余脱敏用例 PASS 均有 evidencePath 证据`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS `testbot3-hermes-ecs-4863601129`（D3-C1） | ✅ CreateServers 返回 serverIds | ✅ DeleteServers 提交 + 代理手工补删 | ✅ ECS count=0 |
| VPC `testbot3-hermes-e2e-4863601129`（D3-C1） | ✅ CreateVpc | ✅ DeleteVpc（先删 ECS/子网） | ✅ VPC count=0 |
| 子网 `testbot3-hermes-e2e-4863601129-subnet` | ✅ CreateSubnet | ✅ DeleteSubnet | ✅ 已删 |
| OBS `testbot3-hermes-obs-4863601129`（D3-C2） | ✅ 建桶成功 | ✅ 删桶成功 | ✅ OBS count=0 |

> 真云 D3-C1/D3-C2 的首轮失败源于本机残留占位代理 `~/.config/huaweicloud/proxy.json`（`proxy.example`），已备份 `proxy.json.bak-20261117` 并清空后重跑；D3-C3/D3-C6 转 PASS，D3-C1/D3-C2 归零复核通过。**本轮只删本次创建（唯一时间戳前缀 `…-4863601129`），未误删其他客户端并发资源。**

---

## 八、遗留与建议

- **D9-9（SPEC-MISMATCH）**：MCP 协议 `capabilities` 未声明 `cancellation`/`notifications`/`cancel`，需维护者裁决是否属契约漂移。
- **D3-C1/D3-C2（测试侧）**：建议维护 `scripts/realcloud_e2e.mjs` 两处——①ECS 删除归零轮询窗 150s 不足，改轮询上限或轮询到 `ListServersDetails` 不含该 ID 为止；②OBS「建桶」断言对含 `Notice` 提示的成功返回误判 false。
- **环境残留**：`~/.config/huaweicloud/proxy.json` 昨日残留占位代理（`proxy.example`），已清理；建议增加探针前置断言或 `prepare_env.py` 自检该文件非占位值。
- **硬编码前缀**：`realcloud_e2e.mjs` 统一用 `testbot3-hermes-*` 命名，多客户端共享云账号 `hw018619646` 并发时靠时间戳后缀区分，存在误删他客户端资源的风险，建议按客户端+机器打唯一前缀。
- **产品缺陷（FINDINGS #1~#6）**：均为昨日起持续复现的历史缺陷，本轮重验根因未变，交由 `file_issue.py` 历史查重后统一提单/补复发。