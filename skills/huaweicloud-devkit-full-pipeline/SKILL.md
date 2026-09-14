---
name: huaweicloud-devkit-full-pipeline
description: "一句话触发 huaweicloud-devkit 全链路测试：按【版本需求/问题】类型自动分流 → 测试设计(评审闭环) → 用例输出(生成器+门禁) → 测试验证(执行回填+报告+提单)。支持 --light 跳过 Codex 评审快速过。Use when: 收到含版本号/需求名或 issue 编号的测试指令，要求自动走完「测试设计→用例输出→测试验证」全程，尽量少打断用户。"
version: 1.1.0
platforms: [windows]
tags: [testing, qa, huaweicloud, devkit, orchestration, end-to-end]
---

# huaweicloud-devkit 全链路测试编排

把「测试设计 → 用例输出 → 测试验证」三段封装成一条一句话触发的流水线。本技能是**编排层**：定分支、定顺序、定每步命令与落点、定停点；各环节的细节方法论引用既有技能，不重复展开。

- 方法论 / NR 流程 / 评审闭环 / 提单规范 → `huaweicloud-devkit-testing`（尤其 refs/hermes-codex-review-loop.md）
- 执行流水线（6 步 + init_day + 回填 + 报告）→ `huaweicloud-devkit-daily-execution`
- 用例设计六要素 / 列语义 / 源码核对 → `test-design-methodology`
- 结构联动纪律 / 门禁 verify_new 硬编码 → `huaweicloud-devkit-test-structure`

## 一、触发语（一句话）

```
按 huaweicloud-devkit-full-pipeline，测【版本需求 <版本号或需求名>】/【问题 <issue 编号>】，全链路：测试设计 → 用例输出 → 测试验证。
```

更简短也可：`全链路测 v1.1.4` / `全链路测 #562`。**只要出现「全链路」+「版本号/需求名 或 issue 编号」即触发本技能。**

### 模式选择

- **默认**：含 Codex 评审闭环（流水线 A Step 2）。
- **`--light`**：追加 `--light`（如 `全链路测 v1.1.4 --light`）→ 跳过 Codex 评审，Hermes 自检 + 用户最后确认，适合小需求/低风险快速过。
- 问题类（流水线 B）本就不含 Codex，`--light` 无影响。

## 二、类型识别（第一动作：先判类型再分流）

| 触发语特征 | 类型 | 输入来源 | 流水线 |
|---|---|---|---|
| 版本号（如 v1.1.4）/ 需求名 / 「新需求 NR」/ 设计文档路径 | **版本需求** | `docs/upstream-designs/<版本>/` 或用户给的路径 | A（§三） |
| issue 编号（如 #562）/ 缺陷描述 / 「回归」 | **问题** | 上游 issue 编号 + 缺陷现象 | B（§四） |

无法一眼判定时，优先问一句「这是版本需求还是问题回归？」，不要猜错分支（两类落点、门禁完全不同）。

## 三、流水线 A——版本需求（新版本/新功能）

### Step 0 环境 + 范围固定
1. 自检：`node -v; python --version; gh auth status`；拉最新：`python scripts/prepare_env.py --update`（pull 测试仓 main + SUT dev 最新）。
2. 读开发设计方案（`docs/upstream-designs/<版本>/` 或用户路径），固定：设计文档绝对路径 / 被测版本、commit / 代码变更范围 / 多终端基线。
3. 建评审迭代目录：`reviews/ITER-<NNN>-<YYYYMMDDHHmmss>/`（时间戳用紧凑 `YYYYMMDDHHmmss`，北京时间）。

### Step 1 测试设计（Hermes 产出初版）
按 `docs/06-Hermes-Codex测试设计评审闭环.md` 与 `test-design-methodology` 产出，落盘到 `reviews/<ITER>/hermes/`：
- `test-design.md`（基线/范围/分层/证据索引/放行检查对照）
- `candidate-matrix.csv`（候选用例，多终端字段）
- `status.md`（状态机：写 `HERMES_DRAFT_READY`，**禁止自写 TEST_DESIGN_READY**）

