# -*- coding: utf-8 -*-
"""Render the ITER-005 Hermes design handoff.

This is a design-archive generator only. It does not invoke tests, MCP,
KooCLI, upgrades, clients, or cloud APIs.
"""
import csv
import json
import os
import re
import shutil
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone, timedelta

ROOT = r"C:\Users\Administrator\devkit-test\huaweicloud-devkit-test"
TC = os.path.join(ROOT, "test-cases")
DES = os.path.join(TC, "design", "用例矩阵-设计级.csv")
EXP = os.path.join(TC, "expanded", "用例矩阵-展开级.csv")
TRACE = os.path.join(TC, "tracing", "需求-设计-证据追踪表.csv")

def beijing_stamp():
    return (datetime.now(timezone.utc) + timedelta(hours=8)).strftime("%Y%m%d%H%M%S")

STAMP = sys.argv[1] if len(sys.argv) > 1 else beijing_stamp()
ITER = f"ITER-005-{STAMP}"
REVIEW = os.path.join(ROOT, "reviews", ITER)
HERMES = os.path.join(REVIEW, "hermes")

def read_csv(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

def write_text(path, text):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)

def status_reason(row):
    return row.get("blockedReason", "") or row.get("blocked_reason", "") or ""

def _sut_baseline():
    """解析被测项目 SUT（hdk）路径 + tools.mjs 工具数 + git HEAD + package.json 版本。
    可移植：优先 env HUAWEICLOUD_DEVKIT_HOME，否则取测试仓相邻 ../hdk。"""
    sut_home = os.environ.get("HUAWEICLOUD_DEVKIT_HOME") or os.path.normpath(os.path.join(ROOT, "..", "hdk"))
    tm = os.path.join(sut_home, "plugins", "huaweicloud-core", "src", "tools.mjs")
    tools = 0
    if os.path.isfile(tm):
        mtxt = open(tm, encoding="utf-8").read()
        names = []
        m = re.search(r"\bTOOL_DEFINITIONS\s*=\s*\[", mtxt)
        if m:
            i = m.end() - 1
            depth = 0
            quote = None
            while i < len(mtxt):
                c = mtxt[i]
                if quote:
                    if c == quote and mtxt[i - 1] != '\\':
                        quote = None
                elif c in "'\"`":
                    quote = c
                elif c == '[':
                    depth += 1
                elif c == ']':
                    depth -= 1
                    if depth == 0:
                        break
                i += 1
            for n in re.findall(r"\bname:\s*['\"]([a-z_0-9]+)['\"]", mtxt[m.end():i]):
                if n.startswith("huaweicloud_"):
                    sn = n[len("huaweicloud_"):]
                    if sn and sn not in names:
                        names.append(sn)
        tools = len(names)
    head = ""
    if os.path.isdir(sut_home):
        try:
            head = subprocess.run(["git", "-C", sut_home, "rev-parse", "--short", "HEAD"],
                                  capture_output=True, text=True, timeout=10).stdout.strip()
        except Exception:
            head = ""
    ver = ""
    pkg = os.path.join(sut_home, "package.json")
    if os.path.isfile(pkg):
        try:
            ver = json.load(open(pkg, encoding="utf-8")).get("version", "")
        except Exception:
            ver = ""
    return sut_home, head, ver, tools

def _sut_section():
    sut_home, head, ver, tools = _sut_baseline()
    return (
        "## SUT 基线（被测项目，P1 可复现）\n"
        f"- SUT 路径：`{sut_home}`（`HUAWEICLOUD_DEVKIT_HOME` 可覆盖，否则取测试仓相邻 `../hdk`）\n"
        f"- 工具注册源：`plugins/huaweicloud-core/src/tools.mjs` → 工具全集 **{tools} 个**（由注册源推导，非硬编码门禁值）\n"
        f"- SUT 版本/commit：`{ver}` @ `{head}`（本机 hdk 工作副本，测试对象跟随 dev）"
    )

