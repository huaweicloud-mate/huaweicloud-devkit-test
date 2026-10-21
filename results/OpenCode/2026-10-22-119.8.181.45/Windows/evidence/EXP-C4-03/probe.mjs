// EXP-C4-03 OBS service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'OBS'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['OBS','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
