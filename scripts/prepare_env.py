# -*- coding: utf-8 -*-
"""环境准备：自检工具链 + 测试仓库 + 源码仓库(hdk) + 安装 next 包 + 凭证。

用法:
    python prepare_env.py               # 仅检查 + 报告
    python prepare_env.py --setup       # clone 缺失仓库 + npm 安装最新 next 包
    python prepare_env.py --update      # pull 测试仓库/源码 + npm 更新最新 next 包

被测对象两件套：
  - 源码仓库 hdk（clone 自 huaweicloud/huaweicloud-devkit）→ 源码检查/根因定位/写探针
  - npm 全局包 huaweicloud-devkit@next → 真实场景黑盒测试
"""
import os, sys, subprocess, json, re

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.dirname(REPO)
SRC = os.path.join(WORK, "hdk")
TEST_REPO_URL = "https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git"
SRC_URL = "https://github.com/huaweicloud/huaweicloud-devkit.git"
PKG = "huaweicloud-devkit@next"


def run(cmd, cwd=None):
    r = subprocess.run(cmd, capture_output=True, text=True, shell=True, cwd=cwd)
    return r.returncode, (r.stdout or "").strip(), (r.stderr or "").strip()


def set_gh_token():
    rc, tok, _ = run("gh auth token --user shuangheaven")
    if rc == 0 and tok.strip():
        os.environ["GH_TOKEN"] = tok.strip()
        return True
    return False


def check_tools():
    print("=== 工具链 ===")
    ok = True
    rc, out, _ = run("node --version")
    if rc == 0 and int(out.lstrip("v").split(".")[0]) >= 22:
        print(f"  [OK] node {out}")
    else:
        print(f"  [缺] Node >=22（当前 {out or '未装'}）")
        ok = False
    rc, out, _ = run("python --version")
    print(f"  [OK] {out}" if rc == 0 else "  [缺] Python 未装")
    ok = ok and rc == 0
    rc, out, _ = run("gh auth status")
    print("  [OK] gh 已登录" if rc == 0 else "  [缺] gh 未登录，请 `gh auth login`")
    ok = ok and rc == 0
    return ok


def check_repo(path, url, name, setup):
    if os.path.isdir(os.path.join(path, ".git")):
        print(f"  [OK] {name} 已就绪: {path}")
        return True
    if setup:
        print(f"  [准备] clone {name}: {url} -> {path}")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        set_gh_token()
        rc, out, _ = run(f"git clone {url} {path}")
        if rc == 0:
            print("  [OK] clone 成功")
            return True
        print(f"  [失败] {out[:200]}")
        return False
    print(f"  [缺] {name} 未 clone → `git clone {url} {path}`（或 --setup）")
    return False


def check_next_pkg():
    print("=== 被测包（next 版） ===")
    rc, out, _ = run("npm ls -g huaweicloud-devkit --depth=0")
    if rc == 0 and "huaweicloud-devkit" in out:
        line = [l for l in (out or "").splitlines() if "huaweicloud-devkit" in l]
        print(f"  [OK] 已安装: {(line[-1] if line else out).strip()[:90]}")
        return True
    print("  [缺] 未安装 huaweicloud-devkit 全局包 → 用 --setup 安装 @next")
    return False


def install_next():
    print("=== 安装最新 next 包 ===")
    rc, out, err = run(f"npm install -g {PKG}")
    if rc == 0:
        print(f"  [OK] 已安装/更新 {PKG}")
        return True
    print(f"  [失败] npm install -g {PKG}: {(out or err)[:300]}")
    return False


def update_src_to_next():
    """源码 hdk 拉取并 checkout 到 npm @next 对应 commit（与安装的包保持一致，用于源码检查）。"""
    if not os.path.isdir(os.path.join(SRC, ".git")):
        return
    print("=== 源码 checkout 到 next 对应 commit ===")
    run("git fetch origin --tags", cwd=SRC)
    rc, out, _ = run("npm view huaweicloud-devkit@next version gitHead")
    m_head = re.search(r"gitHead\s*=\s*'?([0-9a-fA-F]+)'?", out or "")
    if m_head:
        head = m_head.group(1)
        rc2, o2, e2 = run(f"git checkout {head}", cwd=SRC)
        print(f"  [{'OK' if rc2 == 0 else '失败'}] checkout {head[:8]}: {(o2 or e2)[:80]}")
    else:
        rc2, o2, e2 = run("git checkout dev", cwd=SRC)
        print(f"  [{'OK' if rc2 == 0 else '失败'}] checkout dev（@next 查询失败回退）")


def pull_test_repo():
    if not os.path.isdir(os.path.join(REPO, ".git")):
        return True
    set_gh_token()
    rc, out, err = run("git pullm --no-rebase origin main", cwd=REPO)
    print(f"  [{'OK' if rc == 0 else '失败'}] 测试仓库 pull main: {(out or err)[:120]}")
    return rc == 0


def check_credentials():
    print("=== 凭证 ===")
    for p in [os.path.expanduser("~/.config/huaweicloud/credentials.json"),
              os.path.expanduser("~/credentials.json")]:
        if os.path.isfile(p):
            try:
                d = json.load(open(p, encoding="utf-8"))
                if d.get("ak") and d.get("sk"):
                    print(f"  [OK] 真云凭证已配置: {p}")
                    return True
            except Exception:
                pass
    print("  [缺] 真云凭证未配置 → `huaweicloud-devkit auth init`")
    return False


def main():
    setup = "--setup" in sys.argv
    update = "--update" in sys.argv
    tools_ok = check_tools()
    print("=== 仓库 ===")
    repo_ok = check_repo(REPO, TEST_REPO_URL, "测试仓库", setup)
    src_ok = check_repo(SRC, SRC_URL, "源码仓库(hdk)", setup)
    pkg_ok = check_next_pkg()
    cred_ok = check_credentials()
    if setup and not pkg_ok:
        pkg_ok = install_next()
    if update:
        pull_test_repo()
        update_src_to_next()
        install_next()
    print("=== 汇总 ===")
    if tools_ok and repo_ok and src_ok and pkg_ok and cred_ok:
        print("环境就绪，可开始每日测试执行。")
        sys.exit(0)
    print("环境不完整：--setup 自动 clone/安装，--update 拉取+更新 next。")
    sys.exit(1)


if __name__ == "__main__":
    main()