### Step 2 Codex 评审闭环（反复至放行）；`--light` 模式跳过本步
默认（含 Codex）启动评审配方（Windows 实测，详见 hermes-codex-review-loop.md §11）：
```powershell
# 1. 评审 prompt 落盘 reviews/<iter>/codex/prompt-round<NN>.txt
# 2. 后台非 PTY 执行（pty=true 在 Windows 后台 0xC0000142 崩溃）：
Get-Content "reviews\<iter>\codex\prompt-round<NN>.txt" -Raw -Encoding UTF8 | codex exec -s workspace-write 2>&1
#    background=true + notify_on_complete=true
# 3. 完成通知后核实 codex/review-round-<NN>-*.md 真实落盘（查文件+大小）再读全文
```
- 每轮整改只做 🟢 机器可闭合项（矩阵/脚本/文档/门禁）；🔴 外部依赖项如实列 status.md §六。
- 整改轮只做设计层动作，**不跑真实探针/真云**。
- 结论仅二选一：`REVIEW_CHANGES_REQUESTED`（继续整改）/ `TEST_DESIGN_READY`（进入 Step 3）。
- 每轮整改后主动发六要素通知（文件/用例/结果/逐项清单/出口标准对照/待裁决）并启动下一轮评审，直到放行。
- **`--light` 模式**：跳过 Codex，Hermes 按 docs/06 放行门槛逐项自检，输出「自检清单 + 待用户确认项」，**不自签 TEST_DESIGN_READY**；用户确认后直接进入 Step 3/4。红线停点（真云/升级/凭证/策略冲突）照常停下问。

### Step 3 用例输出（TEST_DESIGN_READY 后）
1. 新增/修改用例落到生成器（**改 gen_matrix.py / gen_tracing.py，禁手改 CSV**）；三处联动铁律：`add()` 定义 + `BATCH_TS` + `NEW_REVIEW_IDS_*` 时间戳归属集同步，verify_new 行数列数断言同步。
2. 重生成真源（`test-cases/design/` 下）：
```powershell
cd test-cases/design
python gen_matrix.py; python gen_tracing.py         # 重生成矩阵+追踪表
python verify_new.py                                  # 结构门禁 exit 0
python scan_gaps.py                                   # GATE-PASS
```
3. 自检脚本：`cd test-cases; python gen_daily.py`（若 daily 子集受影响）。
4. 版本冻结快照：复制当前 CSV → `test-cases/versions/<版本>/` + 补一份 `迭代测试设计.md`（结构见 versions/README.md）。
5. 同步 README 数量 + check_docs（`test-cases/check_docs.py`、`check_readme_consistency.py`），保证「文档提及=原子记录」。

### Step 4 测试验证（Hermes 侧单机执行）
> 边界：本步骤 = **Hermes 客户端 + 本机环境**跑一遍验证，产出 Hermes 执行报告。完整 10 客户端 × 2 OS 矩阵验收由各 agent 按 `huaweicloud-devkit-daily-execution` 分散执行，属后续动作。
1. 建执行包：`python scripts/init_day.py Hermes Windows`
2. 执行 P0→P1→P2，证据落 `evidence/<case-id>/`，回填副本 CSV「执行状态」列。
3. PASS 门禁：`python scripts/verify_no_fake_pass.py Hermes Windows`（虚报即作废）。
4. 出报告 `results/Hermes/<日期>-<IP>/Windows/Hermes-<模型>-测试报告.md`（八节骨架，标题含 Agent+模型名）。
5. 有缺陷：先 FINDINGS.md 记根因，全量测完 `python scripts/file_issue.py <缺陷.md> <版本>` **合并 1 单**（勿拆单/勿未测完就提）。
6. 汇总（维护者）：`python scripts/build_summary.py`；推送：`$env:GH_TOKEN=(gh auth token --user shuangheaven); git pushm origin main`。

## 四、流水线 B——问题（缺陷回归）

### Step 0 定位
拿到 issue 编号 + 现象，定位上游 issue 与本地已归档缺陷（`test-cases/issues/<编号>-<slug>/`、`results/Regression/`）。

### Step 1 复现 + 根因定位
复现缺陷，根因定位到 `文件:行号`，记 `FINDINGS.md`（断言字段必填）。

### Step 2 回归用例设计
产出 `test-cases/issues/<编号>-<slug>/回归用例.md`（复现步骤 + 精确断言 + 结论模板：复现/已修复/仍存在）。P0 同步进 daily 盯防（改 gen_daily.py 后 `python gen_daily.py` + 门禁）。

### Step 3 用例输出
与流水线 A Step 3 相同：生成器 + verify_new（exit 0）+ scan_gaps（GATE-PASS）+ 冻结/README 同步。

### Step 4 测试验证
针对该缺陷定向复测（不是全量矩阵）：init_day 建包 → 执行回归用例 → 回填 → 结论落 `results/Regression/<日期>/问题回归-<日期>.md` → 已修复则关单、仍存在则更新 issue。

