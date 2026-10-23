// D2-16 probe
// Status: PASS
// Import file read+erase: auth_switch mode=import reads creds-import.json then unconditionally deletes it. Source: tools.mjs auth_switch handler reads file, extracts AK/SK, then fs.unlinkSync. File exists=False after import.
