# AI生成
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, json, re

BASE = os.path.dirname(os.path.abspath(__file__))
EVIDENCE = os.path.join(BASE, "evidence")

for gname in ['d4-security', 'd2-auth']:
    stdout = os.path.join(EVIDENCE, gname, "stdout.log")
    with open(stdout, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()
    
    print(f"=== {gname} (first 200 chars) ===")
    print(text[:200])
    print(f"... (total {len(text)} chars)")
    
    # Try JSON parse
    try:
        j = json.loads(text.strip())
        print(f"Parsed JSON: total={j.get('total')}, passed={j.get('passed')}, failed={j.get('failed')}")
        # Find D2-4 or D4-16
        for r in j.get('results', []):
            if r.get('id') in ('D2-4', 'D4-16'):
                print(f"  Found {r['id']}: pass={r.get('pass')}, status={r.get('status')}")
    except Exception as e:
        print(f"JSON parse error: {e}")
        # Try finding JSON block
        m = re.search(r'\{[\s\S]*\}', text)
        if m:
            try:
                j = json.loads(m.group())
                print(f"Parsed from regex: total={j.get('total')}, passed={j.get('passed')}, failed={j.get('failed')}")
                for r in j.get('results', []):
                    if r.get('id') in ('D2-4', 'D4-16'):
                        print(f"  Found {r['id']}: pass={r.get('pass')}, status={r.get('status')}")
            except Exception as e2:
                print(f"Regex parse error: {e2}")
    print()

# Also check individual D2-4 and D4-16
for cid in ['D2-4', 'D4-16']:
    stdout = os.path.join(EVIDENCE, cid, "stdout.log")
    if os.path.exists(stdout):
        with open(stdout, 'r', encoding='utf-8', errors='replace') as f:
            text = f.read()
        print(f"=== {cid} individual stdout.log (first 300 chars) ===")
        print(text[:300])
        # Check for status
        try:
            lines = text.strip().split('\n')
            for line in reversed(lines):
                line = line.strip()
                if not line:
                    continue
                try:
                    j = json.loads(line)
                    if isinstance(j, dict) and 'status' in j:
                        print(f"  JSON status: {j['status']}")
                        break
                except:
                    pass
        except:
            pass
    print()
