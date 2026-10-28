/**
 * v2 shim：auth/credential-validator.mjs → v2 dist/auth/credential-validator.js
 */
import { load } from '../_loader.mjs';

const m = await load('auth/credential-validator.js');

export const validateIamCredentials = m.validateIamCredentials;