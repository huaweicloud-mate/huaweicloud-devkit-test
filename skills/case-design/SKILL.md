---
name: case-design
description: "huaweicloud-devkit 测试用例结构与规范：用例体系五分区与真源纪律、维度 D1–D11 与 ID 三铁律、三张矩阵列结构(设计级 27 / 展开级 24 / 追踪表 10)与列↔内容语义映射、展开规则四段规范(COMMON/CLIENT_MATRIX/OS_MATRIX/AGENT_E2E/CROSS_PROCESS)、新增用例的生成器三处联动与门禁复现校验、UX/D11 体验用例判据强度、状态口径与红线陷阱。Use when: 收到「用例规范」提示语，或需要设计/审查/修改/新增测试用例(设计级·展开级·追踪表·D11 体验级·issue 回归用例)、校验用例规范性/列语义对应/覆盖完整性。"
version: 1.0.0
tags: [testing, test-design, case-matrix, test-case-design, coverage, huaweicloud-devkit]
---

# 用例结构与规范（case-design）

为 huaweicloud-devkit（MCP 插件，npm 包 `huaweicloud-devkit`）**设计、审查、修改测试用例**的规范手册。
设计产物全部落在本仓库 `test-cases/` 下。

> 本文档**平台无关、自包含**：不依赖任何特定 agent/客户端工具，随 git 分发到所有 agent。
> 与 `skills/test-design/SKILL.md` 的分工：本文件管**「用例长什么样」（结构/列/ID/展开规则/门禁）**，
> test-design 管**「怎么把用例产出来」（范围固定 → 设计稿 → 评审放行 → 用例输出）**。

## 触发语（一句话）

```
用例规范                    # 查规范 / 校用例 / 设计或新增用例前对照
用例规范 <维度或用例ID>      # 例：用例规范 D11 / 用例规范 D1-71
```

只要出现「用例规范」，或向本仓库**新增/修改/审查**测试用例，即适用本能力。

## 前言

设计前先确认仓库与源码仓就位（源码仓是测试仓的**兄弟目录** `../hdk`，用于核对函数名/字段/错误码）：

```bash
git clone https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git   # 测试仓（本仓）
git clone https://github.com/huaweicloud/huaweicloud-devkit.git ../hdk      # 源码仓
python scripts/prepare_env.py --update                                      # 拉最新（本仓 main + hdk 对齐 npm latest）
```

## 0. 文件地图（先定位再动手）

| 路径 | 内容 | 真源 |
|---|---|---|
| `test-cases/design/用例矩阵-设计级.csv` | 设计级用例（**27 列**，纯设计定义） | ✅ `design/gen_matrix.py` |
| `test-cases/expanded/用例矩阵-展开级.csv` | 展开级用例（**24 列**） | ✅ `design/gen_matrix.py` |
| `test-cases/tracing/需求-设计-证据追踪表.csv` | 需求↔设计↔展开 追踪表（**10 列**） | ✅ `design/gen_tracing.py` |
| `test-cases/daily/` | 每日基础用例（母版**筛行不裁剪列**的精选子集） | `test-cases/gen_daily.py` |
| `test-cases/versions/<版本>/` | 版本冻结快照（设计文档 + CSV 快照） | 复制母版 |
| `test-cases/issues/<编号>-<slug>/回归用例.md` | 缺陷级定向回归用例 | 手写 Markdown |
| `test-cases/ux/用例矩阵-体验级.csv` | D11 体验用例（**27 列**，独立分区） | ✅ `ux/gen_ux.py` |
| `test-cases/design/verify_new.py` | 设计门禁（行/列/字段/四段/工具覆盖/可复现） | — |
| `test-cases/design/scan_gaps.py` | 深度扫描门禁（展开规则 0 空 + 工具全覆盖） | — |

**铁律：用例定义与执行结果分离。** `test-cases/**` 只放纯设计定义（无执行状态/结果/证据路径）；
执行结果只落 `results/**`（`scripts/init_day.py` 复制母版时追加 `执行状态`/`execution_status` + `evidencePath` 空列供回填）。
**禁止手改 CSV 母版**——一律改生成器后重跑。

