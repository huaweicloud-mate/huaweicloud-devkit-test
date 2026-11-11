# -*- coding: utf-8 -*-
import io, sys, json
sys.stdout.reconfigure(encoding='utf-8')
t = io.open(r'C:\Users\Administrator\.hcloud\config.json', encoding='utf-8', errors='replace').read()
d = json.loads(t)
buf = io.StringIO()
def walk(o, path=''):
    if isinstance(o, dict):
        for k, v in o.items():
            kl = k.lower()
            if isinstance(v, (dict, list)):
                walk(v, path + '/' + k)
            else:
                s = str(v)
                if any(x in kl for x in ['ak', 'sk', 'secret', 'key', 'token', 'password']):
                    buf.write('%s/%s = <masked len %d>\n' % (path, k, len(s)))
                else:
                    buf.write('%s/%s = %s\n' % (path, k, s[:60]))
    elif isinstance(o, list):
        for i, v in enumerate(o):
            walk(v, path + '[%d]' % i)
walk(d)
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_hcloud_cfg.txt','w',encoding='utf-8').write(buf.getvalue())
print('ok')
