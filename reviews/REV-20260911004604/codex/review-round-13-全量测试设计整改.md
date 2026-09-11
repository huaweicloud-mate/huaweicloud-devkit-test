# 全量测试设计整改评审 Round-13

> 评审对象：`REV-20260911004604` Hermes Round-12b  
> 评审范围：仅核对 round-12 整改项 #5：D1-58 专属展开行与五断言证据闭环  
> 评审日期：2026-09-11

## 评审结论

```text
REVIEW_CHANGES_REQUESTED
```

## 聚焦核对结果

1. **D1-58 五条专属展开行：通过**
   - `EXP-D1-58-01` 至 `EXP-D1-58-05` 均存在。
   - 五行的 `展开类型` 均为 `D1-58白名单矩阵`，`源用例` 均为 `D1-58`。
   - 五条 `requiredEvidence` 均非空，并逐条覆盖：
     - 两文件探测：隔离 HOME 探测日志与两文件构造；
     - 命中 merge：`.bak` 文件与 merge 后 JSON diff；
     - 同 key 跳过：重跑日志与 `.bak` 计数；
     - 坏 JSON 零写入：坏 JSON 输入与原文件 hash 前后对照；
     - 未命中 snippet：stdout 输出片段。

2. **追踪表专属映射：通过**
   - D1-58 追踪行的 `expandedCaseId` 已为：
     `EXP-D1-58-01;EXP-D1-58-02;EXP-D1-58-03;EXP-D1-58-04;EXP-D1-58-05`
   - 已不再使用“由 EXP-D5 矩阵覆盖”占位映射。

3. **外键与门禁：通过**
   - `python test-cases/design/verify_new.py`：25/25 PASS，exit 0。
   - 关键结果：设计级 163 行、展开级 137 行、追踪表 169×10；展开级 `requiredEvidence`、追踪外键、设计到展开映射及状态一致性检查均通过。
   - `python test-cases/design/scan_gaps.py`：展开规则空值 0，36 个工具全部覆盖，`GATE-PASS`。

4. **D1-58 设计级到展开级的结构闭环：通过；执行证据闭环：未完成**
   - 设计级 D1-58 的测试数据、操作步骤和预期结果包含同一组五断言。
   - 五条专属展开行分别承载五断言及其证据要求，且追踪表已逐条指向专属行，结构闭环成立。
   - 但五条展开行当前仍为未执行状态，`requiredEvidence` 内容是“待补”要求，不是真实执行产物；追踪行仍为 `UNASSESSED`。因此本轮只能确认设计绑定完成，不能确认运行证据已经闭合。

## 未闭合状态复核

本轮之外的状态与 Round-12b 通知一致，未因本次结构补充而改变：

- `FAIL (1)`：`EXP-NR3-09` / D1-39 Windows P0 #554；
- `SPEC-MISMATCH (5)`：D1-29、D1-43c、D1-46g、D1-55b、EXP-NR3-19；
- `BLOCKED (9)`、`NOT_RUN (1)`：Linux 补跑、D1-52、macOS/ARM、CodeArtsSpace、TTY/remote session 等环境项；
- 追踪表仍有 `133` 条 `UNASSESSED`。

依据评审门槛，环境类 `BLOCKED/NOT_RUN`、规格类 `SPEC-MISMATCH` 或 P0 `FAIL` 尚未闭合时，不得给出 `TEST_DESIGN_READY`。本轮 D1-58 结构整改通过，但总体结论维持 `REVIEW_CHANGES_REQUESTED`。