## 一、维度与 ID 规则

| 维度 | 名称 | 范围 |
|---|---|---|
| D1 | 安装 | 安装/卸载/升级/生命周期/引导 |
| D2 | 认证 | 凭证解析/指纹/多档/只读子账号 |
| D3 | 功能 | MCP 工具功能与真云 E2E（创建→验证→释放→归零） |
| D4 | 安全 | 审批/hook/最小权限/注入对抗 |
| D5 | 客户端 | 10 客户端矩阵 |
| D6 | 性能 | 压测/采样统计 |
| D7 | 兼容 | OS × Node 版本矩阵 |
| D8 | 质量 | 静态评审/资产一致性 |
| D9 | 协议 | MCP 协议报文/schema |
| D10 | 评测 | 意图路由评测集 |
| D11 | 体验 | UX 体验（**独立分区 `ux/`**） |

- **维度列字面量 = 无分隔连写**：`D1安装` / `D2认证` / … / `D11体验`（CSV「维度」单元格就是这个合并串，不是「D11」+「体验」两列）。
- **ID 格式**：设计级 `D<维度>-<序号>`（如 `D1-1`、`D3-C7`、`D11-43`）；展开级 `EXP-<矩阵>-<序号>`（如 `EXP-D5-1-1`）。
- **优先级**：`P0` 必测（安全/中断级）/ `P1` 应测 / `P2` 可测。
- **禁止剪枝集**：D4 全量、D1-3、D9 全量、D10 核心评测集——任何裁剪不得触碰。
- **演进三铁律**：① ID 一经分配**永不复用**；② 废弃用 `OBSOLETE` 标记（保留历史结果，不物理删除）；③ 修改 = **新 ID + 注明 supersedes 旧 ID**（保证跨版本可比）。

## 二、三张矩阵的列结构（列↔内容语义映射）

### 2.1 设计级 27 列（`design/`、`ux/`）

```
ID | 维度 | 标题 | 优先级 | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 指引来源 | 关联工具 | 自动化建议 | 展开规则 |
生成时间 | 设计状态 | 终端覆盖类型 | terminal | agent | OS | Node/npm | shell | TTY | installLayout |
mcpTransport | hookSupport | requiredEvidence | owner | 依赖
```

（= 12 个设计字段 + 生成时间/设计状态 + 终端覆盖类型 + 9 个终端元数据 + requiredEvidence + owner/依赖）

| 列 | 应填（语义） | 禁止 / 常见错位 |
|---|---|---|
| 前置条件 | 环境/凭证/版本/隔离态（可复现） | 输入数据、操作动作、模糊词「合适的环境」 |
| 测试数据 | **精确**输入值/断言契约（如 `distTags={latest:1.1.2}`） | 「若干数据」、环境描述 |
| 操作步骤 | **编号化**可机械执行（①②③） | 「酌情/大概」、预期结果 |
| 预期结果 | **纯设计预期**，唯一可判定断言 | 执行观测（「实测发现…」「当前状态…」）——门禁会查 |
| 关联工具 | MCP 工具名（40 个 `huaweicloud_*` 全名/简称）+ CLI（install/uninstall/doctor/status/update/install-hcloud/plugins/npx/npm/auth/reconcile）+ 框架组件（mcp-server/inspector/harness） | 源码函数名（归「指引来源 `实:xxx`」）、脚本文件、概念词、通配符 |
| 指引来源 | 带标签：`P:` 产品承诺 · `仓:` 仓库事实 · `标:` 行业对标 · `规:` 规范 · `通:` 通用实践 · `设:` 设计文档 · `方:` 方案 · `实:` **源码函数/文件** | 无标签裸描述 |
| 自动化建议 | 载体建议（如「函数/fixture」「脚本 60%」） | 执行结论 |
| 展开规则 | **四段**：`<枚举>|<代表: …>|<证据: …>|<阻塞: …>` | 段数≠4、缺标签、串段（门禁硬校验） |
| 生成时间 | 批次日期（`YYYY-MM-DD`），由 `gen_matrix.py` 的 `BATCH_TS`/`gen_ts()` 推导 | 手填当前时间 |
| 设计状态 | 恒 `DESIGN_COVERED`（= **设计完整**，≠ 执行通过） | 写执行态、自签放行态 |
| 终端覆盖类型 | 五枚举之一（见 §四） | 自由文本 |
| terminal/agent/OS/Node·npm/shell/TTY/installLayout/mcpTransport/hookSupport | 终端元数据，**0 空**（未涉及写 `n/a`） | 空值（门禁报错） |
| requiredEvidence | 「强断言：…；保留脱敏日志/前后快照」 | 空 |
| owner / 依赖 | 「测试负责人」/ 依赖与清理约定（含 `契约依赖: <字段> 待冻结`） | 空 |

