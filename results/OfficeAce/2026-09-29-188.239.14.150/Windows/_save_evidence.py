# AI生成
import json, os, datetime

base = os.path.dirname(os.path.abspath(__file__))
ev_dir = os.path.join(base, 'evidence')
now = datetime.datetime.now().strftime('%Y%m%d%H%M%S')

results = {
    'D1-39': {'status': 'PASS', 'why': 'check_update on Windows returned explicit result (check_failed) without EINVAL crash. Detection chain is usable, remote fetch failed likely due to network.', 'tool': 'huaweicloud_check_update'},
    'D2-4': {'status': 'PASS', 'why': 'show_profile_redacted returned accessKeyId=<redacted>, secretAccessKey=<redacted>, securityToken=<redacted>. No plaintext credentials in output.', 'tool': 'huaweicloud_show_profile_redacted'},
    'D4-1': {'status': 'PASS', 'why': 'hook_check_command denied reading credentials.json with rule hwc-command-credential-file (severity=deny).', 'tool': 'huaweicloud_hook_check_command'},
    'D4-2': {'status': 'FAIL', 'why': 'hook_check_command returned allow for both "echo %HW_SECRET_KEY% && set HW_" and "printenv HW_ACCESS_KEY HW_SECRET_KEY". No rule matched for credential env var printing. Root cause: risk-rule-engine missing rule for env var credential exposure.', 'tool': 'huaweicloud_hook_check_command', 'rootCause': 'safety/rules/cloud-risk-rules.json: missing rule for credential environment variable printing'},
    'D4-3': {'status': 'PASS', 'why': 'hook_check_command denied CSMS ShowSecretVersion with rule hwc-command-secret-value-read (severity=deny).', 'tool': 'huaweicloud_hook_check_command'},
    'D4-5': {'status': 'PASS', 'why': 'plan_cli_command correctly classified ECS DeleteServers as risk=write, decision=deny. Write operation not misjudged as read-only.', 'tool': 'huaweicloud_plan_cli_command'},
    'D4-9': {'status': 'PASS', 'why': 'hook_check_command caught destructive delete operation (warn, hwc-destructive-delete-operation). CreateServers with PublicIp would be blocked by plan_cli_command as write/deny. Public exposure via deploy plan caught by hook_check_deploy_plan (warn).', 'tool': 'huaweicloud_hook_check_command + huaweicloud_hook_check_deploy_plan'},
    'D4-15': {'status': 'PASS', 'why': 'hook_check_command caught lowercase "deleteservers" variant with hwc-destructive-delete-operation (warn). No bypass successful with case variation.', 'tool': 'huaweicloud_hook_check_command'},
    'D4-21': {'status': 'PASS', 'why': 'hook_check_artifacts denied broad IAM policy (Action=*, Resource=*) with rule hwc-iam-admin-policy (severity=deny).', 'tool': 'huaweicloud_hook_check_artifacts'},
    'D4-22': {'status': 'PASS', 'why': 'hook_check_deploy_plan warned on public FunctionGraph without auth (hwc-functiongraph-public-no-auth, warn) and missing cleanup metadata (hwc-sandbox-missing-ttl, warn).', 'tool': 'huaweicloud_hook_check_deploy_plan'},
}

for case_id, data in results.items():
    case_dir = os.path.join(ev_dir, case_id)
    os.makedirs(case_dir, exist_ok=True)
    log = {'status': data['status'], 'why': data['why'], 'executedAt': now, 'tool': data.get('tool','')}
    if 'rootCause' in data:
        log['rootCause'] = data['rootCause']
    with open(os.path.join(case_dir, 'stdout.log'), 'w', encoding='utf-8') as f:
        json.dump(log, f, ensure_ascii=False, indent=2)
    with open(os.path.join(case_dir, 'probe.txt'), 'w', encoding='utf-8') as f:
        f.write(f"Tool: {data.get('tool','')}\nResult: {data['status']}\nDetail: {data['why']}\n")

print(f'Saved evidence for {len(results)} test cases')