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