### 2.2 展开级 24 列（`expanded/`）

```
ID | 展开类型 | 枚举对象 | 源用例 | 优先级 | 执行要点 | 预期结果 | 生成时间 | requiredEvidence |
designCaseId | expandedCaseId | design_status | terminalType | terminal | agent | OS | Node/npm |
shell | TTY | installLayout | mcpTransport | hookSupport | owner | 依赖
```

- 展开类型：`D5客户端矩阵`（逐客户端 70）/ `D3-C4服务矩阵`（22）/ `D10评测集`（15）/ `NR3终端矩阵`（25）/ `D1-58白名单矩阵`（5）——字面量与 `gen_matrix.py` 写入 CSV 的真值一致（`_nr3()` / `_d158()`）。
- `执行要点` = 「在 <枚举对象> 上执行 <源用例>」；`预期结果` 必须带枚举对象前缀（如 `OpenCode：…`）。
- 外键：`designCaseId` 必须能在设计级找到，`expandedCaseId` = 本行 ID。

### 2.3 追踪表 10 列（`tracing/`）

```
sourceAsset | requirementOrRisk | designCaseId | expandedCaseId | testLayer |
clientOrOSScope | requiredEvidence | design_status | owner | gap
```

- 两处外键校验：`designCaseId` → 设计级 ID；`expandedCaseId` → 展开级 ID（或 `由EXP-…覆盖(...)` / `无(不展开/代表执行)` / `-`）。
- **设计→展开映射无缺口**：声明了展开类型的用例，`expandedCaseId` 不得为空。
- 注意：**禁 `status` / `evidencePath` 列**（那是执行态，追踪表是纯设计追踪）。

## 三、设计方法论（要点；真源见 test-design §二）

> 本节与 `skills/test-design/SKILL.md` §二**同源**：完整方法论表（六技术 × devkit 落点示例、六要素逐条、对照源码核对四步）以 test-design 为准，本节只列**判据**，避免两处漂移。

**六技术查缺口**（任一技术的典型场景无对应用例 → 记缺口，落「需求/风险」或新增 ID；不臆造、不堆用例充数）：
等价类划分 · 边界值分析（版本 `1.1.0` vs `1.1.0-next.9`、TTL 1h、节流 5min、cooldown 3 天）· 决策表（多条件组合）· 状态转换（状态机各迁移/回退）· 场景法（真云 E2E 创建→验证→释放→归零）· 错误推测（中断/回滚/绕过/注入）。

**六要素**（每条用例必须同时满足，任一违反即不规范）：

1. **单一验证点 + 唯一可追溯 ID**（ID 永不复用）；
2. **前置条件明确可复现**（禁「已配置好」）；
3. **测试数据具体**（精确值/契约，不用「若干」）；
4. **操作步骤可机械执行**（编号化，无「酌情」）；
5. **预期结果可判定 + 断言唯一**（精确错误码/字段/阈值；**禁用模糊词**：明确/正确/合理/可执行/类/如/或同义/二选一；多结果 → 拆独立契约）；
6. **关联工具 = 真实 MCP 工具名**（函数/脚本/组件归「指引来源 `实:xxx`」）。

