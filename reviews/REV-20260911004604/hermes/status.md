# Hermes 整改通知 — Round-16（第 15 轮评审整改）

> 通知时间：2026-09-11 08:40:00（北京时间）
> 归档评审：`reviews/REV-20260911004604/`
> 整改轮次：Round-16（针对 Codex round-15 的 1 项文本口径整改：S5 'No supported' vs 'No known'）
> 上一轮结论：`REVIEW_CHANGES_REQUESTED`（round-15）

---

## 一、本轮修改的文件

| # | 文件 | 变更性质 |
|---|---|---|
| 1 | `test-cases/design/gen_matrix.py` | 修改：EXP-D1-58-05 预期结果+requiredEvidence 按**两层文本语义**统一（菜单层 'No supported agent detected' 引导 + configureGenericMCP 层 'No known MCP agent detected; here is a config snippet you can paste' 断言目标） |
| 2 | `test-cases/expanded/用例矩阵-展开级.csv` | 重生成：EXP-D1-58-05 措辞更新（状态仍 PASS） |
| 3 | `results/ITER-008-20260911072254/evidence/d158/manifest.json` | 修改：新增 `S5_text_semantics` 章节（menu_layer/assert_layer/conclusion 三层说明） |
| 4 | 本文件 | 新增：Round-16 整改通知 |

## 二、S5 文本口径整改说明（Codex round-15 唯一整改项）

**真相**：s5.stdout.log 中两个关键文本**均真实存在，但属于不同代码层**：
- **L8 菜单层**：`No supported agent detected.` —— `promptZeroDetect()` 在无 agent 时的引导文本（不是断言目标）
- **L18 configureGenericMCP 层**：`No known MCP agent detected; here is a config snippet you can paste:` —— **断言⑤的真正判定目标**（snippet 交付物）

**整改**：
1. EXP-D1-58-05 预期结果明确写出两层文本语义 + 判定目标
2. requiredEvidence 指向 s5.stdout.log 且说明断言⑤依据
3. manifest 新增 `S5_text_semantics` 章节（menu_layer/assert_layer/conclusion）

**结论**：断言⑤（可粘贴 snippet 输出）判定目标文本在场 + snippet/remote 提示在场 → **PASS 成立**，且措辞与证据口径已统一，无歧义。

## 三、新增/修改/删除
- 新增：无；修改：EXP-D1-58-05 措辞 + manifest S5 语义章节；删除：无

## 四、全量测试执行结果

| 口径 | 统计 |
|---|---|
| 设计级 163 | 不变 |
| 展开级 137×12 | NR3: PASS 18 / BLOCKED 4 / FAIL 1 / SPEC 1 / NOT_RUN 1 + D1-58 5 行全 PASS |
| 追踪表 169×10 | PARTIAL 3（D1-52/46/55）/ PASS 29 / SPEC 3 / FAIL 2 / UNASSESSED 132 |
| 门禁 | verify_new 25 项全覆盖 exit 0（含 BLOCKED 聚合拦截）；scan_gaps GATE-PASS |

## 五、failed / BLOCKED / SPEC-MISMATCH 逐项（外部依赖，未变）
- **FAIL (1)**：D1-39 Windows P0 #554
- **SPEC-MISMATCH (3)**：D1-29 / D1-43c / D1-55b + EXP-NR3-19 + D1-46g(PARTIAL 子项)
- **BLOCKED (4) + NOT_RUN (1)**：macOS / CodeArtsSpace / Linux升级链 / TTY + remote session
- **skipped**：无

## 六、仍需评审或外部环境确认
1. **Codex round-16 复评**：S5 两层文本口径是否闭合。
2. 规格裁决（D1-29/43c/46g/55b/EXP-NR3-19/D9-9 cancellation）。
3. D1-39 #554 回归；macOS/CodeArtsSpace/PTY 环境；Linux 升级链平台化；remote session 决策。
4. 132 行 UNASSESSED + 9 条新用例契约执行轮。

---

## 当前状态：`REVIEW_CHANGES_REQUESTED`

P0 FAIL + 环境 BLOCKED + 规格 SPEC 未闭合（全部外部依赖），**不报 TEST_DESIGN_READY**；等待 Codex round-16 评审意见。