# L2 轻量激活评测（11 个长尾技能）

> 目的：验证「覆盖地图」里 11 个长尾技能能否被 agent 正确激活，补足端到端任务（L1）覆盖不到的服务。
> 评测方式：零真云成本（确定性探测，不调 LLM、不建资源）。二维判据见下。

## 评测二维

| 维度 | 工具 | 判据 | 语义 |
|---|---|---|---|
| ① 路由 | `huaweicloud_service_catalog(intent=…)` | `recommendedServices` 命中期望服务 | 能力发现：意图能否路由到正确服务 |
| ② 激活 | `huaweicloud_retrieve_skill(name=…)` | 返回 `{ok:true, content:…}` | 技能本体：精确名能否取到 SKILL.md 全文 |

## 实测结果（2026-10-14）

| 技能 | 期望服务 | 路由 | 激活 |
|---|---|---|---|
| huawei-cbr | CBR | ❌ 兜底 | ✅ |
| huawei-gaussdb | GaussDB | ✅ | ✅ |
| huawei-dds-dcs | DDS/DCS | ✅ | ✅ |
| huawei-dew | KMS/CSMS | ✅ | ✅ |
| huawei-cts | CTS | ❌ 兜底 | ✅ |
| huawei-cloud-eye | CES | ❌ 兜底 | ✅ |
| huawei-waf-aad | WAF | ❌ 兜底 | ✅ |
| huawei-apig | APIG | ❌ 兜底 | ✅ |
| huawei-modelarts | ModelArts | ❌ 兜底 | ✅ |
| huawei-voucher | Incentive Voucher | ✅ | ✅ |
| huawei-sandbox | Sandbox | ✅ | ✅ |
| huawei-deployment | CodeArtsDeploy | ❌ 兜底 | ✅ |
| **合计** | | **5/12** | **12/12** |

## 核心发现（能力发现缺口）

- **激活层全可达（12/12）**：29 个 SKILL.md 本体都在，`retrieve_skill` 精确名全部能取到全文——技能「存在且可加载」无缺口。
- **路由层缺口（7 个）**：`huawei-cbr` / `huawei-cts` / `huawei-cloud-eye` / `huawei-waf-aad` / `huawei-apig` / `huawei-modelarts` / `huawei-deployment` 这 7 个服务，`service_catalog` 用自然语言意图**无法路由**到（返回兜底「Run hcloud --help…」）。

**含义**：7 个技能依赖「能力发现（service_catalog）→ 定位技能名 → retrieve_skill」这条首选链路时，会在第一跳断链。agent 只能靠模型记忆硬猜技能名（如 `huawei-cbr`）才能激活，激活率与稳定性下降。这是 devkit 的能力发现路由表对长尾服务覆盖不全的缺口，建议作为上游改进点（`service_catalog` 意图路由补全这 7 个服务）。

## 复跑

```bash
node skill-bench/l2/run-l2-eval.mjs
```
## 版本对比（2026-10-16 加测）：SUT 升级后 L2 重测

同一探测脚本、同一评测机，仅换被测 SUT（`BENCH_MCP_SERVER` 指向不同安装目录）：

| 被测版本 | `service_catalog` 路由 | `retrieve_skill` 激活（旧名） | `retrieve_skill`（新名） | 产物 |
|---|---|---|---|---|
| `huaweicloud-devkit@1.1.1-next.15` | 5/12 | **12/12** | — | `l2-eval-20261016015831-huaweicloud-devkit_1.1.1-next.15.json` |
| `huaweicloud-devkit@1.1.9-next.0` | **8/12** | **5/12** | **7/7** | `l2-eval-20261016020017-huaweicloud-devkit_1.1.9-next.0.json` |

**两条结论**：

1. **路由缺口部分修复**：`cbr`/`cts`/`cloud-eye` 已可命中（上游 1.1.8 中文关键词修复生效）；仍 MISS 的 4 个 = `waf-aad`/`apig`/`modelarts`/`deployment` → 已在既有单 [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852) 更新版本化证据。
2. **技能改名导致旧名激活回归（新发现）**：1.1.9-next.0 将 7 个长尾技能改名（`huawei-gaussdb` → `huawei-cloud-gaussdb-instance-management` 等），**旧名全部 MISS、新名 7/7 可达** → 技能本体都在，缺的是**旧名别名回退**；影响所有按旧名调用的下游。已提上游 **[#930](https://github.com/huaweicloud/huaweicloud-devkit/issues/930)**。

> 探测已加固：结果 `meta` 记录 `mcpServer` + `devkitVersion`，文件名带版本后缀（可自证跑在哪版 SUT 上）；`L2_SET` 支持「旧名 + 新名」双探测，用于区分「改名」与「缺失」。

## C 项探针（2026-10-16 新增，均可零成本复跑）

| 脚本 | 作用 | 结果文件 |
|---|---|---|
| `l2/run-horizontal-eval.mjs` | 横向 8 技能激活实测（C2） | `l2/results/horizontal-eval-*` |
| `l2/probe-untested-capabilities.mjs` | 未测能力只读探针：9 项候选操作可调通性（C3） | `l2/results/untested-capabilities-*` |
| `l2/probe-sandbox-tools.mjs` | sandbox 类 MCP 工具清单 + 最小参数探测（C1） | `l2/results/sandbox-probe-*` |
| `l2/probe-sandbox-exec.mjs` | sandbox 执行层：connect → exec_one_shot → **close（归零）**（C1） | `l2/results/sandbox-exec-*` |
