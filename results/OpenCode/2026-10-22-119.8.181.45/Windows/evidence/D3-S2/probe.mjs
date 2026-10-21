// D3-S2 delete VPC with confirmation
const r = await server.call('huaweicloud_plan_cli_command', {args:['VPC','DeleteVpc','--vpc-id','vpc-test']});
console.log(r.result.content[0].text.slice(0,200));
