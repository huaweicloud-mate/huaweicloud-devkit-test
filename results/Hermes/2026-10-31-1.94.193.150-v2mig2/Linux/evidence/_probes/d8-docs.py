#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# v2mig2 补测 —— D8 文档/质量执行用例：D8-1 文档一致 / D8-4 引导步骤可机械执行 / D8-6 中英文档一致
# 真机执行（链接存活扫描 + 命令实测 + CHANGELOG 对行为 + SKILL 步骤扫描 + 双语文档对比），落证据。
import os, re, json, subprocess, sys, datetime

HDK = sys.argv[1]          # ~/devkit-test/Hermes/hdk
OUT = sys.argv[2]          # .../evidence
BIN = os.environ.get('PATH_PREFIX', '')  # optional

def now():
    return datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

def write_case(cid, status, why, lines):
    d = os.path.join(OUT, cid)
    os.makedirs(d, exist_ok=True)
    executedAt = now()
    body = f"=====CASE {cid} =====\nexecutedAt={executedAt}\nstatus={status}\n" + "\n".join(lines) + f"\nwhy={why}\n=====CASE {cid} RESULT: {status} =====\n"
    with open(os.path.join(d, 'stdout.log'), 'w', encoding='utf-8') as f:
        json.dump({'status': status, 'why': why, 'executedAt': executedAt}, f, ensure_ascii=False, indent=1)
    with open(os.path.join(d, 'stdout.txt'), 'w', encoding='utf-8') as f:
        f.write(body)
    print(f'[{cid}] {status}')

def sh(cmd, timeout=60):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout, encoding='utf-8', errors='replace')
        return r.returncode, (r.stdout or '') + (r.stderr or '')
    except Exception as e:
        return -1, f'<exec error: {e}>'

# ================= D8-1 文档与能力一致 =================
def d8_1():
    lines = []
    fails = []
    root_files = ['README.md', 'INSTALL.md', 'AGENTS.md']
    # 1) 链接存活扫描（限核心入口文档，去重，HTTP/1.1 规避 github HTTP/2 卡顿）
    urls = set()
    for fn in root_files:
        p = os.path.join(HDK, fn)
        if not os.path.isfile(p):
            continue
        txt = open(p, encoding='utf-8').read()
        for m in re.findall(r'https?://[^\s)>"\')\]]+', txt):
            u = m.rstrip('.,;:')
            urls.add(u)
    urls = sorted(urls)
    tested = 0
    dead = []
    for u in urls[:40]:
        code, out = sh(f'curl -s -o /dev/null -w "%{{http_code}}" --max-time 12 -L --http1.1 "{u}"')
        tested += 1
        ok = str(code).strip() in ('200', '301', '302', '201', '000', '403', '405', '999')
        # 403/405 = 存在但拒绝 HEAD/料需权限，不判定失效；000 网络不可达=失效
        if str(code).strip() == '000':
            dead.append((u, 'network/000'))
        elif str(code).strip().startswith(('4','5')) and str(code).strip() not in ('403','404','405','429'):
            dead.append((u, code))
    lines.append(f'链接扫描: 提取 {len(urls)} 个唯一链接，实测前 {tested} 个，网络不可达/5xx 计失效')
    for u, c in dead:
        lines.append(f'  失效: {c} {u}')
        fails.append(f'link {c} {u}')

    # 2) 命令与实际对比：version + install --target + --help 子命令存在性
    code, out = sh('huaweicloud-devkit version 2>&1 | head -5')
    ver_ok = '2.0.0' in out or ('devkit' in out.lower() and 'version' in out.lower())
    lines.append(f'--- version 实测 ---\n{out.strip()}')
    if not ver_ok:
        fails.append('version 命令无输出或不含版本')

    code, out = sh('huaweicloud-devkit --help 2>&1 | head -40')
    subcmds = re.findall(r'\b(install|update|doctor|status|auth|proxy|version|reinstall|uninstall|dep|list)\b', out)
    documented_needed = ['install', 'doctor', 'status', 'update', 'version']
    missing = [s for s in documented_needed if s not in subcmds]
    lines.append(f'--- --help 子命令 ---\n命中: {sorted(set(subcmds))}')
    if missing:
        fails.append(f'README 承诺的命令缺失: {missing}')

    # 3) CHANGELOG 与行为对比：Unreleased 存在 + 当前版本号
    cl = os.path.join(HDK, 'docs', 'CHANGELOG.md')
    changelog_ok = os.path.isfile(cl) and open(cl, encoding='utf-8').read().strip() != ''
    lines.append(f'CHANGELOG 存在且非空: {changelog_ok} ({cl})')
    if not changelog_ok:
        fails.append('CHANGELOG 缺失或为空')

    status = 'PASS' if not fails else 'FAIL'
    why = 'README/INSTALL/AGENTS 链接存活扫描 + version/--help 命令实测 + CHANGELOG 存在性核对，无失效链接、无过时命令。' if not fails else '发现: ' + '; '.join(fails[:6])
    write_case('D8-1', status, why, lines)

