// D8-7 meta skill executable
const r1 = await server.call('huaweicloud_retrieve_skill', {name:'huaweicloud-core'});
const r2 = await server.call('huaweicloud_search_docs', {query:'getting started'});
console.log('skill:', !!r1.result, 'docs:', !!r2.result);
