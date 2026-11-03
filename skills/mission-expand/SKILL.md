---
name: mission-expand
description: "huaweicloud-devkit 测试使命自主展开：Worker agent 收到测试使命(mission yaml：scope/affectedTools/qualityCriteria)后，自主设计可执行测试用例（正常+边界+异常，3–8 条/使命）并执行回填，产出落执行包 autocases/<mission-id>.csv，过 verify_mission_expansion.py 门禁。含判据强度四阶(L1 文案/L2 双向断言/L3 闭环有效性/L4 独立回读)、自证禁区、与用例母版的边界铁律。Use when: 收到「展开使命 <mission-id>」提示语，或需要把测试使命(mission)自主展开为具体测试用例并执行（AI 原生测试 Layer 3）。"
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [testing, huaweicloud-devkit, mission, ai-native, layer3, case-design]
    related_skills: [case-design, test-execution, source-coverage]
---

# 测试使命自主展开（Layer 3：使命 → 用例）

## Overview

测试编排采用**三层生成模型**：Layer 1 策略（Test Manager 决策引擎产出 `test-strategy.md`）→
Layer 2 使命（`test-cases/missions/*.yaml`，含 scope + affectedTools + qualityCriteria）→
**Layer 3 用例（本技能：Worker agent 收到使命后自主展开）**。

本技能就是 Layer 3 的落地：**使命不写具体用例**，用例由执行 agent 在使命的 scope / constraints /
qualityCriteria 约束下**自主设计并执行**。这样用例能跟着领域上下文与环境自适应，而不必维护者逐条手写。

## When to Use

- 收到提示语 `展开使命 <mission-id>`（或调度器下发的使命包）。
- 使命已由 `test-manager/run-plan.mjs` 生成、经 `publish-missions.mjs` 分发到 `test-cases/missions/`，
  并由 `scripts/mission_ingest.py` 摄入到当日执行包。
- **不适用**：只需照章执行母版用例（走 `每日测试` / `skills/test-execution`）；或校验用例结构规范（走 `用例规范`）。

## 前置

| 项 | 要求 |
|---|---|
| 使命文件 | `test-cases/missions/<mission-id>.yaml`（或执行包内 `missions/` 的摄入副本） |
| 执行包目录 | `results/<你的客户端>/<日期>-<IP>/<OS>/`（先 `python scripts/init_day.py <客户端> <OS>` 建包） |
| 必须读的字段 | `spec.scope` / `spec.affectedTools` / `spec.qualityCriteria` / `spec.constraints` / `spec.affectedCases` |
| 真云类使命 | 凭证就绪（先 `npm run preflight`）；真云用例必须真机执行 + 测后归零 |

## 步骤

### 1. 解析使命，列出「必须覆盖的判定点」
读 `scope`（测什么）、`constraints`（环境/数据限制）、`qualityCriteria`（通过标准）、`affectedTools`（涉及的工具面）。
**完成判据**：口头/笔记里能列出「本使命需要覆盖的判定点清单」，且每个判定点都能对应到 `affectedTools` 或 `affectedCases` 里的具体对象。

### 2. 设计用例（正常 + 边界 + 异常，3–8 条）
按 `affectedTools` 逐项设计，**不要只测"能跑通"**：
- **正常路径**：典型输入 → 期望行为
- **边界值**：空值 / 极值 / 特殊字符 / 大小写 / 引号与空格形态
- **异常路径**：非法输入 / 缺权限 / 超时 / 并发

**完成判据**：每条用例都有「明确输入 + 可判定的预期」，且覆盖了 `scope` 里点名的每个判定点。
**铁律**：用例必须**来自使命的 scope + affectedTools**，不得凭空发明与使命无关的场景。

### 3. 判据强度自审（禁止自证）
判据强度四阶，**优先 L2 以上**：

| 阶 | 含义 | 例 |
|---|---|---|
| L1 | 文案/存在性 | "返回文案含『成功』" |
| L2 | 双向断言 | "命中时返回 X，**未命中时必须返回 Y**"（正反都断言） |
| L3 | 闭环有效性 | "创建后**独立回读**能查到 → 删除后回读查不到" |
| L4 | 独立回读 + 归零 | 用**另一条路径**（列表/API）验证状态，并确认资源归零 |

