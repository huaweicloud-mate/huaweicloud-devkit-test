# D4-25 Python hook 事件遥测分类（Linux 上直调 huaweicloud-safety.py 的 record_cli_event）
import importlib.util, json, os, tempfile, sys
HOOK = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/hooks/huaweicloud-safety.py'
from importlib.machinery import SourceFileLoader
spec = importlib.util.spec_from_loader('hdksafety', SourceFileLoader('hdksafety', HOOK))
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
# 重定向遥测输出到本证据目录
tmpdir = tempfile.mkdtemp(prefix='hdk-hookevo-')
mod.TELEMETRY_DIR = type('D',(),{})(); 
from pathlib import Path
p = Path(tmpdir)
class _D:
    @staticmethod
    def mkdir(parents=False, exist_ok=False): p.mkdir(parents=parents, exist_ok=True)
mod.TELEMETRY_DIR = _D()
mod.HOOK_EVENTS_PATH = p / 'hook-events.jsonl'

samples = [
    ('hcloud ecs ListServersDetails --project-id x', 'cli:read'),
    ('hcloud ecs DeleteServers --server-id x', 'cli:write'),
    ('hcloud ecs CreateServers --flavor x', 'cli:write'),
    ('ls -la /tmp', 'cli:invoke'),
]
PASS=FAIL=0
def A(l,c,d=''):
    global PASS,FAIL
    ok=bool(c); PASS+= 1 if ok else 0; FAIL+= 0 if ok else 1
    print(f"[{'PASS' if ok else 'FAIL'}] {l}{d and ' | '+d}")

# record_cli_event 只记录 hcloud 命令（非 hcloud → 不记录）
mod.record_cli_event(samples[3][0])  # non-hcloud → no event
# 清空后逐个记录 hcloud 三类
if mod.HOOK_EVENTS_PATH.exists(): mod.HOOK_EVENTS_PATH.unlink()
for text, _ in samples[:3]:
    mod.record_cli_event(text)
events = []
if mod.HOOK_EVENTS_PATH.exists():
    for line in mod.HOOK_EVENTS_PATH.read_text().splitlines():
        if line.strip(): events.append(json.loads(line))
print('hook-events.jsonl keys:', [e['key'] for e in events])
keys = [e['key'] for e in events]
A('D4-25 只读→cli:read', 'cli:read' in keys, str(keys))
A('D4-25 写→cli:write', 'cli:write' in keys, str(keys))
A('D4-25 事件含 key/value/capability', all('key' in e and 'value' in e and 'capability' in e for e in events))
# 非 hcloud → cli:invoke（record_cli_event 仅捕获 hcloud 命令，invoke 类由非 hcloud 命令在 evaluate 层归类；此处核对 evaluate 不误分类）
reason = mod.evaluate('Bash', {'command':'hcloud ecs DeleteServers --server-id x'})
print('evaluate(高危 Bash) =>', repr(reason))
A('D4-25 evaluate 高危写命令返回拦截原因', bool(reason), str(reason)[:60])
# 清理
import shutil; shutil.rmtree(tmpdir, ignore_errors=True)
print(f"\n=== 汇总: PASS={PASS} FAIL={FAIL} ===")
sys.exit(1 if FAIL else 0)
