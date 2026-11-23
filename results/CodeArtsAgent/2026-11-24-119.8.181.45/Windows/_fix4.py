import os,re,shutil
BASE=os.path.dirname(os.path.abspath(__file__));EV=os.path.join(BASE,'evidence');lib=os.path.join(BASE,'_runner','lib.mjs')
M={'D9-2':['rawSession','parseFrames','errOf'],'D9-4':['rawSession','parseFrames'],'D9-5':['rawSession','parseFrames']}
for d,names in M.items():
    pf=os.path.join(EV,d,'probe.mjs');shutil.copyfile(lib,os.path.join(EV,d,'lib.mjs'))
    src=open(pf,encoding='utf-8',errors='replace').read()
    def repl(m):
        xs=[x.strip() for x in m.group(1).split(',') if x.strip()]
        return 'import { '+', '.join(xs+[n for n in names if n not in xs])+" } from '../../_runner/lib.mjs';"
    src2,n=re.subn(r"import \{([^}]*)\} from '../../_runner/lib\.mjs';",repl,src,count=1)
    open(pf,'w',encoding='utf-8').write(src2); print(d,n)
