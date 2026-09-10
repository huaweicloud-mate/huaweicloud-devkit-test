import paramiko

acct_file = r'C:\Users\Administrator\Desktop\测试机账号.txt'
machines = {}
with open(acct_file, encoding='utf-8') as f:
    for ln in f.read().splitlines()[1:]:
        if not ln.strip():
            continue
        parts = ln.split('\t')
        if len(parts) >= 4:
            ip, user, pwd, osn = parts[0], parts[1], parts[2], parts[3]
        else:
            toks = ln.split()
            ip, user, pwd, osn = toks[0], toks[1], toks[2], toks[3]
        machines[user] = {'ip': ip.strip(), 'user': user.strip(), 'pwd': pwd.strip(), 'os': osn.strip()}

m = machines['zhangshuang']
cli = paramiko.SSHClient()
cli.set_missing_host_key_policy(paramiko.AutoAddPolicy())
cli.connect(m['ip'], username=m['user'], password=m['pwd'], timeout=20, banner_timeout=20, auth_timeout=20)

def run(cmd, t=90):
    _, out, err = cli.exec_command(cmd, timeout=t)
    return out.read().decode('utf-8', 'replace'), err.read().decode('utf-8', 'replace')

setup = '/home/zhangshuang/hdk-n113/hdk/bin/setup.cjs'
node = '/opt/node22/bin/node'

# P2-4: 坏 JSON 的 .claude.json，跑 option 3，应报 not valid JSON 且不动原文件、无 .bak
setup_cmd = (
    'rm -rf /tmp/p24 && mkdir -p /tmp/p24 && '
    'printf \'{broken\\n\' > /tmp/p24/.claude.json && '
    'echo "=== 原始坏JSON ===" && cat /tmp/p24/.claude.json && '
    'cd /tmp/p24 && export USERPROFILE=/tmp/p24 HOME=/tmp/p24 HERMES_HOME=/tmp/p24/.hermes && '
    f'printf \'3\\n\' | script -qec "{node} {setup} install" /dev/null 2>&1'
)
print('=== P2-4 坏 JSON 场景执行 ===', flush=True)
o, e = run(setup_cmd)
print(o)

# 验证结果
print('=== 验证：原文件是否未被改动 + 无 .bak ===', flush=True)
o2, e2 = run(
    'echo "--- .claude.json 内容(应为原始坏JSON {broken) ---"; cat /tmp/p24/.claude.json; '
    'echo "--- .bak 是否存在 ---"; ls -la /tmp/p24/*.bak 2>&1'
)
print(o2 + e2)

cli.close()
print('DONE')