// EXP-C4-06 CCE service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'CCE'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['CCE','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
