// D6-1 search latency
const start = Date.now();
await server.call('huaweicloud_search_docs', {query:'VPC subnet'});
console.log('latency:', Date.now()-start, 'ms');
