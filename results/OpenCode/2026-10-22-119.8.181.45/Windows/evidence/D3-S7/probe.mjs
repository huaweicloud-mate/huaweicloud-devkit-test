// D3-S7 cross-service delivery
const r1 = await server.call('huaweicloud_plan_cli_command', {args:['RDS','CreateInstance']});
console.log('ok:', !!r1.result);
