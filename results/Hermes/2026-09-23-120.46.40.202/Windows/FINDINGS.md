# FINDINGS — 缺陷发现清单（Hermes-GLM-5.2）

> **落盘路径**：`results/Hermes/2026-09-23-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-09-23 10:00:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.7-next.0（hdk 源码 v1.1.6, commit a96422e）

---

## #1【P0】D4-23 全局规则 huawei-agent-rules.md 注入生效性 — 文件缺失（SPEC-MISMATCH）

- **现象**：设计用例 D4-23 要求 11 个 Agent 安装目标均有 `huawei-agent-rules.md` 注入系统提示/规则，并在构造禁直连 csms/kms 场景时核对 MUST 约束生效。实际在 hdk 源码仓库（v1.1.6, commit a96422e）及 npm 全局安装目录中均未找到 `huawei-agent-rules.md` 文件。搜索 `plugins/huaweicloud-core/` 全目录无 `agent-rules` 目录或文件引用。
- **断言**：`existsSync(resolve(pluginDir, 'agent-rules', 'huawei-agent-rules.md'))` 应返回 `true`，实际返回 `false`。
- **根因**：`plugins/huaweicloud-core/` 目录下无 `agent-rules/huawei-agent-rules.md` 文件；`setup-cli.mjs` 和 `tools.mjs` 中无 agent-rules 注入逻辑引用。安全约束（禁直连 CSMS/KMS）目前通过 hooks（`huaweicloud-safety.mjs` + `hooks.json`）实现，而非设计文档约定的独立 rules.md 文件注入方式。
- **影响**：设计契约与实现存在漂移。hook-based 安全约束可达到等效目标，但与设计文档的「文件注入 + 11 目标」约定不一致。不影响当前安全性（hook 正常工作），但影响契约一致性。
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：SPEC-MISMATCH，待裁决

## #2【P1】EXP-E01~E14 评测路由准确率偏低（21.4%，已知基线）

- **现象**：运行 `eval/harness/run-eval.mjs` 对 15 条中文意图评测集进行 serviceCatalog 路由测试，HIT=3, MISS=11, N/A=1，准确率=21.4%。其中 11 条 MISS 的实际路由结果为 `Run hcloud --help to list available services.`（即未命中任何服务），仅 EXP-E06 (DCS)、EXP-E09 (CCE)、EXP-E15 (Voucher) 命中。
- **断言**：`evaluateCommandRisk` / `serviceCatalog` 应能将「帮我查一下我账号在华北北京四有哪些云主机」路由到 ECS 服务，实际返回通用 help 提示。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` 中 `serviceCatalog` 路由层对中文自然语言意图的匹配覆盖率不足。此为已知基线问题（21.4% MISS），非本次新增回归。
- **影响**：用户自然语言意图无法直接路由到正确云服务，需手动指定服务名。
- **证据**：`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E15/stdout.log`，`eval/results/eval-run-20260923095428.csv`
- **状态**：已知基线，非新增缺陷
