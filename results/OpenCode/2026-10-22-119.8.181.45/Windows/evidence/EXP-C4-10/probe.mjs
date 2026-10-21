// EXP-C4-10 CES service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'CES'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['CES','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
