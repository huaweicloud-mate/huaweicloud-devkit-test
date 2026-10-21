// EXP-C4-11 DDS service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'DDS'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['DDS','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
