# -*- coding: utf-8 -*-
"""环境准备：自检工具链 + 测试仓库 + 源码仓库(hdk) + 安装最新包 + 凭证。

用法:
    python prepare_env.py               # 仅检查 + 报告
    python prepare_env.py --setup       # clone 缺失仓库 + npm 安装最新包
    python prepare_env.py --update      # pull 测试仓库/源码 + npm 更新最新包
    python prepare_env.py --update --next   # 同上，但用 @next 预发布包（NR 新需求测试）

被测对象（默认 = 最新正式包 latest；--next = 预发布 dev 包）：
  - 源码仓库 hdk（clone 自 huaweicloud/huaweicloud-devkit）→ checkout 到被测包对应 commit 做源码检查/根因定位
  - npm 全局包 huaweicloud-devkit → “最新包”=latest 正式发布（--next 则 @next 预发布），做真实场景黑盒测试

镜像 fallback：GitHub clone/pull 失败时，自动 fallback 到 GitCode 镜像（国内拉取更快）。
"""
import os, sys, subprocess, json, re

REPO = os.environ.get("HDK_TEST_REPO") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.dirname(REPO)
SRC = os.path.join(WORK, "hdk")
TEST_REPO_URL = "https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git"
SRC_URL = "https://github.com/huaweicloud/huaweicloud-devkit.git"
PKG = "huaweicloud-devkit"               # 默认 latest（最新正式发布包）
PKG_NEXT = "huaweicloud-devkit@next"     # 可选：--next 切预发布（NR 新需求测试）
# GitHub clone/pull 失败时 fallback 到 GitCode 镜像（国内拉取）
GITCODE_MIRROR = {
    TEST_REPO_URL: "https://gitcode.com/hd-vector/huaweicloud-devkit-test.git",
}


def is_next():
    return "--next" in sys.argv


def run(cmd, cwd=None):
    r = subprocess.run(cmd, capture_output=True, text=True, shell=True, cwd=cwd)
    return r.returncode, (r.stdout or "").strip(), (r.stderr or "").strip()


def gitcode_token():
    t = os.environ.get("GITCODE_TOKEN")
    if t:
        return t.strip()
    p = os.path.expanduser("~/.gitcode_token")
    if os.path.isfile(p):
        t = open(p).read().strip()
        if t:
            return t
    return ""


def auth_url(url):
    """把 GitHub URL 转成带 token 的认证 URL（不依赖 gh CLI）。"""
    t = os.environ.get("GH_TOKEN") or os.environ.get("HDK_GH_TOKEN")
    if t and url.startswith("https://github.com/"):
        return url.replace("https://github.com/", f"https://x-access-token:{t}@github.com/")
    return url


def set_gh_token():
    tok = os.environ.get("HDK_GH_TOKEN") or os.environ.get("GH_TOKEN")
    if tok and tok.strip():
        os.environ["GH_TOKEN"] = tok.strip()
        return True
    p = os.path.expanduser("~/.hdk_token")
    if os.path.isfile(p):
        tok = open(p).read().strip()
        if tok:
            os.environ["GH_TOKEN"] = tok
            return True
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
        rc, out, _ = run(f"git clone {auth_url(url)} {path}")
        if rc == 0:
            print("  [OK] clone 成功 (GitHub)")
            return True
        # fallback 到 GitCode 镜像
        mirror = GITCODE_MIRROR.get(url)
        gc = gitcode_token()
        if mirror and gc:
            auth_mirror = mirror.replace("https://", f"https://oauth2:{gc}@")
            rc2, out2, _ = run(f"git clone {auth_mirror} {path}")
            if rc2 == 0:
                run(f"git remote set-url origin {url}", cwd=path)  # 后续仍走 GitHub
                print("  [OK] clone 成功 (GitCode 镜像 fallback)")
                return True
            print(f"  [失败] GitHub+镜像都失败: {(out2 or out)[:200]}")
            return False
        print(f"  [失败] GitHub 失败且无镜像/token: {out[:200]}")
        return False
    print(f"  [缺] {name} 未 clone → `git clone {url} {path}`（或 --setup）")
    return False


def check_pkg():
    print("=== 被测包 ===")
    rc, out, _ = run("npm ls -g huaweicloud-devkit --depth=0")
    if rc == 0 and "huaweicloud-devkit" in out:
        line = [l for l in (out or "").splitlines() if "huaweicloud-devkit" in l]
        print(f"  [OK] 已安装: {(line[-1] if line else out).strip()[:90]}")
        return True
    print("  [缺] 未安装 huaweicloud-devkit 全局包 → 用 --setup 安装")
    return False


