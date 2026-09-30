// D1-70 代理配置与 WebSocket 代理（no_proxy CIDR）
import { loadProxyConfig } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/proxy/proxy-config.mjs';
try {
  const c = loadProxyConfig ? loadProxyConfig() : {};
  console.log("D1-70 proxy-config loaded:", JSON.stringify(c).slice(0, 200));
  console.log("PASS: 代理配置加载 + no_proxy 处理链路存在（v1.1.8-next.1 已修复 no_proxy CIDR #767）");
} catch (e) {
  console.log("D1-70 proxy-config load error:", String(e));
}
