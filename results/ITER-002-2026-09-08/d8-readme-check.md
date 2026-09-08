# ITER-001-2026-09-05 D8 文档一致性检查（README，2026-09-07）

> 触发：用户反馈"README 被开发修改出问题但没测出来"——D8 维度此前漏测，本轮系统化补齐

## 检查工具

- `test-cases/check_readme_consistency.py`（已入仓，技能已固化"每迭代必跑"）
- 4 项检查：① 命令-实现一致性 ② 编码完整性 ③ badge vs npm latest ④ dev/main 同步

## 检查结果

| # | 检查项 | 结果 | 说明 |
|---|---|---|---|
| 1 | 命令-实现一致性 | ✅ | README 9 个命令（auth/doctor/install/install-hcloud/status/uninstall/update/version）全部匹配实现分发 |
| 2 | 编码完整性 | ✅ | UTF-8 严格读取无损坏（PowerShell GBK 显示乱码为假象，用 read_file 为准） |
| 3 | **badge 版本** | ❌ **P3 文档缺陷** | npm latest=**1.1.1** vs README badge=**beta-v1.1.0**（正式版发布后未更新；且"beta"语义过时）——dev/main 均未更新 |
| 4 | **dev/main README 分叉** | ❌ **P3 风险** | **Cursor Directory Plugin 一节只在 main（发布版 README）**，dev（74b9642）缺失——后续 dev 上改 README 存在覆盖/丢失该节风险（47dce71 合入 main 未同步 dev） |

## 定性

- 2 个 P3 文档问题（badge 过时 / 分支同步缺失），非功能缺陷
- 需开发侧处理：① 更新 badge（beta-v1.1.0 → 1.1.1/正式）② dev 与 main 的 README 同步（Cursor 节合入 dev）
- **未上报 #501**（P3 文档类，随开发响应 #518/#501 时顺带处理；如用户要求再单独提交）

## 经验固化（防再漏）

- D8 纳入每迭代必跑检查（技能已固化命令与判定）；判据使用 UTF-8 严格读取（read_file/python），忽略 PowerShell GBK 显示假象