**断言契约**：错误码/响应字段/常量必须是唯一可判定值（`EREPO_BAD_TARBALL` / `Ecs.0021` / `-32000` / `ETIMEDOUT`）。
实例：`err.code=="HDKIT_CRED_MISSING" && err.onboarding.scenario==3 && steps[] 含 action=="obtain-aksk"`。

**源码核对**（防「设计 vs 实现」漂移，源码根 = `../hdk/plugins/huaweicloud-core/src/`）：核对函数名真实存在（实例：`wrapResult` 不存在，实为 `decorateResult`）、字段/错误码/常量值一致（如 `fingerprint = sha256(ak+sk).hex.slice(0,8)`，无冒号拼接）；工具全集以 `tools.mjs` 的 `TOOL_DEFINITIONS` 的 `name:` 机器推导为准（**非手写清单**）。

## 四、展开规则四段规范

五枚举（`test-cases/design/gen_matrix.py` 的 `ENUM_TYPES`）：`COMMON` / `CLIENT_MATRIX` / `OS_MATRIX` / `AGENT_E2E` / `CROSS_PROCESS`。

格式：`<枚举>[|<代表: …>|<证据: …>|<阻塞: …>]`，四段缺一不可（`scan_gaps.py` 要求 0 空，`verify_new.py` 校验段数与标签）。

| 维度 | 默认展开规则 |
|---|---|
| D1安装 | `OS_MATRIX\|<代表: Windows/Linux>\|<证据: 安装落点+重启生效+卸载残留>\|<阻塞: 无>` |
| D2认证 | `COMMON\|<代表: Hermes 或 OpenCode>\|<证据: 三端指纹/状态字段>\|<阻塞: 需真云凭证>` |
| D3功能 | `COMMON\|<代表: Hermes>\|<证据: 工具返回+归零验证>\|<阻塞: 按用例需真云>` |
| D4安全 | `COMMON\|<代表: hook=Hermes 非hook=OpenCode>\|<证据: hook拦截结果>\|<阻塞: 需hook-capable客户端>` |
| D5客户端 | `CLIENT_MATRIX\|<代表: 逐客户端 10+>\|<证据: 安装/加载/重启>\|<阻塞: 长尾客户端环境>` |
| D6性能 | `COMMON\|<代表: Windows x64 + Node22>\|<证据: 采样统计 p95>\|<阻塞: 需标准环境>` |
| D7兼容 | `OS_MATRIX\|<代表: Windows/Linux/macOS × Node22/24>\|<证据: 安装冒烟>\|<阻塞: macOS 缺环境>` |
| D8质量 | `COMMON\|<代表: 静态评审人 测试经理>\|<证据: 评审记录+链接>\|<阻塞: 无>` |
| D9协议 | `COMMON\|<代表: MCP Inspector + Hermes>\|<证据: 协议报文>\|<阻塞: 无>` |
| D10评测 | `CLIENT_MATRIX\|<代表: 10 客户端>\|<证据: 评测集结果+模型参数>\|<阻塞: 评测预算>` |

真云类归 `COMMON` 并用代表终端标注（如 `<代表: 隔离进程>`），不为真云新增枚举类型。

## 五、新增/修改用例的标准流程

1. **判断类型**：版本需求 → 母版 `design/`（评审后进）；缺陷回归 → `test-cases/issues/<编号>-<slug>/回归用例.md`；体验 → `ux/`（D11）。
2. **改生成器**（`test-cases/design/gen_matrix.py`），**禁手改 CSV**。单条用例只有一个定义点：
   ```python
   add(id_, dim, title, pri, pre, data, steps, expect, src, tools, auto="", expand="")
   ```
3. **三处联动**（漏一处门禁必红）：
   - `add()` 定义行；
   - `BATCH_TS`（新批次的 `(谓词, 'YYYY-MM-DD')`）或在 `NEW_REVIEW_IDS_<日期>` 集合里登记新 ID —— 决定 `生成时间`；
   - `gen_ts()` 的分支（若为新批次日期）；
   - 若新增展开级：同步 `gen_matrix.py` 的展开规则/展开行 + `gen_tracing.py` 的追踪行。
