// D3-S6 FunctionGraph timer task
const r = await server.call('huaweicloud_plan_cli_command', {args:['FunctionGraph','CreateFunction','--name','test']});
console.log(JSON.stringify(r.result).slice(0,200));
