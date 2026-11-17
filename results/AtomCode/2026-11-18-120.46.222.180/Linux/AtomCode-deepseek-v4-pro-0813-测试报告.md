# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-18 05:15:00（北京时间）
> **执行归档**：`results/AtomCode/2026-11-18-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（x86_64，node v22.23.5） |
| 被测版本（SUT） | `1.1.15-next.1`（npm，gitHead `df6bea57`） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：① 源码级函数直调探针——`node evidence/<case-id>/probe.mjs` 直调 `plugins/huaweicloud-core/src` 中的函数（`redactString`/`serviceCatalog`/`judgeUpdate`/`planHcloudCommand` 等）断言真实行为；② MCP 工具真机调用——`callTool` 直调 `tools.mjs` 导出的 MCP 工具；③ 真云 E2E——`scripts/realcloud_e2e.mjs` 真机执行（最低配置建 VPC/子网/ECS/OBS/沙箱 → 测后删除归零 → 只删本次创建）。每个用例结果写入 `evidence/<case-id>/stdout.log`（JSON，含 status/why/executedAt），探针均非空壳、真实运行。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39，展开级已按客户端+OS 预筛剔除 27 条非本机项） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 12 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `91.7%` |
| P0 / P1 / P2 产品缺陷 | `1 / 3 / 2`（另有 2 项【测试侧】不计入产品缺陷） |
| 红线（I 类）违规 | `无` |
| 资源释放 | `已归零`（ECS/VPC/子网/OBS 桶全部删除并核验） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D9-9） |
| NOT_RUN | `1` | OS 专属 Windows 用例在 Linux 不适用（D1-39） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 诉讼路由未命中（归入缺陷 #2） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | `D2-4`,`D4-27` | 凭证脱敏未覆盖小写 ak/sk 与 JSON 键名，明文泄露 | `safety-policy.mjs:34-45` | 待提单 |
| 2 | P1 | `D3-S1/S2/S3/S5`,`EXP-E01` | serviceCatalog 中文意图含英文服务名路由 miss 返回 fallback | `tools.mjs:2587,2611-2613` | 待提单 |
| 3 | P1 | `D3-C7` | 跨区域写操作未预检 IAM 项目绑定不匹配 | `tools.mjs:2925` | 待提单 |
| 4 | P2 | `D4-25` | Python hook 写命令分类误判 cli:invoke | `hooks/huaweicloud-safety.py:46` | 待提单 |
| 5 | P2 | `D8-9` | 遥测 sanitizeValue 不脱敏任何键值 | `telemetry/telemetry.mjs:190-197` | 待提单 |
| 6 | P1 | `D9-9` | mcp-protocol 未声明 cancellation/超时语义（SPEC-MISMATCH） | `mcp-protocol.mjs:60-61` | 待提单 |
| 7 | 测试侧 | `D3-C1` | ECS 生命周期 E2E finally归零轮询窗（150s）过短误报 | 测试探针，非产品缺陷 | 不提单 |
| 8 | 测试侧 | `D3-C2` | OBS建桶断言关键字误判 false（建删实际成功归零） | 测试脚本，非产品缺陷 | 不提单 |

### 根因详情

- **#1（P0）凭证脱敏**：期望——含 `ak`/`sk`/`token` 明文的输入不泄露明文值。实际——`redactSecrets('{"ak":"AKID123456",...}')` 原样返回；`redactString("token=abc ak=AKID456 sk=secret789")` 仅 `token` 被脱敏。根因——`safety-policy.mjs:42/45` 键名正则区分大小写且要求 `\s*[:=]\s*`，小写 `ak=`/`sk=` 与 JSON `"ak":"` 均不命中。
- **#2（P1）路由**：期望——中文意图含 ECS/VPC/沙箱等服务语义命中路由。实际——`huaweicloud_service_catalog` 返回 fallback `Run hcloud --help...`。根因——`tools.mjs:2587` 分词对「中文+英文无空格」不切英文 token，英文关键词仅全等匹配。
- **#3（P1）跨区域**：期望——目标区域与 token 项目不匹配时预检引导。实际——`get_regional_availability` 报 `available=true`，EIP 创建 `VPC.0501` 失败。根因——`tools.mjs:2925` 仅静态缓存校验，plan 未做项目绑定预检。
- **#4（P2）hook 分类**：期望——写命令分类 `cli:write`。实际——`DeleteServers` 分类 `cli:invoke`。根因——`huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 边界 `(^|[A-Za-z0-9])` 吞空格后未命中。
- **#5（P2）遥测脱敏**：期望——`sanitizeValue` 不泄露 `AK=...` 明文。实际——原样返回。根因——`telemetry.mjs:190-197` 仅做空白/长度处理，无键名脱敏。
- **#6（P1）协议**：期望——MCP 实现声明取消/超时能力。实际——`capabilities: { tools: {} }`。根因——`mcp-protocol.mjs:60-61`（SPEC-MISMATCH 待裁决）。
- **#7/#8（测试侧）**：非产品缺陷，详见 FINDINGS #7/#8。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属：OS 列标注「专属」，Windows 升级检测链 EINVAL 语义在 Linux 不适用，由展开级 `EXP-NR3-10` 代表覆盖 | 调归属（OS 专属） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（发现 1 项产品脱敏缺陷 D2-4/D4-27/D8-9，已记根因并入缺陷单，测试过程未泄露真实凭证）
- [x] 写操作误判 read-only：`无`（D4-25 hook 分类误判属产品缺陷，已提单，非红线违规）
- [x] 红线（I 类）违规：`无`（真云用例均真机执行，未 mock；资源测后归零）
- [x] 脱敏复核：`已完成`（D2-4/D4-27/D8-9 三路脱敏用例实测，发现漏脱敏并提单）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（c6.large.2 ×1，`testbot3-hermes-ecs-4949*`） | D3-C1 创建 | 探针 finally 提交删除 + 代理手工补删 | ECS ListServersDetails 核对 `9d7e6e73-…` 已消失，count=0 |
| VPC（`testbot3-hermes-e2e-4949*`） | D3-C1 创建 | 子网删后 DeleteVpc 补删 | ListVpcs 核对 `670fbe7f-…` 已消失 |
| 子网（`-subnet`） | D3-C1 创建 | DeleteSubnet 补删 | ListSubnets 核对 `38cb8654-…` 已消失 |
| OBS 桶（`testbot3-hermes-obs-4949*`） | D3-C2 创建 | `obs rm -f` 删除 | OBS ls 核对无残留 |
| 沙箱会话（D3-C3/D3-C6） | 连接建立 | `sandbox_close_session` 关闭 | close_session 返回 ok |

