# Hermes ITER-005 交接状态

- 状态：`HERMES_REVISION_READY`
- 评审结论：等待 Codex 复审；不得标记 `TEST_DESIGN_READY`
- 评审目录：`reviews/ITER-005-20260912092621/`
- 本轮纪律：只修改设计文档、CSV、生成/审计脚本和评审交接；没有运行测试、npm test、node --test、pytest、hcloud、真实 MCP、真实升级或真实云操作。

## SUT 基线（被测项目，P1 可复现）
- SUT 路径：`C:\Users\Administrator\devkit-test\hdk`（`HUAWEICLOUD_DEVKIT_HOME` 可覆盖，否则取测试仓相邻 `../hdk`）
- 工具注册源：`plugins/huaweicloud-core/src/tools.mjs` → 工具全集 **39 个**（由注册源推导，非硬编码门禁值）
- SUT 版本/commit：`1.1.3-next.4` @ `0316e00`（本机 hdk 工作副本，测试对象跟随 dev）

## 本轮修改

1. `test-cases/design/gen_matrix.py`：正式设计级矩阵增加设计/执行状态分离、终端字段、证据、阻塞责任、owner 和依赖；展开级增加规范化外键和状态字段。
2. `test-cases/design/gen_tracing.py`：追踪表追加 `design_status`、`execution_status`，保留历史 `status`。
3. `test-cases/design/verify_new.py`：工具全集改为从被测项目 `tools.mjs` 机器推导（不再硬编码 36/37 清单）+ 状态分离门禁定义。
4. `test-cases/design/render_iter005.py`：新增设计归档渲染器，仅读矩阵并生成本评审包。
5. 正式 `test-cases/design/用例矩阵-设计级.csv`、`test-cases/expanded/用例矩阵-展开级.csv`、`test-cases/tracing/需求-设计-证据追踪表.csv` 已按生成逻辑同步。
6. 工具全集口径整改（Codex round-01 P1）：36/37 → 39，同步 `docs/01-测试规划.md`（域表补 `auth_switch`/`auth_confirm` + 新增「升级提醒」域 `check_update`/`upgrade`）、`docs/02-测试规划评审报告.md`、`docs/03-执行准备清单.md`、`docs/测试体系-评审稿.html`、`gen_matrix.py` 用例预期与三张 CSV。
7. 门禁路径可复现（Codex round-02 P1）：`verify_new.py`/`scan_gaps.py` 工具注册源改为 env `HUAWEICLOUD_DEVKIT_HOME` + 相邻 `../hdk` 解析，解析失败明确 `[BLOCKED] ENV_MISSING`（exit 2），不再硬编码机器绝对路径。
8. 工具数量推导收敛（Codex round-02 P2）：工具数由 `tools.mjs` 单源推导；`verify_new.py` 新增生成脚本可复现哈希校验；`gen_matrix.py` 设计文本标注 `=tools.mjs 注册源数量`。
9. 门禁只读化 + 路径/解析稳健（Codex round-03 P1/P2）：`verify_new.py` 复现校验改为**临时目录生成候选 CSV 与正式真源字节对比，不覆盖真源**（生成失败报 `GENERATION_CHECK_FAILED`）；矩阵路径改为基于 `__file__` 的 `REPO_ROOT` 绝对路径（去 cwd 依赖）；`gen_matrix.py`/`gen_tracing.py` 支持 `HUAWEICLOUD_TESTCASES_DIR` 输出重定向；工具解析限制在 `TOOL_DEFINITIONS` 注册数组内且仅接受 `huaweicloud_` 前缀 `name`。

## 工具全集口径（P1 收敛结论）

- 工具全集由被测项目 `hdk/plugins/huaweicloud-core/src/tools.mjs`（正式注册源）唯一推导：**39 个**（去 `huaweicloud_` 前缀去重）。
- 36（规划标题）/ 37（旧静态清单）差异根因：NR2 增 `auth_switch`+`auth_confirm`，NR3 增 `check_update`+`upgrade`；规划 §1.5 列表实际仅列 35 项且标题误写 36。
- `verify_new.py` 不再独立硬编码工具清单，改由 `tools.mjs` 解析 → 数量、名称、设计级 `关联工具` 覆盖三者单源一致；39 个均为实现侧已注册工具，无需 SPEC-MISMATCH 标注。

## 统计

- 设计级：163 条；`设计状态=DESIGN_COVERED` 163；执行状态 `{'NOT_RUN': 131, 'PASS': 25, 'SPEC-MISMATCH': 5, 'FAIL': 1, 'BLOCKED': 1}`。
- 展开级：137 条；执行状态 `{'NOT_RUN': 108, 'PASS': 23, 'FAIL': 1, 'BLOCKED': 4, 'SPEC-MISMATCH': 1}`。
- 追踪表：169 条；含 `design_status/execution_status` 分离字段。
- 工具覆盖：唯一口径 = 被测项目 `tools.mjs` 注册全集 39 个（`verify_new.py` 从 tools.mjs 推导并逐名核对设计级 `关联工具` 覆盖，已闭合）；本轮只做静态设计核对，不将覆盖视为执行通过。

## 历史风险保留

- D1-39 的 P0 `FAIL` 不得改写为设计通过。
- D1-29、D1-43c、D1-46g、D1-55b 等 `SPEC-MISMATCH` 继续保留，待产品/开发裁决。
- macOS/ARM、CodeArtsSpace、TTY/PTY、remote session、Linux/跨客户端等缺少环境的路径统一按执行阶段 `BLOCKED`，责任归环境提供方。
- 历史失败/skip 仅作为 baseline risk，不产生新的执行结果。

## 待 Codex 复审

- 核验 163/137/169 三张表的外键、字段和状态一致性。
- 核验 131 条历史 `UNASSESSED` 是否都保持 `执行状态=NOT_RUN`，不被统计成 PASS。
- 核验由 tools.mjs 推导的 39 个工具的逐名覆盖（含 `auth_switch`/`auth_confirm`/`check_update`/`upgrade`），以及展开规则空值/不展开原因。
- 核验 10 行终端矩阵是否满足 Hermes、Hook、非 Hook、Windows、Linux、TTY/non-TTY、stdio/remote 的设计范围。
- 核验安全审批 token、写操作重试、P0 FAIL、SPEC-MISMATCH 和 BLOCKED 判定规则是否足够强。

## 仍未解决

唯一总体阻塞：**等待 Codex 完成 ITER-005 复审并决定是否继续整改；当前不得进入测试执行，也不得标记 `TEST_DESIGN_READY`。**
