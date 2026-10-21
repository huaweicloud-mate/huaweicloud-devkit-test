// D3-B3 run_readonly redaction
const r = await server.call('huaweicloud_run_readonly_command', {args:['ECS','ListServers','--limit','5']});
console.log(r.result.content[0].text.slice(0,200));
