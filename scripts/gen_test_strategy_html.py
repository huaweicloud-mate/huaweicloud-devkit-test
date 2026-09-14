# -*- coding: utf-8 -*-
"""生成 docs/测试体系全貌与测试策略.html（自包含，含徽章/hero/目录/表格美化）。
用法：python scripts/gen_test_strategy_html.py
改动 docs/测试体系全貌与测试策略.md 后重跑本脚本即可同步 HTML。
"""
import markdown, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "测试体系全貌与测试策略.md"
DST = ROOT / "docs" / "测试体系全貌与测试策略.html"

text = SRC.read_text(encoding="utf-8")

BADGES = {
    "产品承诺": "p", "仓库事实": "repo", "行业对标": "bench",
    "规范要求": "spec", "通用测试实践": "gen", "设计文档": "design",
    "开发方案": "plan", "源码函数": "src",
}
for name, cls in BADGES.items():
    n = re.escape(name)
    text = re.sub(
        rf"\*\*{n}\*\*|(?<![\w*]){n}(?![\w])",
        lambda m, c=cls: f'<span class="badge b-{c}">{name}</span>',
        text,
    )

body = markdown.markdown(text, extensions=["tables", "fenced_code", "toc", "sane_lists"])
toc_items = re.findall(r'<h2 id="([^"]+)">\s*(.*?)\s*</h2>', body)
toc_html = "".join(f'<a class="toc-item" href="#{hid}">{txt}</a>' for hid, txt in toc_items)

