// D1-70 proxy config
const { readProxyConfig, getProxySettings } = await import('proxy-config.mjs');
console.log('readProxyConfig:', typeof readProxyConfig);