def render_case(row):
    lines = [
        f"### {row['ID']}：{row['标题']}",
        f"- 需求/来源：{row['指引来源']}",
        f"- 优先级：{row['优先级']}",
        f"- 设计状态：{row.get('设计状态', 'DESIGN_COVERED')}",
        f"- 执行状态：{row.get('执行状态', 'NOT_RUN')}",
        f"- 历史聚合状态：{row.get('用例当前状态', '')}",
        f"- 前置条件：{row['前置条件']}",
        f"- 测试数据：{row['测试数据']}",
        f"- 操作步骤：{row['操作步骤']}",
        f"- 预期结果：{row['预期结果']}",
        f"- 强断言：{row.get('requiredEvidence') or '检查返回字段、状态、参数、调用次数、副作用计数、前后快照；保存脱敏日志和 manifest。'}",
        f"- 环境：terminal={row.get('terminal', '')}; agent={row.get('agent', '')}; OS={row.get('OS', '')}; Node/npm={row.get('Node/npm', '')}; shell={row.get('shell', '')}; TTY={row.get('TTY', '')}",
        f"- 安装/传输：installLayout={row.get('installLayout', '')}; mcpTransport={row.get('mcpTransport', '')}; hookSupport={row.get('hookSupport', '')}",
        f"- 多终端覆盖类型：{row.get('终端覆盖类型', '')}",
        f"- 证据要求：{row.get('requiredEvidence', '')}",
        f"- 数据/资源 manifest：case_id={row['ID']}; run_id；region/project_id/credential_alias；资源 ID、owner/run_id/case_id 标签；进程、端口、临时文件、token_hash 和配置快照。",
        f"- 清理断言：按 manifest 仅清理本轮资源和托管文件；核验进程、端口、临时文件、隧道、审批 token 和配置快照；第二次清理幂等。",
        f"- 判定规则：PASS 需全部强断言和清理证据满足；执行前置缺失为 BLOCKED；实现/规范冲突为 SPEC-MISMATCH；历史未执行保持 NOT_RUN，不得改写为 PASS。",
        f"- blockedReason：{row.get('blockedReason', '') or '无当前历史阻塞；若未提供执行环境，执行阶段按统一环境规则标记 BLOCKED。'}",
        f"- owner：{row.get('owner', '测试负责人；环境/规格阻塞责任见 blockedReason')}",
        f"- 依赖：{row.get('依赖', '需求来源与前置条件；独立 manifest；finally 清理；状态/证据回填')}",
        f"- 展开规则：{row['展开规则']}",
        "",
    ]
    return "\n".join(lines)

