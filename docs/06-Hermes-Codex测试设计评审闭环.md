# Hermes-Codex 测试设计评审闭环

> 适用范围：基于设计文档新增或修改测试用例，直到达到可执行状态。  
> 默认项目目录：`C:\Users\Administrator\devkit-test`  
> 协作角色：Hermes 负责测试设计，Codex 负责编排与评审，用户只处理需要产品决策或外部授权的事项。
>
> 时间格式：文档正文使用北京时间时间戳 `YYYY-MM-DD HH:mm:ss`；Windows 文件名和目录使用紧凑时间戳 `YYYYMMDDHHmmss`。历史归档若只有日期，保留原始事实，不补造时分秒。

## 1. 目标

建立固定的“生成 → 评审 → 修改 → 再评审”循环，避免出现以下情况：

- 只检查设计文档，没有读源码和既有测试；
- 只测函数或 mock，却把结果描述成真实用户闭环；
- 只在单一 Agent 或单一操作系统上验证，却把结果推广到所有终端；
- 用例有标题但没有可执行步骤和强断言；
- P0/P1、错误路径、安全影响或跨平台场景遗漏；
- 设计文档与实现不一致，却被统计成通过；
- 测试版本、commit、命令和环境无法复现；
- Hermes 修改后没有经过第二轮评审就直接进入执行。

最终目标不是“用例已经生成”，而是得到明确状态：

```text
TEST_DESIGN_READY
```

只有达到这个状态，才允许进入 `devkit-test` 测试执行阶段。

## 2. 角色职责

### 2.1 Hermes：测试设计者

Hermes 负责：

1. 阅读需求设计文档、被测项目源码、既有单测、历史矩阵和历史执行结果；
2. 生成初版测试用例；
3. 根据 Codex 评审意见修改用例、脚本和交接状态；
4. 为每条用例标注优先级、测试层、自动化方式和所需环境；
5. 对每条受影响用例标注多终端范围：Agent/宿主、操作系统、Node/npm、TTY/非 TTY、安装布局和 MCP 传输；
6. 说明无法执行的原因，不得把 `BLOCKED` 或 mock 结果写成 `PASS`；
7. 每轮修改后写出变更摘要和待 Codex 复核的项目。

Hermes 不负责最终放行，不得自行宣布 `TEST_DESIGN_READY`。

### 2.2 Codex：编排者与评审者

Codex 负责：

1. 接收 Hermes 的初版或修订版；
2. 独立阅读设计文档、源码、既有单测、测试矩阵和执行证据；
3. 检查覆盖、可执行性、断言强度、环境隔离、可复现性和结果统计口径；
4. 把问题按优先级写成可操作的修改意见，并发送给 Hermes；
5. 评审 Hermes 的下一版，必要时重复多轮；
6. 只有所有放行门槛满足后，才将状态改为 `TEST_DESIGN_READY`；
7. 将未解决的规格冲突、权限问题或外部环境缺口升级给用户决策；
8. 检查多终端覆盖是否充分，不能用一个终端的 MCP 结果替代客户端、OS、TTY 或安装布局差异验证。

Codex 不能因为“用例数量足够”就放行，必须确认关键用户链路和失败路径有足够证据。

### 2.3 用户：启动者与决策者

用户只需要：

1. 提供项目目录和设计文档；
2. 启动一次闭环；
3. 对产品策略冲突、真实升级、真实云资源、凭证或付费操作作最终决策；
4. 在收到 `TEST_DESIGN_READY` 后决定是否开始执行。

在没有需要用户决策的阻塞项时，Codex 与 Hermes 应自行完成往返，不能每轮都要求用户转发意见。

## 3. 固定状态机

状态只能按以下方向流转：

```text
INIT
  ↓
HERMES_DRAFT_READY
  ↓
CODEX_REVIEWING
  ├── REVIEW_CHANGES_REQUESTED → HERMES_REVISION_READY
  │                                  ↓
  │                           CODEX_REVIEWING
  ├── USER_DECISION_REQUIRED → BLOCKED
  └── TEST_DESIGN_READY
```