CSS = """
:root{--bg:#f2f5fa;--ink:#1b2430;--muted:#667085;--line:#e4e9f2;--blue:#2563eb;--ink2:#0f172a}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:#222c3a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei","PingFang SC",sans-serif;line-height:1.8;font-size:15px}
.wrap{max-width:1000px;margin:0 auto;padding:0 24px 96px}
.hero{background:linear-gradient(120deg,#0f2557 0%,#1e3a8a 45%,#2563eb 100%);color:#fff;padding:56px 24px 48px;position:relative;overflow:hidden}
.hero::after{content:"";position:absolute;right:-120px;top:-120px;width:380px;height:380px;background:radial-gradient(circle,rgba(255,255,255,.12),transparent 70%);border-radius:50%}
.hero::before{content:"";position:absolute;left:-80px;bottom:-160px;width:320px;height:320px;background:radial-gradient(circle,rgba(255,255,255,.08),transparent 70%);border-radius:50%}
.hero-inner{max-width:1000px;margin:0 auto;position:relative;z-index:1}
.hero .kicker{font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.7;margin:0 0 12px}
.hero h1{margin:0 0 14px;font-size:30px;font-weight:800;line-height:1.3}
.hero .sub{font-size:15px;opacity:.86;margin:0 0 26px;max-width:640px}
.metrics{display:flex;gap:12px;flex-wrap:wrap}
.metric{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:12px;padding:12px 20px;backdrop-filter:blur(4px)}
.metric .num{font-size:24px;font-weight:800;line-height:1.1}
.metric .lbl{font-size:12px;opacity:.78;margin-top:2px}
.toc{position:sticky;top:12px;z-index:5;margin:20px 0 8px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 16px;box-shadow:0 2px 10px rgba(30,64,175,.06);display:flex;flex-wrap:wrap;gap:6px}
.toc-title{font-size:12px;color:var(--muted);margin-right:8px;align-self:center;font-weight:600}
.toc-item{font-size:13px;color:#334155;text-decoration:none;padding:5px 11px;border-radius:999px;background:#f4f7fb;border:1px solid #e6ecf5;transition:.15s}
.toc-item:hover{background:var(--blue);color:#fff;border-color:var(--blue)}
h2{font-size:21px;font-weight:800;color:var(--ink2);margin:34px 0 6px;padding-left:14px;border-left:4px solid var(--blue);line-height:1.4}
h2[id]{scroll-margin-top:70px}
h3{font-size:16px;font-weight:700;color:#1e293b;margin:26px 0 10px}
h4{font-size:15px;font-weight:700;margin:18px 0 8px}
p{margin:10px 0}
a{color:var(--blue);text-decoration:none}
a:hover{text-decoration:underline}
hr{border:none;border-top:1px solid var(--line);margin:30px 0}
code{background:#eef2f8;padding:2px 7px;border-radius:5px;font-family:"SFMono-Regular",Consolas,Menlo,monospace;font-size:13px;color:#b91c47}
pre{background:#0f172a;color:#dbe4f3;padding:18px 20px;border-radius:12px;overflow-x:auto;margin:14px 0;line-height:1.5}
pre code{background:transparent;color:inherit;padding:0;font-size:13px}
blockquote{background:#eef4ff;border-left:4px solid var(--blue);border-radius:0 10px 10px 0;margin:16px 0;padding:12px 18px;color:#1e40af}
blockquote p{margin:4px 0}
table{border-collapse:separate;border-spacing:0;width:100%;margin:16px 0;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;font-size:14px;box-shadow:0 1px 2px rgba(16,24,40,.04)}
thead th{background:linear-gradient(180deg,#f0f4fb,#e8eef8);color:#1e293b;font-weight:700;border-bottom:2px solid #d7e0ee;white-space:nowrap;text-align:left}
th,td{padding:11px 14px;border-bottom:1px solid #eef1f7;vertical-align:top;text-align:left}
tbody tr:last-child th,tbody tr:last-child td{border-bottom:none}
tbody tr:nth-child(even){background:#f8fafd}
tbody tr:hover{background:#eef4ff}
td strong{color:#0f172a}
.badge{display:inline-block;font-size:12px;font-weight:600;line-height:1;padding:4px 9px;border-radius:999px;border:1px solid transparent;white-space:nowrap;margin:1px 2px}
.b-p{background:#fef2f2;color:#b91c1c;border-color:#fecaca}
.b-repo{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
.b-bench{background:#f5f3ff;color:#6d28d9;border-color:#ddd6fe}
.b-spec{background:#ecfdf5;color:#047857;border-color:#a7f3d0}
.b-gen{background:#f8fafc;color:#475569;border-color:#e2e8f0}
.b-design{background:#ecfeff;color:#0e7490;border-color:#a5f3fc}
.b-plan{background:#fdf2f8;color:#be185d;border-color:#fbcfe8}
.b-src{background:#fff7ed;color:#c2410c;border-color:#fed7aa}
ul,ol{padding-left:26px;margin:10px 0}
li{margin:6px 0}
li::marker{color:var(--blue)}
@media(max-width:640px){.hero h1{font-size:24px}.metrics{gap:8px}}
"""

html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>huaweicloud-devkit 插件测试体系全貌与测试策略</title>
<style>{CSS}</style>
</head>
<body>
<header class="hero">
  <div class="hero-inner">
    <p class="kicker">HuaweiCloud DevKit · Test System</p>
    <h1>huaweicloud-devkit 插件测试体系全貌与测试策略</h1>
    <p class="sub">面向 AI 编码 Agent 的「引导 + 安全包」的完整测试工程：体系架构、仓库全景、策略依据与全面性评估。</p>
    <div class="metrics">
      <div class="metric"><div class="num">316</div><div class="lbl">测试用例</div></div>
      <div class="metric"><div class="num">10</div><div class="lbl">测试维度</div></div>
      <div class="metric"><div class="num">10+</div><div class="lbl">客户端矩阵</div></div>
      <div class="metric"><div class="num">93</div><div class="lbl">规划评分</div></div>
      <div class="metric"><div class="num">39</div><div class="lbl">MCP 工具</div></div>
    </div>
  </div>
</header>
<div class="wrap">
  <nav class="toc"><span class="toc-title">目录</span>{toc_html}</nav>
  <main>
{body}
  </main>
</div>
</body>
</html>
"""

DST.write_text(html, encoding="utf-8")
print("OK", DST, DST.stat().st_size, "bytes")