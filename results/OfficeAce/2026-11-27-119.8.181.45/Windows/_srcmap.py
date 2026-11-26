import io, sys, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
src = r'C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src'
print('mcp-server.mjs exists:', os.path.exists(src + r'\mcp-server.mjs'))
print('mcp-server.ts exists:', os.path.exists(src + r'\mcp-server.ts'))
for f in sorted(os.listdir(src)):
    if f.startswith('mcp') or f.endswith('.mjs'):
        print(' ', f)
# check dist
pkg = r'C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core'
print('pkg.json main:', open(pkg + r'\package.json', encoding='utf-8').read()[:400])
