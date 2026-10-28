/**
 * v2 shim：hcloud-probe.mjs → v2 dist/hcloud-probe.js
 */
import { load } from './_loader.mjs';

const m = await load('hcloud-probe.js');

export const classifyHcloudProbe = m.classifyHcloudProbe;
export const findHcloudBin = m.findHcloudBin;
export const hcloudProbeNextStep = m.hcloudProbeNextStep;
export const hcloudProbeRaw = m.hcloudProbeRaw;
export const probeHcloud = m.probeHcloud;
export const resolveHcloudCommand = m.resolveHcloudCommand;