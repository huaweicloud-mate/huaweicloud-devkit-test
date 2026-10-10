// D4-15: hook detected IAM CreateUser through node -e execSync wrapper
// Rule: hwc-iam-highrisk-write, decision: warn
console.log('hook bypass via node -e detected');