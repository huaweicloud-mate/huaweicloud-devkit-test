// Source-level probe for D4-28
// Checks hooks.json for .mjs Node implementation registration
import { readFileSync } from 'node:fs';
const hooks = readFileSync('hooks.json', 'utf8');
