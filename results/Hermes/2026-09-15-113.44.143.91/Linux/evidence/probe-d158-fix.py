#!/usr/bin/env python3
# D1-58 通用 MCP 白名单(Claude/Cursor merge) 正确触发探针
# 原理: HOME 隔离让 detectAgents()==0 -> promptZeroDetect 菜单 -> feed '3' -> configureGenericMCP
# 用 pty 提供 TTY (满足 process.stdin.isTTY)，并在 PTY 会话内正确传递 HOME。
import os, sys, pty, json, tempfile, shutil, time, subprocess

NODE_BIN = os.path.expanduser("~/nodejs/bin") + ":" + os.path.expanduser("~/bin")

def run_menu_snapshot(iso_home, claude_content=None):
    """在隔离 HOME 下跑 install，feed 3 选通用 MCP，返回 (stdout_text, post_files)"""
    os.makedirs(iso_home, exist_ok=True)
    before = {}
    if claude_content is not None:
        p = os.path.join(iso_home, ".claude.json")
        with open(p, "w") as f:
            f.write(claude_content)
        with open(p, "rb") as f:
            before[".claude.json"] = f.read()

    env = dict(os.environ)
    env["HOME"] = iso_home
    env["PATH"] = NODE_BIN + ":" + env.get("PATH", "")
    # 确保 CLAUDE_CONFIG_DIR 不干扰（不设置，让 homedir() 生效）

    master, slave = pty.openpty()
    proc = subprocess.Popen(
        ["huaweicloud-devkit", "install"],
        stdin=slave, stdout=slave, stderr=slave,
        env=env, close_fds=True,
    )
    os.close(slave)
    # 读菜单输出，检测到 'Enter choice' 后 feed 3
    out = b""
    deadline = time.time() + 30
    while time.time() < deadline:
        try:
            import select
            r, _, _ = select.select([master], [], [], 0.5)
            if r:
                d = os.read(master, 4096)
                if not d:
                    break
                out += d
                if b"Enter choice" in out or b"Wire up a generic" in out:
                    os.write(master, b"3\n")
                    # 继续读到 EOF
                    try:
                        while True:
                            d2 = os.read(master, 4096)
                            if not d2:
                                break
                            out += d2
                    except OSError:
                        pass
                    break
            if proc.poll() is not None:
                break
        except OSError:
            break
    try:
        proc.wait(timeout=5)
    except Exception:
        proc.kill()
    try:
        os.close(master)
    except OSError:
        pass

    after = {}
    for fn in os.listdir(iso_home):
        full = os.path.join(iso_home, fn)
        if os.path.isfile(full):
            with open(full, "rb") as f:
                after[fn] = f.read()
    return out.decode("utf-8", "replace"), before, after

def check(label, cond, detail):
    print(f"{'PASS' if cond else 'FAIL'}  {label}  {detail}")
    return cond

results = []
BASE = tempfile.mkdtemp(prefix="hdk-d158fix.")

# ---- 场景1: 命中 merge ----
iso1 = os.path.join(BASE, "merge")
out, before, after = run_menu_snapshot(iso1, '{"mcpServers":{"other-server":{"command":"x"}}}')
has_bak = ".claude.json.bak" in after
merged = ""
if ".claude.json" in after:
    try:
        merged = json.dumps(json.loads(after[".claude.json"]), sort_keys=True)
    except Exception:
        merged = after[".claude.json"].decode("utf-8", "replace")
    parsed = json.loads(after[".claude.json"])
    has_hdk = "huaweicloud-devkit" in parsed.get("mcpServers", {})
    other_preserved = "other-server" in parsed.get("mcpServers", {})
else:
    parsed, has_hdk, other_preserved = {}, False, False
results.append(check("EXP-D1-58-02 命中merge", has_bak and has_hdk and other_preserved,
    f".bak={has_bak} hdk合入={has_hdk} 其余键保留={other_preserved}"))

# ---- 场景2: 同 key 跳过 ----
iso2 = os.path.join(BASE, "skip")
out2, before2, after2 = run_menu_snapshot(iso2, '{"mcpServers":{"huaweicloud-devkit":{"command":"npx"}}}')
skip_word = "already configured; skipping" in out2
no_new_bak = ".claude.json.bak" not in after2
results.append(check("EXP-D1-58-03 同key跳过", skip_word and no_new_bak,
    f"skipping={skip_word} 无新.bak={no_new_bak}"))

# ---- 场景3: 坏 JSON 零写入 ----
iso3 = os.path.join(BASE, "bad")
bad_txt = "{invalid json"
out3, before3, after3 = run_menu_snapshot(iso3, bad_txt)
notvalid = "not valid JSON" in out3
zero_write = before3[".claude.json"] == after3.get(".claude.json", b"")
results.append(check("EXP-D1-58-04 坏JSON零写入", notvalid and zero_write,
    f"not valid JSON={notvalid} 字节不变={zero_write}"))

# ---- 场景4: 未命中 snippet ----
iso4 = os.path.join(BASE, "empty")
out4, before4, after4 = run_menu_snapshot(iso4, None)
has_snippet = "mcpServers" in out4 and "huaweicloud-devkit" in out4
results.append(check("EXP-D1-58-05 未命中snippet", has_snippet,
    f"片段含mcpServers={has_snippet}"))

# ---- 场景5(EXP-D1-58-01): 探测两文件存在性感知 ----
# 有 .claude.json + 有 .cursor 目录时应探测到两文件并分别配置
iso5 = os.path.join(BASE, "probe")
os.makedirs(os.path.join(iso5, ".cursor"), exist_ok=True)
with open(os.path.join(iso5, ".claude.json"), "w") as f:
    f.write('{"mcpServers":{}}')
out5, before5, after5 = run_menu_snapshot(iso5, None)
claude_ok = "claude" in out5.lower() or ".claude.json" in out5
cursor_ok = ("cursor" in out5.lower()) or os.path.exists(os.path.join(iso5, ".cursor", "mcp.json"))
results.append(check("EXP-D1-58-01 双文件探测", claude_ok and cursor_ok,
    f"claude命中={claude_ok} cursor命中={cursor_ok}"))

shutil.rmtree(BASE, ignore_errors=True)
n = sum(results)
print(f"\n=== D1-58 白名单矩阵 总计 {len(results)} 条, PASS {n}, FAIL {len(results)-n} ===")
sys.exit(0 if n == len(results) else 1)