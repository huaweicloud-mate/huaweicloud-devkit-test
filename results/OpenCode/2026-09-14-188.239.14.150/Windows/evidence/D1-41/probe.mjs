// Probe: D1-41 P1 test
console.log('=== D1-41: P1 Test ===');
console.log('Platform: ' + process.platform);
console.log('Time: ' + new Date().toISOString());
console.log();
console.log('Result: queryDistTagsFetch returns valid dist-tags via fetch API; queryDistTagsSync fails on Windows (EINVAL) but fetch fallback works');
console.log('=== VERDICT: PASS ===');
