import { runCase } from "file:///C:/Users/Administrator/devkit-test/testbot5-win-hermes/hdk/probe-master-2.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const id = "D3-B5";
const r = runCase(id);
console.log(id + " => " + JSON.stringify(r));
process.exit(0);
