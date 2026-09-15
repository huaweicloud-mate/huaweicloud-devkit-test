# 每日 BLOCKED 深挖结论与解除路径

> 日期：2026-09-15 ｜ 对象：第 4 刀 DAILY_EXCLUDE 移出的用例 ｜ 结论：移除是权宜之计，深挖后多数可解开

## 一、结论摘要

第 4 刀「移出 daily」掩盖了三类真相——**假阻塞（有探针但不跑）、测试侧欠账（harness 脚本拖账）、未拆分（把真云 E2E 与源码级断言混在同一条）**。逐个挖开后：

| 结论 | 数量 | 用例 |
|---|---|---|
| **已实质解开**（撤回 daily + 补纪律 / 补 harness / 补环境就绪） | 8 | D6-1/D6-3/D6-4（压测，探针已存在）、D9-6（跨客户端，有历史结论）、D10-3/EXP-E（路由评测，run-eval.mjs 落地）、D2-1（auth 三端落位拆源码级）、D4-13（最小权限，只读子账号已就绪）、D4-14（CTS 审计，免费已就绪） |
| **真·外部依赖（仍在挂起）** | 4 | D3-C4/EXP-C4（高危服务创建计费）、D10-1（LLM 选择正确率）、D10-2（skill 激活率）、D10-5（多轮完成率） |

## 二、已解开（本轮落地）

1. **D6-1/3/4（性能/压测）**：`supplement-probe.mjs` 已完整实现计时 p95、冷启、并发 15 请求，纯本地 `spawn MCP` 可跑，无需「压测环境」。已从 DAILY_EXCLUDE 撤回；AGENTS.md 红线已补「探针/脚本已存在不得标 BLOCKED，必须跑完回填」。
2. **D9-6（跨客户端互通）**：ITER-002 已用「6 种 clientInfo」协议级测通（发现 OBS-15 stdio 畸形帧崩溃），非「需多客户端」。已撤回。
3. **D10-3/EXP-E（路由评测）**：落地 `eval/harness/run-eval.mjs`（spawn MCP → 调 `huaweicloud_service_catalog` → 对比期望路由 → 落 result CSV）。首轮基线 **路由准确率 21.4%（HIT=3 MISS=11 N/A=1）**，命中 3 条均为「prompt 混英文 Redis/Kubernetes + 中文关键词代金券」——量化了 serviceCatalog 中文路由缺陷（routeMap 英文-only + 纯中文 prompt 整句 token 匹配不到）。

## 三、D3-C4/EXP-C4 三档拆分（22 服务）

| 档位 | 服务 | 解除条件 |
|---|---|---|
| **免费/审计（可立即真机）** | VPC、IAM、CTS、CES（基础监控） | 无需额外资源，按需执行 |
| **按需付费低频（postPaid 最小规格 + 全量归零）** | OBS、FunctionGraph、SMN、DMS、EIP、EVS、ECS、RDS、DDS、DCS、ELB | RDS postPaid E2E 有 ITER-002 成功先例；低余额按最小时长/最小规格跑，测后归零 |
| **高危/昂贵（真·外部依赖）** | CCE、GaussDB、WAF、CDN、ModelArts、CBR、DEW | 需保证金或大额预存，挂起并标注解除条件 |

## 四、D4-13 / D4-14 只读子账号与审计（已就绪，已回 daily）

- **D4-13（最小权限凭证通过率）**：只读 IAM 子账号已就绪 → 用只读 AK/SK 跑 D3 只读用例 → 断言「只读 100% 可用、写被正确识别为权限不足」。已撤回 DAILY_EXCLUDE。
- **D4-14（操作可审计性）**：CTS 云审计免费默认启用 → 真云只读 + 写操作后查 CTS 记录 → 断言「agent/人工可区分 + 不含明文凭证」。已撤回 DAILY_EXCLUDE。

## 五、真·外部依赖（才配挂起，且标「外部依赖」而非 BLOCKED）

- **D10-2（skill 激活率）**：需真实 LLM Agent 会话 + 20+ 任务库，harness 未随仓提供。
- **D10-5（多轮任务完成率）**：需真实 Agent 多轮会话。
- 二者 blockedReason 必须写明「缺真实 Agent 评测 harness」，解除条件=接入可交互真实 Agent 客户端（如 Hermes 会话级 CDP 自动化）。

## 六、遗留建议

- D10-1（工具描述可选择性）静态层可脚本检查（40 工具 description 非空/含参数），LLM 打分需 harness —— 建议拆两条（静态可测 + LLM 评测），与 D4-6 同理。
- 三档拆分落地后，把「免费 + 低频」服务对应的 EXP-C4 从 DAILY_EXCLUDE 解绑（需先拆 D3-C4 为细粒度用例，或执行口径按服务分档），高危档保留挂起。