# -*- coding: utf-8 -*-
import csv, sys, glob, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
os.chdir(os.path.dirname(os.path.abspath(__file__)))
for f in glob.glob('*.csv'):
    rows = list(csv.DictReader(open(f, encoding='utf-8-sig')))
    print('==', f, 'rows', len(rows))
    if rows:
        print('cols:', list(rows[0].keys()))
    print()