def render_expanded_index(expanded):
    lines = [
        "## 展开级设计索引",
        "",
        "展开级保留 `源用例`，并增加规范化 `designCaseId`/`expandedCaseId`、`design_status`/`execution_status`。空的历史 `status` 只表示未回填执行证据，规范化执行状态为 `NOT_RUN`。",
        "",
        "| expandedCaseId | designCaseId | 类型/对象 | design_status | execution_status | 历史 status | blockedReason | requiredEvidence |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for r in expanded:
        vals = [
            r.get("expandedCaseId", r["ID"]),
            r.get("designCaseId", r.get("源用例", "")),
            f"{r.get('展开类型', '')}/{r.get('枚举对象', '')}",
            r.get("design_status", ""),
            r.get("execution_status", ""),
            r.get("status", ""),
            status_reason(r).replace("|", "/"),
            (r.get("requiredEvidence", "") or "").replace("|", "/"),
        ]
        lines.append("|" + "|".join(vals) + "|")
    return "\n".join(lines) + "\n"

def build_test_design(design, expanded, trace):
    d_status = Counter(r.get("执行状态", "NOT_RUN") for r in design)
    raw_status = Counter(r.get("用例当前状态", "") for r in design)
    e_status = Counter(r.get("execution_status", "NOT_RUN") for r in expanded)
    t_status = Counter(r.get("status", "") for r in trace)
    text = [
        "# Hermes-Codex 测试设计评审交接：ITER-005",
        "",
        f"- 评审目录：`reviews/{ITER}/`",
        f"- 生成时间：{(datetime.now(timezone.utc) + timedelta(hours=8)).strftime('%Y-%m-%d %H:%M:%S')}（北京时间；目录时间戳：{STAMP}）",
        "- 角色：Hermes 测试设计提交；等待 Codex 复审",
        "- 状态：`HERMES_REVISION_READY`",
        "- 本轮范围：只做设计审计、正式矩阵字段修订和评审交接；未执行测试、`npm test`、`node --test`、`pytest`、`hcloud`、真实 MCP 回归、真实升级或真实云资源操作。",
        "",
        "## 审计基线",
        "",
        f"- 设计级：{len(design)} 条；历史 `UNASSESSED`={raw_status.get('UNASSESSED', 0)}；规范化执行状态={dict(d_status)}。",
        f"- 展开级：{len(expanded)} 条；规范化执行状态={dict(e_status)}；空历史 status 不被当作 PASS。",
        f"- 追踪表：{len(trace)} 条；历史 status 分布={dict(t_status)}。",
        "- 既有历史风险：D1-39 的 P0 `FAIL`、D1-29/D1-43c/D1-46g/D1-55b 等 `SPEC-MISMATCH`、终端环境 `BLOCKED` 均原样保留；历史失败/skip 仅作为 baseline risk。",
        "",
        _sut_section(),
        "",
        "## 状态分离规则",
        "",
        "1. `设计状态=DESIGN_COVERED` 只表示设计字段完整，不代表执行通过。",
        "2. 历史 `用例当前状态=UNASSESSED` 的用例，其独立 `执行状态=NOT_RUN`；没有执行证据不得变成 PASS。",
        "3. `FAIL`、`SPEC-MISMATCH`、`BLOCKED`、`NOT_RUN` 逐条保留；`PARTIAL` 只作为历史聚合描述，不覆盖子状态。",
        "4. 设计缺陷、执行失败、规格冲突和环境缺失不能互相替代。",
        "5. 缺少专用 region/project/credential/quota/Sandbox/PTY/AtomCode/客户端 fixture 时，执行阶段唯一判定为 `BLOCKED`，责任为环境提供方；不作为设计通过，也不伪造失败。",
        "",
        "## 审批和安全设计契约",
        "",
        "- 写/执行操作必须走 `deny -> approval -> execution`。",
        "- 授权依据是结构化 `args + approvalToken`；token TTL、单次消费、同一 MCP 会话、args 完全匹配，精确契约以 D4-24 为准（TTL=60s，可注入时钟）。",
        "- 过期、重复、伪造、参数篡改、跨会话和未批准调用必须拒绝，并且不得启动 hcloud 子进程。",
        "- `exact command`/`executableBlock` 仅用于脱敏展示和审计，不作为授权依据。",
        "- 写操作默认禁止自动重试；只有服务支持且已验证幂等键，才允许同一 token、同一 args、同一幂等键重试；否则执行判定为 BLOCKED。",
        "",
        "## 需求到用例追踪",
        "",
        "- 设计级 ID 通过 `designCaseId` 作为父键。",
        "- 展开级 ID 通过 `expandedCaseId` 作为子键，`源用例` 与 `designCaseId` 必须一致。",
        "- 追踪表 `designCaseId` 必须存在于设计级；具体 `expandedCaseId` 必须存在于展开级。矩阵载体说明只能在确有对应展开行时使用，不能用空白或摘要替代外键。",
        "- 工具全集以被测项目 `tools.mjs` 注册源为唯一口径（39 个，2026-09-12 收敛；`verify_new.py` 从 tools.mjs 机器推导）；设计级 `关联工具` 已逐名覆盖全部 39 个；工具覆盖只证明定义覆盖，不代表执行覆盖。",
        "- 展开规则必须是 `COMMON|代表|证据|阻塞`、`CLIENT_MATRIX|...`、`OS_MATRIX|...`、`AGENT_E2E|...` 或 `CROSS_PROCESS|...` 四段格式；明确“不展开”时也必须记录原因。",
        "",
        "## 多终端设计规则",
        "",
        "每条设计级用例均增加 `终端覆盖类型`、terminal、agent、OS、Node/npm、shell、TTY、installLayout、mcpTransport、hookSupport、requiredEvidence、blockedReason、owner、依赖。终端矩阵另行记录 Hermes、Hook 客户端、非 Hook 客户端、Windows/Linux、TTY/non-TTY 和 stdio/remote；不可用的环境只标 `BLOCKED`。",
        "",
        "## 逐条设计记录",
        "",
    ]
    text.extend(render_case(r) for r in design)
    text.extend([render_expanded_index(expanded), "## 发布门禁", "",
                  "- 当前只允许 `HERMES_REVISION_READY`，不得标记 `TEST_DESIGN_READY`。",
                  "- Codex 复审前不得启动正式执行；尤其不得用 131 条历史 `UNASSESSED` 的设计完整性替代执行证据。",
                  "- 只有在 P0 FAIL、SPEC-MISMATCH、环境 BLOCKED、外键漂移和强断言缺口均按闭环规则处理后，才可重新评估 readiness。",
                  ""])
    return "\n".join(text)

def build_terminal_matrix():
    header = ["caseId", "terminal", "agent", "os", "arch", "node", "npm", "shell", "ttyMode",
              "installLayout", "mcpTransport", "hookSupport", "executionLevel",
              "requiredEvidence", "status", "blockedReason"]
    rows = [
        ["D1-1", "Hermes-Windows", "Hermes", "win32", "x64", ">=22", "paired", "PowerShell", "non-TTY",
         "isolated HOME/plugin/npm cache", "stdio", "yes", "design-only",
         "install落点、重启生效、tools/list、清理快照", "BLOCKED", "本轮不执行；未来需隔离 Hermes 环境"],
        ["D1-1", "Hermes-Linux", "Hermes", "linux", "x64/arm64", ">=22", "paired", "bash", "non-TTY",
         "isolated HOME/plugin/npm cache", "stdio", "yes", "design-only",
         "安装落点、重启生效、tools/list、清理快照", "BLOCKED", "本轮不执行；未来需 Linux 实机"],
        ["D5-3", "Hook-client", "Hermes", "Windows/Linux", "declared", ">=22", "paired", "platform shell", "TTY/non-TTY",
         "client-specific isolated profile", "stdio", "yes", "design-only",
         "39 tools逐个schema、Hook行为、重启生效", "BLOCKED", "需要真实 Hook 客户端环境"],
        ["D5-3", "Non-Hook-client", "OpenCode", "Windows/Linux", "declared", ">=22", "paired", "platform shell", "non-TTY",
         "client-specific isolated profile", "stdio", "no", "design-only",
         "39 tools逐个schema、MCP fallback、配置快照", "BLOCKED", "需要真实非 Hook 客户端环境"],
        ["D9-1", "MCP-stdio", "Hermes/MCP Inspector", "Windows/Linux", "declared", ">=22", "paired", "PowerShell/bash", "non-TTY",
         "isolated HOME", "stdio", "n/a", "design-only",
         "initialize、tools/list、JSON Schema、协议 framing", "BLOCKED", "本轮不启动真实 MCP"],
        ["D1-55", "MCP-remote", "Hermes/MCP Inspector", "Windows/Linux", "declared", ">=22", "paired", "PowerShell/bash", "non-TTY",
         "isolated HOME", "remote", "n/a", "design-only",
         "session header、A/B隔离、重启和取消语义", "BLOCKED", "remote session 能力/环境未提供；不得用进程级观测替代"],
        ["D1-55", "TTY", "Hermes", "Windows", "x64", ">=22", "paired", "ConPTY/PTY", "TTY",
         "isolated profile", "stdio/remote", "yes", "design-only",
         "同意、拒绝、取消、重复调用交互日志", "BLOCKED", "当前无真实 PTY；未来需 ConPTY/PTY"],
        ["D7-1", "macOS-arm64", "代表客户端待定", "darwin", "arm64", ">=22", "paired", "zsh", "non-TTY",
         "isolated HOME", "stdio", "按客户端", "design-only",
         "安装、路径、Node/npm、MCP 互通", "BLOCKED", "无 macOS/ARM 环境；未来需机器或 CI runner"],
        ["D5-5", "CodeArtsSpace-Hook", "CodeArtsSpace", "Windows/Linux", "declared", ">=22", "paired", "platform shell", "non-TTY",
         "isolated client profile", "stdio", "yes", "design-only",
         "Sandbox/KooCLI限制、Hook、重启和恢复", "BLOCKED", "无可用 CodeArtsSpace 环境"],
        ["D4-4", "安全代表", "Hermes/OpenCode", "Windows/Linux", "declared", ">=22", "paired", "platform shell", "TTY/non-TTY",
         "isolated HOME", "stdio", "Hook/no-Hook", "design-only",
         "deny、token审批、execution、无spawn、脱敏和清理", "BLOCKED", "本轮不执行；未来需本地 fake 与代表客户端"],
    ]
    return header, rows

def build_status(design, expanded, trace):
    d_exec = Counter(r.get("执行状态", "NOT_RUN") for r in design)
    e_exec = Counter(r.get("execution_status", "NOT_RUN") for r in expanded)
    return f"""# Hermes ITER-005 交接状态

- 状态：`HERMES_REVISION_READY`
- 评审结论：等待 Codex 复审；不得标记 `TEST_DESIGN_READY`
- 评审目录：`reviews/{ITER}/`
- 本轮纪律：只修改设计文档、CSV、生成/审计脚本和评审交接；没有运行测试、npm test、node --test、pytest、hcloud、真实 MCP、真实升级或真实云操作。

{_sut_section()}

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

- 设计级：{len(design)} 条；`设计状态=DESIGN_COVERED` {sum(r.get('设计状态') == 'DESIGN_COVERED' for r in design)}；执行状态 `{dict(d_exec)}`。
- 展开级：{len(expanded)} 条；执行状态 `{dict(e_exec)}`。
- 追踪表：{len(trace)} 条；含 `design_status/execution_status` 分离字段。
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
"""

def main():
    design = read_csv(DES)
    expanded = read_csv(EXP)
    trace = read_csv(TRACE)
    os.makedirs(HERMES, exist_ok=True)
    shutil.copyfile(DES, os.path.join(HERMES, "candidate-matrix.csv"))
    write_text(os.path.join(HERMES, "test-design.md"), build_test_design(design, expanded, trace))
    write_text(os.path.join(HERMES, "status.md"), build_status(design, expanded, trace))
    header, rows = build_terminal_matrix()
    with open(os.path.join(REVIEW, "terminal-matrix.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    print(REVIEW)
    print(f"design={len(design)} expanded={len(expanded)} tracing={len(trace)}")
    print("files=hermes/test-design.md,hermes/candidate-matrix.csv,hermes/status.md,terminal-matrix.csv")

if __name__ == "__main__":
    main()
