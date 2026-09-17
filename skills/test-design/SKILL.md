---
name: test-design
description: "huaweicloud-devkit 测试设计能力：按版本需求/设计文档产出候选测试设计（范围固定 → 设计稿 → 用例生成器 → 门禁 → 冻结），含设计方法论六技术+六要素、源码能力核对四步、生成器三处联动铁律。评审放行(TEST_DESIGN_READY)由维护者统一执行。Use when: 收到「测试设计 <版本/需求>」提示语，需为 huaweicloud-devkit 新版本/新功能设计测试用例。"
version: 1.0.0
tags: [testing, test-design, huaweicloud, devkit, coverage]
---

# huaweicloud-devkit 测试设计能力

为 huaweicloud-devkit 插件的新版本/新功能产出**合规的候选测试设计**。任意 agent 均可执行——产出初版设计稿（状态 `HERMES_DRAFT_READY`）后停下，**评审放行（`TEST_DESIGN_READY`）由维护者统一执行**（见 §三）。

## 触发语（一句话）

```
测试设计 <版本号或需求名>      # 例：测试设计 v1.1.4
测试设计 <设计文档路径>        # 例：测试设计 docs/upstream-designs/570-cred-placeholder-r11/方案.md
```

只要出现「测试设计」+「版本号/需求名/设计文档路径」即触发本能力。

## 前置（自包含，缺一项先补齐）

1. 两仓库已 clone（相对测试仓根，源码仓在兄弟目录 `../hdk/`）：
   ```bash
   git clone https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git   # 测试仓库
   git clone https://github.com/huaweicloud/huaweicloud-devkit.git ../hdk      # 源码仓库
   ```
2. 环境自检 + 拉最新：`python scripts/prepare_env.py --update`（pull 测试仓 main + `../hdk` checkout 到 npm 最新包 latest 正式版对应 commit）。
3. 工具链：`node -v` / `python --version` / `gh auth status`。
4. 推送凭证：环境变量 `HDK_GH_TOKEN` 或本机 gh 已登录（push 用 token URL，不依赖 gh CLI，见 §五）。

## 一、范围固定（Step 0）

读设计文档（`docs/upstream-designs/<版本>/` 或用户给的路径），固定四件事并写进设计稿开头：

- 设计文档绝对路径 + 被测版本、commit
- 代码变更范围（`git -C ../hdk show <sha> --stat` 锁定改动文件/函数）
- 多终端基线（10 客户端枚举、Windows/Linux）
- 判定「版本需求」还是「问题回归」——本能力只管**版本需求**；`回归 #<编号>` 走 AGENTS.md「问题单号回归」节

## 二、设计方法论（产出用例前先过一遍）

### A. 覆盖完整性——六种技术交叉查缺口

| 技术 | 核心问法 | huaweicloud-devkit 落点示例 |
|---|---|---|
| 等价类划分 | 有效/无效等价类每类至少一条 | `judgeUpdate` dist-tags：合法/坏 JSON/null/空输出 |
| 边界值分析 | 边界上下界各测一条 | 版本 1.1.0 vs 1.1.0-next.9；TTL 1h；节流 5min；cooldown 3 天 |
| 决策表 | 多条件组合列全 | `auth_switch` mode×action；pre-release latest+next |
| 状态转换 | 状态机迁移/回退都测到 | up_to_date/update_available/dismissed/check_failed 四态 |
| 场景法 | 端到端业务流闭环 | 真云 E2E：创建→验证→释放→归零；升级→重启→生效 |
| 错误推测 | 异常/中断/对抗路径覆盖 | 安装中断恢复、装坏回滚、hook 绕过、注入 |

**缺口判定**：任一技术典型场景无对应用例 → 记缺口（落「需求/风险」或新增 ID），不臆造。

### B. 用例质量——六要素（任一违反即不规范）

1. **单一验证点 + 唯一可追溯 ID**（ID 一经分配永不复用）
2. **前置条件明确可复现**（禁用「合适的环境」「已配置好」）
3. **测试数据具体**（精确输入值/断言契约，不用「若干数据」）
4. **操作步骤可机械执行**（编号化，无「酌情/大概」）
5. **预期结果可判定 + 断言唯一**（精确错误码/字段/阈值；禁用「明确/正确/合理/类/如」等模糊词；多结果拆独立契约）
6. **关联工具 = 真实 MCP 工具名**（40 工具全名/简称 + CLI 命令 + 框架组件；函数/组件/脚本归「指引来源 实:`xxx`」）

### C. 源码能力核对——四步（修正「设计 vs 实现」漂移）

源码根 = `../hdk/plugins/huaweicloud-core/src/`。