4. **重生成 + 双门禁**：
   ```bash
   cd test-cases/design
   python gen_matrix.py && python gen_tracing.py   # 重生成矩阵 + 追踪表
   python verify_new.py                            # 结构门禁：行数/列数/必填/四段/工具覆盖/可复现 → exit 0
   python scan_gaps.py                             # 展开规则 0 空 + 工具全覆盖 → GATE-PASS
   ```
   ⚠️ `verify_new.py` 内**硬编码行数/列数断言**（`check("设计级行数 == N")`）——增删用例必须同步改：
   - `verify_new.py` 的行数/列数常量 + 其 docstring 清单（2026-10-13 曾出现 docstring 写 179 / check 写 212 的静默漂移）；
   - `test-cases/README.md` 的数量描述。
5. **daily 子集受影响** → `cd test-cases; python gen_daily.py`；**版本冻结** → 复制 CSV 到 `versions/<版本>/` + 补 `迭代测试设计.md`。
6. **同步文档**：`python test-cases/check_docs.py` / `python test-cases/check_readme_consistency.py`（保证「文档提及 = 原子记录」，不漏列不虚标）。
7. **放行纪律**：设计者只产出候选设计；放行态由维护者按 `docs/06-Hermes-Codex测试设计评审闭环.md` 统一评审（见 `skills/test-design/SKILL.md` §三）。

## 六、UX / D11 体验用例（独立分区）

独立分区 `test-cases/ux/`（真源 `ux/gen_ux.py`），不混放母版——判据形态与执行载体不同：

| 维度 | 功能用例 | UX 体验用例 |
|---|---|---|
| 判据形态 | 字段/错误码精确相等 | 症状消失（闭环）/ 独立观测 / 指标不劣化 |
| 断言强度 | 单侧 | **正断言 + 反断言**（不含英文整句原文、不含内部代号） |
| 执行载体 | 母版矩阵 + 脚本 | L1 单测 / L2 fixture / L3 replay / L4 agent 评测 |
| 生命周期 | 长期稳定 | 提案期会大改，评审通过后再并入 `design/` 母版 |

设计纪律：

1. **按用户旅程触点穷举**（不按工具数堆砌），否则必然偏科；
2. **主观体验 → 客观可判定信号**：提示友好 = 含中文字符集断言 **+ 反断言（不含指定英文原文）**；可动作 = `action` 字段以可执行命令前缀开头；闭环 = `ready`/`nextStep` 非空且唯一；可发现 = 能力清单非空且分组覆盖；
3. **双向断言 + 契约依赖显式标注**：依赖未实现字段的用例在「依赖」列写 `契约依赖: <字段> 待冻结`，执行前标 `NOT_RUN`——**不得以 `DESIGN_COVERED` 冒充「可执行/已通过」**。

可执行门禁：`npm run test:ux`（**三态退出码**：`0` 全过 = 需求已实现；`1` = `NOT_IMPLEMENTED` 需求验收未达标（已知缺口，非 harness 故障）；`2` = `BLOCKED` 宿主/环境不满足）。夹具自动发现 `d11-*.mjs` + 内置宿主隔离（空 `HOME`/`USERPROFILE`）。详见 `test-cases/ux/README.md`。

## 七、状态口径

| 状态 | 含义 | 约束 |
|---|---|---|
| 设计状态 `DESIGN_COVERED` | 设计完整 | **≠ 执行通过**；母版恒为此值 |
| PASS | 通过，有证据 | 必须①实测②证据落盘 `evidence/<case-id>/`③`evidencePath` 回填 |
| FAIL | 不符预期 | 必须落根因 = 文件 + 行号 |
| SPEC-MISMATCH | 实现与设计契约漂移 | 记漂移点 |
| BLOCKED | 环境/权限阻塞 | 必写 `blockedReason`（四要素：实测时间/缺失环境/影响/解除条件） |
| NOT_RUN | 未执行 | 仅限明确不适用本客户端/OS；P0 不得 NOT_RUN（OS 专属 P0 例外） |

