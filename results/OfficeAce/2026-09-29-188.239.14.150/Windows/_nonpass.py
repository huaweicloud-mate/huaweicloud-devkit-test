# -*- coding: utf-8 -*-
import io, os
base = os.path.dirname(os.path.abspath(__file__))
src = io.open(os.path.join(base, '_status_summary.txt'), encoding='utf-8').read().splitlines()
out = []
for l in src:
    if ('FAIL' in l) or ('BLOCKED' in l) or ('NOT_RUN' in l) or ('DIST ' in l):
        out.append(l)
with io.open(os.path.join(base, '_nonpass_list.txt'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
print('done', len(out))