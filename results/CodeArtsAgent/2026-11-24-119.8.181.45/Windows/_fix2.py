import os, re, shutil
BASE=os.path.dirname(os.path.abspath(__file__)); EV=os.path.join(BASE,'evidence')
lib=os.path.join(BASE,'_runner','lib.mjs')
NAMES=['existsSync','readFileSync','writeFileSync','mkdirSync','readdirSync','rmSync','unlinkSync','statSync','copyFileSync','join','basename','dirname','resolve','extname','tmpdir','homedir','platform','spawnSync','execSync','sleep','iso','stamp','hc','cleanupStack','createVpcStack']
changed=[]
for d in sorted(os.listdir(EV)):
    p=os.path.join(EV,d)
    f=os.path.join(p,'probe.mjs')
    if not os.path.isdir(p) or not os.path.exists(f): continue
    shutil.copyfile(lib, os.path.join(p,'lib.mjs'))
    src=open(f,encoding='utf-8',errors='replace').read()
    if '// LIBIMPORT-FIXED' in src: continue
    bound=set()
    for m in re.finditer(r'import\s*\{([^}]*)\}', src):
        for part in m.group(1).split(','):
            n=part.strip().split(' as ')[-1].strip()
            if n: bound.add(n)
    for m in re.finditer(r'(?:const|let|var)\s+([A-Za-z_$][\w$]*)', src): bound.add(m.group(1))
    for m in re.finditer(r'function\s+([A-Za-z_$][\w$]*)', src): bound.add(m.group(1))
    need=[n for n in NAMES if re.search(r'\b'+re.escape(n)+r'\b', src) and n not in bound]
    if not need: continue
    def repl(m):
        names=[x.strip() for x in m.group(1).split(',') if x.strip()]
        merged=names+[n for n in need if n not in names]
        return 'import { '+', '.join(merged)+" } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED"
    src2, n=re.subn(r"import \{([^}]*)\} from '../../_runner/lib\.mjs';", repl, src, count=1)
    if n==0:
        # no lib import line: add after first import
        ls=src.splitlines(); idx=0
        for i,l in enumerate(ls[:40]):
            if l.strip().startswith('import '): idx=i+1
        ls.insert(idx, 'import { '+', '.join(need)+" } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED")
        src2='\n'.join(ls)
    open(f,'w',encoding='utf-8').write(src2)
    changed.append(d)
print('fixed',len(changed))
print(changed[:60])
