# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-10-31-1.94.193.150-v2mig2/Linux/FINDINGS.md`
> **生成时间**：2026-10-31 15:30（北京时间）
> **被测对象**：huaweicloud-devkit v2 分支（2.0.0，被测 commit fcfe047f）
> **范围**：v2 迁移补测 27 条（重发闭环）

---

## #1【P1】D1-60 update-check HTTP 查询超时 abort 未生效

- **现象**：`queryDistTagsFetch({ timeoutMs: 400 })` 面向「挂起不响应」的 registry（自定义 `HUAWEICLOUD_NPM_REGISTRY` 指向本地 hang server）时，2.5s 内未返回 `null` 也未抛错，返回值为 `__STILL_PENDING__`（Promise.race 超时哨兵）。
- **断言**：`abort` 应在 ~400ms 内生效并返回 `null`，而非挂起至外层哨兵超时（<2.5s 应返回 null）。
- **根因**：`plugins/huaweicloud-core/dist/update-check.js` `queryDistTagsFetch` 的 `AbortController`/signal 未接进 `fetchWithProxy` 调用，超时 abort 触发后底层 fetch 未被中止，Promise 挂起。
- **影响**：registry 无响应/网络故障时升级检测挂起，影响 `check_update` / 安装器升级通道的健壮性（正常自定义 registry 路径与去尾斜杠逻辑均 PASS，仅超时分支失效）。
- **证据**：`evidence/D1-60/stdout.log`（`FAIL: D1-60 超时 abort 返回 null ... 返回="__STILL_PENDING__" 耗时=2500ms`）
- **状态**：待提单

## #2【P2】D3-C10 市场分类列表返回空（上游索引弃用，未迁移）

- **现象**：`getMarketplaceCategories()` 机制正常（`ok:true`）但返回 `categories: []`；`searchMarketplace('')` 空查仅返回一条迁移指引 skill「请更新最新的 huawei-cloud-find-skills」。
- **断言**：`getMarketplaceCategories` 应返回非空分类列表（当前市场分类能力事实失效）。
- **根因**：`plugins/huaweicloud-core/dist/search-market.js:3` `INDEX_URL` 仍硬编码指向已弃用的 gitcode 索引 `2501_91318609/skills-for-index`（该索引 `deprecated=true, total_skills=0, migrate_message="本索引已停止维护，请升级 huawei-cloud-find-skills 到最新版"`），未迁移到新索引源（`huaweicloud/huaweicloud-skills`）。属上游数据源驱动，非 v2 代码回归。
- **影响**：市场分类/按分类过滤能力不可用，仅能返回迁移指引；对依赖市场分类导航的用户为功能降级。
- **证据**：`evidence/D3-C10/stdout.log`（`getMarketplaceCategories -> {"ok":true,"categories":[]} 上游 deprecated=true`）
- **状态**：待提单

## #3【P1】D7-5 安装/升级会遮蔽用户自定义 mcp_servers（YAML 重复键）

- **现象**：隔离 HOME 预置 `config.yaml` 含用户自定义 `mcp_servers.my-custom-server` 与自定义字段 `markers.user_custom_note`，`install --target hermes` 后追加第二个顶层 `mcp_servers:` 键；`PyYAML safe_load`（last-wins）解析后 `my-custom-server` 丢失（`markers` 字段保留）。
- **断言**：安装/升级不应破坏用户既有 MCP 配置（用户 mcp_servers 映射应保留并与 devkit 条目合并共存）。
- **根因**：`plugins/huaweicloud-core/dist/agents/hermes-config.js:54-86` `writeHermesMcpConfig` 仅当 `existing` 同时包含 `'mcp_servers:'` 与 `'huaweicloud-devkit'` 才走「移除旧块重写」合并；用户已有自己的 `mcp_servers` 映射但尚无 `huaweicloud-devkit` 条目时（首次安装 / 已装他人 MCP 环境），条件不成立 → 直接 `${existing.trimEnd()}\n\n${newBlock}` 追加，产生 YAML 重复顶层键。
- **影响**：首次安装或已装他方 MCP 的 Hermes 用户，其自定义 MCP server 被遮蔽丢失；属用户数据破坏类缺陷。
- **证据**：`evidence/D7-5/stdout.log`（`parsed mcp_servers keys = ['huaweicloud-devkit'], my-custom-server 是否保留 = False`）
- **状态**：待提单