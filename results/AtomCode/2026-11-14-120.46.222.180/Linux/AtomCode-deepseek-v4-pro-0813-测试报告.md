# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-14 05:57:00（北京时间）
> **执行归档**：`results/AtomCode/2026-11-14-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 P0 缺陷 D2-4/D4-27 凭证脱敏漏报）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux x86_64 |
| Node / npm / Python | Node v22.13.0 / npm 10 / Python 3.12.3 |
| 被测版本（SUT） | `1.1.14-next.5`（npm @next，gitHead `4fb59d76`） |
| 工具全集 | `47`（TOOL_DEFINITIONS，src 布局直调） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 提示配对 7.3.12，见 D1-3） |
| 真云凭证 | cn-north-4（AK/SK，已真机真云执行） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **SUT 版本跳变**：本日被测包由昨日 `v2.0.0-next.3`（dist/.js/packs）回退至 `1.1.14-next.5`（src/*.mjs 平铺，无 dist/vendor gate/packs）。探针已全部以 src 布局直调重跑取证。

> **执行方法**：探针脚本（.mjs）直调 `node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；真云用例 `scripts/realcloud_e2e.mjs` 真机执行（建删资源归零）；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146 |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 131 / 13 / 0 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 90.3% |
| P0 / P1 / P2 新增缺陷 | 1 / 3 / 2 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 93 | 有证据且通过 PASS 门禁 |
| FAIL | 12 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 1 | D9-9 cancellation 未声明，契约漂移 |
| NOT_RUN | 1 | D1-39 Windows 专属在 Linux（OS 专属豁免） |
| **合计** | **107** | P0=21 / P1=56 / P2=30 |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01（serviceCatalog 路由 miss，同 #2 根因） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | P1=39 |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` `D4-27` | redactSecrets 不脱敏小写 ak/sk 键与 JSON 键名 | 输出无明文凭证字段 | `AKID123456`/`AKID456`/`secret789` 明文泄露 | `safety-policy.mjs:34-45` | P | 待提单 |
| 2 | P1 | `D3-S1` `D3-S2` `D3-S3` `D3-S5` `EXP-E01` | serviceCatalog 中文意图含英文服务名路由 miss | 命中对应 service，不得 fallback | 返回 `Run hcloud --help...` | `tools.mjs:2587,2591,2611-2613` | P | 待提单 |
| 3 | P1 | `D3-C7` | 跨区域写操作未预警项目绑定不匹配 | 预检并引导切换区域 | EIP 创建 `VPC.0501` 失败 | `tools.mjs:2925,3045-3046` | P | 待提单 |
| 4 | P2 | `D4-25` | Python hook 写命令误分类 cli:invoke | 写命令→cli:write | `DeleteServers` 分类 cli:invoke | `hooks/huaweicloud-safety.py:46` | P | 待提单 |
| 5 | P2 | `D8-9` | sanitizeValue 不脱敏 AK/SK | 移除敏感值与非法字符 | `AK=ABC123XYZ` 原样泄露 | `telemetry/telemetry.mjs:190-197` | P | 待提单 |
| 6 | P1 | `D9-9` | mcp-protocol 未声明 cancellation | capabilities 声明取消语义 | 仅 `{tools:{}}`（SPEC-MISMATCH） | `mcp-protocol.mjs:60-62` | P | 待提单 |
| 7 | 非产品缺陷 | `D1-3` | doctor 报 Node 版本不满足 | —（环境问题） | Node 22.13 < 22.19 | 测试机环境 | G | 不提单 |
| 8 | 测试侧 | `D3-C1` | 真云 ECS 轮询未确认归零（已补删归零） | finally 归零 | ECS 轮询仍在/未确认 | `scripts/realcloud_e2e.mjs` | G | 不提单 |
| 9 | 测试侧 | `D3-C2` | OBS建桶断言误判（建桶成功，已归零） | 建桶成功判 PASS | 断言 false | `scripts/realcloud_e2e.mjs` | G | 不提单 |

> P/G/I 列：`P`=产品缺陷（需提单）、`G`=环境/测试侧（不进入产品提单）。

### 根因详情（P0/P1 缺陷）

```markdown
**#1 [P0] D2-4/D4-27 凭证脱敏漏报**

- 期望：含 ak/sk/token 明文凭证的输入，输出不得含明文。
- 实际：`redactSecrets('{"ak":"AKID123456",...}')` 原样返回；`redactSecrets("token=abc123 ak=AKID456 sk=secret789")` 返回 `token=<redacted> ak=AKID456 sk=secret789`。
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:34-45`
  `redactString()` 的键名正则仅覆盖大写 `(AK|SK)\s*[:=]`（:45，区分大小写）与全称键（:42，要求键后紧跟 `:=`）；小写 `ak=`/`sk=` 不匹配；JSON `"ak":"` 的键与冒号间隔引号也不匹配。

**#2 [P1] D3-S1/S2/S3/S5/EXP-E01 serviceCatalog 路由 miss**

- 根因：`tools.mjs:2587` 分词 `it.split(/[\s,./-]+/)` 不切分「中文+英文无空格」；`:2591` 英文关键词仅 `tokens.has(kw)` 全等匹配；命中空 → `:2611-2613` fallback。

**#3 [P1] D3-C7 跨区域未预警**

- 根因：`tools.mjs:2925` `getRegionalAvailability` 仅静态 cache（`:3045`）服务级可用性，`:3046` disclaimer；`plan_cli_command`（`:1348`）未预检区域-项目绑定。

**#6 [P1] D9-9 cancellation 未声明**

- 根因：`mcp-protocol.mjs:60-62` `capabilities: { tools: {} }` 未声明取消/超时能力。
```

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属升级检测链用例，Linux 不适用（OS 列`专属`，展开级 EXP-NR3-10 代表 Linux 覆盖） | — |

> 仅 1 条 NOT_RUN（OS 专属豁免，属「调归属」——实际为 OS 专属在非对应 OS 的标准豁免）。无 BELOCKED 用例。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件（I 类）：`0`（P0 缺陷 D2-4/D4-27 为「脱敏功能不生效」的缺陷，真云/探针执行过程中无真实凭证外泄到证据目录；证据目录已核查无原始 AK/SK）
- [x] 写操作误判 read-only：`0`
- [x] 红线违反：`无`
- [x] 脱敏复核：证据目录无原始凭证明文（D2-4/D4-27 证据内 `AKID123456`/`AKID456` 为探针自造测试假凭证，非真实 AK/SK）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是 | 已删（测试侧补删） | `ListServersDetails` 前缀 `testbot3-hermes-ecs-4606265877` 残留 0 |
| VPC（D3-C1） | 是 | 已删 | `ListVpcs` 前缀 `testbot3-hermes-e2e-4606265877` 残留 0 |
| Subnet（D3-C1） | 是 | 已删 | `ListSubnets` 同前缀残留 0 |
| OBS 桶（D3-C2） | 是 | 已删 | `OBS ls` 前缀 `testbot3-hermes-obs-` 残留 0 |
| 沙箱会话（D3-C3/C6） | 是 | 已 close | close_session 返回 ok |

> 真云只删本次创建资源；删除前全量盘点 + 唯一时间戳名（`*4606265877`）白名单，未触碰既有资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（mcp-protocol 取消/超时语义）
- 本轮未覆盖：多终端矩阵（AtomCode 单客户端）、审批流实时对话框（CDP 会话自动化）。
- 建议：修复 #1（P0 凭证脱敏）为最高优先级；#2 serviceCatalog 路由补齐「中文+英文无空格」token 化与关键词覆盖；#5 sanitizeValue 复用 redactString 脱敏逻辑。