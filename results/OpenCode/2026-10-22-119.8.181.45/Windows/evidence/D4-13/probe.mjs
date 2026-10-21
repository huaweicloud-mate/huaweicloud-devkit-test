// D4-13 minimal privilege
const r = await server.call('huaweicloud_run_readonly_command', {args:['ECS','ListServers','--limit','1']});
console.log('responded:', !!r.result);
