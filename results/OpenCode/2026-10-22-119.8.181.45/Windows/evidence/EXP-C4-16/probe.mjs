// EXP-C4-16 CDN service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'CDN'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['CDN','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
