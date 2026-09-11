# 全量测试设计整改评审 Round-12

> 评审对象：`REV-20260911004604` Hermes Round-12  
> 评审日期：2026-09-11  
> 评审范围：Round-12 `status.md`、round-11 评审、设计级/展开级矩阵、追踪表、生成脚本、门禁脚本和闭环规范  
> 评审结论：`REVIEW_CHANGES_REQUESTED`

## 一、门禁实测

在仓库根目录实际执行：

```text
python test-cases/design/verify_new.py
=> 25/25 PASS，exit 0

python test-cases/design/scan_gaps.py
=> 展开规则 0 空
=> 36 工具全部有覆盖
=> GATE-PASS
```

`verify_new.py` 本轮实际覆盖并通过了 163 条设计级用例、132 条展开级用例、169 行/10 列追踪表、设计级 ID 外键、`expandedCaseId` 外键、设计到展开映射非空、已执行追踪行证据非空以及追踪表/展开级状态一致性检查。门禁有效，但门禁 PASS 不等于全量设计达到放行状态。

## 二、九类检查

### 1. 需求覆盖与追踪

**机器结构通过，执行闭环未通过。** 设计级 163 条、展开级 132 条、追踪表 169 行/10 列；ID 唯一，设计级和展开级外键实测无错误。Round-12 新增 D1-58 已出现在设计矩阵，追踪表有 `D1-58` 外键；ITER-005 P2 专项行也已从待回填改为正式 ID。

追踪门禁增强有效，能够阻断非法 `expandedCaseId`、空映射、缺证据和 PASS 对应展开级 FAIL/SPEC 的情况。但 133 行追踪记录仍为 `UNASSESSED`，不能称为证据闭环。

D1-58 的 R12 追踪行使用 `由EXP-D5客户端矩阵覆盖(D5-1~7逐客户端)`，机器上属于合法载体标注且不破坏外键；但是当前 132 条展开级数据中没有 `源用例=D1-58` 的展开行，EXP-D5 行的执行要点仍引用 D5 用例。该标注只能证明映射字段非空，不能证明 Claude/Cursor 白名单的五个断言已经在展开级执行。需补 D1-58 专属展开行，或在正式执行计划中逐项说明如何由 D5 载体承载这五个断言并归档证据。

### 2. 测试层次

**部分通过。** COMMON、CLIENT_MATRIX、OS_MATRIX、AGENT_E2E、CROSS_PROCESS 规则和状态字段完整；真实客户端、OS、TTY、remote、升级路径仍与函数/mock 层次区分。

但 D1-58 的五断言目前仍是设计级/专项行，不能由通用 D5 占位展开结果自动替代真实客户端配置合并验证。D9-9 仍依赖 Inspector/夹具，取消能力的真实产品规格尚未裁决。

### 3. 断言强度

**Round-11 指出的契约开放断言已基本闭合，但本轮不能据此放行。**

- D1-57：`EREPO_BAD_TARBALL` 为唯一错误码，已删除“或自定义同码”。
- D3-C7：区域不可用固定 `Ecs.0021`，资源不存在固定 `Ecs.0200`，已删除 message 替代路径。
- D3-C8：固定 `Ecs.0038`，已删除 message 替代路径。
- D3-C9：不存在/已删除固定 `APIGW.0101`，冻结 fixture 固定 `EVS.5400`，已删除 message 替代路径。
- D9-9：超时错误码固定为 `-32000`；取消能力按 initialize capabilities 实测，不支持时记录 `SPEC-MISMATCH`，没有伪造支持。

针对五条目标用例检查“或/同码/二选一/message 含”残留时，未发现 Round-11 所指的替代错误码断言残留。D9-9 仍有 `message` 包含 `timeout` 的文本约束和 capabilities 条件分支；前者不是错误码替代路径，后者已显式纳入 SPEC 状态，但仍是外部规格依赖，不能作为已闭合的产品行为证据。

### 4. 负向路径与恢复

**设计覆盖通过，放行未通过。** 坏包回滚、安装中断、凭证轮换、区域/项目/资源状态、令牌过期/重放、超时/恢复均有入口和证据要求。

`EXP-NR3-09` 对应 D1-39 仍为 P0 `FAIL`，Windows `npm.cmd`/`spawnSync` 缺陷 #554 未修复；Linux 探针补跑和真实升级链也仍未完成。因此关键失败恢复路径没有达到可执行放行条件。

### 5. 安全与兼容

**部分通过。** 一次性凭证、`tctest-` 资源标签、owner/清理、SIM 冻结级别、代表客户端和 OS 范围已记录。

仍缺 CodeArtsSpace 第二个 Hook 客户端、macOS/ARM 和真实 TTY/PTY 证据；Windows P0 缺陷仍在。D1-58 的隔离 HOME 要求已写入设计，但没有对应五断言执行证据。

### 6. 环境隔离

**设计通过，证据未闭合。** D1-58、D3-C7/C8/C9、D2-21、D4-24 等均写明隔离 HOME、真云资源标签/清理、SIM fixture、一次性凭证或可注入时钟。

现有矩阵仍列出真云多 region/企业项目权限、Linux 补跑、macOS/ARM、CodeArtsSpace、TTY/PTY 和 remote session 等环境缺口。设计中的 `requiredEvidence` 不能代替实际清理清单、运行 manifest 和日志。

### 7. 可复现性

**数据和门禁层通过，真实执行层未通过。** `gen_matrix.py`、`gen_tracing.py` 的生成逻辑可追溯，CSV 行数和字段稳定；`verify_new.py` 可在失败条件下非零退出，追踪外键和状态门禁本轮已实际验证。

