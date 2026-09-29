import os
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows\evidence'
no_probe = []
with_probe = []
for d in sorted(os.listdir(base)):
    p = os.path.join(base, d)
    if os.path.isdir(p):
        files = os.listdir(p)
        others = [f for f in files if f != 'stdout.log']
        if others:
            with_probe.append('%s: %s' % (d, ','.join(others)))
        else:
            no_probe.append(d)
print('有额外文件的目录 (%d):' % len(with_probe))
for x in with_probe: print(' ', x)
print()
print('仅 stdout.log 的目录 (%d):' % len(no_probe))
print(' ', ', '.join(no_probe))