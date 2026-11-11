# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-12 05:26:00（北京时间）
> **执行归档**：`results/AtomCode/2026-11-12-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux`（aarch64，Ubuntu 24.04） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.14-next.2`（npm @next，gitHead `5c9478d3a`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS.length） |
| hcloud / 依赖 | `KooCLI 7.2.12`，doctor/status/install 已配置 |
| 真云凭证 | `cn-north-4`（AK/SK 已配置，真机执行） |
| 测试类型 | 源码级探针（直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数）/ MCP 协议 / 真云 E2E（建删资源） |
| daily 基础用例 | 设计级 107 / 展开级 39（另使命 mission-001 9 条） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；真云用例走 `scripts/realcloud_e2e.mjs` 经 `callTool`/`hcloud` 真机建删资源；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 12 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `91.7%` |
| P0 / P1 / P2 新增缺陷 | `1 / 8 / 3` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `本次全部归零（我的 ECS 727255ff / subnet 687328ef / VPC ffcd1e7c 已删，EIP total_count=0，OBS 桶已删）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D9-9） |
| NOT_RUN | `1` | OS 专属用例在非对应 OS（D1-39 Windows 专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由 miss，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 本轮未覆盖 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 维度 | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | JSON 字符串形式凭证（小写键 ak/sk/token）不被脱敏 | 输出不含 `AKID123456` | 原文含 `AKID123456`/`secret789`/`TOKEN123` | `safety-policy.mjs:34-47` | P | 待提单 |
| 2 | P1 | `D3-C7` | D3功能 | 跨区域写操作因 token 项目不匹配失败，引导未预警 | 提前识别区域不匹配并引导 | 返回 VPC.0501 失败 | `tools.mjs` 区域可用性/plan | P | 待提单 |
| 3 | P1 | `D3-S1/S2/S3` | D3功能 | serviceCatalog 中文意图含英文服务名路由 miss | 命中对应服务 | 返回 fallback | `tools.mjs:2548-2552` | P | 待提单 |
| 4 | P1 | `D3-S5`(P2) | D3功能 | 复合意图分层路由 miss | 命中对应服务 | 返回 fallback | `tools.mjs:2548-2552` | P | 待提单 |
| 5 | P2 | `D4-25` | D4安全 | 空格分隔写命令未被分类为 `cli:write` | 分类为 cli:write | 落到 cli:invoke | `huaweicloud-safety.py:46` | P | 待提单 |
| 6 | P1 | `D4-27` | D4安全 | 小写 `ak=`/`sk=` 不被脱敏 | 输出不含 `AKID456` | 明文残留 | `safety-policy.mjs:45` | P | 待提单 |
| 7 | P2 | `D8-9` | D8质量 | `sanitizeValue` 完全不脱敏任何键值 | 输出不含明文值 | 原样返回 | `telemetry.mjs:190-199` | P | 待提单 |
| 8 | P1 | `D9-9` | D9协议 | 未声明 cancellation/notifications/cancel | 协议面声明取消语义 | 源码无声明 | `mcp-protocol.mjs` | SPEC | 待裁决 |
| 9 | P1 | `EXP-E01` | D10评测 | 中文意图含英文服务名路由 miss | 命中服务 | 返回 fallback | `tools.mjs:2548-2552` | P | 待提单 |

### 根因详情（缺陷根因定位）

```markdown
**#1 [P0] D2-4 凭证脱敏正确性**

- 期望：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` → 不含 `AKID123456`
- 实际：整串原样返回，凭证完整泄露
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:34-47` `redactString()` 只匹配未加引号键的 `key=value`/`key: value` 形式（:45），`(AK|SK)` 正则未加 `i` 标志、仅覆盖大写键名；JSON 引号键 + 小写 ak/sk 均不在覆盖范围

**#6 [P1] D4-27 双路径输出脱敏**

- 期望：`redactSecrets("token=abc123 ak=AKID456 sk=secret789")` → 不含 `AKID456`
- 实际：`token=<redacted> ak=AKID456 sk=secret789`
- 根因：`safety-policy.mjs:45` `/(AK|SK)\s*[:=]\s*(...)/g` 未加 `i` 标志

**#7 [P2] D8-9 安装 ID 与遥测值脱敏**

- 期望：遥测 sanitize 含 `AK=...` 不泄露明文
- 实际：`sanitizeValue("AK=ABC123XYZ")` 返回原样
- 根因：`telemetry/telemetry.mjs:190-199` `sanitizeValue()` 仅做控制字符/截断，无键名脱敏

**#5 [P2] D4-25 Python hook 遥测分类**

- 期望：`hcloud ECS DeleteServers` → `cli:write`
- 实际：落到 `cli:invoke`
- 根因：`hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前向边界未命中空格分隔命令 token

**#3/#4/#9 [P1/P2] serviceCatalog 中文路由 miss**

- 期望：含 ECS/VPC/沙箱语义的中文意图命中对应服务
- 实际：`Run hcloud --help to list available services.`
- 根因：`tools.mjs:2548` 分词 `it.split(/[\s,./-]+/)` 对「中文+英文无空格」不切英文 token；英文关键词仅全等匹配（:2552）；命中空 → fallback `tools.mjs:2574`

**#8 [SPEC] D9-9 tools/call 超时协议语义**

- 根因：`mcp-protocol.mjs` 未实现/未声明取消与超时语义（SPEC-MISMATCH）

**#2 [P1] D3-C7 跨区域资源操作引导**

- 根因：`tools.mjs` 仅校验服务级可用性，未校验目标区域 IAM 项目绑定
```

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标注「专属」），Linux 由展开级 EXP-NR3-10 代表覆盖 | — |

> 无 BLOCKED 用例；无「需环境补测」的假阻塞项。其余 145 条全部执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（探针使用假凭证 AKID123456 等）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 是（`727255ff`，本轮） | 已删 | ListServersDetails 确认已删 |
| VPC | 是（`ffcd1e7c`，本轮） | 已删 | ListVpcs 检查已删 |
| Subnet | 是（`687328ef`，本轮） | 已删 | ListSubnets 检查已删 |
| EIP | 否 | 未创建 | total_count=0 |
| OBS桶 | 是（`testbot3-hermes-obs-4431382584`） | 已删 | 脚本删桶归零 PASS |

> 真云只删本次创建资源；删除前盘点 + 白名单。残留仅剩其它并发客户端（OpenClaw `tctest-openclaw-c1-4431851155`）运行时资源，非本次创建，未触碰。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（tools/call 取消/超时协议语义）。
- 本轮缺陷与 2026-11-11 完全一致（SUT 同为 `5c9478d3a` 未变更），均属已在途/已建档的已知缺陷，提单走历史查重。
- 建议：优先修复 P0 `D2-4`/`D4-2` 系凭证脱敏（小写 ak/sk/token、JSON 引号键），再修 serviceCatalog 中文分词路由（:2548）与 MCP 取消语义。