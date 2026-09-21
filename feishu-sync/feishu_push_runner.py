# -*- coding: utf-8 -*-
"""feishu_push_runner.py - 调用 sync_sheet.py --push（内部 subprocess 规避 shell 引号问题）"""
import subprocess, sys, os

here = r'C:\Users\Administrator\devkit-test\feishu-sync'
xlsx = r'C:\Users\Administrator\devkit-test\test manage\huaweicloud-devkit-测试全景图.xlsx'
py = sys.executable
cmd = [py, os.path.join(here, 'sync_sheet.py'), '--push', xlsx]
if '--diff' in sys.argv:
    cmd.append('--diff')
r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=600)
print(r.stdout)
if r.stderr:
    print('[stderr]', r.stderr[-800:])
sys.exit(r.returncode)