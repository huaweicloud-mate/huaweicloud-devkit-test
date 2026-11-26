import io, sys, os, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# What the batch runner used in Nov: re-derive HDK_ROOT and probe entry
gd = r'C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3\node_modules\huaweicloud-devkit'
core = os.path.join(gd, 'plugins', 'huaweicloud-core')
d = os.path.join(core, 'dist')
cands = [f for f in os.listdir(d) if 'mcp' in f.lower()]
print('mcp dist files:', cands)
# check exports from dist/mcp-server.js and mcp-protocol.js
import subprocess
for f in ['mcp-server.js', 'mcp-protocol.js', 'tool-definitions.js', 'safety-policy.js']:
    p = os.path.join(d, f)
    if os.path.exists(p):
        r = subprocess.run(['node', '-e', f"import('file:///{p.replace(chr(92), '/')}').then(m => console.log('{f}', Object.keys(m).slice(0,12).join(',')))"], capture_output=True, text=True, timeout=30)
        print(r.stdout.strip(), r.stderr.strip()[:150])
