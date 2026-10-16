# 评测 SUT 升级：1.1.1-next.15 → 1.1.9-next.0

- 日期：2026-10-16 ｜ 触发：用户确认「用最新的产品包」
- 背景：R2 引入的**版本锚点**首次暴露「全部基线测于 `huaweicloud-devkit@1.1.1-next.15`（本机安装版）」的问题（此前基线不记版本，无从发现）

## 一、升级方式（隔离安装，不动现有安装）

按仓库自身策略（`scripts/prepare_env.py`：自动取 `latest`/`next` 中版本号更高者 → **`next` = `1.1.9-next.0`**，与每日测试同版本）：

```bash
npm install --prefix <WS>/_sut_119 huaweicloud-devkit@1.1.9-next.0
# npm 包布局：<WS>/_sut_119/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs
export BENCH_MCP_SERVER=<WS>/_sut_119/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs
```

- **不覆盖** `~/.dsh/huaweicloud-plugins`（1.1.1-next.15 保留为对照基线口径）
- 每条 run 记录带 `devkitVersion` 锚点 → 新旧数据可区分、可回溯（R2 的价值在此兑现）

## 二、升级即刻产出的两个结论（L2 零成本探测，同一脚本只换 SUT）

| 被测版本 | `service_catalog` 路由 | `retrieve_skill` 激活（旧名） |
|---|---|---|
| `1.1.1-next.15` | 5/12 | **12/12** |
| `1.1.9-next.0` | **8/12**（↑3） | **5/12**（↓7） |

### 结论 1 · 路由缺口部分修复（上游修复生效）

`huawei-cbr` / `huawei-cts` / `huawei-cloud-eye` 三个服务在 1.1.9-next.0 上已能命中（与上游 1.1.8「中文关键词补齐」方向一致）；**剩余 4 个仍返回兜底**：`waf-aad` / `apig` / `modelarts` / `deployment`。
→ 已在既有单 [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852) 更新版本化证据（不再带「测于旧版」的限定）。

### 结论 2 · 技能改名导致 `retrieve_skill` 舊名回归（新发现，已上游提单）

1.1.9-next.0 将 **7 个长尾技能改名**（技能总数仍 29）：

| 旧名 | 新名 |
|---|---|
| `huawei-gaussdb` | `huawei-cloud-gaussdb-instance-management` |
| `huawei-dds-dcs` | `huawei-cloud-dds-dcs-instance-management` |
| `huawei-dew` | `huawei-cloud-dew-key-management` |
| `huawei-cts` | `huawei-cloud-cts-trace-management` |
| `huawei-waf-aad` | `huawei-cloud-waf-aad-rule-management` |
| `huawei-apig` | `huawei-cloud-apig-instance-management` |
| `huawei-deployment` | `huawei-cloud-deployment-task-management` |

- **旧名全部 MISS（5/12）**，而**新名 7/7 全部可取到** → 技能本体都在，缺的是**旧名别名回退**；
- 影响：所有按旧名调用的下游（评测集、每日用例、文档、客户端引用）断裂；
- 已提上游：**[huaweicloud/huaweicloud-devkit#930](https://github.com/huaweicloud/huaweicloud-devkit/issues/930)**（建议保留旧名 alias 或提供迁移映射 + 在 release note 标注 breaking change）。

## 三、探测脚本的两处加固（本轮一并落地）

1. **provenance 入库**：L2 结果 `meta` 增加 `mcpServer` + `devkitVersion`（此前只有 ts/mode，**无法证明结果跑在哪版 SUT 上** —— 与 R2 同一教训）；结果文件名加版本后缀（`l2-eval-<ts>-<版本>.json`），避免不同 SUT 互相覆盖。
2. **新旧双名探测**：`L2_SET` 增加第 4 列（新技能名），同时报告「旧名激活 / 新名激活」→ 可区分「改名」与「技能缺失」（本次正是靠它把结论从「激活回归」精确到「缺别名」）。
3. **`detectDevkitVersion()` 改为逐级上溯**：npm 包布局下 `mcpServer` 的上一级不是包根（`plugins/huaweicloud-core/src/` → 需上溯 4 级），原实现会返回 `unknown` 而让门禁判 FAIL。

## 四、重跑范围与进度

| 层 | 任务 | 状态 |
|---|---|---|
| L2 激活（零成本） | 12 技能 | ✅ 已跑（本节结论） |
| L2 只读真机 | t21–t33（13 条） | 🔄 已发起（新 SUT，3 采样） |
| L1 只读 | t04–t08、t14（6 条） | 🔄 已发起 |
| L1 创建类写任务 | t01/t03/t11/t12/t13/t15–t20（std + bare） | ⏳ 待排期（预估数小时真云） |

> 口径提示：新旧版本的 run 记录会并存（每条的 `devkitVersion` 自证）；门禁当前按「任务」聚合、**未按版本分组**——跨版本混合统计时，成功率阈值含义会变弱，属已知限制，后续可加「按版本分组断言」。