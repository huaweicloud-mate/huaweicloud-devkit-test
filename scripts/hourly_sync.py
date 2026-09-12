# -*- coding: utf-8 -*-
"""每小时增量提报：把已完成的执行结果 commit + push 到远端，避免测试中途丢失。

用法:
    python hourly_sync.py <客户端> <OS>                 # 单次提报
    python hourly_sync.py <客户端> <OS> --interval 3600  # 循环模式：每 3600 秒提报一次

用途：agent 长时执行测试时，每小时把已回填结果推到远端（防中断/崩溃丢失）。
"""
import os, sys, subprocess, datetime, time

REPO = os.environ.get("HDK_TEST_REPO") or r"C:\Users\Administrator\devkit-test\huaweicloud-devkit-test"

CLIENTS = ["OpenCode", "Codex", "CodeArtsAgent", "CodeArtsWork", "WorkBuddy",
           "DSH", "OfficeAce", "Hermes", "OpenClaw", "AtomCode"]
OSES = ["Windows", "Linux"]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    return r.returncode, (r.stdout or "").strip(), (r.stderr or "").strip()


def sync_once(client, os_name):
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    # 用 shuangheaven token push（huaweicloud-mate 仓库由该账号管理）
    token = run("gh auth token --user shuangheaven")[1].strip()
    os.environ["GH_TOKEN"] = token  # 让后续 git pushm 通过 gh auth git-credential 读取
    def git(args):
        return run(f"git {args}")

    # git add
    rc, out, err = git("add -A")
    if rc != 0:
        print(f"[{ts}] git add 失败: {err[:200]}")
        return False
    # git commit（无改动则跳过）
    rc, out, err = git(f'commit -m "test: {client}-{os_name} 增量提报 {ts}"')
    if rc != 0:
        # nothing to commit 或其它
        if "nothing to commit" in (out + err).lower() or "no changes" in (out + err).lower():
            print(f"[{ts}] 无改动，跳过")
            return True
        print(f"[{ts}] git commit 失败: {(out+err)[:200]}")
        return False
    # push（用 pushm 别名走 gh auth git-credential + GH_TOKEN）
    rc, out, err = run("git pushm origin main")
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
        interval = int(sys.argv[i + 1]) if i + 1 < len(sys.argv) else 3600
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