> 说明：探针 `realcloud_e2e.mjs` 的 D3-C1 `finally` 块因 ECS 异步删除超过 150s 轮询窗、且子网/VPC 删除被「Router in Use」阻断，未在探针内完成归零；代理在探针结束后手工补删 ECS→子网→VPC 并核验全部归零（只为本次创建的 `testbot3-hermes-*` 资源）。

---

## 八、遗留与建议

- 缺陷 #1/#5 为安全相关（凭证/遥测脱敏），建议优先修复 `safety-policy.mjs` 与 `telemetry/telemetry.mjs` 的键名正则与脱敏逻辑。
- 缺陷 #2 影响中文意图路由准确率，建议 `tools.mjs` 分词对「中文+英文无空格」补充英文子串/服务关键词匹配。
- 缺陷 #6（D9-9 SPEC-MISMATCH）为 MCP 协议契约漂移，待维护方裁决是否补齐 `cancellation`/`notifications` 能力声明。
- 测试脚本侧：`scripts/realcloud_e2e.mjs` 的 D3-C1 `finally` ECS 轮询窗（150s）过短、D3-C2「OBS建桶」断言关键字误判，建议维护 agent 延长轮询窗并修正断言（不计入产品提单）。
- 历史查重：以上 6 项产品缺陷与昨日（2026-11-17）基线完全一致（本日 SUT 仅版本号/CHANGELOG/manifest 变更，`plugins/huaweicloud-core/src` 零改动），提单脚本将按用例号+缺陷语义历史查重，命中即生成 `HISTORY_LINKS.md` 关联清单而不重复开单。