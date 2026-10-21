// D3-A1 skill search completeness
const r = await server.call('huaweicloud_search_docs', {query:'ECS create instance'});
console.log(r.result.content[0].text.slice(0,200));