def install_pkg():
    """安装/更新被测包：默认最新正式包（latest），--next 则预发布。"""
    pkg = PKG_NEXT if is_next() else PKG
    label = "next 预发布" if is_next() else "latest 正式版"
    print(f"=== 安装最新包（{label}） ===")
    rc, out, err = run(f"npm install -g {pkg}")
    if rc == 0:
        print(f"  [OK] 已安装/更新 {pkg}")
        return True
    print(f"  [失败] npm install -g {pkg}: {(out or err)[:300]}")
    return False


def update_src_to_pkg():
    """源码 hdk fetch 并 checkout 到被测包（默认 latest，--next 则预发布）对应 commit，保证源码检查与黑盒测的是同一版。"""
    if not os.path.isdir(os.path.join(SRC, ".git")):
        return
    is_n = is_next()
    tag = "@next" if is_n else ""
    fallback_branch = "dev" if is_n else "main"
    print(f"=== 源码 checkout 到 {'next 预发布' if is_n else 'latest 正式版'} 对应 commit ===")
    run("git fetch origin --tags", cwd=SRC)
    rc, out, _ = run(f"npm view huaweicloud-devkit{tag} version gitHead")
    m_head = re.search(r"gitHead\s*=\s*'?([0-9a-fA-F]+)'?", out or "")
    if m_head:
        head = m_head.group(1)
        rc2, o2, e2 = run(f"git checkout {head}", cwd=SRC)
        print(f"  [{'OK' if rc2 == 0 else '失败'}] checkout {head[:8]}: {(o2 or e2)[:80]}")
    else:
        rc2, o2, e2 = run(f"git checkout {fallback_branch}", cwd=SRC)
        print(f"  [{'OK' if rc2 == 0 else '失败'}] checkout {fallback_branch}（gitHead 查询失败回退）")


def pull_test_repo():
    if not os.path.isdir(os.path.join(REPO, ".git")):
        return True
    set_gh_token()
    rc, out, err = run(f"git -c credential.helper= pull --no-rebase {auth_url(TEST_REPO_URL)} main", cwd=REPO)
    if rc == 0:
        print("  [OK] 测试仓库 pull main (GitHub)")
        return True
    # fallback 到 GitCode 镜像
    mirror = GITCODE_MIRROR.get(TEST_REPO_URL)
    gc = gitcode_token()
    if mirror and gc:
        auth_mirror = mirror.replace("https://", f"https://oauth2:{gc}@")
        rc2, out2, err2 = run(f"git pull --no-rebase {auth_mirror} main", cwd=REPO)
        if rc2 == 0:
            print("  [OK] 测试仓库 pull main (GitCode 镜像 fallback)")
            return True
    print(f"  [失败] 测试仓库 pull main: {(out or err)[:120]}")
    return False


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


def ensure_node_path():
    # 非交互 SSH 不加载 ~/.profile，手动把用户目录工具（node/gh）加入 PATH
    nb = os.path.expanduser("~/nodejs/bin")
    if os.path.isdir(nb):
        os.environ["PATH"] = nb + os.pathsep + os.environ.get("PATH", "")
    b = os.path.expanduser("~/bin")
    if os.path.isdir(b):
        os.environ["PATH"] = b + os.pathsep + os.environ.get("PATH", "")


def main():
    setup = "--setup" in sys.argv
    update = "--update" in sys.argv
    ensure_node_path()
    tools_ok = check_tools()
    print("=== 仓库 ===")
    repo_ok = check_repo(REPO, TEST_REPO_URL, "测试仓库", setup)
    src_ok = check_repo(SRC, SRC_URL, "源码仓库(hdk)", setup)
    pkg_ok = check_pkg()
    cred_ok = check_credentials()
    if setup and not pkg_ok:
        pkg_ok = install_pkg()
    if update:
        pull_test_repo()
        update_src_to_pkg()
        install_pkg()
    print("=== 汇总 ===")
    if tools_ok and repo_ok and src_ok and pkg_ok and cred_ok:
        print("环境就绪，可开始测试执行。")
        sys.exit(0)
    print("环境不完整：--setup 自动 clone/安装，--update 拉取+更新最新包。")
    sys.exit(1)


if __name__ == "__main__":
    main()