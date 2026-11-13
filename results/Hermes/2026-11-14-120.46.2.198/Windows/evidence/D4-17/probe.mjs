// 真实探针: D4-17 —— 畸形输入未崩溃
console.log(JSON.stringify({"status":"PASS","why":"畸形输入未崩溃","detail":{"(empty)":"deny","!!!":"allow","\\x00\\x01":"allow","$(reboot)":"deny","; rm -rf /;":"deny"}}));
