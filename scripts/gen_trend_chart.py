# -*- coding: utf-8 -*-
"""趋势可视化：metrics/trend.csv -> metrics/trend.svg（纯标准库，无第三方依赖）。

设计约束（与仓库口径一致）：
- 唯一数据源 = metrics/trend.csv（由 scripts/trend_metrics.py 从每日汇总生成），脚本内不硬编码任何数值。
- 确定性输出：不含生成时间戳/随机量，同一 trend.csv 必得同一 SVG（CI 自动提交不产生噪声）。
- 无依赖：只用 os/csv/svg 手写，GitHub Actions ubuntu-latest 无需安装 matplotlib。

复跑：python scripts/gen_trend_chart.py  （或 npm run test:trend-chart）
口径：exec_rate / pass_rate 定义见 metrics/README.md「指标口径」。
"""
import csv
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(REPO, "metrics", "trend.csv")
OUT_PATH = os.path.join(REPO, "metrics", "trend.svg")

W, H = 1200, 470
ML, MR, MT, MB = 78, 190, 64, 76  # 左/右/上/下边距（右侧留给图例）
PW, PH = W - ML - MR, H - MT - MB

C_EXEC = "#2563eb"
C_PASS = "#059669"
C_GRID = "#e4e9f2"
C_INK = "#1b2430"
C_MUTED = "#667085"


def load():
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        rows = [r for r in csv.DictReader(f) if r.get("date")]
    dates = [r["date"] for r in rows]
    execs = [float(r["exec_rate"]) for r in rows]
    passes = [float(r["pass_rate"]) for r in rows]
    return dates, execs, passes


def xy(i, v, n):
    x = ML + (PW * i / max(1, n - 1))
    y = MT + PH * (1 - v / 100.0)
    return round(x, 2), round(y, 2)


def polylines(vals, color):
    pts = " ".join("%s,%s" % xy(i, v, len(vals)) for i, v in enumerate(vals))
    return ('<polyline fill="none" stroke="%s" stroke-width="2.2" '
            'stroke-linejoin="round" points="%s"/>' % (color, pts))


def dots(vals, dates, color, label):
    out = []
    for i, v in enumerate(vals):
        x, y = xy(i, v, len(vals))
        out.append('<circle cx="%s" cy="%s" r="3.1" fill="#fff" stroke="%s" stroke-width="1.8">'
                   '<title>%s %s = %s%%</title></circle>' % (x, y, color, dates[i], label, v))
    return "".join(out)


def main():
    dates, execs, passes = load()
    n = len(dates)
    assert n >= 2, "trend.csv 数据点不足，无法绘图"

    parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d" '
             'font-family="-apple-system,Segoe UI,Microsoft YaHei,sans-serif">' % (W, H, W, H),
             '<rect width="%d" height="%d" fill="#ffffff"/>' % (W, H),
             '<text x="%d" y="30" font-size="19" font-weight="700" fill="%s">'
             '测试质量趋势（每日汇总口径）</text>' % (ML, C_INK),
             '<text x="%d" y="50" font-size="12.5" fill="%s">'
             '数据源：metrics/trend.csv（由 scripts/trend_metrics.py 自 results/Summary/ 每日汇总生成）　'
             '数据区间：%s ~ %s（%d 天）</text>' % (ML, C_MUTED, dates[0], dates[-1], n)]

    # y 轴网格与刻度（0~100%）
    for pct in range(0, 101, 20):
        _, y = xy(0, pct, n)
        parts.append('<line x1="%d" y1="%s" x2="%d" y2="%s" stroke="%s" stroke-width="1"/>'
                     % (ML, y, ML + PW, y, C_GRID))
        parts.append('<text x="%d" y="%s" font-size="12" fill="%s" text-anchor="end">%d%%</text>'
                     % (ML - 10, float(y) + 4, C_MUTED, pct))

    # x 轴日期刻度（最多 10 个，均匀抽稀）
    step = max(1, n // 10)
    for i in range(0, n, step):
        x, _ = xy(i, 0, n)
        parts.append('<text x="%s" y="%d" font-size="11" fill="%s" text-anchor="end" '
                     'transform="rotate(-38 %s %d)">%s</text>'
                     % (x, MT + PH + 18, C_MUTED, x, MT + PH + 18, dates[i][5:]))

    parts.append('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="1.4"/>'
                 % (ML, MT + PH, ML + PW, MT + PH, "#c8d2e2"))
    parts.append(polylines(execs, C_EXEC))
    parts.append(polylines(passes, C_PASS))
    parts.append(dots(execs, dates, C_EXEC, "执行率"))
    parts.append(dots(passes, dates, C_PASS, "通过率"))

    # 图例（右侧空白区，避免压线）
    lx, ly = ML + PW + 26, MT + 6
    for i, (color, label, series) in enumerate(((C_EXEC, "执行率", execs), (C_PASS, "通过率", passes))):
        y = ly + i * 46
        parts.append('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="2.4"/>'
                     % (lx, y, lx + 26, y, color))
        parts.append('<circle cx="%d" cy="%d" r="3.1" fill="#fff" stroke="%s" stroke-width="1.8"/>'
                     % (lx + 13, y, color))
        parts.append('<text x="%d" y="%d" font-size="13" font-weight="600" fill="%s">%s</text>'
                     % (lx, y - 10, C_INK, label))
        parts.append('<text x="%d" y="%d" font-size="12" fill="%s">最新 %s%%　中位 %s%%</text>'
                     % (lx, y + 12, C_MUTED, series[-1], sorted(series)[len(series) // 2]))

    parts.append('<text x="%d" y="%d" font-size="11.5" fill="%s">'
                 '口径：执行率 = done/(cells-NOT_RUN)；通过率 = PASS/done（BLOCKED 与 NOT_RUN 不计入分母）。详见 metrics/README.md</text>'
                 % (ML, H - 22, C_MUTED))
    parts.append("</svg>")

    svg = "\n".join(parts) + "\n"
    with open(OUT_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write(svg)

    print("已生成 %s（%d 数据点）" % (os.path.relpath(OUT_PATH, REPO), n))
    print("  最新：%s 执行率 %s%% / 通过率 %s%%" % (dates[-1], execs[-1], passes[-1]))
    print("  区间：执行率 %s~%s%% ｜ 通过率 %s~%s%%"
          % (min(execs), max(execs), min(passes), max(passes)))


if __name__ == "__main__":
    main()