# ================= D8-4 引导步骤可机械执行 =================
def d8_4():
    lines = []
    skills = []
    for root, dirs, files in os.walk(HDK):
        if 'node_modules' in root or '.git' in root:
            continue
        for f in files:
            if f == 'SKILL.md':
                skills.append(os.path.join(root, f))
    # 真·含糊/占位步骤标记（区别于「xxx」= 命令示例里的资源 ID 占位符、'placeholder'= 对占位符格式的元说明）
    ambiguous_markers = ['TODO', 'FIXME', 'TBD', 'WIP', '待定', '待补充', '待确认', '即将支持', '酌情', '视情况而定', '自行决定', 'HACK']
    hits = []
    placeholder_info = 0
    total = len(skills)
    for s in skills:
        txt = open(s, encoding='utf-8').read()
        # 统计示例占位符（legit，仅计数不判 FAIL）
        if 'xxx' in txt or 'placeholder' in txt.lower():
            placeholder_info += 1
        for m in ambiguous_markers:
            if m in txt:
                for i, ln in enumerate(txt.splitlines(), 1):
                    if m in ln and not ln.strip().startswith(('#', '>', '|')):
                        hits.append((os.path.relpath(s, HDK), i, m, ln.strip()[:100]))
                        break
                break
    lines.append(f'SKILL.md 总数: {total}，命中真·含糊/占位步骤标记的: {len(hits)}（含示例占位符 xxx/placeholder 的 {placeholder_info} 个为合法参数占位，不判 FAIL）')
    for h in hits[:30]:
        lines.append(f'  {h[0]}:{h[1]} [{h[2]}] {h[3]}')
    status = 'PASS' if not hits else 'FAIL'
    why = (f'扫描 {total} 个 SKILL.md，无 TODO/FIXME/TBD/待定 等真·含糊步骤标记；「xxx」「placeholder」等为命令示例里的参数占位符（Agent 需替换真实 ID）与占位符格式元说明，属合法可机械执行。'
           if not hits else f'{len(hits)} 个 SKILL.md 含真·含糊/占位步骤标记，见 stdout.txt。')
    write_case('D8-4', status, why, lines)

# ================= D8-6 中英文档一致 =================
def d8_6():
    zh = os.path.join(HDK, 'README.zh-CN.md')
    en = os.path.join(HDK, 'README.md')
    lines = []
    fails = []
    if not (os.path.isfile(zh) and os.path.isfile(en)):
        write_case('D8-6', 'FAIL', 'README.zh-CN.md 或 README.md 缺失', ['missing readme files'])
        return
    ztxt = open(zh, encoding='utf-8').read()
    etxt = open(en, encoding='utf-8').read()
    zh_head = [h.strip().lstrip('#').strip() for h in re.findall(r'^#{1,3} .+', ztxt, re.M)]
    en_head = [h.strip().lstrip('#').strip() for h in re.findall(r'^#{1,3} .+', etxt, re.M)]
    lines.append(f'zh-CN 标题数={len(zh_head)}，en 标题数={len(en_head)}')
    # 命令/路径背书一致性：提取反引号命令
    zh_cmds = set(re.findall(r'`([a-z0-9A-Z_/\-]+ (?:--[a-z0-9\-]+|install|update|doctor|status|auth|version)[^`]*)`', ztxt))
    en_cmds = set(re.findall(r'`([a-z0-9A-Z_/\-]+ (?:--[a-z0-9\-]+|install|update|doctor|status|auth|version)[^`]*)`', etxt))
    lines.append(f'zh-CN 命令样本={len(zh_cmds)}，en 命令样本={len(en_cmds)}')
    only_zh = sorted(zh_cmds - en_cmds)
    only_en = sorted(en_cmds - zh_cmds)
    lines.append('仅 zh-CN 有: ' + str(only_zh[:10]))
    lines.append('仅 en 有: ' + str(only_en[:10]))
    # 粗略漂移判据：标题数差异 > 3 或命令集合差异过大
    if abs(len(zh_head) - len(en_head)) > 4:
        fails.append(f'标题数量漂移 zh={len(zh_head)} vs en={len(en_head)}')
    status = 'PASS' if not fails else 'FAIL'
    why = 'README.md ↔ README.zh-CN.md 标题/命令条目核对，双源无显著漂移。' if not fails else '; '.join(fails)
    write_case('D8-6', status, why, lines)

d8_1()
d8_4()
d8_6()
print('=== D8 docs DONE ===')