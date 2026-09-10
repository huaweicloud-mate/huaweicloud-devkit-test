# -*- coding: utf-8 -*-
"""生成评审用 HTML 文档：测试规划 + 用例体系（自包含单文件，内联 CSS）"""
import csv
import os
from datetime import datetime
from collections import Counter

BASE = r"C:\Users\Administrator\devkit-test"
DESIGN_CSV = os.path.join(BASE, "test-cases", "huaweicloud-devkit-用例矩阵-设计级.csv")
EXPANDED_CSV = os.path.join(BASE, "test-cases", "huaweicloud-devkit-用例矩阵-展开级.csv")
OUT = os.path.join(BASE, "huaweicloud-devkit-测试体系-评审稿.html")

def load(path):
    with open(path, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))

design = load(DESIGN_CSV)
expanded = load(EXPANDED_CSV)

# ---------- 优先级统计 ----------
prio_count = Counter(r["优先级"] for r in design)
prio_exp = Counter(r["优先级"] for r in expanded)

def prio_badge(p):
    cls = {"P0": "p0", "P1": "p1", "P2": "p2"}.get(p, "px")
    return f'<span class="badge {cls}">{p}</span>'

# ---------- 设计级按维度分组 ----------
DIMENSIONS = [
    ("D1", "安装与生命周期", "install/doctor/status/update/uninstall/install-hcloud、OpenClaw 插件流、通用 MCP 通道"),
    ("D2", "认证与凭证", "auth init/status/sync、show_profile_redacted、OBS 独立配置、无凭证降级"),
    ("D3", "功能覆盖", "A 能力路由与技能体系 / B 命令规划与执行 / C 真实场景端到端（ECS/OBS/沙箱/20+服务）"),
    ("D4", "安全与风险护栏（最高权重）", "凭证拦截、写操作审批门、对抗性测试（绕过/包裹/模糊）、提示注入、最小权限、可审计"),
    ("D5", "多 Agent 客户端适配矩阵", "10+ 客户端：OpenCode/Codex/CodeArts/WorkBuddy/DSH/OfficeAce/Hermes/OpenClaw/AtomCode/通用MCP"),
    ("D6", "性能与可靠性", "检索延迟/只读执行耗时/MCP冷启/并发调度/大输入/弱网幂等/长会话稳定性"),
    ("D7", "兼容性与跨平台", "OS×Node 矩阵、Windows better-sqlite3 缺口、国内镜像源、升级兼容"),
    ("D8", "文档与内容质量", "文档漂移、错误可执行性、脱敏误报平衡、引导步骤可机械执行、日志安全、中英一致性"),
    ("D9", "MCP 协议合规", "tools/list schema、JSON-RPC 错误码、tools/call 格式、生命周期、stdio 健壮性、跨客户端互通、版本协商"),
    ("D10", "Agent 行为评测", "工具描述可选择性、skill 激活率≥90%、路由准确率、安全干预、多轮任务完成率、评测基建"),
]

dim_rows = []
for prefix, name, obj in DIMENSIONS:
    rows = [r for r in design if r["ID"].startswith(prefix + "-")]
    cnt = len(rows)
    c = Counter(r["优先级"] for r in rows)
    parts = " / ".join(f'{k}{v}' for k, v in sorted(c.items(), key=lambda x: "012".index(x[0][1])))
    n_auto = sum(1 for r in rows if "自动" in r["自动化建议"] or "脚本" in r["自动化建议"])
    auto_rate = f"{round(n_auto / cnt * 100)}%" if cnt else "-"
    dim_rows.append(f"<tr><td><b>{prefix}</b></td><td>{name}</td><td>{obj}</td><td class='c'>{cnt}</td><td class='c'>{parts}</td><td class='c'>{auto_rate}</td></tr>")

dim_table = (
    "<table class='grid'><thead><tr><th>维度</th><th>名称</th><th>主要对象</th>"
    "<th class='c'>用例数</th><th class='c'>优先级分布</th><th class='c'>自动化</th></tr></thead><tbody>"
    + "".join(dim_rows) + "</tbody></table>"
)

# ---------- 设计级全量表（分维度） ----------
design_blocks = []
for prefix, name, _ in DIMENSIONS:
    rows = [r for r in design if r["ID"].startswith(prefix + "-")]
    if not rows:
        continue
    trs = []
    for r in rows:
        steps = (r["操作步骤"] or "").replace("①", "1. ").replace("②", "2. ").replace("③", "3. ").replace("④", "4. ")
        trs.append(
            f"<tr><td class='mono'>{r['ID']}</td><td>{prio_badge(r['优先级'])}</td><td>{r['标题']}</td>"
            f"<td class='small'>{steps}</td><td class='small'>{r['预期结果']}</td>"
            f"<td class='small'>{r['指引来源']}</td><td class='c small'>{r['自动化建议']}</td></tr>"
        )
    design_blocks.append(
        f"<details open><summary><b>{prefix} {name}</b>（{len(rows)} 条）</summary>"
        f"<table class='grid cases'><thead><tr><th>ID</th><th>优先级</th><th>标题</th>"
        f"<th>操作步骤</th><th>预期结果</th><th>指引来源</th><th>自动化</th></tr></thead>"
        f"<tbody>{''.join(trs)}</tbody></table></details>"
    )

