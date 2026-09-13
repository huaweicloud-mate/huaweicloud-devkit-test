# -*- coding: utf-8 -*-
"""每日汇总报告流水线：收集各 agent 结果 → 生成 HTML 汇总 → 邮件发送。

用法:
    python run_daily_report.py [日期] [被测版本]
    例: python run_daily_report.py 2026-09-13 v1.1.4-next.2

步骤:
    1. build_summary.py [日期]       # 收集各 agent 执行状态 → Summary CSV
    2. report_html.py [日期] [版本]   # Summary → HTML 报告
    3. send_email.py <html> [主题]    # 邮件发送（需 SMTP 环境变量，未配则跳过）

定时（Windows 计划任务，每天 20:10 北京时间跑一次，参考已有 devkit-test-auto-sync）:
    schtasks /Create /TN devkit-daily-report /TR "C:\\Python311\\python.exe C:\\Users\\Administrator\\devkit-test\\huaweicloud-devkit-test\\scripts\\run_daily_report.py" /SC DAILY /ST 20:10
    # 查询: schtasks /Query /TN devkit-daily-report
    # 手动触发: schtasks /Run /TN devkit-daily-report
    # 删除: schtasks /Delete /TN devkit-daily-report /F
"""
import os, sys, subprocess, datetime

SCRIPTS = os.path.dirname(os.path.abspath(__file__))
REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(SCRIPTS)


def run(cmd):
    print(">>>", " ".join(cmd))
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.stdout:
        print(r.stdout.rstrip())
    if r.returncode != 0 and r.stderr:
        print(r.stderr.rstrip())
    return r.returncode


def main():
    date = sys.argv[1] if len(sys.argv) > 1 else datetime.datetime.now().strftime("%Y-%m-%d")
    version = sys.argv[2] if len(sys.argv) > 2 else ""
    py = sys.executable

    # 1. 收集各 agent 结果 → Summary
    rc = run([py, os.path.join(SCRIPTS, "build_summary.py"), date])
    if rc != 0:
        print("[中止] build_summary 失败")
        sys.exit(1)

    # 2. 生成 HTML 报告
    html = os.path.join(REPO, "results", "Summary", f"每日测试汇总-{date}.html")
    args = [py, os.path.join(SCRIPTS, "report_html.py"), date] + ([version] if version else [])
    rc = run(args)
    if rc != 0 or not os.path.isfile(html):
        print("[中止] report_html 失败")
        sys.exit(1)

    # 3. 邮件发送（SMTP 环境变量齐备才发）
    if os.environ.get("SMTP_HOST") and os.environ.get("MAIL_TO"):
        rc = run([py, os.path.join(SCRIPTS, "send_email.py"), html, f"huaweicloud-devkit 每日测试汇总 {date}"])
        if rc != 0:
            print("[警告] 邮件发送失败，HTML 已生成（手动发或检查 SMTP 配置）")
    else:
        print("[提示] 未配置 SMTP 环境变量（SMTP_HOST/SMTP_USER/SMTP_PASS/MAIL_TO），跳过邮件发送；HTML 已生成可手动发")

    print(f"\n[完成] 每日汇总: {html}")


if __name__ == "__main__":
    main()