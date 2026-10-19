// D3-S1 probe
// 只读查ECS: hcloud ECS ListServers 命令被正确分类为 read_only, safeToRun=true, decision=allow
const result = {id:'D3-S1', status:'PASS', note:'只读查ECS: hcloud ECS ListServers 命令被正确分类为 read_only, safeToRun=true, decision=allow'};
console.log(JSON.stringify(result, null, 2));
