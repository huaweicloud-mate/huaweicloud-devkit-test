// EXP-C4-14 DMS service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'DMS'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['DMS','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
