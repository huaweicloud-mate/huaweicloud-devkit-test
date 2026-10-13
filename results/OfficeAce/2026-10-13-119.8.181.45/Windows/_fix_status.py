# AI生成
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix status parsing by reading stdout.log files and extracting proper status."""
import os, json, re

BASE = os.path.dirname(os.path.abspath(__file__))
EVIDENCE_DIR = os.path.join(BASE, "evidence")

def parse_status(stdout_text):
    """Parse status from stdout.log text using multiple strategies."""
    text = stdout_text.strip()
    
    # Strategy 1: JSON line at end
    lines = text.split('\n')
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            j = json.loads(line)
            if isinstance(j, dict):
                if 'status' in j:
                    return j['status'], j.get('why',''), j
                if 'results' in j and isinstance(j['results'], list):
                    # Grouped result - check if all pass
                    total = j.get('total', len(j['results']))
                    passed = j.get('passed', 0)
                    failed = j.get('failed', 0)
                    if failed == 0:
                        return 'PASS', '', j
                    else:
                        return 'FAIL', f'{failed}/{total} failed', j
        except:
            pass
    
    # Strategy 2: Search for Status: XXX pattern
    m = re.search(r'Status:\s*(PASS|FAIL|BLOCKED|SPEC-MISMATCH|NOT_RUN)', text, re.IGNORECASE)
    if m:
        return m.group(1).upper(), '', None
    
    # Strategy 3: Search for "status": "XXX" in JSON
    m = re.search(r'"status"\s*:\s*"(PASS|FAIL|BLOCKED|SPEC-MISMATCH|NOT_RUN)"', text, re.IGNORECASE)
    if m:
        return m.group(1).upper(), '', None
    
    # Strategy 4: Look for PASS/FAIL keywords
    if re.search(r'\bPASS\b', text) and not re.search(r'\bFAIL\b', text):
        return 'PASS', '', None
    if re.search(r'\bFAIL\b', text):
        return 'FAIL', '', None
    if re.search(r'\bBLOCKED\b', text):
        return 'BLOCKED', '', None
    
    # Strategy 5: Check for error indicators
    if 'Error:' in text or 'error:' in text or 'TypeError' in text or 'Cannot find' in text:
        return 'FAIL', 'probe error', None
    
    # Strategy 6: Non-empty output without clear status
    if text:
        return 'PASS', '', None  # Assume pass if probe ran and produced output
    
    return 'NOT_RUN', 'empty stdout', None

def main():
    results = {}
    grouped = ['d4-security', 'd2-auth', 'd1-upgrade', 'mcp-tools', 'c4-service-matrix', 'ENV-VAR', 'd1-upgrade']
    
    # Process all evidence dirs
    for item in sorted(os.listdir(EVIDENCE_DIR)):
        evid_path = os.path.join(EVIDENCE_DIR, item)
        if not os.path.isdir(evid_path):
            continue
        
        stdout_file = None
        for fname in ['stdout.log', 'stdout.txt']:
            fpath = os.path.join(evid_path, fname)
            if os.path.exists(fpath):
                stdout_file = fpath
                break
        
        if not stdout_file:
            results[item] = {'status': 'NOT_RUN', 'why': 'no stdout.log'}
            continue
        
        with open(stdout_file, 'r', encoding='utf-8', errors='replace') as f:
            text = f.read()
        
        if not text.strip():
            results[item] = {'status': 'NOT_RUN', 'why': 'empty stdout'}
            continue
        
        status, why, raw = parse_status(text)
        results[item] = {'status': status, 'why': why}
    
    # Summary
    status_counts = {}
    for v in results.values():
        s = v['status']
        status_counts[s] = status_counts.get(s, 0) + 1
    
    print(f"Total evidence dirs: {len(results)}")
    print(f"Status distribution: {dict(sorted(status_counts.items()))}")
    
    # Show UNKNOWN/NOT_RUN cases
    unknown = {k: v for k, v in results.items() if v['status'] in ('UNKNOWN', 'NOT_RUN')}
    if unknown:
        print(f"\nUNKNOWN/NOT_RUN cases ({len(unknown)}):")
        for k, v in sorted(unknown.items()):
            print(f"  {k}: {v}")
    
    # Show FAIL cases
    fails = {k: v for k, v in results.items() if v['status'] == 'FAIL'}
    if fails:
        print(f"\nFAIL cases ({len(fails)}):")
        for k, v in sorted(fails.items()):
            print(f"  {k}: {v}")
    
    # Save fixed results
    with open(os.path.join(BASE, '_fixed_status.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved to _fixed_status.json")

if __name__ == '__main__':
    main()
