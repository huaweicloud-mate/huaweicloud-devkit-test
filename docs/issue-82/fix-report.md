# Issue #82 修复交付报告（EXP-E01 路由 MISS）

> 修复目标仓库 `huaweicloud-mate/huaweicloud-devkit` 对 grapedev-bot 无推送权限（403），
> 修复以补丁形式交付（`docs/issue-82/patches/`），验证证据见 `eval/results/eval-run-*.csv`。

## 根因（双层）

被测版本 npm `huaweicloud-devkit@1.1.9`（gitHead 05a67b6，对应上游 main）的
`serviceCatalog()` 路由层：

1. **EXP-E01 直接根因**：ECS 关键词表缺中文口语别名「云主机」——
   意图「帮我查一下我账号在华北北京四有哪些云主机」不含任何已收录关键词（云服务器/服务器/虚拟机均非其子串）→ fallback `Run hcloud --help`。
2. **同层并存缺陷**（mate 仓 main 现状，VOD 已定位）：空白分词 + 整词精确匹配，
   中文与英文粘连意图（「查看ECS」）整段为单 token，无法命中关键词 `ecs`。

## 修复内容（补丁 0001，目标 `plugins/huaweicloud-core/src/tools.mjs`）

- 路由表对齐上游 v1.1.9 已发布行为：19 条既有 route 补全中文关键词，
  新增 Sandbox/DevStation、ELB、Voucher 三条 route；ECS 补「云主机」别名；
- 匹配逻辑：多词/中文关键词走子串匹配，单个 ASCII 词走整词匹配；
  tokens 追加提取字母数字片段 `it.match(/[a-z0-9][a-z0-9/-]*/g)`（修复「查看ECS」类粘连意图）；
- 移植部署意图 sandbox 置顶逻辑；工具返回结构不变。
- 补丁 0002：`docs/issue-82/{spec,plan,task}.md`（根因/方案/验证记录）。

## 验证结果（本地实测）

| 项 | 结果 |
|---|---|
| 目标仓单测 | `npm test` 84/84 全绿（基线 79 + 新增 `test/service-catalog.test.mjs` 5 条，TDD RED→GREEN） |
| eval 基线（npm v1.1.9） | 13 HIT / 1 MISS / 1 N/A = 92.9%（`eval-run-20261019213714.csv`） |
| eval 基线（mate 仓 main） | 2 HIT / 12 MISS / 1 N/A = 14.3%（`eval-run-20261019213832.csv`） |
| eval 修复后（mate 仓+补丁） | **14 HIT / 0 MISS / 1 N/A = 100%**，EXP-E01 实际 = `['ECS']`（`eval-run-20261019214423.csv`） |
| 其余 14 条回归 | 13 条 HIT 且 actualServices 与 v1.1.9 基线逐条一致；EXP-E08 维持 N/A（实际路由由 fallback 文案改善为 ECS） |

复跑命令：`node eval/harness/run-eval.mjs <devkit仓>/plugins/huaweicloud-core/src/mcp-server.mjs`

## 待人工动作（解除 403 阻塞）

- 方式一：给 `grapedev-bot` 配置 `huaweicloud-mate/huaweicloud-devkit` 写权限后重派 coding agent（分支 `feat/issue-82` 已就绪，2 个原子提交）；
- 方式二：维护者在 `huaweicloud-mate/huaweicloud-devkit` 上应用补丁
  `git am docs/issue-82/patches/0001-*.patch 0002-*.patch` 并以 `feat/issue-82` → `main` 建 PR。
