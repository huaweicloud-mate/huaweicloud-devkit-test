# -*- coding: utf-8 -*-
"""
issue #598 回归验证 — 独立黑盒脚本（2026-09-10 22:43 北京时）
被测：dev CCE http://devkit.topxtopx.com/rest/developer/server/hdkitservice/（TEST）
范围：DEF-01 控频 / DEF-02 已最新不发 / DEF-03 裸 /dashboard 排除 + 防退化回归
方法：全新 AK（随机后缀），不复用第三方任何历史证据；urllib 直连
"""
import json, time, urllib.request, urllib.error, uuid, sys, datetime, os

BASE = "http://devkit.topxtopx.com/rest/developer/server/hdkitservice/"
OUT_DIR = os.path.dirname(os.path.abspath(__file__))
TS = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
results = []

def req(path, ak=None, cv=None, sk="fake-sk", method="GET", body=None, label=""):
    url = BASE + path
    headers = {}
    if ak: headers["X-HW-AK"] = ak
    if sk: headers["X-HW-SK"] = sk
    if cv: headers["X-HW-Client-Version"] = cv
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    t0 = time.time()
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            status = resp.status
            txt = resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        status = e.code
        txt = e.read().decode("utf-8", "replace")
    except Exception as e:
        status = "ERR"
        txt = str(e)
    dur_ms = int((time.time() - t0) * 1000)
    try:
        j = json.loads(txt)
    except Exception:
        j = None
    rec = {"label": label, "path": path, "method": method, "cv": cv, "ak": ak,
           "status": status, "ms": dur_ms, "json": j, "raw": txt[:600]}
    results.append(rec)
    print("[%s] %s %s cv=%s status=%s (%dms)" % (label, method, path, cv, status, dur_ms))
    return rec

def has_upgrade_fields(j):
    if not isinstance(j, dict): return False
    return ("updateAvailable" in j) or ("upgradeHint" in j) or ("latestStable" in j)

def verdict(ok, label):
    print(("PASS  " if ok else "FAIL  ") + label)
    return ok

suffix = uuid.uuid4().hex[:8]
AK_RL   = "bb-rl-%s" % suffix        # DEF-01 控频专用（全新）
AK_ADV  = "bb-adv-%s" % suffix       # DEF-02 已最新专用
AK_SOFT = "bb-soft-%s" % suffix      # T08 软提醒正常专用
AK_ISO  = "bb-iso-%s" % suffix       # T09 硬门槛不受控频专用
checks = []

# ============ DEF-01 软提醒控频（同AK同cv 连5次，间隔3s）============
print("\n=== DEF-01 控频（同AK %s, cv=1.0.5, 5连发间隔3s）===" % AK_RL)
seq = []
for i in range(1, 6):
    r = req("voucher/status", ak=AK_RL, cv="1.0.5", label="DEF01-%d" % i)
    if i < 5: time.sleep(3)
    seq.append((i, r))
first_has = has_upgrade_fields(seq[0][1]["json"])
rest_has  = [has_upgrade_fields(s[1]["json"]) for s in seq[1:]]
checks.append(("DEF-01 首请求带升级字段", verdict(first_has, "DEF-01 首请求带升级字段")))
checks.append(("DEF-01 第2~5次被抑制", verdict(not any(rest_has), "DEF-01 第2~5次被抑制 (got=%s)" % rest_has)))

# ============ DEF-02 已最新版不发（全新AK各测一次）============
print("\n=== DEF-02 已最新不发（cv=1.1.2/1.1.3/1.2.0）===")
for cv in ["1.1.2", "1.1.3", "1.2.0"]:
    r = req("voucher/status", ak="%s-%s" % (AK_ADV, cv.replace(".", "")), cv=cv, label="DEF02-cv%s" % cv)
    ok = (r["status"] == 200) and (not has_upgrade_fields(r["json"]))
    checks.append(("DEF-02 cv=%s 200且无升级字段" % cv, verdict(ok, "DEF-02 cv=%s 200且无升级字段" % cv)))

# ============ DEF-03 裸 /dashboard 排除 ============
print("\n=== DEF-03 裸 /dashboard（期望 非409）===")
r1 = req("dashboard", ak=None, cv=None, label="DEF03-nohdr")
checks.append(("DEF-03 无头 /dashboard 非409", verdict(r1["status"] != 409, "DEF-03 无头 /dashboard -> %s (期望非409)" % r1["status"])))
r2 = req("dashboard", ak=AK_ADV, cv="1.9.9", label="DEF03-hdr")
checks.append(("DEF-03 带头cv=1.9.9 /dashboard 非409", verdict(r2["status"] != 409, "DEF-03 带头 /dashboard -> %s (期望非409)" % r2["status"])))
r3 = req("dashboard/api-keys", ak=None, cv=None, label="DEF03-apikeys")
checks.append(("DEF-03 无头 /dashboard/api-keys 非409", verdict(r3["status"] != 409, "DEF-03 /dashboard/api-keys -> %s" % r3["status"])))

