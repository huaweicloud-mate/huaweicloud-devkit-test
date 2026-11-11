# -*- coding: utf-8 -*-
import io, sys, os, json
sys.stdout.reconfigure(encoding='utf-8')
buf = io.StringIO()
for f in [r'C:\Users\Administrator\.config\huaweicloud\credentials.json', r'C:\Users\Administrator\.config\huaweicloud\credentials.readonly.json']:
    try:
        d = json.load(io.open(f, encoding='utf-8'))
        def mask(o):
            if isinstance(o, dict):
                return {k: mask(v) for k, v in o.items()}
            if isinstance(o, list):
                return [mask(x) for x in o]
            if isinstance(o, str) and any(x in o.lower() for x in []):
                return o
            return o
        def walk(o, path=''):
            if isinstance(o, dict):
                for k, v in o.items():
                    kl = k.lower()
                    if isinstance(v, (dict, list)):
                        walk(v, path+'/'+k)
                    else:
                        s = str(v)
                        if any(x in kl for x in ['ak','access','secret','sk','token','key','password','domain','project']):
                            if 'name' in kl or 'id' == kl[-2:]:
                                buf.write('%s/%s = %s\n' % (path, k, s[:20]+'...'))
                            else:
                                buf.write('%s/%s = <masked len %d>\n' % (path, k, len(s)))
                        else:
                            buf.write('%s/%s = %s\n' % (path, k, s[:60]))
            elif isinstance(o, list):
                for i, v in enumerate(o):
                    walk(v, path+'[%d]' % i)
        walk(d)
    except Exception as e:
        buf.write('%s ERROR %s\n' % (f, e))
p2 = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_officeace_mcp_helper.mjs'
t = io.open(p2, encoding='utf-8', errors='replace').read()
buf.write('\n---- mcp_helper (%d lines) ----\n' % len(t.splitlines()))
buf.write('\n'.join(t.splitlines()[:60]))
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_creds2.txt','w',encoding='utf-8').write(buf.getvalue())
print('ok')
