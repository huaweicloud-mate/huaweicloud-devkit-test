# --- P1 ---
r = subprocess.run('hdk doctor 2>&1', capture_output=True, text=True, timeout=30, shell=True)
ev('D1-3', 'PASS' if (r.stdout+r.stderr).strip() else 'FAIL', 'doctor exists', (r.stdout+r.stderr)[:500])
a = 'check_update' in T; b = 'upgrade' in T
ev('D1-26', 'PASS' if a and b else 'FAIL', 'check_update=' + str(a) + ',upgrade=' + str(b), {'a':a,'b':b})
src = str(SRC).replace(chr(92), '/')
for cid, ver, tags, opt, chk in [
    ('D1-27', '1.1.8-next.2', '{latest:1.1.8-next.2,next:1.1.8-next.2}', 'null', 'up_to_date'),
    ('D1-28', '1.0.0', '{latest:1.1.8-next.2,next:1.1.8-next.2}', 'null', 'update_available'),
    ('D1-31', '1.0.0', '{latest:1.1.8-next.2}', '{dismiss:true,dismissVersion:1.1.8-next.2}', 'dismiss'),
]:
    o = node('import("file:///' + src + '/update-check.mjs").then(m=>{const fn=m.judgeUpdate||(m.default&&m.default.judgeUpdate);console.log(JSON.stringify(fn?fn("' + ver + '",' + tags + ',' + opt + '):"nf"));});')
    ev(cid, 'PASS' if chk in o else 'FAIL', chk, o[:500])
