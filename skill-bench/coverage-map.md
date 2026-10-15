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
| huawei-ecs | T4 查询 ECS 实例列表（只读）| ✅ 已建 |
| huawei-iam | T5 查询 IAM 用户列表（只读）| ✅ 已建 |
| huawei-rds | T6 查询 RDS 实例列表（只读）| ✅ 已建 |
| huawei-functiongraph | T7 查询函数列表（只读）| ✅ 已建 |
| huawei-cce | T8 查询 CCE 集群列表（只读）| ✅ 已建 |
| huawei-deployment | T9 CloudDeploy（CodeArts 未启用，真机查不了）| 🔶 L2 兜 |
| huawei-smn-dms | T10 创建 SMN 主题 | ✅ 已建 |
| huawei-vpc | T11 出向规则（egress）| ✅ 已建 |
| huawei-smn-dms | T12 发布消息 | ✅ 已建 |
| huawei-iam | T13 用户组+自定义策略 | ✅ 已建 |
| huawei-billing | T14 账单费用明细 | ✅ 已建 |

### 轻量激活评测层（L2 · 只读/规划为主，零真云成本）

以下 12 个技能以「激活率 + 路由准确率 + 工具链正确性」轻量评测覆盖（复用 `eval/harness/run-agent-eval.mjs` 自然语言评测集），不逐条真机创建：

`huawei-cbr` · `huawei-gaussdb` · `huawei-dds-dcs` · `huawei-dew` · `huawei-cts` · `huawei-cloud-eye` · `huawei-waf-aad` · `huawei-apig` · `huawei-modelarts` · `huawei-voucher` · `huawei-sandbox` · `huawei-deployment`

> 说明：以上多为只读/检索/低风险场景，或需特殊前置（企业实名、专属套餐），先以激活评测兜覆盖，待预算允许再升级为端到端。

## 四、覆盖率口径（双轨）

| 口径 | v1 现状 | 目标 |
|---|---|---|
| 端到端任务覆盖（L1） | 13/21 服务技能 | 14/21 |
| 轻量激活覆盖（L2） | ✅ 12/12 激活（详见 `l2/README.md`）| 12/12 |
| 横向技能 | 8/8（端到端天然带出）| 8/8 |

**L2 实测发现**：`retrieve_skill` 激活 12/12 全可达，但 `service_catalog` 路由仅 5/12——`huawei-cbr/cts/cloud-eye/waf-aad/apig/modelarts/deployment` 7 个服务的「意图→服务」路由断链（能力发现缺口，详见 `l2/README.md`）。

**当前覆盖 = 端到端 13（L1）+ 轻量激活 12（L2）+ 横向 8 = 33 次覆盖 / 29 skill（L1 多能力已超出「skill 粒度」）**。

## 五、L1 仍缺的深层能力（高成本/前置/CLI 坑，暂 L2 兜）

| 技能 | 未补能力 | 原因 |
|---|---|---|
| huawei-ecs | 创建实例 / EIP / 磁盘 / 弹性伸缩 | 创建按量付费 + 需 flavor/镜像 |
| huawei-rds | 创建实例 / 备份 / 恢复 | 创建按量付费 |
| huawei-cce | 创建集群 / 节点池 / SWR 镜像推送 | 付费+需节点，且 CreateCluster 在 KooCLI 7.2.12 有 bug |
| huawei-functiongraph | 创建函数 / 触发器 / 调用 | inline 传参不明确，zip 假成功坑 |
| huawei-iam | 委托 STS / 访问密钥 | 需跨服务信任；skill 红线禁建长时凭证 |
| huawei-obs | 版本控制 / 生命周期 / CORS | hcloud CLI 无对应命令（走 obsutil）|
| huawei-vpc | EIP / 子网 / 对等连接 | 需独立资源/配额 |