# -*- coding: utf-8 -*-
"""发送 huaweicloud-devkit 测试执行总览邮件（对齐看板 dashboard.html「每日执行」tab 完整内容）。

邮件正文 = 测试执行总览看板（dashboard.html）的「每日执行」tab 全部 section，并做邮件兼容转换：

看板使用了邮件客户端普遍不支持的呈现，统一换成最兼容形式：
    - flex 卡片（总体执行/缺陷存量的指标卡片）-> <table> + <td bgcolor> 一行多列；
    - SVG 折线图（通过率趋势/open issue 趋势）-> 用 Pillow 渲染成 PNG 折线图，以 Content-ID 内嵌图片方式呈现；
    - 空 <div> 进度条（width:XX% 无内容，邮件不渲染）-> <table>+<td bgcolor> 两格；
    - 9px 圆点（用例执行明细「客户端」列）-> 彩色 ● 字符（保留状态色+title）；
    - JS 过滤按钮 / <details> 折叠 -> 移除 / 展开为 <h3>；正文宽 720px。

「版本全量测试」属「版本执行」tab，不纳入每日邮件。

用法:
    python scripts/mail_daily_summary.py [日期] [主题] [--preview]
配置（仓库根 .env，已 .gitignore 排除）: SMTP_HOST/PORT/USER/PASS/MAIL_FROM/MAIL_TO
"""
import io
import os
import re
import sys
import subprocess
import smtplib
import datetime
import tempfile
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.utils import formataddr

from PIL import Image, ImageDraw, ImageFont

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_CARD_RE = re.compile(
    r'<div style="flex:1;[^\"]*?background:(#?[0-9a-fA-F]{3,8})[^\"]*?\">'
    r'\s*<div[^>]*>([^<]+)</div>\s*<div[^>]*>([^<]+)</div>\s*</div>'
)


