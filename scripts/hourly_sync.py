# -*- coding: utf-8 -*-
"""每 10 分钟增量提报：把已完成的执行结果 commit + push 到远端，避免测试中途丢失。

用法:
    python hourly_sync.py <客户端> <OS>                 # 单次提报
    python hourly_sync.py <客户端> <OS> --interval 600   # 循环模式：每 600 秒(10 分钟)提报一次

凭证（三级 fallback）：环境变量 HDK_GH_TOKEN/GH_TOKEN → ~/.hdk_token 文件 → 本机 gh shuangheaven token。
推送用通用 git 命令，只提交自己「客户端/日期-IP/OS」目录（多机同客户端靠 IP 区分，避免冲突）。
"""
import os, sys, subprocess, datetime, time, socket

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsWork", "WorkBuddy",
           "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]
OSES = ["Windows", "Linux"]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    return r.returncode, (r.stdout or "").strip(), (r.stderr or "").strip()


def load_token():
    t = os.environ.get("HDK_GH_TOKEN") or os.environ.get("GH_TOKEN")
    if t:
        return t
    p = os.path.expanduser("~/.hdk_token")
    if os.path.isfile(p):
        t = open(p).read().strip()
        if t:
            return t
    rc, t, _ = run("gh auth token --user shuangheaven")
    return t if rc == 0 and t else ""


def get_machine_ip():
    ip = os.environ.get("HDK_MACHINE_IP")
    if ip:
        return ip.strip()
    p = os.path.expanduser("~/.hdk_ip")
    if os.path.isfile(p):
        ip = open(p).read().strip()
        if ip:
            return ip
    try:
        return socket.gethostbyname(socket.gethostname())
    except Exception:
        return "unknown"


def sync_once(client, os_name):
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    token = load_token()
    if not token:
        print(f"[{ts}] 无推送凭证（请设 HDK_GH_TOKEN 或写 ~/.hdk_token 或 gh 登录 shuangheaven）")
        return False
    os.environ["GH_TOKEN"] = token
    ip = get_machine_ip()
    date = datetime.datetime.now().strftime("%Y-%m-%d")

    def git(args):
        return run(f"git {args}")

    # git add：只提交自己「客户端/日期-IP/OS」的目录（不碰 Summary/其他客户端/其他机器）
    rc, out, err = git("add results/{}/{}-{}/{}".format(client, date, ip, os_name))
    if rc != 0:
        print(f"[{ts}] git add results/{client}/{date}-{ip}/{os_name} 失败: {err[:200]}")
        return False
    # git commit（无改动则跳过）
    rc, out, err = git('commit -m "test: {}-{} 增量提报 {}"'.format(client, ip, ts))
    if rc != 0:
        if "nothing to commit" in (out + err).lower() or "no changes" in (out + err).lower():
            print(f"[{ts}] 无改动，跳过")
            return True
        print(f"[{ts}] git commit 失败: {(out + err)[:200]}")
        return False
    # push（通用命令，不依赖 pushm alias）
    rc, out, err = run('git -c credential.helper="!gh auth git-credential" push origin main')
    if rc == 0:
        print(f"[{ts}] 已提报 commit -> {out.splitlines()[-1] if out else 'ok'}")
        return True
    print(f"[{ts}] push 失败: {(out + err)[:300]}")
    return False


def main():
    if len(sys.argv) < 3:
        print("用法: python hourly_sync.py <客户端> <OS> [--interval 秒]")
        sys.exit(2)
    client, os_name = sys.argv[1], sys.argv[2]
    if client not in CLIENTS:
        print(f"未知客户端 '{client}'，可选: {', '.join(CLIENTS)}")
        sys.exit(2)
    if os_name not in OSES:
        print(f"未知 OS '{os_name}'，可选: {', '.join(OSES)}")
        sys.exit(2)
    os.chdir(REPO)
    interval = None
    if "--interval" in sys.argv:
        i = sys.argv.index("--interval")
        interval = int(sys.argv[i + 1]) if i + 1 < len(sys.argv) else 600
    if interval:
        print(f"循环提报模式：每 {interval} 秒一次（Ctrl+C 退出）")
        try:
            while True:
                sync_once(client, os_name)
                time.sleep(interval)
        except KeyboardInterrupt:
            print("已停止")
    else:
        sync_once(client, os_name)


if __name__ == "__main__":
    main()