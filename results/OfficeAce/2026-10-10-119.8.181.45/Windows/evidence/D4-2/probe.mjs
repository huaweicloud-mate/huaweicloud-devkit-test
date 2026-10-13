// D4-2: hook_check_command with 'echo $HW_ACCESS_KEY $HW_SECRET_KEY' returned allow
// Expected: deny (credential env print should be blocked)
console.log('env print NOT blocked - FAIL');