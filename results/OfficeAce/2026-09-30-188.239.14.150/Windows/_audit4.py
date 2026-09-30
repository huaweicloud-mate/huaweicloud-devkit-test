import os
d = 'evidence'
no_stdout = []
for x in sorted(os.listdir(d)):
    full = os.path.join(d, x)
    if not os.path.isdir(full):
        print('FILE (not dir):', x)
        continue
    p = os.path.join(full, 'stdout.log')
    if os.path.isfile(p):
        continue
    has_probe = os.path.isfile(os.path.join(full, 'probe.mjs'))
    has_txt = os.path.isfile(os.path.join(full, 'stdout.txt'))
    files = os.listdir(full)
    no_stdout.append((x, has_probe, has_txt, files))
print('no-stdout dirs:', len(no_stdout))
for x, hp, ht, files in no_stdout:
    print(x, '| probe=', hp, '| txt=', ht, '| files=', files)