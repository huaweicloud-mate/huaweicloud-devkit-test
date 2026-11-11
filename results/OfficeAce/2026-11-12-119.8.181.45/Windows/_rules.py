# -*- coding: utf-8 -*-
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
p = r"C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\safety\rules\cloud-risk-rules.json"
rules = json.load(open(p, encoding="utf-8"))
# print rule ids mentioning secret / kms
def walk(obj, path=""):
    if isinstance(obj, dict):
        rid = obj.get("id")
        if rid and ("secret" in rid.lower() or "kms" in rid.lower()):
            print("RULE", rid, "| stage:", obj.get("stage"), "| decision:", obj.get("decision"))
            m = obj.get("match")
            if m:
                print("   match:", json.dumps(m, ensure_ascii=False)[:300])
        for k, v in obj.items():
            walk(v, path + "/" + str(k))
    elif isinstance(obj, list):
        for v in obj:
            walk(v, path)
walk(rules)
