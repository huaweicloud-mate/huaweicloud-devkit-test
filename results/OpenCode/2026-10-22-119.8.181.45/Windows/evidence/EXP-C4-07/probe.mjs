// EXP-C4-07 FunctionGraph service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'FunctionGraph'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['FunctionGraph','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
