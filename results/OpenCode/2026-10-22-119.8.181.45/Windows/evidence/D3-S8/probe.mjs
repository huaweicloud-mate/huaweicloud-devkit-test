// D3-S8 failure troubleshooting
const r = await server.call('huaweicloud_explain_error', {errorCode:'APIGW.0301',message:'Invalid token'});
console.log(JSON.stringify(r.result).slice(0,200));
