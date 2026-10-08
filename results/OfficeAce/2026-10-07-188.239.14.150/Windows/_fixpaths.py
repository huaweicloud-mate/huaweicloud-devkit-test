import glob, os, re
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'evidence')
targets = ['d4-security','d2-auth','d1-upgrade','mcp-tools','c4-service-matrix']
subs = [
    ('C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk', 'C:/Users/Administrator/devkit-test/OfficeAce/hdk'),
    ('C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\hdk', 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk'),
    ('devkit-test/testbot4-win-Opencode/hdk', 'devkit-test/OfficeAce/hdk'),
    ('devkit-test\\testbot4-win-Opencode\\hdk', 'devkit-test\\OfficeAce\\hdk'),
    ('C:/Users/Administrator/devkit-test/OpenCode/huaweicloud-devkit-test', 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test'),
    ('C:\\Users\\Administrator\\devkit-test\\OpenCode\\huaweicloud-devkit-test', 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\huaweicloud-devkit-test'),
    ('devkit-test/OpenCode/huaweicloud-devkit-test', 'devkit-test/OfficeAce/huaweicloud-devkit-test'),
]
for t in targets:
    p = os.path.join(base, t, 'probe.mjs')
    if not os.path.isfile(p):
        print('MISSING', t); continue
    s = open(p, encoding='utf-8').read()
    before = s
    for a, b in subs:
        s = s.replace(a, b)
    s = s.replace('testbot4-win-Opencode', 'OfficeAce')
    s = s.replace('devkit-test/OpenCode', 'devkit-test/OfficeAce')
    s = s.replace('devkit-test\\OpenCode', 'devkit-test\\OfficeAce')
    open(p, 'w', encoding='utf-8').write(s)
    print(t, 'changed' if (before != s) else 'NOCHANGE')