# ---------- 展开级（折叠） ----------
exp_blocks = []
exp_types = [
    ("D5 客户端矩阵", "EXP-D5", "10 客户端 × D5-1~7 适配用例（70 条）"),
    ("D3-C4 服务矩阵", "EXP-C4", "22 个云服务只读规划冒烟 + 高危服务轻量创建释放（22 条）"),
    ("D10 评测集", "EXP-E", "15 条自然语言评测任务（Agent 行为评测集 v1）（15 条）"),
]
for label, prefix, desc in exp_types:
    rows = [r for r in expanded if r["ID"].startswith(prefix)]
    trs = "".join(
        f"<tr><td class='mono'>{r['ID']}</td><td>{prio_badge(r['优先级'])}</td><td>{r['枚举对象']}</td>"
        f"<td class='small'>{r['执行要点']}</td><td class='small'>{r['预期结果']}</td></tr>"
        for r in rows
    )
    exp_blocks.append(
        f"<details><summary><b>{label}</b>（{desc}，{len(rows)} 条，点击展开）</summary>"
        f"<table class='grid cases'><thead><tr><th>ID</th><th>优先级</th><th>对象</th><th>执行要点</th>"
        f"<th>预期结果</th></tr></thead><tbody>{trs}</tbody></table></details>"
    )

# ---------- 统计卡片 ----------
total = len(design) + len(expanded)
p0 = prio_count["P0"] + prio_exp["P0"]
p1 = prio_count["P1"] + prio_exp["P1"]
p2 = prio_count["P2"] + prio_exp["P2"]

CSS = """
* { box-sizing: border-box; }
body { font-family: -apple-system, "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif;
       margin: 0; background: #f4f5f7; color: #1f2328; line-height: 1.6; }
.wrap { max-width: 1180px; margin: 0 auto; padding: 24px 28px 80px; }
header.hero { background: linear-gradient(135deg, #0b1c33 0%, #12305c 60%, #c7000b 160%);
       color: #fff; border-radius: 12px; padding: 34px 40px; margin-bottom: 26px; }
header.hero h1 { margin: 0 0 6px; font-size: 28px; }
header.hero .sub { opacity: .92; font-size: 15px; }
.meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.meta span { background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.25);
       padding: 4px 12px; border-radius: 20px; font-size: 12.5px; }
nav.toc { position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
       background: rgba(11,28,51,.97); box-shadow: 0 2px 10px rgba(0,0,0,.28);
       display: flex; align-items: center; flex-wrap: wrap; gap: 6px 18px;
       padding: 10px 28px; }
nav.toc .toc-title { color: #ff8a8f; font-weight: 700; font-size: 13px; white-space: nowrap; }
nav.toc ol { display: flex; flex-wrap: wrap; gap: 3px 14px; margin: 0; padding: 0; list-style: none; }
nav.toc li { font-size: 12.5px; }
nav.toc a { color: #dce6f5; text-decoration: none; white-space: nowrap; }
nav.toc a:hover { color: #fff; text-decoration: underline; }
body { padding-top: 56px; }
section { scroll-margin-top: 66px; }
section { background: #fff; border: 1px solid #e3e6ea; border-radius: 10px;
       padding: 22px 26px; margin-bottom: 22px; }
section h2 { margin: 0 0 14px; font-size: 20px; color: #0b1c33; border-left: 4px solid #c7000b; padding-left: 12px; }
section h3 { margin: 18px 0 8px; font-size: 15.5px; color: #12305c; }
p, li { font-size: 13.8px; }
table.grid { width: 100%; border-collapse: collapse; font-size: 12.5px; margin: 10px 0; }
table.grid th { background: #12305c; color: #fff; padding: 7px 9px; text-align: left; font-weight: 600; }
table.grid td { border: 1px solid #e3e6ea; padding: 6px 9px; vertical-align: top; }
table.grid tbody tr:nth-child(even) { background: #f8fafc; }
table.cases td { font-size: 12px; }
.c { text-align: center; }
.mono { font-family: Consolas, "Courier New", monospace; font-size: 11.5px; white-space: nowrap; }
.small { color: #444; }
.badge { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; color: #fff; }
.badge.p0 { background: #d92d20; }
.badge.p1 { background: #e8820c; }
.badge.p2 { background: #7a869a; }
.badge.px { background: #98a2b3; }
.cards { display: flex; gap: 14px; margin: 14px 0; flex-wrap: wrap; }
.card { flex: 1; min-width: 150px; background: #f8fafc; border: 1px solid #e3e6ea; border-radius: 10px;
       padding: 14px 18px; text-align: center; }
.card .num { font-size: 30px; font-weight: 800; color: #12305c; }
.card .lbl { font-size: 12.5px; color: #666; margin-top: 2px; }
details { margin: 8px 0; border: 1px solid #e3e6ea; border-radius: 8px; padding: 8px 14px; background: #fcfcfd; }
details summary { cursor: pointer; font-size: 14px; color: #12305c; padding: 4px 0; }
details[open] summary { color: #c7000b; }
ul.tight li { margin-bottom: 4px; }
.quote { background: #fdf6f3; border-left: 3px solid #c7000b; padding: 10px 14px; border-radius: 0 8px 8px 0;
       font-size: 13px; margin: 10px 0; }
table.grid td.p0bg { background: #fef0ee; }
.flag { background: #fff8e6; border: 1px solid #f2dd9b; border-radius: 8px; padding: 12px 16px; margin: 8px 0; font-size: 13px; }
footer { text-align: center; color: #98a2b3; font-size: 12px; margin-top: 30px; }
@media print {
  body { background: #fff; padding-top: 0; }
  .wrap { max-width: none; padding: 0; }
  section, header.hero { box-shadow: none; break-inside: avoid; }
  nav.toc { display: none; }
  details { break-inside: avoid; }
}
"""

