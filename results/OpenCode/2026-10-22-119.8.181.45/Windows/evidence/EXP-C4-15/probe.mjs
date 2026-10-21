// EXP-C4-15 WAF service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'WAF'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['WAF','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
