// D3-S4 voucher claim
const r = await server.call('huaweicloud_voucher_status', {});
console.log(JSON.stringify(r.result).slice(0,200));
