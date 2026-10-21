// EXP-C4-20 EVS service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'EVS'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['EVS','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
