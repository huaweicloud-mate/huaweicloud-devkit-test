#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""拆分 probe-daily.mjs 输出到 evidence/<case-id>/stdout.log，并写出各 source 用例的 PASS/FAIL 判定。"""
import os, re, json, sys

D = '/home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-13-1.94.218.129/Linux'
LOG = os.path.join(D, 'stdout-daily.log')
EVID = os.path.join(D, 'evidence')

def main():
    text = open(LOG, encoding='utf-8').read()
    # split by @@CASE ... @@END@@
    blocks = re.findall(r'@@CASE\s+([\w-]+)@@(.*?)@@END@@', text, re.S)
    verdict = {}
    os.makedirs(EVID, exist_ok=True)
    for cid, body in blocks:
        body = body.strip()
        # count assertions
        passes = len(re.findall(r'^PASS\s+', body, re.M))
        fails = len(re.findall(r'^FAIL\s+', body, re.M))
        # also inline "FAIL D4-xx" lines not at line start (e.g. from c(...) inside loops)
        inline_fail = body.count('FAIL ')
        verdict[cid] = 'FAIL' if (fails > 0 or 'FAIL' in body) else 'PASS'
        d = os.path.join(EVID, cid)
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, 'stdout.log'), 'w', encoding='utf-8') as f:
            f.write(f'@@CASE {cid}@@\n{body}\n@@END@@\n')
        print(f'{cid}: {verdict[cid]} (PASS~{passes} FAIL~{fails})')

    print(f'\nTotal blocks: {len(blocks)}')
    # distinct case ids
    print('Case IDs:', sorted(set(verdict.keys())))
    with open(os.path.join(D, 'probe-verdict.json'), 'w', encoding='utf-8') as f:
        json.dump(verdict, f, ensure_ascii=False, indent=2)
    print('Wrote probe-verdict.json')

if __name__ == '__main__':
    main()