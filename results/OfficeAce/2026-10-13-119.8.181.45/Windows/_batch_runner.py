# AI生成
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Batch reuse evidence from prior run + re-run probes to generate fresh stdout.log."""
import os, sys, shutil, json, subprocess, csv, re, time
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
PRIOR = r"C:\Users\Administrator\devkit-test\officeace\huaweicloud-devkit-test\results\OfficeAce\2026-10-12-119.8.181.45\Windows"
HDK_SRC = r"C:\Users\Administrator\devkit-test\officeace\hdk"
REPO_ROOT = r"C:\Users\Administrator\devkit-test\officeace\huaweicloud-devkit-test"
EVIDENCE_DIR = os.path.join(BASE, "evidence")

# Read design CSV to get all case IDs
def get_case_ids():
    cases = []
    with open(os.path.join(BASE, "用例矩阵-设计级.csv"), encoding='utf-8-sig') as f:
        for r in csv.DictReader(f):
            cases.append(('design', r['ID'], r.get('优先级',''), r))
    with open(os.path.join(BASE, "用例矩阵-展开级.csv"), encoding='utf-8-sig') as f:
        for r in csv.DictReader(f):
            cases.append(('expanded', r['ID'], r.get('优先级',''), r))
    return cases

# Read prior CSV statuses
def get_prior_statuses():
    statuses = {}
    prior_design = os.path.join(PRIOR, "用例矩阵-设计级.csv")
    if os.path.exists(prior_design):
        with open(prior_design, encoding='utf-8-sig') as f:
            for r in csv.DictReader(f):
                statuses[r['ID']] = {
                    'status': r.get('执行状态',''),
                    'time': r.get('执行时间',''),
                    'evidencePath': r.get('evidencePath',''),
                    'blockedReason': r.get('blockedReason','')
                }
    prior_exp = os.path.join(PRIOR, "用例矩阵-展开级.csv")
    if os.path.exists(prior_exp):
        with open(prior_exp, encoding='utf-8-sig') as f:
            for r in csv.DictReader(f):
                statuses[r['ID']] = {
                    'status': r.get('执行状态',''),
                    'time': r.get('执行时间',''),
                    'evidencePath': r.get('evidencePath',''),
                    'blockedReason': r.get('blockedReason','')
                }
    return statuses

def copy_evidence():
    """Copy evidence directories from prior run."""
    prior_evidence = os.path.join(PRIOR, "evidence")
    if not os.path.exists(prior_evidence):
        print(f"ERROR: prior evidence dir not found: {prior_evidence}")
        return 0
    count = 0
    os.makedirs(EVIDENCE_DIR, exist_ok=True)
    for item in os.listdir(prior_evidence):
        src = os.path.join(prior_evidence, item)
        dst = os.path.join(EVIDENCE_DIR, item)
        if os.path.isdir(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
            count += 1
    print(f"Copied {count} evidence directories from prior run")
    return count

def run_probe(case_id):
    """Run probe.mjs for a case and return status."""
    evid_path = os.path.join(EVIDENCE_DIR, case_id)
    probe = os.path.join(evid_path, "probe.mjs")
    if not os.path.exists(probe):
        return None, "no probe.mjs"
    
    try:
        result = subprocess.run(
            ['node', probe],
            capture_output=True, text=True, timeout=60,
            cwd=REPO_ROOT,
            encoding='utf-8', errors='replace'
        )
        stdout = result.stdout + result.stderr
        # Write fresh stdout.log
        with open(os.path.join(evid_path, 'stdout.log'), 'w', encoding='utf-8') as f:
            f.write(stdout)
        
        # Parse status from output
        status = 'UNKNOWN'
        if 'PASS' in stdout or 'Status: PASS' in stdout:
            status = 'PASS'
        elif 'FAIL' in stdout or 'Status: FAIL' in stdout:
            status = 'FAIL'
        elif 'BLOCKED' in stdout:
            status = 'BLOCKED'
        elif 'SPEC-MISMATCH' in stdout:
            status = 'SPEC-MISMATCH'
        
        # Try JSON parse
        try:
            j = json.loads(stdout.strip().split('\n')[-1])
            if 'status' in j:
                status = j['status']
        except:
            pass
        
        return status, stdout[:200]
    except subprocess.TimeoutExpired:
        return 'BLOCKED', 'probe timeout 60s'
    except Exception as e:
        return None, str(e)

def run_grouped_probe(group_name):
    """Run a grouped probe (d4-security, d2-auth, etc.)."""
    evid_path = os.path.join(EVIDENCE_DIR, group_name)
    probe = os.path.join(evid_path, "probe.mjs")
    if not os.path.exists(probe):
        return None, "no grouped probe"
    try:
        result = subprocess.run(
            ['node', probe],
            capture_output=True, text=True, timeout=120,
            cwd=REPO_ROOT,
            encoding='utf-8', errors='replace'
        )
        stdout = result.stdout + result.stderr
        with open(os.path.join(evid_path, 'stdout.log'), 'w', encoding='utf-8') as f:
            f.write(stdout)
        return 'OK', stdout[:500]
    except Exception as e:
        return 'ERR', str(e)

def main():
    print("=== Step 1: Copy evidence from prior run ===")
    copied = copy_evidence()
    
    print("\n=== Step 2: Identify new cases (not in prior run) ===")
    prior_statuses = get_prior_statuses()
    all_cases = get_case_ids()
    current_ids = set(c[1] for c in all_cases)
    prior_ids = set(prior_statuses.keys())
    new_cases = current_ids - prior_ids
    print(f"Total cases: {len(all_cases)}, Prior: {len(prior_ids)}, New: {len(new_cases)}")
    if new_cases:
        print(f"New case IDs: {sorted(new_cases)}")
    
    print("\n=== Step 3: Re-run grouped probes ===")
    grouped = ['d4-security', 'd2-auth', 'd1-upgrade', 'mcp-tools', 'c4-service-matrix', 'ENV-VAR']
    for g in grouped:
        status, msg = run_grouped_probe(g)
        print(f"  {g}: {status} ({msg[:100]})")
    
    print("\n=== Step 4: Re-run individual probes ===")
    results = {}
    now_str = datetime.now().strftime('%Y%m%d%H%M%S')
    
    # Get all evidence dirs with probe.mjs
    probe_cases = []
    if os.path.exists(EVIDENCE_DIR):
        for item in sorted(os.listdir(EVIDENCE_DIR)):
            evid_path = os.path.join(EVIDENCE_DIR, item)
            if os.path.isdir(evid_path) and os.path.exists(os.path.join(evid_path, "probe.mjs")):
                if item not in grouped:  # Skip grouped, already run
                    probe_cases.append(item)
    
    print(f"Found {len(probe_cases)} individual probe cases to re-run")
    
    for i, case_id in enumerate(probe_cases):
        status, msg = run_probe(case_id)
        if status:
            results[case_id] = {
                'status': status,
                'executedAt': now_str,
                'evidencePath': f'evidence/{case_id}/',
                'detail': msg[:100]
            }
        if (i+1) % 20 == 0:
            print(f"  Progress: {i+1}/{len(probe_cases)}")
    
    print(f"  Completed: {len(results)}/{len(probe_cases)}")
    
    # Summary
    status_counts = {}
    for v in results.values():
        s = v['status']
        status_counts[s] = status_counts.get(s, 0) + 1
    print(f"\n  Status summary: {dict(sorted(status_counts.items()))}")
    
    # Save results
    with open(os.path.join(BASE, '_final_status.json'), 'w', encoding='utf-8') as f:
        json.dump({
            'generatedAt': now_str,
            'totalCases': len(all_cases),
            'priorCases': len(prior_ids),
            'newCases': sorted(new_cases),
            'probeResults': results,
            'statusCounts': status_counts
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n=== Done. Results saved to _final_status.json ===")
    print(f"New cases needing manual execution: {sorted(new_cases)}")

if __name__ == '__main__':
    main()
