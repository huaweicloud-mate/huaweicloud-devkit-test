// D3-C4 service create regression
const r = await server.call('huaweicloud_plan_cli_command', {args:['ECS','CreateServers']});
console.log(JSON.stringify(r.result).slice(0,200));
