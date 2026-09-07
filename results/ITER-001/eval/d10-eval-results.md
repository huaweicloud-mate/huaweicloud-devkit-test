# ITER-001 D10 评测（search_docs 检索召回 · 中文评测集）

> 执行：2026-09-07 ｜ 通道：`huaweicloud_search_docs`（MCP 真实工具 = next.15）｜ 评测集：EXP-E01~E15（D10-3 自然语言任务）

## 结果：14/15 跑完，仅 2 命中 → 中文召回率 ≈ 14%（目标 ≥90%）

| 任务 | 期望技能 | 结果 | 备注 |
|---|---|---|---|
| E01 查云主机（ECS） | huawei-ecs | ❌ count=0 | 纯中文 → 整句 token |
| E02 创建云服务器 | huawei-ecs | ❌ 未命中 | 返回 functiongraph/iac/voucher 等无关 |
| E03 部署静态网站 | huawei-obs | ❌ 未命中 | 错配 dds-dcs（relevance 4）|
| E04 绑定弹性公网IP | huawei-vpc | ❌ count=0 | |
| E05 云数据库MySQL状态 | huawei-rds | ❌ count=0 | 查询含 mysql 也 0（中文段吞并）|
| E06 创建Redis缓存 | huawei-dds-dcs | ✅ **命中** | 查询含独立英文词 "redis" |
| E07 每日备份策略 | huawei-cbr | ❌ count=0 | |
| E08 ECS启动失败诊断 | troubleshooting/ecs | ❌ count=0 | |
| E09 Kubernetes集群 | huawei-cce | ✅ **命中** | 查询含 "kubernetes" |
| E10 函数图片压缩 | huawei-functiongraph | ❌ count=0 | |
| E11 本月费用 | huawei-billing | ❌ count=0 | |
| E12 云监控告警 | huawei-cloud-eye | ❌ count=0 | |
| E14 IAM权限审计 | huawei-iam | ❌ count=0 | |
| E15 领取代金券 | huawei-voucher | ❌ count=0 | |
| E13 HTTPS证书 | — | ⏳ 未跑 | 前 14 条已定论 |

## 根因（源码确认 tools.mjs:1779-1830）

```js
const tokens = q.split(/\s+/).filter((t) => t.length > 0);   // 按空白分词
// relevance = tokens.reduce(..., descLower.includes(token) ? 3 ...)  // 整句 token includes 英文描述
```

- 中文查询**无空格** → 整句成为一个 token → `descLower.includes("帮我查一下我账号在华北北京四有哪些云主机")` 必然 false → relevance=0 → **0 结果**
- 仅当查询含**独立英文词**（redis/kubernetes）时才能命中 Triggers
- **无中文分词 / 无 n-gram / 无中英对齐**——中文用户的核心检索通路实质瘫痪

## 影响与定级

- **D10-2 激活率 / D3-A1 检索完整性：P1 缺口（确定性缺陷，功能未达预期）**
- 影响面：所有依赖 `search_docs` 的技能发现链路（显式检索场景/其他客户端）；Agent 会话内还有"描述注入"通道（本次未测，模型自主选择不受此限）——两个通道需区分
- 修复建议：① 中文按字符 bigram/分词处理 token ② skill 描述扩充中文 Triggers（中文关键词）③ 检索增加中英同义词表（云主机/服务器→ECS 等）
- 复现：评测集 14 条 + search_docs 工具（可重复）