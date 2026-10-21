// EXP-C4-17 ModelArts service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'ModelArts'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['ModelArts','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
