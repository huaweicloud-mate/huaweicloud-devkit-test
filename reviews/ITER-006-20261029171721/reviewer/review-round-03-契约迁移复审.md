# ITER-006 Round 03 复审 · 契约迁移复审

评审者：OpenCode (deepseek-gw/deepseek-v4-pro-0813)
评审时间：2026-10-30 16:04:53（北京时间）
替代原因：原 Codex 侧 429 限流不可用，由 OpenCode 顶替
本轮：Round 03 复审（核查 Round 02 三项整改落实）

## 结论

REVIEW_CHANGES_REQUESTED

## 逐项核验

### 1. [P1] D1-71 纳入 + vendor gate 三件套 + 关联工具列补 sandbox_connect — 必须整改（部分通过）

已核验通过的部分：D1-71 已纳入 `candidate-matrix.csv`（第 8 数据行），vendor gate 三件套完整——`前置条件` 含「已建立 vendor 确认（vendorConfirmed=用户确立华为云的原文引用）」、「操作步骤①」为 `sandbox_connect 获取 workspace_id`、步骤含 `⓪建立 vendor 确认…首次 challenge 后原样 retry 一次放行`、`预期结果` 以「（gate 放行后）」前缀开头、`依赖列` 含「契约依赖: vendorConfirmed 语义 已裁决(不放宽…)」。

必须整改的残留：**关联工具列尚未补 `sandbox_connect`**。机器读取 `D1-71['关联工具'] = 'sandbox_expose_tunnel'`（仅此一项，`'sandbox_connect' in 关联工具` = False）；`sandbox_connect` 只出现在「操作步骤①」，未进入「关联工具」列。

修改指令：将 D1-71 的「关联工具」列由 `sandbox_expose_tunnel` 改为 `sandbox_expose_tunnel/sandbox_connect`（与同级 `D3-S3`、`D3-C3` 的 `/` 分隔多工具写法一致），或等效地补入 `sandbox_connect` 短名。

### 2. [P1] D2-23 / D2-27 已从 candidate-matrix.csv 移除 — 已核验通过

证据：`grep -c "D2-23" candidate-matrix.csv` = 0，`grep -c "D2-27" candidate-matrix.csv` = 0，两条均已从候选矩阵移除（书面排除成立）。

### 3. [P2] 全 CSV 已无「40 工具 / 40工具 / 恰好 40」注记 — 已核验通过

证据：`grep -nE "40工具|40 工具|恰好 ?40|40 ?tool|exactly 40" candidate-matrix.csv` 无匹配（exit 1）；`D5-3`/`D1-56` 残留「40 工具」均已订正为 56。

### 4. 文档计数一致 — 已核验通过

证据：`candidate-matrix.csv` 实测 76 行 / 27 列 / ID 无重复，vendor_gate 类 64 条（三件套完备率 100%、0 残缺）；`test-design.md`(L20/L24) / `status.md`(L23) / `v2-契约漂移-用例影响清单.md`(L14) 均写「受影响 76 条、vendor_gate 64」——四方计数一致。

## 汇总

Round 02 三项整改中，第 2、3 项及计数一致性全部落实通过；唯第 1 项的「关联工具列补 sandbox_connect」因 D1-71 关联工具列仍为 `sandbox_expose_tunnel`（未补 `sandbox_connect`）而残留一处机器可闭合整改项，故不放行。其余一切核验通过。

【评审完成】