// EXP-C4-04 RDS service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'RDS'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['RDS','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