状态含义：

| 状态 | 含义 | 是否可执行 |
|---|---|---|
| `INIT` | 已启动，尚未收到 Hermes 设计 | 否 |
| `HERMES_DRAFT_READY` | Hermes 已提交初版 | 否 |
| `CODEX_REVIEWING` | Codex 正在检查 | 否 |
| `REVIEW_CHANGES_REQUESTED` | Codex 发现必须修改的问题 | 否 |
| `HERMES_REVISION_READY` | Hermes 已按意见提交修订版 | 否 |
| `USER_DECISION_REQUIRED` | 存在产品策略或外部操作决策 | 否 |
| `BLOCKED` | 因外部条件暂时无法继续 | 否 |
| `TEST_DESIGN_READY` | 设计达到执行门槛 | 是 |

`PASS` 只表示某一条测试或某一轮验证通过，不等于测试设计完成。测试设计完成必须使用 `TEST_DESIGN_READY`。

## 4. 交接目录和文件

每个需求使用独立评审迭代目录，建议结构如下：

```text
reviews/ITER-NNN-YYYYMMDDHHmmss/
├── hermes/
│   ├── test-design.md        # 当前测试设计说明
│   ├── candidate-matrix.csv  # 当前候选用例
│   ├── status.md             # Hermes 当前状态、变更摘要、待复核项
│   └── evidence/             # 设计验证证据，禁止放凭证
├── codex/
│   ├── review-round-01.md    # Codex 第 1 轮评审
│   ├── review-round-02.md    # 后续评审按轮次递增
│   └── decision-log.md       # 规格决策和用户决策记录
├── terminal-matrix.csv       # 评审确认后的多终端矩阵
└── FINAL_STATUS.md           # 最终状态和执行入口
```

实际落盘时，优先使用测试归档仓库的唯一真源：

- Hermes 测试设计：`reviews/ITER-NNN-YYYYMMDDHHmmss/hermes/`
- Codex 评审记录：`reviews/ITER-NNN-YYYYMMDDHHmmss/codex/`
- 评审确认后的正式用例：`test-cases/design/`、`test-cases/expanded/`
- 设计评审：`reviews/ITER-NNN-YYYYMMDDHHmmss/`
- 测试执行结果：`results/<客户端>/<日期>-<IP>/<OS>/`
- 共享设计交接：`work/<topic>/`
- 多终端矩阵模板：`templates/multi-terminal-matrix.csv`
- 多终端矩阵实例：`reviews/ITER-NNN-YYYYMMDDHHmmss/terminal-matrix.csv`

Hermes 和 Codex 不得同时改同一个文件。Hermes 修改本轮 `hermes/` 目录和候选矩阵；Codex 修改 `codex/`、`FINAL_STATUS.md` 及必要的归档说明。只有 Codex 确认 `TEST_DESIGN_READY` 后，候选矩阵才能同步为 `test-cases/` 下的正式真源。

评审记录和执行结果必须分离：评审阶段不得把 `review-round-*.md`、`decision-log.md` 或 `FINAL_STATUS.md` 写入 `results/`；只有进入执行阶段后，才在 `results/<客户端>/<日期>-<IP>/<OS>/` 保存基线、日志、证据和执行报告。

## 5. 每轮评审步骤

### 第 0 步：固定范围

Codex 先记录：

- 设计文档绝对路径；
- 被测项目绝对路径；
- 被测版本、分支、commit、package 版本；
- 本轮代码变更范围；
- 既有用例和历史证据位置；
- 是否涉及真实升级、真实云资源、凭证或付费操作；
- 多终端基线：Agent/宿主、操作系统、Node/npm、shell、TTY/非 TTY、MCP 传输、插件安装落点和用户目录；
- 终端分类：哪些是共用 MCP 服务逻辑，哪些是客户端适配、安装、配置、重启、Hook 或权限逻辑；
- 执行矩阵：全量终端、代表终端、仅源码/协议验证和当前不可执行项。

