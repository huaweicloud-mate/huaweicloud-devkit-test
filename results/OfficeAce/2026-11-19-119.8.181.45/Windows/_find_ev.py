# -*- coding: utf-8 -*-
import io, sys, os, json, glob
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
evs = sorted(glob.glob(os.path.join(REPO, 'results', 'OfficeAce', '*', 'Windows', 'evidence')), reverse=True)
print('OfficeAce evidence dirs:', len(evs))
for e in evs[:8]:
    print(e)
