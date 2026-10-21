// EXP-C4-18 DEW service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'DEW'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['DEW','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