# ============ 防退化回归 ============
print("\n=== 回归 T04 硬门槛仍在 ===")
r = req("voucher/status", ak=None, cv=None, label="T04-nohdr")
ok = r["status"] == 409 and r["json"] and r["json"].get("code") == "HDKIT_VERSION_TOO_OLD"
checks.append(("T04 无头->409 HDKIT_VERSION_TOO_OLD", verdict(ok, "T04 无头->%s %s" % (r["status"], (r["json"] or {}).get("code")))))
r = req("voucher/status", ak=AK_SOFT, cv="0.9.9", label="T04-099")
ok = r["status"] == 409
checks.append(("T04 cv=0.9.9(<min)->409", verdict(ok, "T04 cv=0.9.9 -> %s" % r["status"])))
r = req("voucher/status", ak=AK_SOFT, cv="1.0.0", label="T04-100")
ok = r["status"] != 409
checks.append(("T04 cv=1.0.0(=min) 放行", verdict(ok, "T04 cv=1.0.0 -> %s" % r["status"])))
r = req("voucher/status", ak=AK_SOFT, cv="1.0.1", label="T04-101")
ok = r["status"] != 409
checks.append(("T04 cv=1.0.1(>min) 放行", verdict(ok, "T04 cv=1.0.1 -> %s" % r["status"])))

print("\n=== 回归 T05 非法头保守409 ===")
for bad in ["1.0", "abc", "null"]:
    r = req("voucher/status", ak=AK_SOFT, cv=bad, label="T05-%s" % bad)
    checks.append(("T05 非法头cv=%s->409" % bad, verdict(r["status"] == 409, "T05 cv=%s -> %s" % (bad, r["status"]))))

print("\n=== 回归 T06 排除路径不受拦截 ===")
r = req("login", ak=None, cv=None, label="T06-login")
checks.append(("T06 无头 /login 非409", verdict(r["status"] != 409, "T06 /login -> %s" % r["status"])))
r = req("telemetry/events", ak=None, cv=None, method="POST", body={}, label="T06-telemetry")
checks.append(("T06 无头 POST /telemetry/events 非409", verdict(r["status"] != 409, "T06 /telemetry/events -> %s" % r["status"])))

print("\n=== 回归 T07 409体字段 ===")
r = req("voucher/status", ak=None, cv=None, label="T07")
j = r["json"] or {}
ok = r["status"] == 409 and "clientVersion" in j and "minVersion" in j and "update" in (j.get("message") or "")
checks.append(("T07 409含clientVersion/minVersion/升级命令", verdict(ok, "T07 409体keys=%s" % list(j.keys()))))

print("\n=== 回归 T08 软提醒正常（cv=1.0.5 新AK）===")
r = req("voucher/status", ak=AK_SOFT, cv="1.0.5", label="T08")
j = r["json"] or {}
ok = r["status"] == 200 and all(k in j for k in ("latestStable", "latestNext", "updateAvailable", "upgradeHint")) and j.get("updateAvailable") is True
checks.append(("T08 200含4字段且updateAvailable=true", verdict(ok, "T08 200 -> %s" % str(j)[:160])))

print("\n=== 回归 T09 硬门槛不受控频（同AK无头3连）===")
oks = []
for i in range(1, 4):
    r = req("voucher/status", ak=AK_ISO, cv=None, label="T09-%d" % i)
    oks.append(r["status"] == 409)
    if i < 3: time.sleep(1)
checks.append(("T09 无头3连均409", verdict(all(oks), "T09 3连status=%s" % [("409" if o else "X") for o in oks])))

# ============ 汇总 ============
passed = sum(1 for _, ok in checks if ok)
failed = [(lbl, ok) for lbl, ok in checks if not ok]
print("\n================ 汇总 %d/%d PASS ================" % (passed, len(checks)))
for lbl, ok in failed:
    print("FAIL: " + lbl)

summary = {
    "issue": "huaweicloud/huaweicloud-devkit#598",
    "env": BASE,
    "run_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "total": len(checks), "passed": passed, "failed": len(failed),
    "failed_items": [lbl for lbl, _ in failed],
}
out = os.path.join(OUT_DIR, "reg-598-evidence-%s.json" % TS)
with open(out, "w", encoding="utf-8") as f:
    json.dump({"summary": summary, "checks": [{"label": l, "ok": o} for l, o in checks], "requests": results}, f, ensure_ascii=False, indent=2)
print("evidence -> " + out)
sys.exit(0 if not failed else 1)