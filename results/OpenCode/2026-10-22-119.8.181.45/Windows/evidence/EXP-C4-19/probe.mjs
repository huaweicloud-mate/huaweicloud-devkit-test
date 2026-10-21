// EXP-C4-19 CBR service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'CBR'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['CBR','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
