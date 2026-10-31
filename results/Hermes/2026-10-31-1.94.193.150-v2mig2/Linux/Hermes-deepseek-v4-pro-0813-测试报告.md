# Hermes-deepseek-v4-pro-0813 测试报告（v2 迁移补测·重发闭环）

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-31 15:32（北京时间）
> **执行归档**：`results/Hermes/2026-10-31-1.94.193.150-v2mig2/Linux/`
> **被测对象**：huaweicloud-devkit v2 分支（被测 commit `fcfe047f`），本地 `npm pack` + 全局装 `huaweicloud-devkit@2.0.0`（npm registry 最高仍是 1.1.12，v2 未发布）
> **结论**：`PARTIAL`（27 条补测：24 PASS / 3 FAIL；3 条真缺陷已记 FINDINGS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（ECS，IP 1.94.193.150） |
| Node / npm / Python | node v26.8.1（`~/.local/bin/node`；node22.23.2 复核下界）/ npm 10 / python3 |
| 被测版本（SUT） | `2.0.0`（v2 分支，被测 commit `fcfe047f`） |
| 工具全集 | `56`（dist/mcp-server.js tools/list，白盒+黑盒一致） |
| 真云凭证 | cn-north-4（`~/.config/huaweicloud/credentials.json`；D2-6/D2-24/D3-C10 真机执行） |
| 测试类型 | 白盒直调 dist 产物 / 真机 CLI（install/update/version/auth）/ MCP 协议 spawn / Python 安全 hook / 真云只读 API |
| 补测范围 | **27 条设计级迁移用例**（上一轮 BLOCKED/未闭环的迁移用例） |

**补测清单与结论（27 条）**：D1×7（D1-32/59/60/61/62/63/64）、D2×5（D2-17/3/6/23/24）、D3-C10、D5×3（D5-2/4/7）、D7×5（D7-1/2/4/5/6）、D8×6（D8-1/2/4/5/6/8）。

> **执行方法**：白盒探针直调 `hdk/plugins/huaweicloud-core/dist/*` 导出函数；真机 CLI 在隔离 HOME 下 `install --target hermes`；MCP 协议 spawn `dist/mcp-server.js`；结果落 `stdout.log`(JSON) + `stdout.txt`(人工可读)。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（补测） | 27 |
| 已执行 | 27（0 BLOCKED / 0 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH | 24 / 3 / 0 / 0 |
| 通过率（= PASS/(PASS+FAIL)） | 88.9% |
| P1/P2 新增缺陷 | 2 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 无真云写资源产生（只读 API + OBS 只读 ls，未建桶/未建 ECS） |

---

## 三、状态汇总（27 条逐条）

### PASS（24 条）

| 用例 | 标题 | 证据 |
|---|---|---|
| D1-32 | 新版本>dismissedVersion 无视冷却 | evidence/D1-32 |
| D1-59 | SKIP_UPDATE 环境变量跳过升级检测 | evidence/D1-59 |
| D1-61 | 升级重启文案 officeace 分支 | evidence/D1-61 |
| D1-62 | 未覆盖 CLI 子命令 reinstall/proxy/version | evidence/D1-62 |
| D1-63 | 安装版本读取双回退 | evidence/D1-63 |
| D1-64 | agent 自动检测匹配与版本 | evidence/D1-64 |
| D2-17 | cmdAuthReconcile 非 TTY 守卫 | evidence/D2-17 |
| D2-3 | auth sync 幂等 | evidence/D2-3 |
| D2-6 | OBS 独立配置引导 | evidence/D2-6 |
| D2-23 | agent 注册状态 | evidence/D2-23 |
| D2-24 | auth 同步 projectId 自动解析 | evidence/D2-24 |
| D5-2 | install 落点正确 | evidence/D5-2 |
| D5-4 | hook 支持差异（hook 拦截 + Node 兜底） | evidence/D5-4 |
| D5-7 | 重启生效一致性 | evidence/D5-7 |
| D7-1 | OS 矩阵 | evidence/D7-1 |
| D7-2 | Node 版本矩阵 | evidence/D7-2 |
| D7-4 | 国内镜像源安装 | evidence/D7-4 |
| D7-6 | 升级兼容 | evidence/D7-6 |
| D8-1 | 文档与能力一致 | evidence/D8-1 |
| D8-2 | 错误信息可执行 | evidence/D8-2 |
| D8-4 | 引导步骤可机械执行 | evidence/D8-4 |
| D8-5 | 运行时日志安全 | evidence/D8-5 |
| D8-6 | 中英文档一致 | evidence/D8-6 |
| D8-8 | 遥测策略端到端 | evidence/D8-8 |

### FAIL（3 条，真缺陷，详见 FINDINGS.md）

| 用例 | 标题 | 根因文件:行号 |
|---|---|---|
| D1-60 | HTTP 查询路径与自定义 registry（fetch 版） | update-check.js queryDistTagsFetch 超时 abort 未接入 |
| D3-C10 | 市场分类列表 | search-market.js:3 INDEX_URL 指向弃用上游索引 |
| D7-5 | 与既有配置共存 | agents/hermes-config.js:54-86 mcp_servers 合并缺陷 |

---

## 四、缺陷清单

见同目录 `FINDINGS.md`（3 条：D1-60 P1、D7-5 P1、D3-C10 P2），均带根因【文件:行号】+ 唯一断言 + 证据路径，供 `file_issue.py` 解析。

## 五、未执行与原因（NOT_RUN / BLOCKED）

- 补测 27 条全部真机执行，**0 BLOCKED / 0 NOT_RUN**（D3-C10、D2-6 等已核凭证真机执行，无「探针未覆盖」假阻塞）。
- 本补测包（v2mig2）仅覆盖 27 条设计级迁移用例；完整 316 条全量版本测试结论与证据见 `results/Hermes/2026-10-27-1.94.193.150-v2full/`（全量包）与 `2026-10-30-1.94.193.150-v2mig/`。本包设计级/展开级 CSV 中非 27 条用例的执行三列已清空，避免跨包虚报证据路径（PASS 门禁 `verify_no_fake_pass` 通过）。

## 六、安全红线

- 无 mock 假跑；真云仅执行只读 API（IAM KeystoneListProjects、OBS ls、getMarketplaceCategories），未创建/删除任何云资源，无归零义务。
- 遥测 D8-8 在隔离插件目录+隔离 HOME+本地 mock 端点下执行，未污染源码树、未真上报。

## 七、资源释放

- 无残留：本补测未创建 ECS/VPC/OBS/子网等资源；隔离 HOME（`/tmp/v2mig2-*`）为临时目录，证据已落盘。

## 八、遗留建议

1. **D1-60**：给 `queryDistTagsFetch` 的 fetch 调用接入 `AbortSignal`（超时 abort 生效）。
2. **D3-C10**：更新 `search-market.js` `INDEX_URL` 至新索引源（`huaweicloud/huaweicloud-skills` 的 `huawei-cloud-find-skills`），或在返回空分类时透传 `migrate_message`。
3. **D7-5**：修正 `writeHermesMcpConfig` 合并逻辑，覆盖「已有用户 mcp_servers 但无 devkit 条目」分支（YAML 合并而非追加重复键）。
4. 上述 3 条建议按 `file_issue.py` 流程统一提单（合并 1 单），避免逐条拆分。