## R8：SUT 升级到最新包（用户确认「肯定用最新的产品包」）

### 升级方式（隔离，不动现有安装）

按仓库自身策略（`scripts/prepare_env.py` 自动取 latest/next 最高 → `next` = **1.1.9-next.0**，与每日测试同版本）：

```bash
npm install --prefix <WS>/_sut_119 huaweicloud-devkit@1.1.9-next.0
export BENCH_MCP_SERVER=<WS>/_sut_119/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs
```

旧版（`~/.dsh/huaweicloud-plugins` = 1.1.1-next.15）保留为对照口径；每 run 记录带 `devkitVersion` 锚点可区分。

### 升级即刻产出两条结论

| 被测版本 | `service_catalog` 路由 | `retrieve_skill`（旧名） | `retrieve_skill`（新名） |
|---|---|---|---|
| 1.1.1-next.15 | 5/12 | **12/12** | — |
| **1.1.9-next.0** | **8/12** | **5/12** | **7/7** |

1. **路由缺口部分修复**（cbr/cts/cloud-eye 已命中；剩 waf-aad/apig/modelarts/deployment）→ 既有单 #852 更新版本化证据。
2. **技能改名导致旧名激活回归**（7 技能改名、无别名回退；新名 7/7 可达）→ 新提上游 **[#930](https://github.com/huaweicloud/huaweicloud-devkit/issues/930)**。

### 探测加固

- L2 结果 `meta` 记 `mcpServer` + `devkitVersion`（此前只有 ts/mode，无法自证跑在哪版 SUT —— 与 R2 同一教训）；文件名带版本后缀
- `L2_SET` 支持旧名/新名双探测 → 可区分「改名」与「技能缺失」（本次正是靠它把结论从「激活回归」精确到「缺别名」）
- `detectDevkitVersion()` 逐级上溯（npm 包布局下 `mcp-server.mjs` 上方 4 级才是包根，原实现返回 `unknown`）

### 重跑范围

只读层（L2 13 条 + L1 只读 6 条）**已在评测机发起**（新 SUT、3 采样）；写任务层（t01/t03/t11–t13/t15–t20 std+bare）另行排期。

> 已知限制：门禁当前按任务聚合、未按版本分组；新旧版本记录并存时成功率阈值含义变弱，后续可加「按版本分组断言」。
