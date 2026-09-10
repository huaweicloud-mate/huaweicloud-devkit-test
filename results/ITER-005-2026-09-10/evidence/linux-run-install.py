import paramiko, sys, time

acct_file = r'C:\Users\Administrator\Desktop\测试机账号.txt'
machines = {}
with open(acct_file, encoding='utf-8') as f:
    lines = f.read().splitlines()
for ln in lines[1:]:
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
print(f"连接 {m['ip']} ...", flush=True)
cli = paramiko.SSHClient()
cli.set_missing_host_key_policy(paramiko.AutoAddPolicy())
cli.connect(m['ip'], username=m['user'], password=m['pwd'], timeout=20, banner_timeout=20, auth_timeout=20)
sftp = cli.open_sftp()

local_tar = r'C:\Users\Administrator\devkit-test\hdk-n113-linux.tar.gz'
remote_tar = '/home/zhangshuang/hdk-n113-linux.tar.gz'
remote_dir = '/home/zhangshuang/hdk-n113'

def run(cmd, t=300):
    _, out, err = cli.exec_command(cmd, timeout=t)
    o = out.read().decode('utf-8', 'replace')
    e = err.read().decode('utf-8', 'replace')
    return o, e

# 清理旧目录 + 上传 + 解压
run(f'rm -rf {remote_dir} {remote_tar}')
print('上传 tar.gz (~576KB) ...', flush=True)
sftp.put(local_tar, remote_tar)
print('解压 ...', flush=True)
o, e = run(f'cd /home/zhangshuang && mkdir -p {remote_dir} && tar xzf {remote_tar} -C {remote_dir} && echo EXTRACT_OK')
print(o.strip(), e.strip()[:200])

# 跑 agent-install.test.mjs（含 PTY 菜单 + MCP + 0/1/多检测）
run_cmd = (
    f'cd {remote_dir}/hdk && '
    'export PATH=/opt/node22/bin:$PATH && '
    '/opt/node22/bin/node --test test/agent-install.test.mjs 2>&1'
)
print('运行 node --test test/agent-install.test.mjs ...', flush=True)
o, e = run(run_cmd, t=600)
combined = o + '\n' + e

# 保存完整结果
with open(r'C:\Users\Administrator\devkit-test\scripts\_linux_agent_install_result.txt', 'w', encoding='utf-8') as f:
    f.write(combined)

# 提取统计
import re
notok = re.findall(r'not ok \d+ - (.*)', combined)
ok_count = combined.count('ok ')
fail_count = combined.count('not ok ')
print(f'\n===== 结果统计： ok=~{ok_count}  not ok={fail_count} =====')
# 关键用例判定
keys = [
    ('unknown --target', 'install rejects unknown --target'),
    ('0 检测(无agent)非TTY', 'no agents reports error'),
    ('1 检测直装', 'single agent installs only that agent'),
    ('多检测非TTY', 'multiple agents requires explicit target'),
    ('菜单 option1 指定安装', 'menu option 1 installs to the entered target'),
    ('菜单 option1 未知拒绝', 'menu option 1 rejects unknown'),
    ('菜单 option2 all', 'menu option 2 installs to all'),
    ('菜单 option0 退出', 'menu option 0 exits'),
    ('菜单 option3 Claude备份', 'option 3 writes Claude Code MCP config with backup'),
    ('菜单 option3 Cursor', 'option 3 writes Cursor mcp.json'),
    ('菜单 option3 同key跳过', 'option 3 skips already-configured'),
    ('菜单 option3 未命中片段', 'option 3 prints snippet'),
]
print('\n===== 关键用例判定 =====')
for label, pat in keys:
    # 在结果中找该测试名，看它后面是否 not ok
    idx = combined.find(pat)
    status = '?'
    if idx >= 0:
        # 找该测试块，判断 ok/not ok
        block = combined[idx: idx + 400]
        if 'not ok' in combined[max(0, idx-120): idx+8]:
            status = 'FAIL(名称前有 not ok)'
        else:
            # 看看名称行本身
            m = re.search(r'(ok|not ok) \d+ - ' + re.escape(pat), combined)
            if m:
                status = ('PASS' if m.group(1) == 'ok' else 'FAIL')
            else:
                # 也许是重名/子测名，向上找最近的 not ok / ok 带行号
                status = '见块(未见明确 ok/not ok 匹配)'
    else:
        status = '未出现(可能跳过/未跑)'
    print(f'  [{"✓" if status=="PASS" else ("✗" if status=="FAIL" else "?" )}] {label}: {status}')

cli.close()
print('\n完整结果已存 scripts/_linux_agent_install_result.txt')
print('DONE')