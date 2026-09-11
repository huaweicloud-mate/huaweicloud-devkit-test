# -*- coding: utf-8 -*-
"""EX-1: 探测 testbot3(1.94.218.129) 连通性与环境画像
密码纪律：凭据仅从桌面账号表读取并在 paramiko 会话内使用，绝不打印/落盘/入日志。
"""
import paramiko, os, sys

CREDS_FILE = os.path.expanduser(r'~\Desktop\测试机账号.txt')
TARGET = '1.94.218.129'

creds = {}
with open(CREDS_FILE, encoding='utf-8-sig') as f:
    for line in f:
        s = line.strip()
        if not s or s.startswith('#') or s.startswith('IP\t'):
            continue
        p = [x.strip() for x in s.split('\t')]
        if len(p) >= 3:
            creds[p[0]] = (p[1], p[2])

if TARGET not in creds:
    print(f'[FAIL] 账号表无 {TARGET}')
    sys.exit(1)

u, pw = creds[TARGET]
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    c.connect(TARGET, username=u, password=pw, timeout=10,
              banner_timeout=10, auth_timeout=10,
              allow_agent=False, look_for_keys=False)
    print(f'[OK] 连接 {TARGET} ({u})')
    cmds = [
        ('OS', 'cat /etc/os-release | grep PRETTY_NAME; uname -m'),
        ('node', 'export PATH=$HOME/node22/bin:$PATH; node -v 2>/dev/null || node -v; echo "node直接: $(node -v 2>&1)"; echo "npm: $(npm -v 2>&1)"'),
        ('hdk', 'ls ~/.npm-global/lib/node_modules/huaweicloud-devkit/package.json 2>/dev/null && node -e "console.log(JSON.parse(require(\'fs\').readFileSync(process.env.HOME+\'/.npm-global/lib/node_modules/huaweicloud-devkit/package.json\')).version)" 2>&1 || echo "无全局hdk"'),
        ('hcloud', 'export PATH=$HOME/.local/bin:$PATH; which hcloud 2>/dev/null; hcloud version 2>&1 | head -1 || echo "无hcloud"'),
        ('git', 'git --version 2>&1'),
        ('curl', 'curl -V 2>&1 | head -1'),
        ('registry', 'cat ~/.npmrc 2>/dev/null || echo "无用户npmrc"; npm config get registry 2>&1'),
        ('python', 'python3 --version 2>&1'),
    ]
    for name, cmd in cmds:
        _, o, e = c.exec_command(cmd, timeout=30)
        out = o.read().decode('utf-8', errors='replace').strip()
        err = e.read().decode('utf-8', errors='replace').strip()
        print(f'--- {name} ---')
        print(out if out else ('(err) ' + err if err else '(空)'))
    # 磁盘
    _, o, e = c.exec_command('df -h / | tail -1; free -m | head -2 | tail -1', timeout=30)
    print('--- 资源 ---')
    print(o.read().decode('utf-8', errors='replace').strip())
    c.close()
except Exception as ex:
    print(f'[FAIL] {TARGET}: {ex}')
    sys.exit(1)