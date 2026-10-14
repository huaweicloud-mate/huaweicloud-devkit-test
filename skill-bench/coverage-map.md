# huaweicloud-devkit skill 覆盖地图（L2 基线）

> 目的：把 29 个 skill 逐一落到「端到端任务（L1）」或「轻量激活评测（L2）」，避免「3 个任务误当全覆盖」。
> 实测 SKILL.md 总数：**29**（`hdk/plugins/huaweicloud-core/skills/`）。

## 一、三分类

| 类别 | 数量 | 覆盖方式 |
|---|---|---|
| 横向/元技能 | 8 | 任何端到端任务天然带出，不单独立评测项 |
| 服务场景技能 | 21 | 端到端任务（核心高频）+ 轻量激活评测（长尾）|
| 合计 | **29** | |

## 二、横向技能（8，端到端任务天然覆盖）

`huaweicloud-core` · `huaweicloud-cli-and-auth` · `huaweicloud-capability-discovery` · `huaweicloud-api-and-sdk` · `huaweicloud-safety` · `huaweicloud-troubleshooting` · `huawei-getting-started` · `huawei-iac`

每个端到端任务都会经 `service_catalog`（能力发现）、`retrieve_skill`、`run_readonly/approved_command`，天然带出这些横向技能，无需单独立评测项。

## 三、服务技能覆盖规划（21）

### 端到端任务层（L1 · 真机 + 归零）

| 技能 | 覆盖任务 | 状态 |
|---|---|---|
| huawei-obs | T1 部署静态网站 | ✅ v1 已建 |
| huawei-billing | T2 查账户余额 | ✅ v1 已建 |
| huawei-vpc | T3 配置安全组 | ✅ v1 已建 |
| huawei-ecs | T4 创建/查询 ECS 实例 | ⬜ 待建 |
| huawei-iam | T5 创建只读 IAM 用户/权限 | ⬜ 待建 |
| huawei-rds | T6 创建 RDS 实例 | ⬜ 待建 |
| huawei-functiongraph | T7 部署并触发函数 | ⬜ 待建 |
| huawei-cce | T8 部署容器工作负载 | ⬜ 待建 |
| huawei-deployment | T9 CloudDeploy 流水线任务 | ⬜ 待建 |
| huawei-smn-dms | T10 发消息/建队列 | ⬜ 待建 |

### 轻量激活评测层（L2 · 只读/规划为主，零真云成本）

以下 11 个技能以「激活率 + 路由准确率 + 工具链正确性」轻量评测覆盖（复用 `eval/harness/run-agent-eval.mjs` 自然语言评测集），不逐条真机创建：

`huawei-cbr` · `huawei-gaussdb` · `huawei-dds-dcs` · `huawei-dew` · `huawei-cts` · `huawei-cloud-eye` · `huawei-waf-aad` · `huawei-apig` · `huawei-modelarts` · `huawei-voucher` · `huawei-sandbox`

> 说明：以上多为只读/检索/低风险场景，或需特殊前置（企业实名、专属套餐），先以激活评测兜覆盖，待预算允许再升级为端到端。

## 四、覆盖率口径（双轨）

| 口径 | v1 现状 | 目标 |
|---|---|---|
| 端到端任务覆盖（L1） | 3/21 服务技能 | 10/21（补 T4~T10）|
| 轻量激活覆盖（L2） | 0/11 | 11/11 |
| 横向技能 | 8/8（端到端天然带出）| 8/8 |

**v1 总覆盖 = 端到端 3 + 横向 8 = 11/29，非「全覆盖」**；补齐 L1(10) + L2(11) + 横向(8) 后 = 29/29。