/**
 * v2 shim：auth/service.mjs → v2 dist/auth/service.js
 */
import { load } from '../_loader.mjs';

const m = await load('auth/service.js');

export const computeOnboarding = m.computeOnboarding;
export const getAuthStatus = m.getAuthStatus;
export const syncAuth = m.syncAuth;