## 五、全程停点（这几类必须停下问用户，红线不因「全链路」豁免）

1. **真实升级会污染用户安装/npm cache**（真实升级污染环境）。
2. **真云操作可能产生费用/资源变更/凭证风险**——低余额按需创建-销毁可自动走（最低配置，测后归零验证），但**升级改造既有环境、大额付费、需提供新凭证**须先问。
3. **设计文档与实现冲突需产品策略裁决 / SPEC-MISMATCH 待定夺**。
4. **需用户提供机器/账号/客户端**（如 Linux 补跑、macOS、特定客户端、PTY）。

其余（用例缺口、断言不足、矩阵遗漏、脚本补充、环境自检）一律自行推进，不逐条打断。

## 六、红线（全程不可破）

1. **真云纪律**：最低配置创建；测试后删本次新建资源并归零验证（List/S 计数=0）；只删本次创建，禁删既有/他人资源。
2. **凭证零进入 git**（.gitignore 23 条 + DPAPI hdk-secrets.ps1）。
3. **PASS 门禁**：标 PASS 必①实测②证据落盘③evidencePath 回填，未执行禁标 PASS。
4. **缺陷合并单**：全量测完统一 1 单附报告，勿拆单/勿逐日提/勿未测完就提。
5. **设计真源门禁**：只改生成器不手改 CSV；改后重跑 gen+verify+scan，字节级可复现。
6. **状态纪律**：Hermes 不签 TEST_DESIGN_READY（Codex 复评签）；FAIL/SPEC-MISMATCH/BLOCKED 不得洗成 PASS。
7. **ID 三铁律**：永不复用 / OBSOLETE 标记 / 修改=新 ID + supersedes。

## 七、关键命令速查

| 用途 | 命令 |
|---|---|
| 环境自检+拉最新 | `python scripts/prepare_env.py --update` |
| 生成矩阵+追踪 | `cd test-cases/design; python gen_matrix.py; python gen_tracing.py` |
| 结构门禁 | `cd test-cases/design; python verify_new.py; python scan_gaps.py`（exit 0 + GATE-PASS） |
| daily 子集 | `cd test-cases; python gen_daily.py` |
| 启动 Codex 评审 | `Get-Content ...prompt-round<NN>.txt -Raw -Encoding UTF8 \| codex exec -s workspace-write 2>&1`（bg+notify+pty=false） |
| 建执行包 | `python scripts/init_day.py Hermes Windows` |
| PASS 门禁 | `python scripts/verify_no_fake_pass.py Hermes Windows` |
| 汇总(维护者) | `python scripts/build_summary.py` |
| 提单 | `python scripts/file_issue.py <缺陷.md> <版本>` |
| 推送 | `$env:GH_TOKEN=(gh auth token --user shuangheaven); git pushm origin main` |

## 八、时间戳 / 状态 / 命名规范

- 文档正文/矩阵：北京时间 `YYYY-MM-DD HH:mm:ss`；文件名/目录：紧凑 `YYYYMMDDHHmmss`；**禁 ISO 8601 的 `T`/`+08:00`**（探针/run-logs 机器 JSON 保留原始格式不改写）。
- 状态枚举全局唯一：`PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN`（+ `UNASSESSED` / `PARTIAL(原因)`）；BLOCKED 不计通过率分母。
- 迭代目录 `ITER-<NNN>-<YYYYMMDDHHmmss>`；客户端名用 D5 展开级 10 枚举对象；版本目录用稳定版号（latest，非 next）。

## 九、陷阱

- PowerShell `>` 重定向产 UTF-16，Python 读会乱码——探针用 `Out-String`。
- patch 改含缩进的 Python 块，old/new 首行缩进须与文件一致，否则整体重排致 IndentationError；大块改动用 write_file 整文件重写。
- `Get-Content -Raw` 默认 ANSI 读 UTF-8 中文会乱码——gh 传中文 title 走 python subprocess；评审 prompt 用 `-Encoding UTF8`。
- 运行目录(.sandbox)残留会致 check_docs 报失效链接假阳性——验证前 node `rmSync(...,{maxRetries:10})`。
- 新增用例 ID 三处联动（add/BATCH_TS/NEW_REVIEW_IDS）+ verify_new 行数列断言同行更新。
- Codex exec 后台必须 pty=false；prompt 长用 stdin 管道避免 PowerShell 引号转义。