BODY = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HuaweiCloud DevKit 插件测试体系 · 团队评审稿</title>
<style>{CSS}</style>
</head>
<body>
<div class="wrap">

<header class="hero">
  <h1>HuaweiCloud DevKit 插件测试体系 · 团队评审稿</h1>
  <div class="sub">测试规划（v1.3）+ 测试用例体系（{len(design) + len(expanded)} 条）+ 执行准备 + 度量与闭环 —— 供团队成员评审</div>
  <div class="meta">
    <span>被测对象：huaweicloud/huaweicloud-devkit</span>
    <span>规划版本：v1.3（2026-09-05 快照）</span>
    <span>用例规模：{len(design) + len(expanded)} 条（设计级 {len(design)} + 展开级 {len(expanded)}）</span>
    <span>用例分布：P0={p0} / P1={p1} / P2={p2}</span>
    <span>评审状态：待评审</span>
  </div>
</header>

<nav class="toc">
<span class="toc-title">📋 目录</span>
<ol>
<li><a href="#s1">综述</a></li>
<li><a href="#s2">被测系统画像</a></li>
<li><a href="#s3">测试策略</a></li>
<li><a href="#s4">维度总览</a></li>
<li><a href="#s5">用例体系</a></li>
<li><a href="#s6">执行准备</a></li>
<li><a href="#s7">执行流程</a></li>
<li><a href="#s8">度量与闭环</a></li>
<li><a href="#s9">自动化路线</a></li>
<li><a href="#s10">风险问题</a></li>
<li><a href="#s11">归档仓库</a></li>
<li><a href="#s12">附录A 演进</a></li>
<li><a href="#s13">附录B 对标</a></li>
<li><a href="#review">评审焦点 🎯</a></li>
</ol>
</nav>

<section id="s1"><h2>1. 综述</h2>
<p>华为云 DevKit 插件（<code>huaweicloud-devkit</code>）是面向 AI 编码 Agent 的<b>引导 + 安全包</b>，帮助 Agent 在真实华为云上安全、准确地完成操作（仓库定位：<i>"Help AI coding agents use Huawei Cloud safely and accurately."</i>）。本测试体系的目标：</p>
<ul class="tight">
<li><b>1. 引导能力</b>：验证插件能否指导 Agent 完成真实云操作（被测是引导能力，非云平台本身）</li>
<li><b>2. 安全护栏</b>：验证高风险操作是否被拦截、写操作是否被正确要求审批</li>
<li><b>3. 能力覆盖</b>：验证承诺的 20+ 云服务、36 个 MCP 工具、~30 个 skills</li>
<li><b>4. 多客户端一致性</b>：验证 10+ 客户端适配层行为一致且无退化</li>
<li><b>5. 缺陷闭环</b>：为 issue 提交与插件修复提供结构化、可复现证据（P0/P1/P2 分层）</li>
</ul>
<div class="quote">本体系按 <b>Microsoft MCP 三层测试模型</b>（Unit→Protocol→Agent）与 <b>四级测试金字塔</b>（静态门禁→工具单元→场景集成→版本回归）组织，并融合 Azure MCP Server / AWS Agent Toolkit 的行业实证做法。</div>
</section>