版本和环境未固定时，只能做设计评审，不能宣布可执行。

### 第 1 步：Hermes 提交初版

Hermes 必须提交：

- 需求到用例的追踪关系；
- 设计级用例和必要的展开级用例；
- 每条用例的完整字段；
- 自动化脚本或脚本设计；
- 预计执行环境；
- 已知阻塞和未决规格问题；
- `status.md` 中的 `HERMES_DRAFT_READY`。

### 第 2 步：Codex 独立评审

Codex 至少检查以下九类内容：

1. **需求覆盖**：设计文档每个功能、状态、分支、风险都有对应测试；
2. **测试层次**：函数、单测、mock、MCP 协议、真实客户端和真实升级明确区分；
3. **断言强度**：检查返回值、字段、状态、调用次数、命令参数、文件落点和副作用，不接受只打印日志；
4. **负向路径**：网络失败、超时、非法输入、权限失败、进程异常和恢复重试；
5. **安全与兼容**：写操作、凭证、审批、Windows、Node 版本和多客户端影响；
6. **环境隔离**：HOME、npm cache、plugin 目录、registry、临时文件和真实资源隔离；
7. **可复现性**：版本、commit、时间、命令、输入和证据可追溯；
8. **多终端覆盖**：客户端、宿主 OS、Node/npm、TTY、shell、安装布局、MCP stdio/remote、Hook 能力差异均已分类并有验证策略；
9. **统计口径**：`PASS`、`FAIL`、`BLOCKED`、`SPEC-MISMATCH`、`PARTIAL` 不混用，分母明确；
10. **源码能力核对**（正确性 + 覆盖缺口）：对照被测源码 `src/*.mjs` 的导出函数 / CLI 子命令 / env 变量，核对用例「指引来源 `实:函数(行号)`」与「预期结果」是否与源码一致（函数名 / 返回字段 / 错误码 / 常量），并识别未覆盖的源码能力缺口（硬缺口 / 弱缺口）——参照技能 `huaweicloud-devkit-source-coverage` 的核对四步（提取能力清单 → 提取覆盖点 → 正确性核对 → 覆盖率核对）。

评审意见必须包含：问题、优先级、证据、修改动作和完成判定。

### 第 2 步补充：多终端评审规则

“多终端”必须拆成两个正交维度评审，不能用“在本机跑通”代表全部终端。

#### 终端维度

至少明确下列对象是否受影响：

| 维度 | 最少检查项 |
|---|---|
| Agent/宿主端 | Hermes、Codex、OpenCode、CodeArts Agent、CodeArts Work、WorkBuddy、DSH、OfficeAce、OpenClaw、AtomCode，以及通用 MCP 客户端 |
| 操作系统 | Windows、Linux、macOS；注明 x86/arm 是否有差异 |
| 运行时 | Node 主版本、npm 版本、`npm`/`npm.cmd`、`npx`/`npx.cmd`、shell 行为 |
| 交互模式 | TTY、非 TTY、stdin close、确认/菜单/取消路径 |
| 安装布局 | 用户目录、插件目录、npx cache、全局配置目录、`HUAWEICLOUD_HOME` |
| MCP 通道 | stdio、remote（如支持）、Content-Length/LF framing、进程重启和多进程 |
| 宿主能力 | Hook 支持、配置文件格式、权限模型、连接器重连和会话生命周期 |

#### 用例分层

Hermes 必须为每条受影响用例增加“终端覆盖类型”：

