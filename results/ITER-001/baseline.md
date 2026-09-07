# ITER-001 基线记录（T0）

> 迭代：ITER-001（2026-09-07）｜状态：首轮执行启动

## 被测对象基线

| 项 | 值 |
|---|---|
| 仓库 | https://github.com/huaweicloud/huaweicloud-devkit |
| **测试目标分支** | `dev` @ `fa04732`（2026-09-05，Merge PR #497 release-dev-1.1.1-next.14） |
| 发布基线（对照） | `main` @ `bcefb32`（2026-09-02，Merge PR #466） |
| 变更规模 | dev vs main：**50 文件，+1698/−143** |
| 本地工作副本 | `C:\Users\Administrator\devkit-test\hdk`（dev 分支） |

## 执行环境（本机预检 2026-09-05 确认）

| 项 | 值 |
|---|---|
| OS | Windows 11（China Standard Time UTC+8） |
| Node / npm | v22.23.2 / 10.9.8 |
| hcloud (KooCLI) | v7.2.12（已认证 AKSK，cn-north-4；⚠️ projectId/domainId 为空待补） |
| Python | 3.11.15 |
| obsutil | ❌ 未安装（阻塞 D2-6/D3-C2，本轮受影响集不涉及，T4 前补装） |
| 凭证文件 | `~/.agents/*.json` 存在（密钥字段人工填） |

## 测试范围（NR1 确认）

- **范围**：dev 相对 main 的**全部未发布变更**（用户确认 2026-09-07）
- **客户端矩阵**：全矩阵（10+ 客户端）
- **维度覆盖**：受影响集 + 固定安全回归基线（P0 全量）+ 冒烟（D3-C5）
- **用例规模**：矩阵 209 条（设计级 102 = 92 既有 + 10 新增 NR2 用例；展开级 107）

## 能力清单核对（T0 待执行项）

- [ ] 36→? 工具枚举 diff（tools.mjs +105 行，D5-3 实测）
- [ ] ~30 skills 清单与 dev 分支 SKILL.md 对照（+93/−57 变更）
- [ ] 环境重置"未安装态"验证
- [ ] CI 有效性审计（integration/pack/security 真执行）

## 安全红线提醒

- 凭证零进入：AK/SK 不进对话/报告/evidence（脱敏强制）
- 写操作纪律：plan → approved；误判 read-only 立即记 P0
- 资源释放：本轮创建资源当轮删除并只读验证归零