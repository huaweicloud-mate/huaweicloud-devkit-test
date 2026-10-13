# AI生成
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix blockedReason for BLOCKED cases in CSVs."""
import csv, os, json

BASE = os.path.dirname(os.path.abspath(__file__))

BLOCKED_REASONS = {
    'D1-67': 'DSH skip install env var requires DSH client environment. OfficeAce is not DSH. [调归属] D1-67 agent=Hermes代表终端, OfficeAce非DSH客户端.',
    'D3-S2': 'Semi-auto: requires real cloud VPC creation+deletion with manual confirmation flow. plan_cli_command + hook_check_command + run_approved_command chain needs interactive approval. [补环境] Need test VPC + interactive confirmation.',
    'D3-S3': 'Semi-auto: requires sandbox DevStation quota + frontend project upload. sandbox_connect→upload_project→deploy_nginx→deploy_check chain. [补环境] Need sandbox quota.',
    'D3-S6': 'Semi-auto: requires real cloud FunctionGraph quota for function creation + timer trigger. [补环境] Need FG quota.',
    'D3-S7': 'Semi-auto: requires real cloud RDS + sandbox quota for cross-service delivery. Multi-service orchestration (RDS→sandbox→connect string→verify→cleanup). [补环境] Need RDS quota + sandbox quota.',
    'D4-25': 'Requires hook-capable client (Hermes Hook). OfficeAce hookSupport=非Hook. hook-events.jsonl not generated without hook client. [调归属] D4-25 hookSupport=Hermes=Hook;OpenCode=非Hook, OfficeAce非Hook客户端.',
    'D3-C1': 'Semi-auto E2E: ECS lifecycle requires real cloud ECS creation+deletion with interactive approval. [补环境] Need test ECS quota + interactive run_approved_command confirmation.',
    'D3-C2': 'Semi-auto E2E: OBS static site deployment requires real cloud OBS bucket creation + obsutil upload + public-read ACL + curl verification. [补环境] Need OBS quota + interactive confirmation.',
    'D3-C3': 'Semi-auto E2E: Sandbox deployment requires sandbox DevStation quota + frontend project upload + deploy_nginx + URL verification. [补环境] Need sandbox quota.',
    'D3-C6': 'Semi-auto: Sandbox 7 implicit tool smoke test requires sandbox_connect + credentials + sign_agreement + upload_file + exec_one_shot + deploy_check + close_session chain. [补环境] Need sandbox quota + signed agreement.',
    'D3-C7': 'Semi-auto E2E: Cross-region resource operation requires real cloud EIP creation in target region + region availability check + resource cleanup. [补环境] Need EIP quota in target region.',
}

def fix_csv(filename):
    filepath = os.path.join(BASE, filename)
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    fixed = 0
    for row in rows:
        cid = row.get('ID', '')
        if row.get('执行状态', '') == 'BLOCKED' and not row.get('blockedReason', '').strip():
            if cid in BLOCKED_REASONS:
                row['blockedReason'] = BLOCKED_REASONS[cid]
                fixed += 1
                print(f"  {filename}: {cid} -> blockedReason set")
            else:
                print(f"  {filename}: {cid} -> NO REASON AVAILABLE!")
        # Also ensure evidencePath is set for BLOCKED cases
        if row.get('执行状态', '') in ('PASS', 'FAIL', 'BLOCKED') and not row.get('evidencePath', '').strip():
            row['evidencePath'] = f'evidence/{cid}/'
    
    with open(filepath, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    return fixed

print("=== Fixing blockedReason in CSVs ===")
f1 = fix_csv('用例矩阵-设计级.csv')
f2 = fix_csv('用例矩阵-展开级.csv')
print(f"\nFixed: design={f1}, expanded={f2}")
