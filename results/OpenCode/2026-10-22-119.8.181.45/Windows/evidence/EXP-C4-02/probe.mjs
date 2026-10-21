// EXP-C4-02 VPC service matrix smoke
const r1 = await server.call('huaweicloud_list_operations', {service:'VPC'});
const r2 = await server.call('huaweicloud_plan_cli_command', {args:['VPC','List']});
console.log('list:', !!r1.result, 'plan:', !!r2.result);
