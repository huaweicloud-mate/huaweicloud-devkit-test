## 工程债三项（用户指定「先完成 4」）

### D3 · 通用残留清扫器（由真实泄漏驱动）

新增 `verifiers/cleanup-sweep.mjs`：按名字前缀 `devkit-bench-<runid>` 扫 **ECS/RDS/FunctionGraph/CCE/SMN/安全组/子网/VPC/IAM 组·策略·委托**，
删除后**再扫一遍终验**，输出 `{success, acted, residue}`。harness 在任务自带 cleanup 之后**再跑一遍**（归零两步），结果写入 run 记录 `cleanup` 字段。

**驱动证据**：R1 裸侧 `t18`（创建 CCE，撞 40 轮上限）留下中间子网 `devkit-bench-20261015150233-t18-2-subnet` —— 原 `cleanup-cce.mjs` 只删集群。
顺带用扩展后的核查（**新增 VPC 类型**）又发现并清理 2 个陈旧 `devkit-bench-*` VPC。

### D2 · bare 记录版本字段

裸模型模式（单一 shell 工具，**不加载 devkit**）→ `devkitVersion` 记 `n/a (bare)`，日志标注「裸模型模式未加载 devkit」。
此前记的是被测版本，会被误读成「裸侧跑在该版本上」（实际与 devkit 版本无关）。

### D1 · 门禁按被测版本分组

成功率断言 / `minRunsPerTask` 门槛 / 安全护栏断言 **只作用于最新被测版本**的标注模式记录；历史版本记录入库保留但**仅统计不判 FAIL**；
版本锚点校验接受裸侧 `n/a (bare)`。此前跨版本混算会弱化阈值含义（3 采样门槛被旧记录灌满）。

## 验证（ad-hoc，真机）

| 项 | 证据 |
|---|---|
| 语法 | `node --check` ×3 全过 |
| 清扫器 · 安全组路径 | 合成泄漏 `devkit-bench-<ts>-sweeptest-t99-0` → 删除 → 终验 0 残留 |
| 清扫器 · 子网路径 | 在 /16 VPC 内建 `...-subnet`（10.98.240.0/24）→ 删除 → 终验 0 残留（= t18 泄漏的那类中间产物） |
| 门禁分组 | 实测输出「✗ 最新版本(huaweicloud-devkit@1.1.9-next.0)标准采样不足(2<3)」+「✓ 历史版本(huaweicloud-devkit@1.1.1-next.15) 3 条 → 仅统计不判 FAIL」 |
| bare 版本字段 | 真跑 `t21 --bare`：记录 `devkitVersion="n/a (bare)"`、`cleanup.sweep=true` |

> 注：本 PR 只改代码；历史 bare 记录版本字段回填与新版数据入库在数据 PR 一并处理。