<section id="s2"><h2>2. 被测系统画像（SUT 基线）</h2>
<table class="grid">
<thead><tr><th>层</th><th>载体</th><th>职责</th><th>测试关注点</th></tr></thead>
<tbody>
<tr><td><b>L1</b> 插件清单 manifest</td><td>各 Agent 配置</td><td>让客户端可发现、可加载插件</td><td>安装/卸载/更新正确性、跨客户端发现</td></tr>
<tr><td><b>L2</b> 技能 Skills</td><td>SKILL.md（~30 个）</td><td>把华为云操作知识压缩成小路由流程</td><td>指引正确性、覆盖度、触发词</td></tr>
<tr><td><b>L3</b> MCP 工具</td><td>mcp-server.mjs（Node）</td><td>安全的本地规划 + 只读检查</td><td>工具正确性、边界、脱敏（36 工具）</td></tr>
<tr><td><b>L4</b> Hooks</td><td>huaweicloud-safety.py（Python）</td><td>执行前拦截高危工具调用</td><td>拦截率、误杀率、平台差异</td></tr>
<tr><td><b>L5</b> 共享安全策略</td><td>safety-policy.mjs + policy.json</td><td>Node MCP 与 Python Hook 策略对齐</td><td>一致性、规则覆盖</td></tr>
</tbody></table>
<p><b>安全模型基线</b>：默认只读 + 显式审批门（12 类写动词清单）；默认阻断（凭证文件读取/凭证 env 打印/明文 secret API/adminPass 回显）；写路径双轨（plan → approved）；执行前风险预检（公开暴露/凭证泄漏/破坏性操作）。</p>
<p><b>已知 CI 限制</b>：Windows 上 better-sqlite3 原生编译不支持 → windows-latest 上 npm test 被显式跳过——Windows 为官方承认薄弱区，由本体系人工专项补齐。</p>
</section>

<section id="s3"><h2>3. 测试策略</h2>
<h3>3.1 分层测试金字塔</h3>
<pre style="background:#f6f8fa;padding:14px;border-radius:8px;font-size:12.5px;line-height:1.5">
        ┌──────────────┐
        │ E2E 真云回归  │  ← 每晚/迭代门禁，真实凭证（少量、昂贵）
     ┌──┴──────────────┴──┐
     │  客户端矩阵集成测试  │  ← 安装/发现/适配 × 10+ client（多、中等）
  ┌──┴──────────────────┴──┐
  │  功能测试(逐工具/逐skill) │  ← 36 工具 + 30 skill 原子用例（最多）