| 类型 | 适用场景 | 规则 |
|---|---|---|
| `COMMON` | 纯版本判断、缓存、解析、协议返回等与宿主无关逻辑 | 函数级 + 代表 MCP 进程验证；不能替代客户端适配测试 |
| `CLIENT_MATRIX` | 安装、配置落点、Skill 加载、Hook、会话重启、连接器行为 | 逐客户端或按风险分组执行，至少覆盖 Hermes、一个标准 MCP 客户端、一个非 Hook 客户端 |
| `OS_MATRIX` | `npm.cmd`/`npx.cmd`、路径、权限、shell、文件锁、TTY | Windows/Linux 必测；macOS 若声明支持必须有证据，否则标 `BLOCKED` |
| `AGENT_E2E` | Agent 是否遵守 Skill、询问用户、同意/拒绝升级 | 至少一个真实 Agent；涉及用户体验或 Skill 顺序时不能只做静态检查 |
| `CROSS_PROCESS` | 缓存、dismiss、审批 token、会话状态、升级后重启 | 至少覆盖新进程读取和两个并行客户端/会话，必要时逐客户端执行 |

#### 代表终端不能随意选择

代表终端必须在评审记录中写明选择理由：

- **功能/协议代表**：一个最标准、最容易复现的 MCP 客户端；
- **Hook 代表**：一个支持 Hook 的 Agent；
- **非 Hook 代表**：一个只能依赖 MCP/Node 兜底的 Agent；
- **Windows 代表**：Hermes 或实际 Windows 目标客户端；
- **Linux/macOS 代表**：各至少一个真实运行环境，若未提供必须标 `BLOCKED`；
- **连接器代表**：OfficeAce 等有独立重连/配置生命周期的客户端。

同一 MCP 服务进程的函数结果可以复用，但以下内容不能复用一份证据：安装落点、配置合并、Skill 注入、Hook、生效重启、TTY 行为、宿主权限、连接器重连和用户交互。

#### 多终端矩阵的最小字段

每轮设计至少维护一张矩阵，字段如下：

```text
caseId / terminal / agent / OS / arch / node / npm / shell / ttyMode
/ installLayout / mcpTransport / hookSupport / executionLevel
/ requiredEvidence / status / blockedReason
```

矩阵中未执行的终端必须写明原因，例如“无 macOS 机器”“客户端未安装”“需要真实 TTY”“升级会污染用户环境”，不能留空或默认算通过。

仓库提供可复制的字段模板：`templates/multi-terminal-matrix.csv`。每个需求应将填写后的副本放入对应的 `work/<topic>/hermes/`，评审归档时复制到 `reviews/ITER-NNN-YYYYMMDDHHmmss/terminal-matrix.csv`。

### 第 3 步：Hermes 修订

Hermes 逐条回应评审意见，不能只回复“已补充”。至少要说明：

- 修改了哪些文件和用例；
- 新增或调整了哪些断言；
- 如何验证修改有效；
- 哪些问题仍未解决及其状态；
- 本轮是否需要用户决策。

### 第 4 步：Codex 复审

Codex 只接受有证据的修订。若仍有 P0/P1 缺口、关键路径弱断言、版本不可追溯或规格冲突未标明，则继续回到第 3 步。

## 6. 放行门槛

满足以下条件后，Codex 才能给出 `TEST_DESIGN_READY`：

- 需求到用例追踪率为 100%；
- 所有 P0/P1 需求都有至少一条可执行用例；
- 每个重要功能至少覆盖 Happy Path、Error Path 和防退化路径；
- 真实 MCP 链路与函数/mock 链路明确分开；
- 涉及用户确认的流程覆盖“同意、拒绝、取消、重复调用”；
- 涉及持久化的流程覆盖写入、重新读取、重启或跨进程读取；
- 涉及缓存或时间的流程覆盖有效期边界和失败恢复；
- 涉及多客户端或多 agent 的流程覆盖路径隔离；
- 多终端矩阵已建立，且每条受影响用例均已标注 `COMMON`、`CLIENT_MATRIX`、`OS_MATRIX`、`AGENT_E2E` 或 `CROSS_PROCESS`；
- 至少覆盖一个 Hook 客户端、一个非 Hook 客户端、Windows 和 Linux；声明支持的 macOS/ARM/remote/TTY 路径不得无证据；
- 任何“所有终端一致”的结论都有逐终端证据或明确的共用代码证明；
- 涉及升级的流程覆盖命令、目标、文件同步、重启生效和失败回退；
- 测试环境、版本和证据可复现；
- 所有未执行项已标记 `BLOCKED` 或 `NOT_RUN`，并注明原因；
- 所有规格冲突已标记 `SPEC-MISMATCH`，不能伪装成通过；
- 用例 ID 唯一且符合仓库演进规则；
- 设计级和展开级矩阵已同步，生成脚本可复现；
- 没有新增未评估的 P0/P1 风险。

