// D9-3 tools/call response format
const r = await server.call('huaweicloud_list_regions', {});
console.log(JSON.stringify(r.result?.content?.[0]?.text?.slice(0,200)));