┌──┴────────────────────────┴──┐
│ 单元/静态/安全扫描(CI 自动化)  │  ← test/*.mjs + npm audit + gitleaks
└───────────────────────────────┘</pre>
<p><b>执行分层策略（§2.6）</b>：36 个 MCP 工具是<b>同一个 Node 进程</b>——不同 Agent 只是不同的 MCP 客户端壳。因此按"客户端相关性"分层执行，避免矩阵爆炸（199×10≈2000 → ~360 次）：</p>
<table class="grid">
<thead><tr><th>测试层</th><th>客户端相关性</th><th>执行策略</th></tr></thead>
<tbody>
<tr><td>D3 工具功能 / D9 协议</td><td>无关（同一服务进程）</td><td><b>代表客户端 1 个全量</b> + MCP Inspector 交叉验证</td></tr>
<tr><td>D4 安全主体</td><td>弱相关（策略共享）</td><td>hook-capable 与非 hook 各 1 个代表客户端；其余抽 D5-4</td></tr>
<tr><td>D6 性能 / D7 兼容 / D8 文档</td><td>无关</td><td>单一标准环境 / OS×Node 矩阵 / 静态评审</td></tr>
<tr><td>D1 安装 + D5 适配</td><td><b>强相关</b></td><td>10 客户端全跑（安装目录/config 落点/hook 支持/重启语义逐客户端不同）</td></tr>
<tr><td>D10 Agent 行为</td><td><b>强相关</b>（模型+插件组合）</td><td>代表 3~4 个 agent（跨厂商模型），受成本预算约束</td></tr>
</tbody></table>
<h3>3.2 测试纪律（铁律）</h3>
<ul class="tight">
<li><b>P/G/I 来源纪律</b>：每步标注 P=插件提供能力 / G=插件缺失自行解决(记缺口) / I=Agent 擅自联想(违规记红线)</li>
<li><b>凭证纪律</b>：AK/SK 永不进对话/报告；输出须脱敏</li>
<li><b>写操作纪律</b>：一律 plan → approved 执行；误判 read-only 立即记安全缺口(高危)</li>
<li><b>资源释放纪律</b>：本轮资源当轮删除并只读验证归零，残留即 FAIL</li>
<li><b>环境清理纪律</b>：测试前重置"未安装"态（重装引导本身是被测能力）</li>
<li><b>数据隐私纪律</b>：测试内容统一无害假数据，真实业务数据不进测试环境</li>
</ul>
<h3>3.3 退出标准（出口条件）</h3>
<ul class="tight">
<li>功能用例通过率 ≥ 95%；P0/P1 缺陷清零；P2 遗留 ≤ 3 且均有排期，其余进 backlog</li>
<li>安全维度：0 个 P0（凭证泄漏/破坏性误判）；写操作误判 read-only 事件 = 0</li>
<li>能力覆盖<b>双口径</b>：定义覆盖率 100%（36 工具/30 skill/20+ 服务均有用例）；执行覆盖率分层（核心 100%，长尾抽测 ≥ 60%）</li>
<li>无资源残留、无红线(I 类)违规；全矩阵客户端安装/加载/冒烟通过</li>
<li>协议合规：tools/list schema 100% 合法，跨 3 客户端互通通过</li>
<li>Agent 评测：skill 激活率 ≥ 90%，路由准确率 ≥ 90%，安全干预 0 失败</li>
</ul>
</section>

<section id="s4"><h2>4. 测试维度总览（D1–D10）</h2>
{dim_table}
<p class="small">用例数=设计级；优先级分布为该维度内 P0/P1/P2 计数；自动化按"脚本/半自动"建议估算。</p>
</section>

<section id="s5"><h2>5. 测试用例体系（{len(design) + len(expanded)} 条）</h2>
<div class="cards">
<div class="card"><div class="num">{total}</div><div class="lbl">总用例（设计+展开）</div></div>
<div class="card"><div class="num">{len(design)}</div><div class="lbl">设计级（D1–D10）</div></div>
<div class="card"><div class="num">{len(expanded)}</div><div class="lbl">展开级（矩阵/服务/评测）</div></div>
<div class="card"><div class="num" style="color:#d92d20">{p0}</div><div class="lbl">P0 必测（安全/中断级）</div></div>
<div class="card"><div class="num" style="color:#e8820c">{p1}</div><div class="lbl">P1 应测</div></div>
<div class="card"><div class="num" style="color:#7a869a">{p2}</div><div class="lbl">P2 可测</div></div>
</div>
<h3>5.1 设计级用例全量表（92 条，按维度）</h3>
<p class="small">每条含 ID / 优先级 / 标题 / 操作步骤 / 预期结果 / 指引来源（【仓】仓库事实【标】行业对标【规】MCP·JSON-RPC 规范【通】通用测试实践）/ 自动化建议。P0=红 / P1=橙 / P2=灰。</p>
{''.join(design_blocks)}
<h3>5.2 展开级矩阵（107 条，点击展开）</h3>
{''.join(exp_blocks)}
</section>

<section id="s6"><h2>6. 执行准备与环境</h2>
<h3>6.1 准备清单（8 组，全部 ✅ 后启动 T0）</h3>
<table class="grid">
<thead><tr><th>组</th><th>内容</th><th>优先级</th></tr></thead>
<tbody>
<tr><td>组 1</td><td>代码与工具：clone 上游仓库、npx 安装、invoke-mcp.mjs、MCP Inspector、cleanup/nightly skill</td><td class="c">硬前置</td></tr>
<tr><td>组 2</td><td>运行环境：Node ≥22（实测 22/24）、Windows 专项机（本机）、Linux x86/arm、macOS</td><td class="c">硬前置</td></tr>
<tr><td>组 3</td><td>云账号与凭证：最小权限 AK/SK、KooCLI 认证、obsutil、~/.agents 凭证文件、沙箱配额、费用上限确认</td><td class="c">硬前置</td></tr>
<tr><td>组 4</td><td>客户端矩阵：主 4（OpenCode/Codex/CodeArts/WorkBuddy）全量，长尾 6 分批冒烟</td><td class="c">并行</td></tr>
<tr><td>组 5</td><td>测试资产：用例矩阵 CSV（已生成）、执行追踪母版、报告模板、issue 模板</td><td class="c">并行</td></tr>
<tr><td>组 6</td><td>人员职责：测试负责人、nightly 轮值、P0 上报通道、issue 提交账号</td><td class="c">并行</td></tr>
<tr><td>组 7</td><td>制度纪律：P/G/I、凭证、资源释放、数据隐私培训；退出标准确认</td><td class="c">首轮前</td></tr>
<tr><td>组 8</td><td>T0 启动：git pull + commit 记录、能力清单核对、环境重置、前置条件可用性检查、CI 有效性审计</td><td class="c">启动</td></tr>
</tbody></table>
<h3>6.2 本机预检结果（2026-09-05）</h3>
<table class="grid">
<thead><tr><th>检查项</th><th>状态</th><th>说明</th></tr></thead>
<tbody>
<tr><td>Node / npm / git</td><td class="c">✅</td><td>v22.23.2 / 10.9.8 / 2.54.0</td></tr>
<tr><td>hcloud（KooCLI）</td><td class="c">✅</td><td>v7.2.12，已认证（AKSK，cn-north-4）——<b>注意 projectId/domainId 为空</b>，T0 需补</td></tr>
<tr><td>obsutil</td><td class="c">❌</td><td>未安装 → 阻塞 D2-6 / D3-C2，需先装</td></tr>
<tr><td>~/.agents 凭证目录</td><td class="c">✅</td><td>存在（密钥字段按约定留空人工填）</td></tr>
<tr><td>仓库 clone</td><td class="c">❌</td><td>待 clone 到 devkit-test\\hdk（T0 第一步）</td></tr>
</tbody></table>
</section>

<section id="s7"><h2>7. 执行流程与节奏</h2>
<table class="grid">
<thead><tr><th>阶段</th><th>内容</th><th>时机/频率</th></tr></thead>
<tbody>
<tr><td><b>T0</b> 基线对齐</td><td>拉最新代码、能力清单核对、环境重置"未安装态"</td><td>每次回归前</td></tr>
<tr><td><b>T0.5</b> 变更影响分析</td><td>git diff → 受影响用例集 → 本轮只跑"受影响集+安全基线+冒烟"</td><td>每次代码更新后</td></tr>
<tr><td><b>T1</b> 自动化左移</td><td>跑通既有单测/CI/安全扫描 + CI 有效性审计 + Win 手动补测</td><td>CI 每 PR + 上线前</td></tr>
<tr><td><b>T2</b> 客户端矩阵</td><td>D5 全矩阵安装/加载/冒烟</td><td>每 Release 前</td></tr>
<tr><td><b>T3</b> 功能+安全回归</td><td>D3/D4 核心 + 每晚真云 E2E（复用 nightly skill）</td><td>每晚</td></tr>
<tr><td><b>T4</b> 纵深维度</td><td>D1/D2/D6/D7/D8 补强</td><td>每周/每迭代</td></tr>
<tr><td><b>T5</b> 资源释放审计</td><td>全量残留扫描、删除验证</td><td>每阶段末</td></tr>
<tr><td><b>T6</b> 汇总上报</td><td>P0/P1/P2 汇总 → 插件修复提示词 → 拆 issue</td><td>每迭代末</td></tr>
</tbody></table>
<p><b>新增需求测试（NR1→NR6）</b>：需求评估 → 测试设计（≥4 用例：Happy/Error/安全/防退化）→ 更新矩阵（ID 永不复用/OBSOLETE/supersedes 三铁律）→ 与既有用例同轮复测 → 合入门禁（P0/P1 100% 通过）→ 防退化沉淀。新增资源自动触发：新工具→D5-3 枚举 diff 报警；新 SKILL→D3-A1 自动覆盖+补 D10-2；policy 新规则→D4-10 自动回归。</p>
</section>

<section id="s8"><h2>8. 度量、报告与缺陷闭环</h2>
<h3>8.1 度量体系（§5.1）</h3>
<table class="grid">
<thead><tr><th>度量项</th><th>口径</th><th>频率</th></tr></thead>
<tbody>
<tr><td>用例执行率</td><td>已执行/计划执行（BLOCKED 不计分母）</td><td>每轮回归</td></tr>
<tr><td>用例通过率</td><td>通过/已执行（含 PARTIAL 折算）</td><td>每轮回归</td></tr>
<tr><td>缺陷密度</td><td>(P0+P1)/已执行用例 ×100</td><td>每迭代</td></tr>
<tr><td>缺陷存量趋势</td><td>P0/P1/P2 状态存量曲线</td><td>每迭代</td></tr>
<tr><td>D10 激活率/路由准确率</td><td>评测集跑分（固定模型+温度）</td><td>每 Release</td></tr>
<tr><td>自动化覆盖率</td><td>脚本驱动用例/总用例</td><td>每迭代</td></tr>
</tbody></table>
<h3>8.2 缺陷分级与闭环</h3>
<table class="grid">
<thead><tr><th>级别</th><th>定义</th><th>处置</th></tr></thead>
<tbody>
<tr><td><b>P0</b></td><td>凭证明文泄漏、写被误判只读并执行、越权/破坏性未拦截、主流程全阻塞</td><td>立即停测，当日上报</td></tr>
<tr><td><b>P1</b></td><td>插件指引错误导致无法完成云操作、hook 失灵、跨客户端严重不一致</td><td>本周修复</td></tr>
<tr><td><b>P2</b></td><td>文案过时、轻微不一致、性能抖动、优化项</td><td>排期/backlog</td></tr>
<tr><td><b>I 类</b></td><td>测试者擅自联想/猜测绕过插件</td><td>非缺陷，记违规整改纪律</td></tr>
</tbody></table>
<p>闭环：测试执行 → 每晚报告 → 缺口表(P/G) → 插件修复提示词 → 拆 issue（§6.4 八字段模板）→ 提交上游 → 下迭代复测验证。</p>
</section>

<section id="s9"><h2>9. 自动化提升路线图（~60% → 目标 ~80%）</h2>
<table class="grid">
<thead><tr><th>档位</th><th>投入</th><th>达到</th><th>动作</th></tr></thead>
<tbody>
<tr><td><b>档 1 快赢</b>（本周）</td><td>零/极低</td><td class="c">~68%</td><td>D4 hook 函数直调（不经 MCP）、D1 安装脚本化、D8 链接扫描、D2 脱敏正则断言</td></tr>
<tr><td><b>档 2 主力</b>（1~2 迭代）</td><td>中等</td><td class="c">~78%</td><td>D3-C 真云 E2E 夜间流水线（复用 nightly+cleanup）、D5 客户端安装/枚举脚本化、D9 Inspector 入 CI</td></tr>
<tr><td><b>档 3 深水</b>（长期）</td><td>较高</td><td class="c">~83~85%</td><td>D10 harness 全链路 + LLM-as-judge、D8 中英对齐 diff、客户端会话半自动</td></tr>
</tbody></table>
<p class="small">瓶颈天花板 85~90%（对齐 Azure/AWS 实测）：真云 E2E 依赖云 API/成本、真实客户端会话无法全无头、人工判断类只能半自动。新用例默认自动化 ≥70%。</p>
</section>

<section id="s10"><h2>10. 风险与开放问题</h2>
<table class="grid">
<thead><tr><th>风险/问题</th><th>影响</th><th>缓解</th></tr></thead>
<tbody>
<tr><td>Windows 无 CI 单测覆盖（better-sqlite3）</td><td>Win 回归漏检</td><td>至少 1 台 Win 手动专项（§4.2 清单）</td></tr>
<tr><td>真实云操作产生费用/资源残留</td><td>成本+污染</td><td>最小权限账号 + 沙箱优先 + 强制释放审计（T5）</td></tr>
<tr><td>多客户端矩阵执行成本高</td><td>周期长</td><td>§2.6 执行分层：~360 次可管理</td></tr>
<tr><td>依赖真实凭证（人工填）</td><td>自动化受阻</td><td>凭证文件模板化，密钥留空待填</td></tr>
<tr><td>服务数量大（20+）用例膨胀</td><td>维护成本</td><td>按风险抽 1 只读 + 高危服务深度测</td></tr>
<tr><td>KooCLI profile projectId/domainId 为空</td><td>D3-B2 命令缺参</td><td>T0 补齐 profile 后跑 D2/D3-B（已发现）</td></tr>
<tr><td>本机 GCM 凭据与 gh 冲突</td><td>git push 404</td><td>归档仓库已配 pushm/fetchm/pullm 别名</td></tr>
</tbody></table>
</section>

<section id="s11"><h2>11. 归档仓库</h2>
<p>测试资料归档仓库已建：<a href="https://github.com/huaweicloud-mate/huaweicloud-devkit-test">github.com/huaweicloud-mate/huaweicloud-devkit-test</a>（PRIVATE，huaweicloud-mate 组织，shuangheaven 账号，main @ commit c663813）</p>
<h3>11.1 目录结构（远程验证版）</h3>
<pre style="background:#0f1b2d;color:#dce6f5;padding:16px 18px;border-radius:10px;font-size:11.5px;line-height:1.55;overflow-x:auto;font-family:Consolas,'Courier New',monospace">huaweicloud-mate/huaweicloud-devkit-test  (PRIVATE · main)
├── README.md                     # 导航首页 + 凭据说明（pushm/pullm/fetchm）
├── .gitignore                    # 凭证零进入（22 条忽略规则锁定）
├── docs/                         # 静态文档
│   ├── 01-测试规划.md             # 测试规划 v1.3（10 维度 / 199 用例）
│   ├── 02-测试规划评审报告.md      # 评审报告（84 → 93 分演进）
│   ├── 03-执行准备清单.md         # 8 组准备清单
│   ├── 05-归档仓库目录结构.md     # 本结构规划文档
│   └── 测试体系-评审稿.html       # 团队评审稿（本文件）
├── test-cases/                  # 用例体系母版（跨版本演进）
│   ├── README.md                # 编号规则 + 用例演进三铁律
│   ├── design/                  # 设计级 92 条
│   │   ├── 用例矩阵-设计级.csv
│   │   └── gen_matrix.py        # 可复现生成脚本
│   └── expanded/                # 展开级 107 条
│       └── 用例矩阵-展开级.csv
├── templates/                   # 模板库（执行时复制到 results/）
│   ├── nightly-report.md        # 每晚回归报告
│   ├── client-matrix-report.md  # 客户端适配矩阵结果
│   ├── security-audit.md        # 安全审计清单
│   ├── gap-report.md            # 缺口表（P/G 分类）
│   ├── dashboard.md             # 质量仪表盘
│   └── issue-template.md        # issue 拆分模板（§6.4）
├── results/                     # 执行结果归档（唯一动态区）
│   ├── README.md                # ITER-NNN-日期命名规则
│   ├── LATEST.md                # 最新迭代指针
│   └── ITER-001-2026-09-05/     # 每轮迭代（baseline / change-impact /
│                                #   nightly / client-matrix / security /
│                                #   gaps / issues / evidence / cleanup）
├── metrics/                     # 跨迭代度量与趋势
│   ├── README.md                # 指标口径
│   ├── execution.csv            # 执行率 / 通过率 / 自动化覆盖率
│   ├── defects.csv              # 缺陷存量趋势
│   └── dashboard.md             # 质量仪表盘
├── eval/                        # D10 Agent 行为评测
│   ├── README.md                # 评测纪律 / 预算 / 失败分级
│   ├── prompts/                 # 自然语言评测集（eval-set-v1.csv）
│   ├── harness/                 # 评测 harness + promptfoo
│   └── results/                 # 每轮评测结果
├── scripts/                     # 工具脚本（占位，待补 check-prereqs 等）
│   └── .gitkeep
└── assets/                      # 可视化素材（占位）
    └── .gitkeep</pre>
<h3>11.2 安全与协作约定</h3>
<ul class="tight">
<li><b>凭证红线</b>：.gitignore 锁定 AK/SK/凭证文件零进入（22 条忽略规则 ad-hoc 验证通过）；evidence 目录只存脱敏内容</li>
<li><b>唯一真源</b>：归档仓库是测试资产唯一真源——新报告/新用例直接写入仓库路径，工作区不双份维护</li>
<li><b>日常推送</b>：<code>git pushm / pullm / fetchm</code>（本仓库 gh 凭据别名，绕开 GCM 冲突）</li>
<li><b>根 .gitkeep</b>：空目录占位保证结构完整性，实际文件后续填充</li>
</ul>
</section>

<section id="s12"><h2>12. 附录 A：规划评审演进（84 → 93 分）</h2>
<table class="grid">
<thead><tr><th>版本</th><th>关键变更</th></tr></thead>
<tbody>
<tr><td>v1.0 → v1.1</td><td>行业对标（Azure/Microsoft/AWS）：新增 D9 协议合规、D10 Agent 评测，补 D2-7/D4-11~14</td></tr>
<tr><td>v1.2</td><td>全部用例补充依据标注（【仓】【标】【规】【通】）</td></tr>
<tr><td>v1.3</td><td>工程化落地：§2.5 用例模板+优先级+禁止剪枝集、覆盖双口径、T0.5 变更影响分析、前置条件矩阵、Windows 专项、度量体系、D4 对抗性测试、D9/D10 补强、issue 模板、工时预算、数据隐私纪律</td></tr>
<tr><td>v1.3+ / v1.3.1</td><td>§2.6 执行分层（1990→360）、§5.2 新增需求流程 NR1-6、§8.1 自动化路线图</td></tr>
</tbody></table>
<p>首轮评审 84 分（合格，达行业水准）→ 补齐 A1–A5 工程化后 93 分（可落地试运行）；剩余 7 分在"执行验证闭环"（跑真实一轮 T0/T0.5/T1 后回填修正）。</p>
</section>

<section id="s13"><h2>13. 附录 B：行业对标摘要</h2>
<table class="grid">
<thead><tr><th>对标对象</th><th>要点</th><th>本体系对应</th></tr></thead>
<tbody>
<tr><td>Azure MCP Server</td><td>Unit(mock)/Live(真资源)/E2E(全 MCP 协议)/NPX 包测试；ToolDescriptionEvaluator 评测工具描述</td><td>D9 协议层、D10-1 工具描述可选择性</td></tr>
<tr><td>Microsoft MCP 测试最佳实践</td><td>三层模型 Unit→Protocol→Agent；测"发现→选参→解读"全链路</td><td>体系总纲 + D3-A2/D10-5</td></tr>
<tr><td>AWS Agent Toolkit</td><td>skill 激活率（静默失效教训）、IAM condition key 只读仿真、CloudTrail 审计、无凭证 docs 检索</td><td>D10-2 激活率、D4-13 最小权限、D4-14 可审计、D2-7 无凭证降级</td></tr>
</tbody></table>
<p class="small">差异化强项：10+ 客户端矩阵（竞品 4–5 个）、P/G/I 指引来源纪律、资源释放审计与环境重置验证。</p>
</section>

<section id="review" style="border:2px solid #c7000b"><h2 style="border-color:#c7000b">本次评审请关注（6 个决策点）</h2>
<ol>
<li><b>用例规模</b>：{len(design) + len(expanded)} 条 + 剪枝策略（禁止剪枝集 D4 全量/D1-1/3/5/D9 全量/D10 核心）是否合理？</li>
<li><b>执行分层</b>：代表客户端全量 + 10 客户端适配矩阵 + 3~4 agent 评测（~360 次/轮）——是否认同"工具层测一遍、Agent 层才多 agent"的切分？</li>
<li><b>优先级分配</b>：P0 共 {p0} 条（安全/凭证/绕过类）——轻重是否恰当？</li>
<li><b>退出标准</b>：通过率 ≥95%、P0 清零、覆盖双口径（定义 100%/执行分层）——是否可接受？</li>
<li><b>自动化目标</b>：~80%（三档路线，天花板 85~90%）是否现实？</li>
<li><b>资源投入</b>：每轮 ~2.5h（半自动）/ 裁剪后 1~2h——与团队人力是否匹配？</li>
</ol>
</section>

<footer>HuaweiCloud DevKit 测试体系 · 评审稿 · 生成于 {datetime.now().strftime('%Y-%m-%d %H:%M')}（北京时间） · 数据源：测试规划 v1.3 + 用例矩阵 CSV（{len(design)} 设计级 + {len(expanded)} 展开级 = {len(design) + len(expanded)} 条）</footer>
</div>
</body>
</html>
"""

with open(OUT, "w", encoding="utf-8") as f:
    f.write(BODY)

print(f"HTML 生成: {OUT}")
print(f"总用例: {total} (设计级 {len(design)} + 展开级 {len(expanded)}), P0={p0}, P1={p1}, P2={p2}")
print(f"文件大小: {os.path.getsize(OUT)/1024:.1f} KB")