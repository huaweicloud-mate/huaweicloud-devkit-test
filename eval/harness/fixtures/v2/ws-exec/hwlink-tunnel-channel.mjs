/**
 * v2 shim：ws-exec/hwlink-tunnel-channel.mjs → v2 dist/ws-exec/hwlink-tunnel-channel.js
 *
 * d9-11 探针 import 本文件取 `HwlinkTunnelChannel`（v1 的 `ws-exec/hwlink-tunnel-channel.mjs`）。
 * v2 该符号仍在 `dist/ws-exec/hwlink-tunnel-channel.js`（实测 export 面含 HwlinkTunnelChannel），
 * 直接桥接即可。
 */
import { load } from '../_loader.mjs';

const m = await load('ws-exec/hwlink-tunnel-channel.js');
export const { HwlinkTunnelChannel } = m;