## 八、红线

1. **禁手改 CSV 母版**：只改生成器 → 重跑 gen + verify + scan，字节级可复现（`verify_new.py` 的「生成脚本可复现」项会实测）。
2. **用例定义 ⊥ 执行结果**：`test-cases/**` 不含执行状态/结果/证据路径；预填执行态即违约。
3. **ID 三铁律**：永不复用 / OBSOLETE 标记 / 修改 = 新 ID + supersedes。
4. **设计阶段不跑真实探针/真云操作**——只做设计，执行归执行。
5. **凭证零进入 git**（AK/SK/密钥/`credentials.readonly.json` 不入库）。
6. **自签禁区**：设计者不自签放行态、不自封「已通过」；放行由维护者评审统一执行。

## 九、命令速查

| 用途 | 命令 |
|---|---|
| 环境就绪 | `python scripts/prepare_env.py --update` |
| 改用例（唯一定义点） | 编辑 `test-cases/design/gen_matrix.py` 的 `add(...)` |
| 重生成 | `cd test-cases/design; python gen_matrix.py; python gen_tracing.py` |
| 结构门禁 | `cd test-cases/design; python verify_new.py`（exit 0） |
| 深度扫描门禁 | `cd test-cases/design; python scan_gaps.py`（GATE-PASS） |
| daily 子集 | `cd test-cases; python gen_daily.py` |
| UX 生成 + 门禁 | `python test-cases/ux/gen_ux.py`；`npm run test:ux`（0/1/2） |
| 文档一致性 | `python test-cases/check_docs.py; python test-cases/check_readme_consistency.py` |
| 工具全集推导 | `python test-cases/tools-enum.py`（读 `../hdk/plugins/huaweicloud-core/src/tools.mjs` 的 `TOOL_DEFINITIONS`） |

## 十、陷阱

- `verify_new.py` 的行数/列数断言与其 docstring 是**两处硬编码**，改真源条数时必须同步，否则门禁报行数不符或 docstring 静默腐化。
- 读取含凭证/密钥的文件时，**工具输出可能被脱敏**（如 token 显示成 `***`）——照抄脱敏输出重写脚本会导致 f-string 未闭合/括号错位；改完必 `python -m py_compile` 验语法。
- Windows PowerShell：`>` 重定向 / `Out-File` 默认 UTF-16，Python 读会乱码 → 用 `Out-String` 或显式 `-Encoding utf8`；`Get-Content -Raw` 按 ANSI 读 UTF-8 中文会乱码 → 用 UTF-8 显式编码。
- CSV 必须带 BOM 读写：`encoding="utf-8-sig"`（各门禁脚本均如此），否则 Excel 打开中文乱码。
- 历史版本快照可能是脏数据（v1.1.3 快照 31 列已含执行态列）：`init_day` 追加回填列必须「只追加缺失列 + 统一置空」，否则 `Import-Csv` 报「成员执行状态已存在」。
- 数字口径：矩阵当前条数以 `verify_new.py` 的 `check()` 字面量为准，**不要在文档里另行硬编码**（本文件刻意不写条数）。

## 关联文档（本仓库内）

- `skills/test-design/SKILL.md` — 测试设计**流程**（范围固定 → 设计稿 → 评审放行 → 用例输出）+ 方法论真源
- `skills/source-coverage/SKILL.md` — 源码能力↔用例覆盖核对四步（含源码文件地图）
- `skills/test-execution/SKILL.md` — 执行侧回填约定（`evidence/<case-id>/` + `verify_no_fake_pass.py`）
- `test-cases/README.md` / `test-cases/ux/README.md` / `test-cases/daily/README.md` — 用例体系与分区说明
- `docs/06-Hermes-Codex测试设计评审闭环.md` — 评审闭环（放行状态 `TEST_DESIGN_READY`）
- `docs/upstream-designs/<编号>-<slug>/方案.md` — 上游方案归档（设计输入）
