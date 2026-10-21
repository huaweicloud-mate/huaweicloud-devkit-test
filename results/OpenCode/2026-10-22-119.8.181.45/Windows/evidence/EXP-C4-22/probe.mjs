// EXP-C4-22 ELB service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'ELB'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['ELB','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
