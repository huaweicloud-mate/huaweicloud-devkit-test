// EXP-C4-08 IAM service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'IAM'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['IAM','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
