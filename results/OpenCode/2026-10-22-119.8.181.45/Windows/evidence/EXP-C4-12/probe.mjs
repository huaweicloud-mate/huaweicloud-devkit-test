// EXP-C4-12 DCS service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'DCS'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['DCS','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
