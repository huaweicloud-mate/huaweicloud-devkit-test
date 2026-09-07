# ITER-001 批量补测结果（D4-10/D3-B2/D6/D2-5/D5-4/D4-13/D8-1）

> 执行：2026-09-07 ｜ 全部本地直调/只读，无资源创建

## 结果总表

| 用例 | 结果 | 证据 |
|---|---|---|
| **D4-10 规则回归** | ✅ 4/4 样例过 | 15 规则清单导出；destructive/network-public-admin-port/credential-file/cost-unbounded 全命中；**11 条规则待补样例**（已列：env-dump/secret-value-read/sts-credential/encoded-shell-exec/obs-anonymous-write/functiongraph-no-auth/iam-admin-policy/delete-force/delete-cascade/sandbox-ttl/sandbox-destructive） |
| **D3-B2 plan 分类** | ✅ **20/20** | 8 服务 20 命令：只读→allow、写→deny、OBS mb→deny、IAM→unknown_read；ResetServerPassword→deny/write（plan 层正确） |
| **D6-4 并发** | ✅ 4/4 | 并行 ListFlavors/ListVpcs/ListImages/BSS 无失败无串扰 |
| **D2-5 凭证轮换(temporary)** | ✅ | temporary 语义正确（内存级 runtime；hcloud 仍用 profile——设计符合） |
| **D5-4 版本一致性** | ⚠️ 观察 | 本机交错 next.15×7 / next.16×2（CodeArts+Hermes）——**测试操作造成**（更新检测测试降过 codearts），CodeArts 已恢复 next.16；整体统一刷新可选 |
| **D4-13 最小权限(只读)** | ✅ | IAM KeystoneListUsers 正常（hw018619646 enabled）；未做权限矩阵深审计 |
| **D8-1 README 完整性** | ✅ 抽样 | 承诺（10 客户端/37 工具/29 skills/审批门）与本日实测全部吻合 |

## 待补（已记录）

- D4-10 未构造样例的 11 条规则（风险规则全覆盖回归 → 建议 ITER-002 按规则构造正/负样例）
- D5 版本统一刷新（可选：`install --target all` 升 next.16）

## 复现

- test-cases/d410-d3b2-regression.mjs（D4-10/D3-B2，node 直跑）