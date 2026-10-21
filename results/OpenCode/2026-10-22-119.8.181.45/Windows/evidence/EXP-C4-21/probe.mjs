// EXP-C4-21 EIP service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'EIP'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['EIP','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
