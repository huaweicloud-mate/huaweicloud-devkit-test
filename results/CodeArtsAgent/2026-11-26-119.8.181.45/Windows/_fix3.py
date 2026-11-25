import os, re, shutil
BASE=os.path.dirname(os.path.abspath(__file__)); EV=os.path.join(BASE,'evidence'); lib=os.path.join(BASE,'_runner','lib.mjs')
M={'D9-1':['init'],'D9-2':['init'],'D9-3':['init'],'D9-4':['init'],'D9-5':['init'],'D9-8':['init'],'D6-1':['timedSession'],'D6-3':['timedSession'],'D6-4':['init'],'D8-1':['HDK'],'D8-6':['HDK'],'D3-S4':['ENV'],'D4-8':['spawnSyncPy'],'D4-25':['spawnSyncPy'],'D4-28':['PATHS'],'D4-6':['ENV']}
for d,names in M.items():
    pf=os.path.join(EV,d,'probe.mjs')
    if not os.path.exists(pf): print('missing',d); continue
    shutil.copyfile(lib, os.path.join(EV,d,'lib.mjs'))
    src=open(pf,encoding='utf-8',errors='replace').read()
    bound=set()
    for m in re.finditer(r'import\s*\{([^}]*)\}',src):
        for part in m.group(1).split(','):
            n=part.strip().split(' as ')[-1].strip()
            if n: bound.add(n)
    for m in re.finditer(r'(?:const|let|var)\s+([A-Za-z_$][\w$]*)',src): bound.add(m.group(1))
    need=[n for n in names if n not in bound]
    if not need: continue
    def repl(m):
        xs=[x.strip() for x in m.group(1).split(',') if x.strip()]
        return 'import { '+', '.join(xs+need)+" } from '../../_runner/lib.mjs';"
    src2,n=re.subn(r"import \{([^}]*)\} from '../../_runner/lib\.mjs';",repl,src,count=1)
    if n==0:
        ls=src.splitlines(); idx=0
        for i,l in enumerate(ls[:40]):
            if l.strip().startswith('import '): idx=i+1
        ls.insert(idx,'import { '+', '.join(need)+" } from '../../_runner/lib.mjs';")
        src2='\n'.join(ls)
    open(pf,'w',encoding='utf-8').write(src2)
    print('fixed',d,need)
