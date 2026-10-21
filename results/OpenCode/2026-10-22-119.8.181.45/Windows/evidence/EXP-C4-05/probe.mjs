// EXP-C4-05 GaussDB service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'GaussDB'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['GaussDB','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