**禁区**：判据不得是「自己输出自己」——如探针硬编码 `Status: PASS`、断言被测对象自己返回的字段当证据、把"命令执行成功"当"行为正确"。
**完成判据**：每条用例的 `判据强度` 列填 L1–L4，且 L1 条目数 ≤ 总数的 1/3（避免整批浅判据）。

### 4. 落盘：`autocases/<mission-id>.csv`
写入执行包内 `autocases/<mission-id>.csv`，列固定为：

```
case_id,步骤,输入,预期结果,判据,判据强度,关联工具,结果,证据路径
```

- `case_id` 格式 **`AUTO-<mission-id>-<序号>`**（如 `AUTO-mission-001-3`）——
  与母版 ID（`D3-S1` / `EXP-*`）**空间隔离**，避免污染真源。
- `关联工具` 必须取自使命 `affectedTools`（不得写使命外的工具）。
- `结果` ∈ `PASS / FAIL / BLOCKED / NOT_RUN`；标 PASS 必须有 `证据路径`。

### 5. 执行 + 回填
逐条执行，证据按用例 ID 组织：`evidence/AUTO-<mission-id>-<n>/{probe.mjs,stdout.log}`。
**完成判据**：CSV `结果` 列无空格，且每条 PASS 都有非空 `证据路径` 且目录真实存在。

### 6. 过门禁
```bash
python scripts/verify_mission_expansion.py <执行包目录> --mission <mission-id>
```
**完成判据**：门禁 exit 0（结构 / 列名 / case_id 前缀 / 判据强度 / 工具归属 / PASS 证据全部通过）。

## 与用例母版的边界（铁律）

- 自主用例**只落执行包 `autocases/`**，**不得回改** `test-cases/` 母版（母版由 `gen_matrix.py` 生成 + `verify_new.py` 门禁）。
- 若某条自主用例值得**固化**成常规用例 → 走 `skills/case-design` 流程（生成器三处联动 + 门禁复现），
  不要直接写进母版 CSV。
- 汇总层把自主用例与母版用例**分开统计**（口径：`autocases` 不计入母版通过率）。

## Common Pitfalls

1. **判据自证**：写「探针返回 PASS 即通过」——等于没断言。改成「独立回读目标状态」。
2. **只测浅层**：查列表（只读、零成本）不能代表写能力。使命若涉及创建/修改/删除，必须走真机闭环。
3. **用例与使命脱节**：设计的场景不在 `scope` 内、用了 `affectedTools` 之外的工具 —— 门禁会拒。
4. **case_id 冲突母版**：直接复用 `D3-S1` 之类母版 ID，会与真源撞号。必须带 `AUTO-` 前缀。
5. **PASS 无证据**：标 PASS 但 `证据路径` 空或目录不存在 —— 与全仓 `verify_no_fake_pass.py` 同一条红线。
6. **把使命当用例**：使命里的 `qualityCriteria` 是**通过标准**，不是步骤；不要直接抄进 `预期结果` 列就交差。

## Verification Checklist

- [ ] `autocases/<mission-id>.csv` 存在，列名与契约完全一致（9 列）
- [ ] 每条 `case_id` 形如 `AUTO-<mission-id>-<n>`，无母版 ID 混入
- [ ] 条数在 3–8 之间（若使命覆盖判定点多于 8 条，拆使命而不是超量）
- [ ] 每条有 `步骤 / 输入 / 预期结果 / 判据`，`判据强度` ∈ {L1,L2,L3,L4}
- [ ] L1 条目 ≤ 1/3；无自证式判据
- [ ] `关联工具` 全部落在使命 `affectedTools` 内
- [ ] 每条 PASS 的 `证据路径` 目录真实存在且含非空输出
- [ ] `python scripts/verify_mission_expansion.py <执行包> --mission <id>` exit 0