但生成脚本只生成设计/追踪数据，不生成真实执行证据。当前 `UNASSESSED 133`，且未决环境和规格项仍存在，故不能认为执行入口已经可复现。

### 8. 多终端覆盖

**不通过。** 展开级 NR3 实测状态为：

```text
PASS 13 / BLOCKED 9 / FAIL 1 / SPEC-MISMATCH 1 / NOT_RUN 1
```

未闭合项包括：Linux D1-27/42/46/53/45 补跑（`EXP-NR3-02/04/06/08/24`）、Windows D1-39 P0 FAIL（`EXP-NR3-09`）、macOS/ARM（`EXP-NR3-11`）、CodeArtsSpace Hook 客户端（`EXP-NR3-15b`）、Linux 真实升级链（`EXP-NR3-16`）、remote session 规格/执行（`EXP-NR3-19/20`）和真实 TTY/PTY（`EXP-NR3-21`）。

闭环规范要求声明支持的 macOS/ARM、remote、TTY 路径不得无证据；Round-12 未改变这些状态，因此不满足放行门槛。

### 9. 统计口径与状态

**结构通过，放行不通过。** PASS、FAIL、BLOCKED、SPEC-MISMATCH、NOT_RUN、UNASSESSED 已分列；BLOCKED/NOT_RUN 原因和证据字段齐全；追踪表状态与展开级状态一致性门禁通过。

`status.md` 自报的 NR3 分布与展开级实际数据一致，未把 BLOCKED、FAIL 或 SPEC-MISMATCH 伪装为 PASS。但这些未闭合状态本身仍然存在，符合审计记录要求，也直接阻止 `TEST_DESIGN_READY`。

## 三、逐项回应 round-11 七项剩余项

1. **修复 D1-39 / EXP-NR3-09：未闭合。** 当前仍为 Windows P0 `FAIL`，缺陷 #554 仍待正式发布线修复和回归证据。
2. **Linux D1-27/42/46/53/45 补跑：未闭合。** 5 条对应展开行仍为 `BLOCKED`，虽已记录 testbot3 已接入，但尚无补跑日志和 manifest。
3. **macOS/ARM、CodeArtsSpace、真实 TTY/PTY：未闭合。** 仍分别为 `BLOCKED`，没有执行证据，也未撤销对应支持承诺。
4. **remote session 与 hintConsumed 裁决：未闭合。** `EXP-NR3-19` 为 `SPEC-MISMATCH`，`EXP-NR3-20` 为 `NOT_RUN`；仍需产品/规格决定会话隔离语义，或正式声明不支持并移除承诺范围。
5. **五条契约唯一结构化断言：已闭合至设计整改要求。** D1-57、D3-C7、D3-C8、D3-C9 已删除替代断言；D9-9 已固定 `-32000`，其取消能力分支明确记录为规格依赖。D9-9 的 SPEC 依赖仍是整体放行阻断项。
6. **追踪门禁增强：已闭合。** `verify_new.py` 实测 25/25 PASS、exit 0；设计/展开外键、映射非空、证据非空和状态一致性均有实际检查。
7. **ITER-005/P2 白名单回填：ID 回填已闭合，执行证据未闭合。** D1-58 已正式进入设计矩阵，追踪表也有正式 ID；但专项 PASS 行与 R12 设计行同时存在，且没有 D1-58 专属展开行和五断言执行证据。该项需补强载体/证据关联后才算完全闭环。

## 四、放行门槛结论

以下门槛已满足：需求/设计/展开结构化追踪的机器校验、ID 外键、设计到展开的非空标注、状态枚举、证据字段规则、用例唯一性、契约错误码收敛、工具覆盖和生成/门禁可复现性。

以下门槛仍不满足：

- P0 `EXP-NR3-09` 仍为 `FAIL`；
- 5 条 Linux 探针仍为 `BLOCKED`；
- macOS/ARM、CodeArtsSpace、TTY/PTY 仍无证据；
- remote session 为 `SPEC-MISMATCH/NOT_RUN`；
- D1-58 的设计到通用 D5 载体标注未形成五断言的专属展开/证据闭环；
- 追踪表仍有 133 行 `UNASSESSED`。

根据闭环规范，环境类 `BLOCKED/NOT_RUN`、产品规格 `SPEC-MISMATCH` 或 P0 `FAIL` 未闭合时，不得输出 `TEST_DESIGN_READY`。

## 五、必须修改项

1. 修复 D1-39 的 #554 并补充正式发布线 Windows 回归证据，闭合 `EXP-NR3-09`。
2. 在 testbot3 完成 D1-27/42/46/53/45 Linux 探针，归档 stdout/stderr/exit/manifest，并更新 `EXP-NR3-02/04/06/08/24`。
3. 提供 macOS/ARM、CodeArtsSpace 和真实 TTY/PTY 证据，或在产品决策记录中撤销相应支持承诺。
4. 对 remote session、`hintConsumed` 和 D9-9 cancellation capability 做正式规格裁决；裁决前保持 `SPEC-MISMATCH/NOT_RUN`，不得放行。
5. 为 D1-58 增加专属 `expandedCaseId` 展开行，或将 D5 载体逐项绑定到五个白名单断言，并归档 `.bak`、merge JSON、坏 JSON 零写入 hash、同 key 不备份和未命中 snippet 五类证据。
6. 执行剩余 `UNASSESSED` 用例并回填追踪表状态、证据和时间；不得用门禁 PASS 代替执行结果。

## 六、最终结论

```text
REVIEW_CHANGES_REQUESTED
```

