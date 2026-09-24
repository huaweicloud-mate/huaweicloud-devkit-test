import json, os, glob
from datetime import datetime

ev_base = os.path.dirname(os.path.abspath(__file__))
now = datetime.now().strftime('%Y%m%d%H%M%S')

# Read all aggregate stdout.log files
aggregate_dirs = ['d4-security', 'd1-upgrade', 'd2-auth', 'd9-protocol', 'd8-quality', 
                  'd4-node-hook', 'd4-install-rules', 'd4-misc', 'd1-envvars', 
                  'd3-scenarios', 'mcp-tools', 'd10-safety', 'c4-service-matrix', 'd5-workbuddy']

case_results = {}

for agg_dir in aggregate_dirs:
    log_path = os.path.join(ev_base, agg_dir, 'stdout.log')
    if not os.path.exists(log_path):
        print(f"SKIP (no log): {agg_dir}")
        continue
    with open(log_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Read {agg_dir}: total={data.get('total',0)}, passed={data.get('passed',0)}, failed={data.get('failed',0)}")
    for r in data.get('results', []):
        case_id = r.get('id', '')
        if not case_id:
            continue
        # For each case, if any test failed, mark as FAIL; if all pass, mark PASS
        if case_id not in case_results:
            case_results[case_id] = {'all_pass': True, 'fail_reasons': []}
        if not r.get('pass', False):
            case_results[case_id]['all_pass'] = False
            reason = r.get('failMsg', r.get('actual', 'unknown'))
            case_results[case_id]['fail_reasons'].append(f"{r.get('name','')}: {reason}")

# Now write individual case stdout.log files
for case_id, info in case_results.items():
    case_dir = os.path.join(ev_base, case_id)
    os.makedirs(case_dir, exist_ok=True)
    log_path = os.path.join(case_dir, 'stdout.log')
    if info['all_pass']:
        entry = {"status": "PASS", "executedAt": now}
    else:
        why = '; '.join(info['fail_reasons'][:3])
        entry = {"status": "FAIL", "executedAt": now, "why": why}
    with open(log_path, 'w', encoding='utf-8') as f:
        json.dump(entry, f, ensure_ascii=False)

print(f"\nGenerated {len(case_results)} individual case logs")

# Print summary
passes = sum(1 for v in case_results.values() if v['all_pass'])
fails = sum(1 for v in case_results.values() if not v['all_pass'])
print(f"PASS: {passes}, FAIL: {fails}")
print("\nFAIL cases:")
for cid, info in sorted(case_results.items()):
    if not info['all_pass']:
        print(f"  {cid}: {'; '.join(info['fail_reasons'][:2])}")
