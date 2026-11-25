import os, re, shutil
BASE=os.path.dirname(os.path.abspath(__file__)); EV=os.path.join(BASE,'evidence')
lib=os.path.join(BASE,'_runner','lib.mjs')
# 1. copy lib.mjs into each evidence dir
for d in os.listdir(EV):
    p=os.path.join(EV,d)
    if os.path.isdir(p) and os.path.exists(os.path.join(p,'probe.mjs')):
        shutil.copyfile(lib, os.path.join(p,'lib.mjs'))

NS = {
 'existsSync':'node:fs','readFileSync':'node:fs','writeFileSync':'node:fs','mkdirSync':'node:fs',
 'readdirSync':'node:fs','rmSync':'node:fs','unlinkSync':'node:fs','statSync':'node:fs','copyFileSync':'node:fs',
 'join':'node:path','basename':'node:path','dirname':'node:path','resolve':'node:path','extname':'node:path',
 'tmpdir':'node:os','homedir':'node:os','platform':'node:os',
 'spawnSync':'node:child_process','execSync':'node:child_process',
}
PRE = '''
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const iso = (tag) => { const t = join(tmpdir(), 'hdk-iso-' + tag + '-' + Date.now()); mkdirSync(join(t, '.config', 'huaweicloud'), { recursive: true }); return t; };
const stamp = ts().slice(2, 14);
const __ADMIN = JSON.parse(readFileSync(homedir() + '/.config/huaweicloud/credentials.json', 'utf8'));
const __base = ['--cli-region=cn-north-4', '--cli-access-key=' + __ADMIN.ak, '--cli-secret-key=' + __ADMIN.sk];
const hc = (args, timeout = 300000) => { const r = spawnSync('hcloud', [...args, ...__base], { encoding: 'utf8', timeout, windowsHide: true }); let parsed = null; const s = r.stdout || ''; const i = s.search(/[{\[]/); try { parsed = JSON.parse(i >= 0 ? s.slice(i) : s); } catch { } return { rc: r.status, out: s.slice(0, 3000), err: (r.stderr || '').slice(0, 800), parsed }; };
function cleanupStack(stack) { const log = []; for (const step of stack) { try { log.push({ step: step.kind, id: step.id, res: hc(step.del(step.id), 240000).rc }); } catch (e) { log.push({ step: step.kind, error: String((e && e.message) || e) }); } } return log; }
async function createVpcStack(vpcName, cidr) {
  const v = hc(['VPC', 'CreateVpc', '--vpc.name=' + vpcName, '--vpc.cidr=' + cidr]);
  const vpcId = v.parsed && v.parsed.vpc && v.parsed.vpc.id;
  if (!vpcId) return { vpcId: null, raw: v, stack: [] };
  const gw = cidr.split('/')[0].split('.').slice(0, 3).join('.') + '.1';
  const subCidr = cidr.split('/')[0].split('.').slice(0, 3).join('.') + '.0/24';
  const s = hc(['VPC', 'CreateSubnet', '--subnet.name=' + vpcName + '-subnet', '--subnet.cidr=' + subCidr, '--subnet.gateway_ip=' + gw, '--subnet.vpc_id=' + vpcId]);
  const subnetId = s.parsed && ((s.parsed.subnet && s.parsed.subnet.id) || s.parsed.id);
  return { vpcId, subnetId, sgId: null, raw: { v, s }, stack: [
    { kind: 'subnet', id: subnetId, del: (id) => ['VPC', 'DeleteSubnet', '--vpc_id=' + vpcId, '--subnet_id=' + id] },
    { kind: 'vpc', id: vpcId, del: (id) => ['VPC', 'DeleteVpc', '--vpc_id=' + id] },
  ] };
}
'''
custom = {'iso','sleep','stamp','hc','cleanupStack','createVpcStack'}
changed=[]
for d in os.listdir(EV):
    f=os.path.join(EV,d,'probe.mjs')
    if not os.path.exists(f): continue
    src=open(f,encoding='utf-8',errors='replace').read()
    if '// PRELUDE-INJECTED' in src: continue
    # bound names from import/const/let/var (first 80 lines and whole)
    bound=set()
    for m in re.finditer(r'import\s*\{([^}]*)\}', src):
        for part in m.group(1).split(','):
            n=part.strip().split(' as ')[-1].strip()
            if n: bound.add(n)
    for m in re.finditer(r'(?:const|let|var)\s+([A-Za-z_$][\w$]*)', src):
        bound.add(m.group(1))
    for m in re.finditer(r'function\s+([A-Za-z_$][\w$]*)', src):
        bound.add(m.group(1))
    need_fs=sorted(n for n in NS if n in src and n not in bound and NS[n]=='node:fs')
    need_path=sorted(n for n in NS if n in src and n not in bound and NS[n]=='node:path')
    need_os=sorted(n for n in NS if n in src and n not in bound and NS[n]=='node:os')
    need_cp=sorted(n for n in NS if n in src and n not in bound and NS[n]=='node:child_process')
    need_custom=sorted(n for n in custom if n in src and n not in bound)
    if not (need_fs or need_path or need_os or need_cp or need_custom): continue
    lines=[]
    if need_fs: lines.append("import { %s } from 'node:fs';" % ', '.join(need_fs))
    if need_path: lines.append("import { %s } from 'node:path';" % ', '.join(need_path))
    if need_os: lines.append("import { %s } from 'node:os';" % ', '.join(need_os))
    if need_cp: lines.append("import { %s } from 'node:child_process';" % ', '.join(need_cp))
    block='// PRELUDE-INJECTED\n'+'\n'.join(lines)+'\n'
    if need_custom:
        pre=PRE
        # only include needed custom defs
        for n in ['sleep','iso','stamp','__ADMIN','__base','hc','cleanupStack','createVpcStack']:
            pass
        block += pre
    # insert after last top import line
    ls=src.splitlines()
    idx=0
    for i,l in enumerate(ls[:40]):
        if l.strip().startswith('import '): idx=i+1
    ls.insert(idx, block)
    open(f,'w',encoding='utf-8').write('\n'.join(ls))
    changed.append(d)
print('patched',len(changed),changed[:40])