def _load_env():
    env_file = os.path.join(REPO, ".env")
    if not os.path.isfile(env_file):
        return
    with open(env_file, encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val


def _git_show(refpath):
    p = subprocess.run(["git", "-C", REPO, "show", refpath], capture_output=True)
    return p.stdout if p.returncode == 0 else b""


def _parse_num(v):
    m = re.match(r"\s*(\d+)", str(v))
    return int(m.group(1)) if m else 0


def _render_trend_png(pairs, color, unit="", width=720, height=200):
    """[(label, value_str)] -> 折线图 PNG 字节。label 仅含 ASCII（日期/数字），无需中文字体。"""
    nums = [_parse_num(v) for _, v in pairs]
    labels = [l for l, _ in pairs]
    n = len(nums)
    minv, maxv = 0, max(nums) or 1
    pad_l, pad_r, pad_t, pad_b = 44, 12, 18, 34
    W = width + pad_l + pad_r
    H = height + pad_t + pad_b
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    try:
        f_small = ImageFont.truetype("arial.ttf", 12)
    except Exception:
        f_small = ImageFont.load_default(14)

    def x(i):
        return pad_l + (width * i / (n - 1) if n > 1 else 0)

    def y(v):
        return pad_t + height * (1 - (v - minv) / (maxv - minv or 1))

    for g in range(5):
        gy = pad_t + height * g / 4
        d.line([(pad_l, gy), (pad_l + width, gy)], fill="#ececec", width=1)
        val = maxv - (maxv - minv) * g / 4
        d.text((2, gy - 7), f"{round(val)}{unit}", fill="#7f8c8d", font=f_small)

    pts = [(x(i), y(v)) for i, v in enumerate(nums)]
    d.line(pts, fill=color, width=2)
    for px, py in pts:
        d.ellipse([px - 2, py - 2, px + 2, py + 2], fill=color)

    step = max(1, (n - 1) // 8)
    shown = set()
    for i in list(range(0, n, step)) + [n - 1]:
        if i in shown:
            continue
        shown.add(i)
        lab = labels[i]
        w = d.textlength(lab, font=f_small)
        d.text((x(i) - w / 2, pad_t + height + 6), lab, fill="#34495e", font=f_small)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _bar_table(w, total, color):
    """一块条形 = 彩色格 + 灰格（td bgcolor + height 属性，最邮件兼容）。"""
    w = max(2, min(total - 2, w))
    return (f'<table width="{total}" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>'
            f'<td width="{w}" height="10" bgcolor="{color}"><span style="font-size:1px;line-height:10px;">&nbsp;</span></td>'
            f'<td width="{total - w}" height="10" bgcolor="#e8e8e8"><span style="font-size:1px;line-height:10px;">&nbsp;</span></td>'
            f'</tr></table>')


def _common_adapt(seg):
    """去 SVG / JS 按钮，details/summary 展开为 h3。"""
    seg = re.sub(r"<svg\b.*?</svg>", "", seg, flags=re.S)
    seg = re.sub(r"<div\b[^>]*>\s*(?:<button\b.*?</button>\s*)+</div>", "", seg, flags=re.S)
    seg = re.sub(r"<button\b.*?</button>", "", seg, flags=re.S)
    seg = re.sub(r"<details\b[^>]*>", "", seg)
    seg = seg.replace("</details>", "")
    seg = re.sub(
        r"<summary\b[^>]*>(.*?)</summary>",
        lambda mm: ('<h3 style="padding:8px 12px;font-size:14px;background:#f7f7f7;'
                    'border:1px solid #ddd;border-radius:6px;margin:14px 0 4px;">'
                    + mm.group(1) + "</h3>"),
        seg, flags=re.S,
    )
    return seg


def _flex_cards_to_table(seg):
    """flex 指标卡片 -> <table>+<td bgcolor> 一行多列。"""
    matches = []
    for m in re.finditer(r'<div[^>]*display:flex[^>]*>', seg):
        start = m.start()
        i = m.end()
        depth = 1
        while i < len(seg) and depth > 0:
            no = seg.find("<div", i)
            nc = seg.find("</div>", i)
            if nc == -1:
                break
            if no != -1 and no < nc:
                depth += 1
                i = no + 4
            else:
                depth -= 1
                i = nc + 6
        if depth != 0:
            continue
        cards = _CARD_RE.findall(seg[start:i])
        if not cards:
            continue
        tds = []
        for color, num, label in cards:
            if not color.startswith("#"):
                color = "#" + color
            tds.append(
                f'<td bgcolor="{color}" style="color:#ffffff;padding:10px 4px;text-align:center;border-radius:6px;">'
                f'<div style="font-size:18px;font-weight:700;color:#ffffff;line-height:1.2;">{num}</div>'
                f'<div style="font-size:11px;color:#ffffff;opacity:.9;">{label}</div></td>'
            )
        table = ('<table width="100%" cellpadding="0" cellspacing="5" border="0"><tr>'
                 + "".join(tds) + "</tr></table>")
        matches.append((start, i, table))
    for start, end, table in reversed(matches):
        seg = seg[:start] + table + seg[end:]
    return seg


def _colorbar_div_to_table(seg):
    """空 div 进度条（外层灰底 + 内层彩色 width:XX%）-> table 两格条形。"""
    def repl(m):
        pct = float(m.group(1))
        color = m.group(2)
        if not color.startswith("#"):
            color = "#" + color
        return _bar_table(round(pct / 100 * 80), 80, color)

    seg = re.sub(
        r'<div[^>]*background:#eee[^>]*>\s*'
        r'<div[^>]*width:([\d.]+)%[^>]*background:(#?[0-9a-fA-F]{3,8})[^>]*>\s*</div>\s*</div>',
        repl, seg,
    )
    return seg


_IMG_TPL = ('<img src="cid:{cid}" alt="{alt}" '
            'style="width:100%;max-width:720px;height:auto;display:block;border:0;">')


def _passrate_trend(seg, cid):
    """「每日执行趋势」内「通过率趋势（%）」SVG 折线 -> 内嵌 PNG 折线图。

    返回 (seg, image) 或 (seg, None)。image=(cid, png_bytes)。
    日期从 details 表格 b 标签取（降序），SVG circle title 是升序，故日期 reverse 对齐。
    """
    dates = re.findall(r'<td[^>]*white-space:nowrap[^>]*><b>(\d{2}-\d{2})</b></td>', seg)
    svg_m = re.search(r'<svg\b.*?</svg>', seg, re.S)
    if not svg_m or not dates:
        return seg, None
    vals = re.findall(r'<circle[^>]*><title>([^<]+)</title></circle>', svg_m.group(0))
    if len(vals) != len(dates):
        return seg, None
    dates = list(reversed(dates))
    pairs = [(d, v) for d, v in zip(dates, vals)]
    png = _render_trend_png(pairs, "#3498db", unit="%")
    seg = seg.replace(svg_m.group(0), _IMG_TPL.format(cid=cid, alt="通过率趋势"))
    return seg, (cid, png)


def _keep_latest_month(seg):
    """只保留「每日执行趋势」最新月份的 <details> 表格块，删除更早月份。"""
    blocks = [m for m in re.finditer(r'<details\b.*?</details>', seg, re.S)]
    if len(blocks) <= 1:
        return seg
    keep_idx = 0
    for i, m in enumerate(blocks):
        if re.search(r'<details\b[^>]*\bopen\b', m.group(0)):
            keep_idx = i
            break
    for m in reversed([b for i, b in enumerate(blocks) if i != keep_idx]):
        seg = seg[:m.start()] + seg[m.end():]
    return seg


def _open_issue_trend(seg, cid):
    """「每日 open issue 趋势」SVG 折线 -> 内嵌 PNG 折线图（保留 <p> 文本数据点兜底）。"""
    m = re.search(r'<p[^>]*>((?:\d{2}-\d{2}:\s*\d+[\s·]*)+)</p>', seg)
    if not m:
        return seg, None
    pts = re.findall(r'(\d{2}-\d{2}):\s*(\d+)', m.group(1))
    if not pts:
        return seg, None
    png = _render_trend_png(pts, "#27ae60", unit="")
    svg_m = re.search(r'<svg\b.*?</svg>', seg, re.S)
    if svg_m:
        seg = seg.replace(svg_m.group(0), _IMG_TPL.format(cid=cid, alt="open issue 趋势"))
    return seg, (cid, png)


def _dots_to_chars(seg):
    """9px 圆点 span -> 彩色 ● 字符。"""
    return re.sub(
        r'<span\s+title="([^\"]+)"\s+style="display:inline-block;width:9px;height:9px;'
        r'border-radius:50%;background:(#[0-9a-fA-F]{6});margin:0 1px;"></span>',
        lambda mm: f'<span title="{mm.group(1)}" style="color:{mm.group(2)};font-size:12px;">●</span>',
        seg,
    )


def _split_sections(daily):
    h2_pos = [m.start() for m in re.finditer(r"<h2\b", daily)]
    out = []
    for i, p in enumerate(h2_pos):
        end = h2_pos[i + 1] if i + 1 < len(h2_pos) else len(daily)
        seg = daily[p:end]
        title = re.sub(r"<[^>]+>", "", daily[p:daily.find("</h2>", p)]).strip()
        out.append((title, seg))
    return out


def _build_mail_html(date):
    html = _git_show("origin/main:dashboard.html").decode("utf-8", "replace")
    if not html:
        return None, "dashboard.html 拉取失败", []

    parts = []
    images = []
    meta = re.search(r"<h1\b.*?</h1>\s*<p\b[^>]*>.*?</p>", html, re.S)
    if meta:
        parts.append(meta.group(0))

    first_h2 = html.find("<h2")
    ver = re.search(r"<h2[^>]*>\s*版本全量测试", html)
    end = ver.start() if ver else len(html)
    if first_h2 == -1:
        return None, "看板无 h2 section", []

    daily = html[first_h2:end]
    n_sections = 0
    for title, seg in _split_sections(daily):
        if "每日执行趋势" in title:
            seg, img = _passrate_trend(seg, "trend_pass")
            seg = _keep_latest_month(seg)
        elif "open issue 趋势" in title:
            seg, img = _open_issue_trend(seg, "trend_issue")
        else:
            img = None
        if img:
            images.append(img)
        seg = _common_adapt(seg)
        seg = _flex_cards_to_table(seg)
        seg = _colorbar_div_to_table(seg)
        if "用例执行明细" in title:
            seg = _dots_to_chars(seg)
        parts.append(seg)
        n_sections += 1

    content = "\n".join(parts)
    mail_html = (
        "<!DOCTYPE html>\n<html lang=\"zh\"><head><meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head>\n"
        "<body style=\"font-family:'Segoe UI',Arial,'Microsoft YaHei',sans-serif;"
        "color:#2c3e50;max-width:720px;margin:20px auto;padding:0 12px;\">\n"
        f"{content}\n"
        "<p style=\"color:#95a5a6;font-size:11px;margin-top:24px;\">"
        "本邮件内容取自测试执行总览看板（dashboard.html）「每日执行」页当天快照，完整看板见 GitHub Pages。</p>\n"
        "</body></html>"
    )
    return mail_html, n_sections, images


def _send(html, subject, images):
    host = os.environ.get("SMTP_HOST", "").strip()
    port = int(os.environ.get("SMTP_PORT", "465").strip() or 465)
    user = os.environ.get("SMTP_USER", "").strip()
    password = os.environ.get("SMTP_PASS", "").strip()
    sender = os.environ.get("MAIL_FROM", "").strip() or user
    to = os.environ.get("MAIL_TO", "").strip()
    missing = [k for k, v in
               [("SMTP_HOST", host), ("SMTP_USER", user),
                ("SMTP_PASS", password), ("MAIL_TO", to)] if not v]
    if missing:
        print(f"[错误] .env 缺少配置: {', '.join(missing)}")
        sys.exit(3)

    recipients = [x.strip() for x in to.split(",") if x.strip()]
    msg = MIMEMultipart("related")
    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(html, "html", "utf-8"))
    msg.attach(alt)
    for cid, png in images:
        img_part = MIMEImage(png, _subtype="png")
        img_part.add_header("Content-ID", f"<{cid}>")
        img_part.add_header("Content-Disposition", "inline", filename=f"{cid}.png")
        msg.attach(img_part)

    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = formataddr((Header("DevKit 测试", "utf-8").encode(), sender))
    msg["To"] = ", ".join(recipients)

    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=30)
        else:
            server = smtplib.SMTP(host, port, timeout=30)
            if port == 587:
                server.starttls()
        server.login(user, password)
        server.sendmail(sender, recipients, msg.as_string())
        server.quit()
        print(f"[成功] 邮件已发送到 {len(recipients)} 个收件人: {', '.join(recipients)}")
    except Exception as e:
        print(f"[失败] 邮件发送异常: {e}")
        sys.exit(1)


def main():
    _load_env()
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    date = args[0] if args else datetime.datetime.now().strftime("%Y-%m-%d")
    subject = args[1] if len(args) > 1 else f"huaweicloud-devkit 测试执行总览 {date}"

    mail_html, n_sections, images = _build_mail_html(date)
    if mail_html is None:
        print(f"[错误] {n_sections}")
        sys.exit(2)
    print(f"[看板] 提取「每日执行」tab {n_sections} 个 section，内嵌图片 {len(images)} 张")

    if "--preview" in flags:
        outdir = os.path.join(tempfile.gettempdir(), "hdk_mail")
        os.makedirs(outdir, exist_ok=True)
        for cid, png in images:
            with open(os.path.join(outdir, f"{cid}.png"), "wb") as f:
                f.write(png)
        preview_html = mail_html
        for cid, _ in images:
            preview_html = preview_html.replace(f'cid:{cid}', f'{cid}.png')
        out = os.path.join(outdir, f"看板邮件-{date}.html")
        with open(out, "w", encoding="utf-8") as f:
            f.write(preview_html)
        print(f"[预览] 已生成（未发送）: {out}  （{len(preview_html)} 字符）")
        return

    _send(mail_html, subject, images)


if __name__ == "__main__":
    main()