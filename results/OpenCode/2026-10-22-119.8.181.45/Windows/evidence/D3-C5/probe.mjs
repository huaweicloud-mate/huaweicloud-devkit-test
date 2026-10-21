// D3-C5 tool smoke test
const r1 = await server.call('huaweicloud_check_cli', {});
const r2 = await server.call('huaweicloud_list_regions', {});
const r3 = await server.call('huaweicloud_explain_error', {errorCode:'APIGW.0301',message:'test'});
console.log('all ok:', r1.result && r2.result && r3.result);
