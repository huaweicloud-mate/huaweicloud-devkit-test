// Source-level probe for D1-39
// Imports update-check.mjs and checks queryDistTags/judgeUpdate exports
import { pathToFileURL } from 'node:url';
const mod = await import(pathToFileURL('update-check.mjs').href);
console.log(Object.keys(mod));
