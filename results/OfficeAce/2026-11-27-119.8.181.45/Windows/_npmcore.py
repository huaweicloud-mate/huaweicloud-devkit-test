import json, io, sys, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
gd = r'C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3\node_modules\huaweicloud-devkit'
j = json.load(open(os.path.join(gd, 'package.json'), encoding='utf-8'))
print('npm version:', j.get('version'), 'main:', j.get('main'), 'type:', j.get('type'))
core = os.path.join(gd, 'plugins', 'huaweicloud-core')
if os.path.exists(core):
    print('npm core exists')
    src = os.path.join(core, 'src')
    if os.path.exists(src):
        print('src files:', len(os.listdir(src)))
        for f in sorted(os.listdir(src)):
            if 'mcp-server' in f or f.endswith('.mjs'):
                print('  ', f)
    print('dist exists:', os.path.exists(os.path.join(core, 'dist')))
    if os.path.exists(os.path.join(core, 'dist')):
        d = os.path.join(core, 'dist')
        print('dist files:', len(os.listdir(d)))
        for f in sorted(os.listdir(d))[:20]:
            print('  dist:', f)
