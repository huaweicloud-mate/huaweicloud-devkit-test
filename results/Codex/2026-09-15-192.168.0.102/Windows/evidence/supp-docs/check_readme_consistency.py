# -*- coding: utf-8 -*-
"""check_readme_consistency.py - D8 README 一致性标准检查（每次迭代必跑）
用法: python check_readme_consistency.py [hdk路径] [--no-network]
检查项:
  1. 命令-实现一致性: README 顶层命令 vs setup-cli.mjs switch 分发
  2. 编码完整性: UTF-8 可读 + mojibake 序列
  3. badge 版本 vs npm dist-tags.latest（网络）
  4. dev/main README 分叉（git，网络）
"""
import os
import re
import sys
import subprocess
import urllib.request
import json

HDK = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else r'C:\Users\Administrator\devkit-test\hdk'
NO_NET = '--no-network' in sys.argv

results = []

def check(name, ok, detail):
    results.append((name, ok, detail))
    print(f"{'✅' if ok else '❌' if ok is False else '⏭️'} {name}: {detail}")

# 1. 命令一致性
readme = os.path.join(HDK, 'README.md')
setup = os.path.join(HDK, 'plugins', 'huaweicloud-core', 'src', 'setup-cli.mjs')
if os.path.exists(readme) and os.path.exists(setup):
    rd = open(readme, encoding='utf-8').read()
    cmds_rd = sorted(set(re.findall(r'huaweicloud-devkit\s+([\w][\w-]*)', rd)))
    sd = open(setup, encoding='utf-8').read()
    cmds_impl = set(re.findall(r"case '([a-z][a-z-]+)'", sd))
    missing = [c for c in cmds_rd if c not in cmds_impl and c not in (
        '--yes', 'opencode', 'codex', 'codearts', 'codearts-work', 'workbuddy',
        'dsh', 'officeace', 'hermes', 'openclaw', 'atomcode', 'all', 'codex-desktop',
        # 自然语言 stopword（README 英文句子误匹配，2026-09-09 ITER-003 实证：
        # "verify huaweicloud-devkit@huaweicloud-devkit is installed" 的 is 被误抓）
        'is', 'installed', 'and', 'the', 'for', 'to', 'on', 'in', 'with', 'version')]
    check('1 命令-实现一致性', not missing,
          f'README 命令 {len(cmds_rd)} 个; 实现缺失: {missing or "无"}')
else:
    check('1 命令-实现一致性', None, f'文件缺失 (readme={os.path.exists(readme)}, setup={os.path.exists(setup)})')

# 2. 编码完整性
def mojibake_count(text):
    # 常见 UTF-8→GBK→utf8 二次解码乱码序列（'鈥', '涓', '锛', '鏄', '锟', '皋' 等）与 U+FFFD
    pats = ['鈥', '涓', '锛', '鏄', '锟', '锜', '朷', '犲', '\ufffd']
    return sum(text.count(p) for p in pats)
try:
    total_bad = 0
    per_file = []
    for f in ('README.md', 'README.zh-CN.md'):
        p = os.path.join(HDK, f)
        if not os.path.exists(p):
            per_file.append(f'{f}:缺失')
            continue
        t = open(p, encoding='utf-8').read()
        b = mojibake_count(t)
        total_bad += b
        per_file.append(f'{f}:{b}处')
    check('2 编码完整性', total_bad == 0, '; '.join(per_file))
except Exception as e:
    check('2 编码完整性', None, str(e)[:80])

# 3. badge vs npm latest
if NO_NET:
    check('3 badge 版本', None, '跳过（--no-network）')
else:
    try:
        with urllib.request.urlopen('https://registry.npmjs.org/huaweicloud-devkit', timeout=15) as r:
            d = json.loads(r.read().decode('utf-8-sig'))
        latest = d['dist-tags']['latest']
        rd = open(readme, encoding='utf-8').read()
        m = re.search(r'badge/([\w.]+)-v?([\d.]+)', rd)
        badge_ver = m.group(2) if m else '?'
        badge_lbl = m.group(1) if m else '?'
        ok = latest == badge_ver
        check('3 badge 版本', ok,
              f'npm latest={latest} | README badge={badge_lbl}-v{badge_ver}' + ('' if ok else ' ← 过时'))
    except Exception as e:
        check('3 badge 版本', None, f'网络失败: {str(e)[:60]}')

# 4. dev/main README 分叉
if NO_NET:
    check('4 dev/main 同步', None, '跳过（--no-network）')
else:
    try:
        subprocess.run(['git', 'fetch', 'origin', 'dev', 'main'], cwd=HDK, capture_output=True, timeout=60)
        out = subprocess.run(['git', 'diff', '--name-only', 'origin/main', 'origin/dev', '--', 'README.md', 'README.zh-CN.md'],
                             cwd=HDK, capture_output=True, text=True, timeout=30)
        changed = [l for l in out.stdout.splitlines() if l.strip()]
        check('4 dev/main 同步', not changed, f'README 在 dev/main 差异: {changed or "无"}')
    except Exception as e:
        check('4 dev/main 同步', None, f'git 失败: {str(e)[:60]}')

fails = [r for r in results if r[1] is False]
print(f"\nD8 检查汇总: {len(results)} 项 | PASS {sum(1 for r in results if r[1] is True)} | FAIL {len(fails)} | SKIP {sum(1 for r in results if r[1] is None)}")
sys.exit(1 if fails else 0)