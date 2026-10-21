// EXP-C4-01 ECS service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'ECS'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['ECS','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