对于 Hermes/Agent 类需求，还必须验证真实 Agent 行为，不能只检查 `SKILL.md` 文本是否存在。

## 7. 何时找用户

只有以下情况才暂停闭环并请求用户决策：

- 设计文档和实现明确冲突，需要选择产品策略；
- 真实升级会修改用户安装或 npm cache；
- 真实云操作可能产生费用、资源变更或凭证风险；
- 需要用户提供不可自动获取的权限、账号或客户端；
- Hermes 与 Codex 的结论冲突，且源码和证据无法消解；
- 外部任务或共享目录不可访问。

普通的用例缺口、断言不足、矩阵遗漏、脚本补充和报告修正，由 Codex 直接发回 Hermes 继续处理。

## 8. 标准启动提示词

下次启动时，直接发送以下内容即可：

```text
启动 Hermes-Codex 测试设计评审闭环。

项目目录：C:\Users\Administrator\devkit-test
被测项目：C:\Users\Administrator\devkit-test\hdk
  测试归档：C:\Users\Administrator\devkit-test\huaweicloud-devkit-test
  设计评审归档：C:\Users\Administrator\devkit-test\huaweicloud-devkit-test\reviews\ITER-<NNN>-<YYYYMMDDHHmmss>
  执行结果归档：C:\Users\Administrator\devkit-test\huaweicloud-devkit-test\results\ITER-<NNN>-<YYYYMMDDHHmmss>
设计文档：<填写设计文档绝对路径>

要求：
1. Hermes 负责生成和修改测试用例；
2. Codex 负责读取设计文档、源码、既有单测、矩阵和历史证据并进行独立评审；
3. Codex 将评审意见直接交给 Hermes，Hermes 修改后再次提交；
4. 持续往复，直到所有放行门槛满足；
5. 未达到放行门槛前，不得宣布测试设计完成，也不得开始正式执行；
6. 严格区分 PASS、FAIL、BLOCKED、SPEC-MISMATCH、PARTIAL；
7. 真实 MCP、真实客户端和真实升级必须与函数/mock 验证分开；
8. 必须同时评审多 Agent 客户端和多 OS/运行时：客户端、Windows/Linux/macOS、Node/npm、shell、TTY、安装布局、MCP transport、Hook 和重启生命周期；
9. 为每条受影响用例标注 COMMON / CLIENT_MATRIX / OS_MATRIX / AGENT_E2E / CROSS_PROCESS，并维护 terminal/agent/OS/node/npm/tty/installLayout/mcpTransport/hookSupport 矩阵；
10. 至少覆盖一个 Hook 客户端、一个非 Hook 客户端、Windows 和 Linux；无法覆盖的终端明确标 BLOCKED，不得默认为通过；
11. 最终只在确认可以执行时输出 TEST_DESIGN_READY，并列出执行顺序、终端矩阵、剩余阻塞项和最终文件路径；
12. 只有产品策略冲突、外部权限或高风险真实操作才请求我决策。
```

## 9. 最终交付格式

完成时，Codex 输出：

```text
TEST_DESIGN_READY

设计文档：<path>
被测版本：<version>/<commit>
设计级用例：<count>
展开级用例：<count>
评审轮次：<n>
终端覆盖：<agent/OS/TTY/transport matrix summary>
P0/P1 未解决项：<none 或列表>
BLOCKED 项：<none 或列表>
执行顺序：<列表>
最终矩阵：<path>
评审记录：<path>
```

若不能放行，输出：

```text
REVIEW_CHANGES_REQUESTED
```

并按优先级列出必须修改项，不用模糊的“建议再看看”。
