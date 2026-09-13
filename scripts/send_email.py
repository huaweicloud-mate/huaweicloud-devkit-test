# -*- coding: utf-8 -*-
"""SMTP 发送每日测试汇总 HTML 报告（邮件正文内嵌 HTML，不落盘附件）。

环境变量（敏感信息用 .env / 系统环境配置，勿硬编码入库）:
    SMTP_HOST      SMTP 服务器（如 smtp.exmail.qq.com / smtp.qq.com / smtp.163.com）
    SMTP_PORT      SMTP 端口（465=SSL，587=STARTTLS，25=明文）
    SMTP_USER      SMTP 登录账号（通常=发件邮箱）
    SMTP_PASS      SMTP 密码/授权码
    MAIL_FROM      发件人（缺省=SMTP_USER）
    MAIL_TO        收件人（多个用逗号分隔）

用法:
    python send_email.py <HTML文件路径> [邮件主题]
    例: python send_email.py results/Summary/每日测试汇总-2026-09-13.html "huaweicloud-devkit 每日测试汇总 2026-09-13"
"""
import os, sys, smtplib, datetime
from email.mime.text import MIMEText
from email.header import Header
from email.utils import formataddr


def _cfg(key, default=""):
    return os.environ.get(key, default).strip()


def main():
    if len(sys.argv) < 2:
        print("用法: python send_email.py <HTML文件路径> [主题]")
        sys.exit(2)
    html_path = sys.argv[1]
    if not os.path.isfile(html_path):
        print(f"[错误] HTML 文件不存在: {html_path}")
        sys.exit(2)

    host = _cfg("SMTP_HOST"); port = int(_cfg("SMTP_PORT", "465") or 465)
    user = _cfg("SMTP_USER"); password = _cfg("SMTP_PASS")
    sender = _cfg("MAIL_FROM", user)
    to = _cfg("MAIL_TO")
    if not (host and user and password and to):
        print("[错误] 缺少 SMTP 配置：请设 SMTP_HOST/SMTP_USER/SMTP_PASS/MAIL_TO 环境变量")
        print("       建议写入 .env 或系统环境变量，勿硬编码入库（敏感信息）")
        sys.exit(3)

    recipients = [x.strip() for x in to.split(",") if x.strip()]
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    subject = sys.argv[2] if len(sys.argv) > 2 else f"huaweicloud-devkit 每日测试汇总 {date}"

    html = open(html_path, encoding="utf-8").read()
    msg = MIMEText(html, "html", "utf-8")
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


if __name__ == "__main__":
    main()