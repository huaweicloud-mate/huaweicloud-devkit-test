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
| huawei-ecs | T15 创建 ECS 实例 | ✅ 已建 |
| huawei-functiongraph | T16 创建并调用函数 | ✅ 已建 |
| huawei-rds | T17 创建 RDS 实例 | ✅ 已建 |
| huawei-cce | T18 创建 CCE 集群 | ❌ 0/3（40 轮超预算）|
| huawei-iam | T19 创建委托 | ✅ 已建 |
| huawei-vpc | T20 创建子网 | ✅ 已建 |

### 轻量激活评测层（L2 · 只读/规划为主，零真云成本）

以下 12 个技能以「激活率 + 路由准确率 + 工具链正确性」轻量评测覆盖（复用 `eval/harness/run-agent-eval.mjs` 自然语言评测集），不逐条真机创建：

`huawei-cbr` · `huawei-gaussdb` · `huawei-dds-dcs` · `huawei-dew` · `huawei-cts` · `huawei-cloud-eye` · `huawei-waf-aad` · `huawei-apig` · `huawei-modelarts` · `huawei-voucher` · `huawei-sandbox` · `huawei-deployment`

> 说明：以上多为只读/检索/低风险场景，或需特殊前置（企业实名、专属套餐），先以激活评测兜覆盖，待预算允许再升级为端到端。

## 四、覆盖率口径（双轨）

| 口径 | v1 现状 | 目标 |
|---|---|---|
| 端到端任务覆盖（L1） | 18/21 服务技能 | 19/21 |
| 轻量激活覆盖（L2） | ✅ 12/12 激活（详见 `l2/README.md`）| 12/12 |
| 横向技能 | 8/8（端到端天然带出）| 8/8 |

**L2 实测发现**：`retrieve_skill` 激活 12/12 全可达，但 `service_catalog` 路由仅 5/12——`huawei-cbr/cts/cloud-eye/waf-aad/apig/modelarts/deployment` 7 个服务的「意图→服务」路由断链（能力发现缺口，详见 `l2/README.md`）。

**当前覆盖 = 端到端 18（L1）+ 轻量激活 12（L2）+ 横向 8 = 38 次覆盖 / 29 skill**。

## 五、仍未能真机覆盖的能力

| 技能 | 未补能力 | 原因 |
|---|---|---|
| huawei-cce | 创建集群 | ❌ 已尝试，agent 40 轮（224 万 token）仍未完成——CCE 创建参数极多 + 集群创建耗时，超出单轮 agent 预算，需提升 MAX_ROUNDS 或改 SDK |
| huawei-obs | 版本控制 / 生命周期 / CORS | hcloud CLI 无对应命令，obsutil 未安装 |
| huawei-ecs | EIP 绑定 / 磁盘扩容 / 弹性伸缩 | EIP/磁盘已涵盖在创建+删除，弹性伸缩需 AS 服务 + 前置 |
| huawei-rds | 备份 / 恢复 | 备份需等实例就绪 + 长时间，恢复同理，暂不测 |
| huawei-iam | 委托 STS 临时凭证 | 委托已测（T19），STS assume 需跨服务信任方发起 |
| huawei-vpc | EIP / 对等连接 | EIP 已存在于账户（非新建场景）；对等连接需第二 VPC |