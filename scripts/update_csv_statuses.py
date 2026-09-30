# -*- coding: utf-8 -*-
"""Update CSV matrices with real execution results from probe-results.json."""
import os, sys, csv, json

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pack_dir = os.path.join(REPO, "results", "CodeArtsSpace", "2026-09-30-120.46.40.202", "Windows")
probe_path = os.path.join(pack_dir, "probe-results.json")

with open(probe_path, encoding="utf-8") as f:
    probe = json.load(f)

results = probe["results"]
print(f"Loaded {len(results)} probe results: {probe['summary']}")

# Root causes for FAIL cases
root_causes = {
    "D2-4": "redactString regex (AK|SK)\\s*[:=] only matches uppercase AK/SK, misses lowercase ak=/sk= in string form. redactSecrets('ak=AKIDxxx sk=Secretxxx') leaks plaintext.",
    "D2-11": "hcloud sts get-token classified as read_only allow, not deny. STS token may leak to disk. sts service not in blockedSecretOperations.",
    "D2-16": "hcloud configure import --file creds.json classified as unknown_read allow, not deny. 'import' not in blockedConfigureSubcommands, credential file import may leave plaintext on disk.",
    "D4-2": "HW_ prefix env-dump not fully blocked. env|grep HW_ and set|grep HW_ return allow (not_huaweicloud). Only direct printenv HW_SECRET_KEY is denied. env|grep / set|grep patterns not matched by credential env-var regex.",
    "D4-3": "kms DecryptData / csms show-secret not blocked. hcloud kms decrypt-data/DecryptData/decrypt and hcloud csms show-secret/show-secret-version all return allow. These operations not in blockedSecretOperations; secret regex only matches secret_string/secret_binary/showsecretversion/getsecretvalue.",
    "D4-4": "echo $AK / echo $SK / echo $HW_ACCESS_KEY_ID all return allow (not_huaweicloud). echo command not classified as credential exposure.",
    "D4-16": "bash -c wrapped destructive commands not denied. sh -c 'hcloud ecs delete' and bash -c 'hcloud ecs/vpc/rds delete' all return allow with only a warning. stripExecutable unwraps bash -c but classifyHcloudArgs segment detection only catches deny via risk rules for --force; plain delete inside bash -c falls through to not_huaweicloud allow.",
    "D4-24": "access_token NOT redacted by redactSecrets. isSecretKeyName regex matches 'access.*key' but not 'access_token'; 'token' alone matches via policy but 'access_token' does not match 'access.*key' or 'xauth.*token'.",
}

def update_csv(csv_path, results, root_causes):
    if not os.path.isfile(csv_path):
        print(f"[skip] {csv_path} not found")
        return
    rows = []
    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    updated = 0
    for r in rows:
        cid = r.get("ID", "")
        if cid in results:
            real_status = results[cid]["status"]
            old_status = (r.get("执行状态") or "").strip()
            if old_status != real_status:
                r["执行状态"] = real_status
                updated += 1
            r["执行时间"] = results[cid].get("executedAt", "")
            if real_status == "FAIL":
                r["blockedReason"] = root_causes.get(cid, results[cid].get("why", "FAIL"))
            elif real_status in ("BLOCKED", "NOT_RUN"):
                if not (r.get("blockedReason") or "").strip():
                    r["blockedReason"] = results[cid].get("why", "")

    with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"[updated] {os.path.basename(csv_path)}: {updated} statuses changed")

update_csv(os.path.join(pack_dir, "用例矩阵-设计级.csv"), results, root_causes)
update_csv(os.path.join(pack_dir, "用例矩阵-展开级.csv"), results, root_causes)
print("Done.")
