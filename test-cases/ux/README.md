# UX 体验用例（独立分区）

本目录存放 huaweicloud-devkit 的 **UX 体验用例**——独立分区，**不与 `design/` 母版混放**。

> **关联上游需求单：[#900](https://github.com/huaweicloud/huaweicloud-devkit/issues/900)**
> 「未登录引导两份实现不一致 + 错误返回未统一」（UX-R1 + UX-R7 合并单，2026-10-13 提交）。
> 对应用例：**D11-1 / D11-2**（引导双路径，UX-R1）、**D11-16**（统一错误卡，UX-R7）、**D11-12**（IAM-401 文案）。

## 文件

| 路径 | 内容 |
|---|---|
| `用例矩阵-体验级.csv` | D11 体验用例 43 条（母版 27 列结构，**纯设计定义**，无执行态；2026-10-13 建立） |
| `gen_ux.py` | 生成脚本（**唯一真源**，改动后重跑保证可复现；勿手改 CSV） |
| `README.md` | 本说明 |

## 为什么单独分区

| 维度 | 功能用例（`design/`） | UX 体验用例（本分区） |
|---|---|---|
| 判据形态 | 字段/错误码精确相等 | 症状消失（闭环）/ 独立观测 / 指标不劣化 |
| 断言强度 | 单侧 | **正断言 + 反断言**（不含英文原文、不含内部代号） |
| 执行载体 | 母版矩阵 + 脚本 | fixture / replay / agent-eval（`test/unit`、`eval/harness`、`eval/replay`） |
| 生命周期 | 长期稳定 | 提案期会大改，不宜直接进母版真源 |

## 编号与批次

- 用例 ID：`D11-<序号>`；维度统一为 `D11体验`
- 维度枚举：D1 安装 / D2 认证 / D3 功能 / D4 安全 / D5 客户端 / D6 性能 / D7 兼容 / D8 质量 / D9 协议 / D10 评测 / **D11 体验**

| 批次 | 用例 | 主题 |
|---|---|---|
| 第一批 | D11-1 ~ D11-21（21 条） | 登录体验专题 |
| 第二批 | D11-22 ~ D11-35（14 条） | 使用体验专题（安装/可读性/凭据生命周期/审批/归零/沙箱） |
| 第三批 | D11-36 ~ D11-43（8 条） | **范式升级**（闭环有效性 / 回放分类 / 独立观测 / 度量对照 / 专项矩阵） |

## 可执行载体映射

| 层 | 载体 | 适用用例 |
|---|---|---|
| L1 单测 | `test/unit/d11-*.test.mjs` | 文案/字段/反断言类（D11-1/10/16/26） |
| L2 逐用例夹具 | `eval/harness/fixtures/d11-*.mjs` + 运行器 `run-ux.mjs`（**已落地 5 个**：`d11-36-guidance-closure` / `d11-41-misleading-attribution` / `d11-42-cp936-terminal` / `d11-43-terminal-env-matrix` / `d11-44-fault-injection`；共用工具 `ux-common.mjs`） | 闭环有效性、误导归因、故障注入、终端矩阵（D11-36/41/42/43/44） |
| L3 回放对照 | `eval/replay/`（待新增 `recordings/ux-baseline-v1.jsonl`） | 体验回归量化（D11-39） |
| L4 Agent 评测 | `eval/harness/run-agent-eval.mjs` + `eval/prompts/eval-set-ux.csv` | 度量对照（D11-40） |

## 已接入自动化

| 入口 | 内容 |
|---|---|
| `npm run test:ux` | D11 夹具批量运行器：**自动发现** `d11-*.mjs` + **内置宿主隔离**（空 `HOME`/`USERPROFILE`）+ 三态退出码 |
| CI job `d11-ux-fixtures` | `.github/workflows/contract-unit-tests.yml`；当前 `continue-on-error: true`（需求未实现属**已知缺口态**，先记趋势不阻断），实现到位后去掉即为硬门禁；证据 artifact `d11-ux-evidence` |

> D11 夹具**未**列入 `run-all.mjs`：run-all 是 Issue #7 批次清单且其 exit 语义为"harness 是否健康"，
> 混入长期 NOT_IMPLEMENTED 的用例会让它恒红、丧失门禁意义。UX 走专用运行器。

### 退出码语义（与"harness 坏了"区分开）

| exit | 含义 |
|---|---|
| 0 | 全部通过（需求已实现） |
| 1 | `NOT_IMPLEMENTED` —— 需求验收未达标，属**已知缺口**，非 harness 故障 |
| 2 | `BLOCKED` —— 宿主/环境不满足，结果不可判定 |

## 状态口径

- 本分区与母版同口径：**纯设计定义**（`设计状态=DESIGN_COVERED` 表示"设计完整"，**非执行通过**）；执行态统一落 `results/Summary/`。
- `依赖` 列含 `契约依赖: <字段> 待冻结` 的用例（共 11 条：D11-3/4/5/6/8/9/13/14/16/28/30）在契约冻结前应标 **NOT_RUN**，不得以 `DESIGN_COVERED` 冒充"可执行/已通过"。

## 载体与执行

```bash
python test-cases/ux/gen_ux.py                     # 重新生成（幂等，字节可复现）

# 首选：批量跑全部 D11 夹具（自解析 hdk src + 内置宿主隔离）
npm run test:ux
npm run test:ux -- --evid <dir>                    # 同时落证据

# 备选：单跑某个夹具（需自行隔离宿主：USERPROFILE/HOME 指向空目录）
node eval/harness/fixtures/d11-36-guidance-closure.mjs <hdk src> --evid <dir>
#   exit 0 = 通过；exit 1 = 需求未实现；exit 2 = ENV_CONTAMINATED（宿主受污染，整例不可判定）
```

## 与母版的关系

- **当前唯一真源 = 本目录**（`gen_ux.py`）。
- 评审通过后并入 `design/` 母版（需同步 `gen_matrix.py` 与 `verify_new.py` 的行数门禁），届时 `design/` 恢复为唯一真源、本分区降级为归档。

## 配套文档

| 文档 | 内容 |
|---|---|
| `docs/UX-登录与使用体验-改善需求-20261013.md` | 需求 UX-R1 ~ UX-R25 + 验收标准 + 落地建议 |
| `docs/UX-体验用例-覆盖自审-20261013.md` | 42 触点覆盖矩阵 + 21 个缺口登记 + 方法论边界 |
| `docs/UX-体验验证案例升级方案-20261013.md` | 四条范式升级 + 三类专项矩阵 + 四层载体映射 + 样板真跑证据 |
