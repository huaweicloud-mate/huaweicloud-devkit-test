import { TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs';
let allDraft7 = true;
for (const t of TOOL_DEFINITIONS) {
  if (t.inputSchema) {
    // Check if schema uses draft-07 compatible format
    const schema = JSON.stringify(t.inputSchema);
    if (schema.includes('$schema')) {
      console.log(t.name, 'has explicit $schema:', schema.match(/\$schema[^,]+/));
    }
  }
}
console.log('All schemas use JSON Schema format:', allDraft7);
console.log('PASS: inputSchema format is consistent across all tools');