1. **提取源码能力**：`^export (function|const|async function)`、顶层常量、CLI `case 'xxx'`（setup-cli.mjs 子命令）、`process.env.XXX`。
2. **提取用例覆盖点**：设计级 CSV「关联工具」列 +「指引来源 `实:xxx`」。
3. **正确性核对**：用例引用的函数名是否真实存在、返回字段/错误码/常量值是否与源码一致（实例：`wrapResult` 不存在，实为 `decorateResult`；`fingerprint` = `sha256(ak+sk).hex.slice(0,8)` 无冒号拼接）。
4. **覆盖核对**：源码能力 − 用例覆盖 = 缺口；分**硬缺口**（完全未覆盖）/ **弱缺口**（仅间接覆盖）。

## 三、产出流程

### Step 1 产出初版设计（任何 agent 都能做）

落盘 `reviews/ITER-<NNN>-<YYYYMMDDHHmmss>/hermes/`（目录名固定，起名沿用既有迭代规范，不特指 Hermes 客户端）：

- `test-design.md`：基线 / 范围 / 分层 / 证据索引 / 放行检查对照（§二 A/B/C 三张表都要有结论）
- `candidate-matrix.csv`：候选用例（多终端字段）
- `status.md`：状态机写 `HERMES_DRAFT_READY`，**禁止自写 `TEST_DESIGN_READY`**

### Step 2 评审闭环（维护者统一执行，非维护者 agent 到此停下）

- 初稿 `HERMES_DRAFT_READY` 后，**非维护者 agent 停在这里**，把迭代目录交给维护者。
- 维护者按 `docs/06-Hermes-Codex测试设计评审闭环.md` 往复评审（Hermes 生成 → Codex 复评 → 整改 → 再评），直到 `TEST_DESIGN_READY` 或 `REVIEW_CHANGES_REQUESTED`。
- 结论仅二选一：`REVIEW_CHANGES_REQUESTED`（退回整改）/ `TEST_DESIGN_READY`（进入 Step 3）。

### Step 3 用例输出（`TEST_DESIGN_READY` 后才能做）

1. 新增/修改用例落到生成器（**改 `gen_matrix.py`/`gen_tracing.py`，禁手改 CSV**）。三处联动铁律：`add()` 定义 + `BATCH_TS` + `NEW_REVIEW_IDS_*` 时间戳归属集同步，`verify_new` 行数列断言同步。
2. 重生成真源：
   ```bash
   cd test-cases/design
   python gen_matrix.py; python gen_tracing.py   # 重生成矩阵+追踪表
   python verify_new.py                          # 结构门禁 exit 0
   python scan_gaps.py                           # GATE-PASS
   ```
3. daily 子集可能受影响则 `cd test-cases; python gen_daily.py`。
4. 版本冻结快照：复制当前 CSV → `test-cases/versions/<版本>/` + 补一份 `迭代测试设计.md`（结构见 versions/README.md）。
5. 同步 README 数量 + `check_docs.py` / `check_readme_consistency.py`（保证「文档提及 = 原子记录」，不漏列不虚标）。

## 四、红线（全程不可破）

1. **真源门禁**：只改生成器不手改 CSV；改后重跑 gen + verify + scan，字节级可复现。
2. **状态纪律**：任何 agent 都不自签 `TEST_DESIGN_READY`（维护者评审放行）；FAIL/SPEC-MISMATCH/BLOCKED 不得洗成 PASS；产出未评审即写 `HERMES_DRAFT_READY`。
3. **ID 三铁律**：永不复用 / OBSOLETE 标记 / 修改 = 新 ID + supersedes。
4. **凭证零进入 git**（AK/SK/密钥不入库）。
5. **真云**：设计阶段不跑真实探针/真云操作。

## 五、命令速查

| 用途 | 命令 |
|---|---|
| 环境自检+拉最新 | `python scripts/prepare_env.py --update` |
| 锁定改动范围 | `git -C ../hdk show <sha> --stat` |
| 生成矩阵+追踪 | `cd test-cases/design; python gen_matrix.py; python gen_tracing.py` |
| 结构门禁 | `cd test-cases/design; python verify_new.py; python scan_gaps.py`（exit 0 + GATE-PASS） |
| daily 子集 | `cd test-cases; python gen_daily.py` |
| 推送 | `T=$(cat ~/.hdk_token 2>/dev/null || echo "$HDK_GH_TOKEN"); git -c credential.helper= push "https://x-access-token:$T@github.com/huaweicloud-mate/huaweicloud-devkit-test.git" main` |

## 六、陷阱

- PowerShell `>` 重定向产 UTF-16，Python 读会乱码——探针用 `Out-String`。
- patch 改含缩进的 Python 块，old/new 首行缩进须与文件一致，否则整体重排致 IndentationError；大块改动用整文件重写更稳。
- `Get-Content -Raw` 默认 ANSI 读 UTF-8 中文会乱码——gh 传中文走 python subprocess；读文档用 UTF-8 显式编码。
- 新增用例 ID 三处联动（add/BATCH_TS/NEW_REVIEW_IDS）+ verify_new 行数列断言必须同行更新，漏一处门禁就报行数不符。
- 运行目录（.sandbox）残留会致 check_docs 报失效链接假阳性——验证前清掉。