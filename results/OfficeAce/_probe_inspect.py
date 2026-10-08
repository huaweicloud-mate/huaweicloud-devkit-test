import sys, io, os, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
YEST = os.path.join('C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence')
dirs = [d for d in os.listdir(YEST) if os.path.isdir(os.path.join(YEST,d)) and os.path.isfile(os.path.join(YEST,d,'probe.mjs'))]
print('total dirs with probe:', len(dirs))
# count date references
dated = []
for d in dirs:
    t = open(os.path.join(YEST,d,'probe.mjs'), encoding='utf-8', errors='replace').read()
    m = re.findall(r'20\d\d[-\/]\d\d[-\/]\d\d', t) + re.findall(r'20\d{12}', t)
    mm = re.findall(r'Administrator', t)
    helper = '_helper' in t
    dated.append((d, len(mm), helper, list(set(m))[:3]))
for d, adm, helper, m in dated:
    print('%s | adminRef=%d | helper=%s | dates=%s' % (d, adm, helper, m))

# sample D1-3 probe first 2000 chars
print('\n===== D1-3 probe head =====')
print(open(os.path.join(YEST,'D1-3','probe.mjs'), encoding='utf-8', errors='replace').read()[:1500])